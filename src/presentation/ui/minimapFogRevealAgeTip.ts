/**
 * Minimap fog-reveal / scout sector age tip (presentation only).
 * Format: Scout · {sector} · {n}s — middot (U+00B7).
 * Distinct from sector-only Scout · {sector} (`hud.minimapScoutPulse`),
 * Fog age · ns (`hud.minimapFogAge`), Fog · pct% (`hud.minimapFog`),
 * and pause Cam · sector (`pause.camSectorTip`).
 */
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

/** Whole seconds since the reveal pulse armed the hint. */
export function fogRevealAgeSec(
  lifeMs: number,
  maxLifeMs = SCOUT_SECTOR_HINT_MS,
): number {
  if (maxLifeMs <= 0) return 0;
  const age = Math.max(0, maxLifeMs - Math.max(0, lifeMs));
  return Math.floor(age / 1000);
}

/** Scout · {sector} · {n}s — age tip for the minimap fog reveal pulse. */
export function minimapFogRevealAgeTip(
  sector: MapSectorId,
  lifeMs: number,
  maxLifeMs = SCOUT_SECTOR_HINT_MS,
): string {
  return t('hud.fogRevealAge', {
    sector,
    sec: fogRevealAgeSec(lifeMs, maxLifeMs),
  });
}
