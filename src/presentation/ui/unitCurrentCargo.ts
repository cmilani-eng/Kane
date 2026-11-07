/**
 * Live current-cargo tip for selected workers (HUD label only).
 * Distinct from Cargo · n max catalog tip, Yield · n per trip, and the
 * longer carry-line deposit copy.
 */
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';
import { t } from '../../i18n';

/** True when the unit can haul resources. */
function isWorker(u: BattlefieldUnit): boolean {
  return u.hp > 0 && u.canGather && (u.carryCapacity || 0) > 0;
}

/**
 * Aggregate current haul for living workers.
 * Empty → Cargo · empty; otherwise Cargo · n/cap.
 */
export function unitCurrentCargoLabel(
  units: readonly BattlefieldUnit[],
): string | null {
  const workers = units.filter(isWorker);
  if (workers.length === 0) return null;
  const n = Math.floor(
    workers.reduce((s, u) => s + Math.max(0, u.carrying), 0),
  );
  const cap = Math.floor(
    workers.reduce((s, u) => s + (u.carryCapacity || 0), 0),
  );
  if (n <= 0) return t('sel.cargoNowEmpty');
  return t('sel.cargoNowTip', { n, cap: Math.max(n, cap) });
}
