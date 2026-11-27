/**
 * Minimap hero status tip (presentation only).
 * Format: Hero · Ready / Down / {sector} — middot (U+00B7).
 * Ready before recruit, Down after death, sector while alive.
 * Distinct from Cam · / Scout · / Mark · / Army · minimap peers;
 * same en/pt-BR/es copy as pause Hero tip (`pause.heroReady` /
 * `pause.heroDown` / `pause.heroSector`), own keys.
 */
import { mapSectorAt, type MapSectorId } from '../../gameplay/battlefield/mapSector';
import { findPlayerHero } from '../../gameplay/battlefield/battlefieldHeroes';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';

export type MinimapHeroStatus =
  | { kind: 'ready' }
  | { kind: 'down' }
  | { kind: 'live'; sector: MapSectorId };

/** Living → sector; fallen → Down; else Ready to recruit. */
export function minimapHeroStatus(world: BattlefieldWorld): MinimapHeroStatus {
  const hero = findPlayerHero(world);
  if (hero && hero.hp > 0) {
    return { kind: 'live', sector: mapSectorAt(hero.x, hero.y) };
  }
  if (world.playerHeroDown) return { kind: 'down' };
  return { kind: 'ready' };
}

export function minimapHeroStatusTipText(status: MinimapHeroStatus): string {
  if (status.kind === 'ready') return t('hud.minimapHeroReady');
  if (status.kind === 'down') return t('hud.minimapHeroDown');
  return t('hud.minimapHeroSector', { sector: status.sector });
}
