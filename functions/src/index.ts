/**
 * Kane Cloud Functions entry point.
 *
 * satsTutor — the SATs Quest "Ask Owl" proxy to Ollama Cloud. The Ollama API key lives only
 * in Secret Manager (OLLAMA_API_KEY) and is never sent to the browser. Every call must be
 * signed in, is checked by tutorCore, counted against a per-child and a global daily cap in a
 * transaction, cached by question + wrong answer, and validated before it is returned.
 *
 * Deploy (needs the Blaze plan):
 *   firebase functions:secrets:set OLLAMA_API_KEY
 *   firebase deploy --only functions:satsTutor
 * Then set SATS_LLM_TUTOR_ENABLED in src/games/sats-quest/satsTutor.ts to true.
 * Optional: a Firestore TTL policy on `expireAt` for satsLlmUsage and satsLlmCache.
 */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import {
  buildMessages,
  cacheKey,
  callOllama,
  dayKey,
  DEFAULT_MODEL,
  parseTutorReply,
  readCached,
  TUTOR_LIMITS,
  usageDecision,
  validateTutorRequest,
} from './satsTutor/tutorCore.js';

initializeApp();

const OLLAMA_API_KEY = defineSecret('OLLAMA_API_KEY');
const SATS_TUTOR_MODEL = defineString('SATS_TUTOR_MODEL', { default: DEFAULT_MODEL });

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_DAYS = 30;

export const satsTutor = onCall(
  {
    region: 'europe-west2',
    secrets: [OLLAMA_API_KEY],
    timeoutSeconds: 20,
    memory: '256MiB',
    maxInstances: 3,
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in to ask Owl.');

    const checked = validateTutorRequest(request.data);
    if (!checked.ok) throw new HttpsError('invalid-argument', checked.reason);
    const req = checked.value;

    const db = getFirestore();
    const cacheRef = db.collection('satsLlmCache').doc(cacheKey(req));
    const cachedSnap = await cacheRef.get();
    const cached = cachedSnap.exists ? readCached(cachedSnap.data(), req) : null;
    if (cached) return { ...cached, cached: true };

    const now = Date.now();
    const day = dayKey(now);
    const expireAt = Timestamp.fromMillis(now + 2 * DAY_MS);
    const userRef = db.collection('satsLlmUsage').doc(`${uid}_${day}`);
    const globalRef = db.collection('satsLlmUsage').doc(`global_${day}`);
    const decision = await db.runTransaction(async (tx) => {
      const [userSnap, globalSnap] = await Promise.all([tx.get(userRef), tx.get(globalRef)]);
      const verdict = usageDecision(Number(userSnap.get('count') ?? 0), Number(globalSnap.get('count') ?? 0));
      if (verdict === 'ok') {
        tx.set(userRef, { count: FieldValue.increment(1), day, expireAt }, { merge: true });
        tx.set(globalRef, { count: FieldValue.increment(1), day, expireAt }, { merge: true });
      }
      return verdict;
    });
    if (decision !== 'ok') {
      throw new HttpsError('resource-exhausted', 'Owl has answered lots of questions today. Use the worked steps instead.');
    }

    let content: string;
    try {
      content = await callOllama({
        fetchImpl: fetch,
        apiKey: OLLAMA_API_KEY.value(),
        model: SATS_TUTOR_MODEL.value(),
        messages: buildMessages(req),
        timeoutMs: TUTOR_LIMITS.timeoutMs,
        maxTokens: TUTOR_LIMITS.maxOutputTokens,
      });
    } catch (err) {
      console.warn('satsTutor upstream failed', err instanceof Error ? err.message : err);
      throw new HttpsError('unavailable', 'Owl is resting. Use the worked steps instead.');
    }

    const reply = parseTutorReply(content, req);
    if (!reply.ok) {
      console.warn('satsTutor rejected a reply', reply.reason);
      throw new HttpsError('unavailable', 'Owl could not explain that one. Use the worked steps instead.');
    }

    await cacheRef.set({ ...reply.value, createdAtMs: now, expireAt: Timestamp.fromMillis(now + CACHE_DAYS * DAY_MS) });
    return { ...reply.value, cached: false };
  },
);
