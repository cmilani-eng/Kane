/**
 * Coarse catalog duty role tip (HUD label only).
 * Format: Role · {worker|combat|hero} — middot (U+00B7).
 * Distinct from Armor · class (`sel.armorTip`) / Species · / Name ·;
 * selection-only tip (no lobby/pause twin).
 */
import { getUnitType, type UnitTypeId } from '../../data/units';
import { t } from '../../i18n';

export type UnitRoleId = 'worker' | 'combat' | 'hero';

export function unitRole(typeId: UnitTypeId): UnitRoleId {
  const def = getUnitType(typeId);
  if (def.isHero) return 'hero';
  if (def.canGather) return 'worker';
  return 'combat';
}

export function unitRoleLabel(typeId: UnitTypeId): string {
  const role = unitRole(typeId);
  return t('sel.roleTip', { role: t(`sel.role.${role}`) });
}

/** Shared role label when every selected unit shares one duty role. */
export function sharedUnitRoleLabel(
  typeIds: readonly UnitTypeId[],
): string | null {
  if (typeIds.length === 0) return null;
  const first = unitRole(typeIds[0]!);
  for (let i = 1; i < typeIds.length; i++) {
    if (unitRole(typeIds[i]!) !== first) return null;
  }
  return unitRoleLabel(typeIds[0]!);
}
