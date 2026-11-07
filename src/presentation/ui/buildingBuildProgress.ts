/**
 * Live construction progress tip for incomplete buildings (HUD label only).
 * Distinct from catalog Build {n}s and the longer Building {pct}% · {sec}s line.
 */
import { t } from '../../i18n';

/**
 * Null when the building is finished.
 * Incomplete → Build · {pct}% · {sec}s
 */
export function buildingBuildProgressLabel(
  ready: boolean,
  buildPct: number,
  remainSec: number,
): string | null {
  if (ready) return null;
  const pct = Math.max(
    0,
    Math.min(99, Math.floor(Math.min(1, Math.max(0, buildPct)) * 100)),
  );
  const sec = Math.max(0, Math.floor(remainSec));
  return t('sel.buildProgressTip', { pct, sec });
}
