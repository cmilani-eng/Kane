/**
 * Minimap fog-reveal scout sector mark (presentation only).
 * Format: Scout · {sector} — distinct from Scout · {sector} · {n}s age tip.
 */
import { SCOUT_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldScoutPulse';
import type { MapSectorId } from '../../gameplay/battlefield/mapSector';
import { t } from '../../i18n';

/** Fade alpha for the minimap scout label (1 at arm, 0 at expiry). */
export function minimapScoutPulseLabelAlpha(
  lifeMs: number,
  maxLifeMs = SCOUT_SECTOR_HINT_MS,
): number {
  if (lifeMs <= 0 || maxLifeMs <= 0) return 0;
  const ratio = Math.min(1, lifeMs / Math.min(400, maxLifeMs));
  return 0.45 + 0.55 * ratio;
}

export function minimapScoutPulseLabelText(sector: MapSectorId): string {
  return t('hud.minimapScoutPulse', { sector });
}
