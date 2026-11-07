/**
 * Pause overlay fog coverage tip (HUD label only).
 * Same fogExploredCoveragePct as minimap — frozen at pause open.
 * Distinct from Fog · ns age tip.
 */
import { t } from '../../i18n';

/** Fog · {pct}% — frozen pause snapshot of explored fog coverage. */
export function pauseFogCoverageTipLine(pct: number): string {
  const n = Math.max(0, Math.min(100, Math.floor(pct)));
  return t('pause.fogCoverageTip', { pct: n });
}
