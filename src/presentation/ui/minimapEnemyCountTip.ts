/**
 * Minimap enemy count tip (presentation only).
 * Format: Enemies · {n} — middot (U+00B7).
 * Living enemy units currently fog-revealed — distinct from Army · /
 * Selected · / Vision · minimap peers (player-side / sight reach).
 */
import { enemyRevealed } from '../../gameplay/battlefield/battlefieldFog';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';

/** Living enemy units currently visible through fog (minimap threat count). */
export function countVisibleEnemies(world: BattlefieldWorld): number {
  let n = 0;
  for (const u of world.units) {
    if (u.team !== 'enemy' || u.hp <= 0) continue;
    if (!enemyRevealed(world.fog, u.x, u.y)) continue;
    n++;
  }
  return n;
}

/** Enemies · {n} — live fog-revealed enemy count on the minimap chrome. */
export function minimapEnemyCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapEnemies', { n });
}
