/**
 * Minimap building count tip (presentation only).
 * Living player buildings — distinct from army / supply and from pause Buildings tip.
 */
import { t } from '../../i18n';

/** Buildings · {n} — live player building count on the minimap chrome. */
export function minimapBuildingCountTipText(count: number): string {
  const n = Math.max(0, Math.floor(count));
  return t('hud.minimapBuildings', { n });
}
