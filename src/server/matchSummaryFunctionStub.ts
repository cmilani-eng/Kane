/**
 * Cloud Function stub — accepts end-of-match payloads.
 * Persists via localStorage write path until Functions deploy.
 */
import { recordMatchResult } from '../database/localStats';
import {
  writeMatchSummary,
  type MatchSummaryPayload,
} from '../database/matchSummary';

export interface MatchSummaryFunctionResult {
  ok: true;
  id: string;
  sink: MatchSummaryPayload['sink'];
}

/**
 * Mimics `onCall('writeMatchSummary')` — no network.
 * Updates win/loss counters + appends summary for #/admin.
 */
export async function writeMatchSummaryFunctionStub(
  payload: Omit<MatchSummaryPayload, 'sink'> & {
    sink?: MatchSummaryPayload['sink'];
  },
): Promise<MatchSummaryFunctionResult> {
  const full: MatchSummaryPayload = {
    ...payload,
    sink: 'function-stub',
  };
  recordMatchResult(full.species, full.won);
  writeMatchSummary(full);
  console.info(
    `[KANE] matchSummary Function stub wrote ${full.id} (${full.result})`,
  );
  return { ok: true, id: full.id, sink: full.sink };
}

/** Placeholder export shape for a future `functions/src/matchSummary.ts`. */
export const MATCH_SUMMARY_FUNCTION_NAME = 'writeMatchSummary' as const;
