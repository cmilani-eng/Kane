/**
 * End-screen career average match-duration tip (HUD label only).
 * Format: Avg time · {clock} — middot (U+00B7).
 * Distinct from Last · / Best · / Time · / ~min match-length peers;
 * same en/pt-BR/es copy as lobby/pause Avg time · (distinct i18n key / surface).
 */
import { loadMatchPrefs } from '../../database/matchPrefs';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

/** Null when prefs have no positive average duration samples yet. */
export function endAvgDurationTipLine(): string | null {
  const ms = loadMatchPrefs().avgDurationMs;
  if (ms == null || ms <= 0) return null;
  return t('end.avgDurationTip', { clock: formatMatchClock(ms) });
}
