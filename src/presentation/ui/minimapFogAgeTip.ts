/**
 * Minimap fog age tip (presentation only).
 * Seconds since the last fog scout reveal — Format: Fog age · {n}s
 * (middot U+00B7). Distinct from pause Fog · ns (`pause.fogAgeTip`),
 * Fog · pct% coverage (`hud.minimapFog`), and Scout · sector · ns
 * (`hud.fogRevealAge`).
 */
import { t } from '../../i18n';
import { fogAgeSec } from './pauseFogAgeTip';

/** Fog age · {n}s — live age of the last fog reveal on the minimap chrome. */
export function minimapFogAgeTipText(ageMs: number | null | undefined): string {
  const ms = ageMs == null ? 0 : ageMs;
  return t('hud.minimapFogAge', { sec: fogAgeSec(ms) });
}
