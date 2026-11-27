/**
 * Selection health tip (HUD label only).
 * Live current/max HP as HP · {pct}% — middot (U+00B7).
 * Distinct from Max HP · / Supply · / DPS · / Range · peers and HP chip.
 */
import { t } from '../../i18n';

/** Whole percent 0–100 from current / max HP. Null when maxHp is missing. */
export function selectionHpRatioPercent(
  hp: number,
  maxHp: number,
): number | null {
  if (!(maxHp > 0)) return null;
  const cur = Math.max(0, hp);
  return Math.min(100, Math.round((100 * cur) / maxHp));
}

/** HP · {pct}% — null when maxHp is missing. */
export function selectionHpRatioTipLine(
  hp: number,
  maxHp: number,
): string | null {
  const pct = selectionHpRatioPercent(hp, maxHp);
  if (pct == null) return null;
  return t('sel.hpRatioTip', { n: pct });
}
