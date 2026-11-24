/**
 * "Ask Owl": an optional LLM explanation for a missed arithmetic question, fetched from the
 * satsTutor Cloud Function (Ollama Cloud behind it). The worked steps written in code are
 * always shown first and stay the fallback whenever Owl is off, slow, capped or unsure.
 *
 * Only the question, the code-computed answer, the child's numeric answer and the content
 * code are sent — nothing about the child. The API key never reaches the browser.
 *
 * Called by: satsUi.ts
 */
import { connectFunctionsEmulator, getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { getFirebaseApp } from '../../firebase/app';
import { EMULATOR_ENDPOINTS } from '../../firebase/emulatorConfig';
import { envWantsEmulators } from '../../firebase/publicConfig';
import type { Item, NumberItem } from './satsTypes';

/** Off until satsTutor is deployed with its OLLAMA_API_KEY secret (see functions/src/index.ts). */
export const SATS_LLM_TUTOR_ENABLED = false;

const REGION = 'europe-west2';
const FUNCTIONS_EMULATOR_PORT = 5001;
const CLIENT_TIMEOUT_MS = 12_000;

export interface OwlReply {
  readonly steps: readonly string[];
  readonly tip: string;
}

export function canAskOwl(item: Item, signedIn: boolean): item is NumberItem {
  return SATS_LLM_TUTOR_ENABLED && signedIn && item.realm === 'arithmetic' && item.kind === 'number';
}

let functions: Functions | null = null;

function tutorFunctions(): Functions | null {
  if (functions) return functions;
  const app = getFirebaseApp();
  if (!app) return null;
  functions = getFunctions(app, REGION);
  if (envWantsEmulators()) connectFunctionsEmulator(functions, EMULATOR_ENDPOINTS.firestoreHost, FUNCTIONS_EMULATOR_PORT);
  return functions;
}

/** Defence in depth: the server already validated the reply, but check its shape again here. */
export function readOwlReply(data: unknown): OwlReply | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { steps?: unknown; tip?: unknown };
  if (!Array.isArray(d.steps) || d.steps.length < 1 || d.steps.length > 5) return null;
  if (!d.steps.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 200)) return null;
  const tip = typeof d.tip === 'string' && d.tip.length <= 200 ? d.tip : '';
  return { steps: d.steps as string[], tip };
}

/** Resolves null on any failure, so the caller just keeps showing the worked steps. */
export async function askOwl(item: NumberItem, given: string): Promise<OwlReply | null> {
  const fns = tutorFunctions();
  if (!fns) return null;
  const call = httpsCallable(fns, 'satsTutor', { timeout: CLIENT_TIMEOUT_MS });
  try {
    const result = await call({ code: item.code, question: item.prompt, correct: item.display, given: given.trim() });
    return readOwlReply(result.data);
  } catch (err) {
    console.info('[SATs Quest] Owl unavailable', err);
    return null;
  }
}
