/**
 * Minimap / HUD attention-ping sector tip (presentation only).
 * Format: Mark · {sector} — middot (U+00B7).
 * Distinct from Mark · sector · ns age / Scout · / Fog age · / Cam · peers.
 */
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

export function minimapPingSectorTipText(sector: MapSectorId): string {
  return t('hud.pingSector', { sector });
}

/** Fade alpha for the ping sector chip (1 at arm, 0 at expiry). */
export function minimapPingSectorTipAlpha(
  lifeMs: number,
  maxLifeMs = ATTENTION_PING_SECTOR_HINT_MS,
): number {
  if (lifeMs <= 0 || maxLifeMs <= 0) return 0;
  const ratio = Math.min(1, lifeMs / Math.min(400, maxLifeMs));
  return 0.45 + 0.55 * ratio;
}
