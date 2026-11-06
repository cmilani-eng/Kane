/**
 * Catalog attack-range tip in map tiles (HUD label only).
 */
import { MAP } from '../../config/balance';
import { t } from '../../i18n';

/** Whole-number tile reach from world-pixel attack range. */
export function attackRangeTiles(rangePx: number): number {
  if (rangePx <= 0) return 0;
  return Math.max(0, Math.round(rangePx / MAP.tile));
}

export function attackRangeLabel(rangePx: number): string | null {
  if (rangePx <= 0) return null;
  return t('sel.rangeTip', { n: attackRangeTiles(rangePx) });
}
