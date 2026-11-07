/**
 * Minimap fog coverage tip (presentation only).
 * Explored cell % of the fog grid — distinct from fog age / scout tips.
 */
import type { FogState } from '../../gameplay/battlefield/battlefieldFog';
import { t } from '../../i18n';

/** Whole-percent of fog cells ever explored by the player. */
export function fogExploredCoveragePct(fog: FogState): number {
  const cells = fog.explored;
  if (cells.length === 0) return 0;
  let n = 0;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] === 1) n += 1;
  }
  return Math.round((100 * n) / cells.length);
}

/** Fog · {pct}% — live explored coverage on the minimap chrome. */
export function minimapFogCoverageTipText(pct: number): string {
  const n = Math.max(0, Math.min(100, Math.floor(pct)));
  return t('hud.minimapFog', { pct: n });
}
