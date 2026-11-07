/**
 * Pause overlay fog-reveal age tip (HUD label only).
 * Distinct from minimap Scout · sector · ns tip — frozen when pause opens.
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
