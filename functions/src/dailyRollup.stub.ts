/**
 * Firebase Cloud Functions — daily match stats rollup (STUB).
 * Not deployed. Client uses `src/server/dailyRollupFunctionStub.ts`.
 */

export const DAILY_ROLLUP_FUNCTION_NAME = 'rollupDailyMatchStats';

export type DailyRollupRequest = {
  /** Optional UTC day filter YYYY-MM-DD; omit = all local summaries. */
  day?: string;
};

export function validateDailyRollupRequest(
  data: Partial<DailyRollupRequest>,
): boolean {
  if (data.day === undefined) return true;
  return typeof data.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.day);
}
