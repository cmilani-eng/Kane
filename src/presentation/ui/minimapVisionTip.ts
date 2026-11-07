/**
 * Minimap vision reach tip (presentation only).
 * Max living-player unit vision in map tiles — distinct from selection
 * Sight · tip (`sel.visionTip`) and Fog · coverage %.
 */
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';
import { visionTiles } from './unitVision';

/** Best vision radius (tiles) among living player units. */
export function maxPlayerVisionTiles(world: BattlefieldWorld): number {
  let best = 0;
  for (const u of world.units) {
    if (u.team !== 'player' || u.hp <= 0) continue;
    best = Math.max(best, visionTiles(u.vision));
  }
  return best;
}

/** Vision · {n} — live max vision reach on the minimap chrome. */
export function minimapVisionTipText(tiles: number): string {
  const n = Math.max(0, Math.floor(tiles));
  return t('hud.minimapVision', { n });
}
