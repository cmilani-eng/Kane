/**
 * Reverse lookup: unit id → lowest control-group slot (0–9).
 */
import type { ControlGroups } from './battlefieldOrders';

/** Build unitId → lowest assigned slot. Empty selection slots skipped. */
export function buildUnitGroupSlotIndex(
  groups: ControlGroups,
): Map<number, number> {
  const map = new Map<number, number>();
  for (let slot = 0; slot <= 9; slot++) {
    const ids = groups.get(slot);
    if (!ids || ids.length === 0) continue;
    for (const id of ids) {
      if (!map.has(id)) map.set(id, slot);
    }
  }
  return map;
}
