/**
 * satsTutor core: everything the SATs Quest tutor proxy does except Firebase I/O, so it can
 * be unit-tested without the emulator.
 *
 * Ollama Cloud (docs.ollama.com/cloud, /api/authentication, /api/chat, checked 2026-11-23):
 * POST https://ollama.com/api/chat with `Authorization: Bearer <OLLAMA_API_KEY>`. Cloud models
 * do not support structured outputs, so the reply's JSON is requested in the prompt and
 * validated here. The model name is a deploy-time setting; confirm it against
 * https://ollama.com/api/tags before deploying.
 *
 * Safety model:
 * - Only arithmetic questions (digits and operators, plus the word "of") are accepted, so the
 *   proxy cannot be used as a general chatbot.
 * - The correct answer is computed by the game in code; the LLM only explains it, and a reply
 *   that does not contain that answer is rejected.
 * - Nothing about the child is sent: no uid, name, email or free text.
 *
 * Called by: functions/src/index.ts. Tested by: tutorCore.test.ts (root `npm test`).
 */
import { createHash } from 'node:crypto';

export const OLLAMA_CHAT_URL = 'https://ollama.com/api/chat';
export const DEFAULT_MODEL = 'gpt-oss:20b';

export const TUTOR_LIMITS = {
  perUserPerDay: 20,
  /** Global daily cap: the cost ceiling across all children. */
  globalPerDay: 2000,
  timeoutMs: 8000,
  /** Includes the model's reasoning tokens, so keep some headroom over the visible reply. */
  maxOutputTokens: 700,
  maxSteps: 5,
  maxStepChars: 160,
  maxTipChars: 160,
} as const;

/** Paper 1 arithmetic content codes SATs Quest can ask about, with a plain topic name. */
export const TUTOR_TOPICS: Readonly<Record<string, string>> = {
  '4C2': 'column addition and subtraction',
  '4C6a': 'times tables',
  '5C6b': 'multiplying and dividing by 10, 100 and 1,000',
  '5C7a': 'short or long multiplication',
  '5C7b': 'short division',
  '5F10': 'adding and subtracting decimals',
  '5F4': 'adding fractions',
  '5F5': 'multiplying a mixed number by a whole number',
  '5C5d': 'square and cube numbers',
  '6N5': 'negative numbers',
  '6C7a': 'long multiplication',
  '6C7b': 'long division',
  '6C9': 'order of operations',
  '6R2': 'percentages of amounts',
  '4F10a': 'fractions of amounts',
  '6F4': 'adding and subtracting fractions with different denominators',
  '6F5a': 'multiplying fractions',
  '6F5b': 'dividing a fraction by a whole number',
  '6F9b': 'multiplying decimals',
  '6F9c': 'dividing decimals',
};

export interface TutorRequest {
  readonly code: string;
  readonly question: string;
  readonly correct: string;
  readonly given: string;
}

export interface TutorReply {
  readonly steps: readonly string[];
  readonly tip: string;
}

export type Checked<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string };

const QUESTION_CHARS = /^[0-9 ,.+\-−×÷()/=%²³]+$/;
const ANSWER = /^[-−]?[0-9][0-9 ,./]{0,15}$/;

const normaliseAnswer = (text: string): string => text.replace(/[−–]/g, '-').replace(/[\s,£]/g, '');

export function validateTutorRequest(data: unknown): Checked<TutorRequest> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'expected an object' };
  const d = data as Record<string, unknown>;
  const keys = Object.keys(d).sort();
  if (keys.join(',') !== 'code,correct,given,question') return { ok: false, reason: 'unexpected fields' };
  const { code, question, correct, given } = d;
  if (typeof code !== 'string' || !Object.hasOwn(TUTOR_TOPICS, code)) return { ok: false, reason: 'unknown topic' };
  if (typeof question !== 'string' || question.length > 60 || !question.trim().endsWith('=')) {
    return { ok: false, reason: 'question must be a calculation ending in =' };
  }
  // The only letters allowed are the word "of" ("25% of 360 =", "3/4 of 20 =").
  if (!QUESTION_CHARS.test(question.replace(/\bof\b/g, ''))) return { ok: false, reason: 'question must be a calculation' };
  if (typeof correct !== 'string' || !ANSWER.test(correct.trim())) return { ok: false, reason: 'bad correct answer' };
  if (typeof given !== 'string' || !ANSWER.test(given.trim())) return { ok: false, reason: 'bad given answer' };
  if (normaliseAnswer(given) === normaliseAnswer(correct)) return { ok: false, reason: 'nothing to explain' };
  return { ok: true, value: { code, question: question.trim(), correct: correct.trim(), given: given.trim() } };
}

/** Same question and same wrong answer → same explanation, so it is only paid for once. */
export function cacheKey(req: TutorRequest): string {
  const material = JSON.stringify([req.code, req.question, normaliseAnswer(req.correct), normaliseAnswer(req.given)]);
  return createHash('sha256').update(material).digest('hex');
}

export interface ChatMessage {
  readonly role: 'system' | 'user';
  readonly content: string;
}

export function buildMessages(req: TutorRequest): ChatMessage[] {
  const system = [
    'You are Owl, a warm and encouraging maths tutor for 10 and 11-year-olds in England preparing for the KS2 SATs arithmetic paper.',
    'Explain how to reach the correct answer using the formal written methods taught in English primary schools',
    '(column addition and subtraction, short and long multiplication, short and long division, common denominators).',
    'Use British English and simple words. Be kind and never make the child feel bad.',
    'The correct answer you are given has been checked and is right: never change it or suggest a different answer.',
    'Do not ask the child questions, do not mention people, places, brands or websites, and do not include links.',
    'Reply with JSON only, exactly in this shape: {"steps": ["..."], "tip": "..."}.',
    'Give 2 to 4 short steps (each under 140 characters); the last step must state the correct answer.',
    'Give one short tip about the mistake the child probably made.',
  ].join(' ');
  const user = JSON.stringify({
    question: req.question,
    correctAnswer: req.correct,
    childAnswer: req.given,
    topic: TUTOR_TOPICS[req.code],
  });
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export class TutorUpstreamError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'TutorUpstreamError';
    this.status = status;
  }
}

export interface OllamaCall {
  readonly fetchImpl: typeof fetch;
  readonly apiKey: string;
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly timeoutMs?: number;
  readonly maxTokens?: number;
}

export function ollamaBody(model: string, messages: readonly ChatMessage[], maxTokens: number): Record<string, unknown> {
  return {
    model,
    messages,
    stream: false,
    // gpt-oss models take a reasoning level; other models are left on their default.
    ...(model.startsWith('gpt-oss') ? { think: 'low' } : {}),
    options: { temperature: 0.2, num_predict: maxTokens },
  };
}

/** One non-streaming chat call. Throws TutorUpstreamError on timeout, HTTP errors or an odd body. */
export async function callOllama(call: OllamaCall): Promise<string> {
  if (!call.apiKey) throw new TutorUpstreamError('missing API key');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), call.timeoutMs ?? TUTOR_LIMITS.timeoutMs);
  try {
    const res = await call.fetchImpl(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${call.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaBody(call.model, call.messages, call.maxTokens ?? TUTOR_LIMITS.maxOutputTokens)),
      signal: controller.signal,
    });
    if (!res.ok) throw new TutorUpstreamError(`Ollama returned ${res.status}`, res.status);
    const body = (await res.json()) as { message?: { content?: unknown } };
    const content = body?.message?.content;
    if (typeof content !== 'string' || !content.trim()) throw new TutorUpstreamError('empty reply');
    return content;
  } catch (err) {
    if (err instanceof TutorUpstreamError) throw err;
    throw new TutorUpstreamError(controller.signal.aborted ? 'timed out' : 'request failed');
  } finally {
    clearTimeout(timer);
  }
}

const UNSAFE = /\b(stupid|idiot|dumb|hate|kill|die|dead|sexy?|damn|hell|crap|shut up|loser)\b/i;
const LINKISH = /https?:|www\.|\.(com|co\.uk|org|net|io)\b|@/i;

const tidy = (text: string): string => text.replace(/\s+/g, ' ').trim();

/** Check the model's reply: JSON shape, lengths, no links or unkind words, and the right answer in it. */
export function parseTutorReply(content: string, req: TutorRequest): Checked<TutorReply> {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) return { ok: false, reason: 'no JSON object' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(content.slice(start, end + 1));
  } catch {
    return { ok: false, reason: 'invalid JSON' };
  }
  const p = parsed as { steps?: unknown; tip?: unknown };
  if (!Array.isArray(p.steps) || p.steps.length < 1 || p.steps.length > TUTOR_LIMITS.maxSteps) {
    return { ok: false, reason: 'steps must be a list of 1 to 5' };
  }
  const steps = p.steps.map((s) => (typeof s === 'string' ? tidy(s) : ''));
  if (steps.some((s) => !s || s.length > TUTOR_LIMITS.maxStepChars)) return { ok: false, reason: 'bad step' };
  const tip = typeof p.tip === 'string' ? tidy(p.tip) : '';
  if (tip.length > TUTOR_LIMITS.maxTipChars) return { ok: false, reason: 'tip too long' };
  const all = [...steps, tip].join(' ');
  if (LINKISH.test(all) || /[<>]/.test(all)) return { ok: false, reason: 'links or markup' };
  if (UNSAFE.test(all)) return { ok: false, reason: 'unsafe wording' };
  if (!normaliseAnswer(all).includes(normaliseAnswer(req.correct))) return { ok: false, reason: 'correct answer missing' };
  return { ok: true, value: { steps, tip } };
}

/** UTC day, used to reset the daily caps. */
export function dayKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export type UsageDecision = 'ok' | 'user-limit' | 'global-limit';

export function usageDecision(
  userCount: number,
  globalCount: number,
  limits: { readonly perUserPerDay: number; readonly globalPerDay: number } = TUTOR_LIMITS,
): UsageDecision {
  if (globalCount >= limits.globalPerDay) return 'global-limit';
  if (userCount >= limits.perUserPerDay) return 'user-limit';
  return 'ok';
}

/** A cached reply is only trusted if it still passes the same checks. */
export function readCached(data: unknown, req: TutorRequest): TutorReply | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { steps?: unknown; tip?: unknown };
  const check = parseTutorReply(JSON.stringify({ steps: d.steps, tip: d.tip }), req);
  return check.ok ? check.value : null;
}
