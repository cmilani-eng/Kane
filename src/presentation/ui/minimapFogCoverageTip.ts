/**
 * Minimap fog coverage tip (presentation only).
 * Explored / revealed cell % of the fog grid.
 * Format: Fog · {pct}% — middot (U+00B7).
 * Distinct from Vision · (`hud.minimapVision`), Fog age · ns
 * (`hud.minimapFogAge`), pause Fog · ns (`pause.fogAgeTip`), Selected ·
 * (`hud.minimapSelected`), Scout · sector (`hud.minimapScoutPulse`), and
 * Scout · sector · ns (`hud.fogRevealAge`). Same en/pt-BR/es copy as pause
 * Fog · pct% (`pause.fogCoverageTip`); distinct key/surface.
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
