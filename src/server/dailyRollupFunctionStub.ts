/**
 * Cloud Function stub — daily match stats rollup.
 * Rebuilds aggregates from local match summaries for #/admin.
 */
import {
  rebuildDailyRollupFromSummaries,
  type DailyRollupStore,
} from '../database/dailyStatsRollup';
import { loadMatchSummaries } from '../database/matchSummary';

export interface DailyRollupFunctionResult {
  ok: true;
  days: number;
  matches: number;
  sink: DailyRollupStore['sink'];
}

/**
 * Mimics a scheduled/onCall `rollupDailyMatchStats` Function.
 * No network — writes `kane.dailyRollup.v1`.
 */
export async function rollupDailyMatchStatsFunctionStub(): Promise<DailyRollupFunctionResult> {
  const summaries = loadMatchSummaries().summaries;
  const store = rebuildDailyRollupFromSummaries(summaries, 'function-stub');
  const matches = store.days.reduce((n, d) => n + d.matches, 0);
  console.info(
    `[KANE] dailyRollup Function stub · days=${store.days.length} matches=${matches}`,
  );
  return {
    ok: true,
    days: store.days.length,
    matches,
    sink: store.sink,
  };
}

export const DAILY_ROLLUP_FUNCTION_NAME = 'rollupDailyMatchStats' as const;
