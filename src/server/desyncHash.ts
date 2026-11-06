/**
 * Deterministic-ish match hash for future lockstep desync checks.
 * Local stub only — SP vs AI does not depend on this.
 */

export interface HashableMatchSlice {
  tick: number;
  unitCount: number;
  buildingCount: number;
  /** Optional stable payload (sorted unit positions, HP, etc.). */
  parts?: Array<string | number>;
}

/** FNV-1a 32-bit → hex — fast, no crypto dependency. */
export function fnv1aHex(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function hashMatchSlice(slice: HashableMatchSlice): string {
  const body = [
    slice.tick,
    slice.unitCount,
    slice.buildingCount,
    ...(slice.parts ?? []),
  ].join('|');
  return fnv1aHex(body);
}
