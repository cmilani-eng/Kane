/**
 * Catalog heal-rate tip from hero repair/heal abilities (HUD label only).
 * Format: Heal · {n}/s — middot (U+00B7); whole HP/s =
 * round(healHp * 1000 / cooldownMs).
 * Distinct from DPS · / Atk CD · / Rate · / Damage · peers and from hero
 * Cooldown Ns button copy. Buildings / non-heal units omit (no catalog heal).
 */
import { HEROES } from '../../data/heroes';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

/** Catalog heal rate in whole HP/s. Null when the unit has no heal cast. */
export function unitHealRate(typeId: UnitTypeId): number | null {
  if (!getUnitType(typeId).isHero) return null;
  for (const hero of Object.values(HEROES)) {
    if (hero.unitTypeId !== typeId) continue;
    for (const ab of Object.values(hero.abilities)) {
      const healHp = ab.healHp ?? 0;
      if (healHp <= 0 || ab.cooldownMs <= 0) continue;
      return Math.round((healHp * 1000) / ab.cooldownMs);
    }
  }
  return null;
}

export function unitHealRateLabel(typeId: UnitTypeId): string | null {
  const n = unitHealRate(typeId);
  return n == null ? null : t('sel.healRateTip', { n });
}

/** Shared heal-rate tip when every selected unit matches. */
export function sharedUnitHealRateLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitHealRate(typeIds[0]!);
  if (first == null) return null;
  for (let i = 1; i < typeIds.length; i++) {
    if (unitHealRate(typeIds[i]!) !== first) return null;
  }
  return unitHealRateLabel(typeIds[0]!);
}
