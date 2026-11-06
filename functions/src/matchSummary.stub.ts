/**
 * Firebase Cloud Functions — match summary write (STUB).
 * Not deployed. Client uses `src/server/matchSummaryFunctionStub.ts` locally.
 *
 * Future:
 *   export const writeMatchSummary = onCall(async (req) => { ... Firestore ... });
 */

export const MATCH_SUMMARY_FUNCTION_NAME = 'writeMatchSummary';

export type MatchSummaryRequest = {
  id: string;
  result: 'victory' | 'defeat';
  species: string;
  difficulty: string;
  durationMs: number;
};

export function validateMatchSummaryRequest(
  data: Partial<MatchSummaryRequest>,
): boolean {
  return (
    typeof data.id === 'string' &&
    (data.result === 'victory' || data.result === 'defeat') &&
    typeof data.species === 'string' &&
    typeof data.difficulty === 'string' &&
    typeof data.durationMs === 'number'
  );
}
