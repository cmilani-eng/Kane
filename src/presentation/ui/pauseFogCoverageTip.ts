/**
 * Pause overlay fog coverage tip (HUD label only).
 * Format: Fog · {pct}% (middot U+00B7) — explored fog cells frozen at pause open.
 * Distinct from Fog · ns / Fog age · / Vision · / Selected ·; same copy as
 * minimap Fog tip but own pause-scoped key (`pause.fogCoverageTip`).
 */
import { t } from '../../i18n';

/** Fog · {pct}% — frozen pause snapshot of explored fog coverage. */
export function pauseFogCoverageTipLine(pct: number): string {
  const n = Math.max(0, Math.min(100, Math.floor(pct)));
  return t('pause.fogCoverageTip', { pct: n });
}
