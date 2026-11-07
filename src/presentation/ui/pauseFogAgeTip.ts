/**
 * Pause overlay fog-reveal age tip (HUD label only).
 * Format: Fog · {n}s (middot U+00B7) — age of the last fog scout pulse,
 * frozen when pause opens. Distinct from Fog · pct% / Fog age · /
 * Scout · sector · ns / Vision ·; own pause-scoped key (`pause.fogAgeTip`).
 */
import { t } from '../../i18n';

/** Whole seconds since the last fog scout pulse armed. */
export function fogAgeSec(ageMs: number): number {
  return Math.max(0, Math.floor(ageMs / 1000));
}

/** Fog · {n}s — age of the last fog reveal / scout pulse. */
export function pauseFogAgeTipLine(ageMs: number): string {
  return t('pause.fogAgeTip', { sec: fogAgeSec(ageMs) });
}
