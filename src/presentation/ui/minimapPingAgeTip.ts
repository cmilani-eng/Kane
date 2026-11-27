/**
 * Minimap attention-ping age tip (presentation only).
 * Format: Mark · {sector} · {n}s — middot (U+00B7).
 * Distinct from sector-only Mark · {sector} (`hud.pingSector`),
 * Fog age · ns (`hud.minimapFogAge`), Scout · {sector} · ns (`hud.fogRevealAge`),
 * and Cam · sector (`hud.minimapCamSector`).
 */
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

/** Whole seconds since the ping sector hint armed. */
export function pingAgeSec(
  lifeMs: number,
  maxLifeMs = ATTENTION_PING_SECTOR_HINT_MS,
): number {
  if (maxLifeMs <= 0) return 0;
  const age = Math.max(0, maxLifeMs - Math.max(0, lifeMs));
  return Math.floor(age / 1000);
}

/** Mark · {sector} · {n}s — middot (U+00B7) age tip for the minimap attention ping. */
export function minimapPingAgeTip(
  sector: MapSectorId,
  lifeMs: number,
  maxLifeMs = ATTENTION_PING_SECTOR_HINT_MS,
): string {
  return t('hud.pingAge', {
    sector,
    sec: pingAgeSec(lifeMs, maxLifeMs),
  });
}
