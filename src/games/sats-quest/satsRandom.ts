/**
 * Small helpers over the shared seeded generator, so question generation is repeatable in
 * tests and from a saved seed.
 */
import { createRng, type Rng } from '../../gameplay/battlefield/battlefieldRng';

export { createRng, type Rng };

/** Whole number from `lo` to `hi`, both included. */
export function int(rng: Rng, lo: number, hi: number): number {
  if (hi < lo) throw new Error(`empty range ${lo}..${hi}`);
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick from an empty list');
  return items[Math.floor(rng() * items.length)]!;
}

/** Fisher–Yates on a copy. */
export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** FNV-1a, for turning a text seed into a generator seed. */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
