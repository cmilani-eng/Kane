/**
 * Seeded random numbers for the battlefield simulation. Every random choice the
 * simulation makes draws from the world's generator, so two runs with the same
 * seed and the same commands end in the same state. Math.random is not allowed
 * inside the simulation.
 */
export type Rng = () => number;

/** mulberry32: small, fast, and well distributed for game jitter. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
