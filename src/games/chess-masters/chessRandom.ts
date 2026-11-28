/**
 * Chess Masters — seeded randomness (mulberry32). Power-up spawns, the computer's loadout and
 * its choice between equal moves all come from a seed, so a test can replay any of them.
 *
 * Called by: chessMatch.ts, chessUpgrades.ts, chessAi.ts
 * Tested by: src/games/chess-masters/chessMatch.test.ts
 */

/** One step of the generator: a value in [0, 1) and the state to pass back in next time. */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(next ^ (next >>> 15), 1 | next);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next };
}

export function seededRandom(seed: number): () => number {
  let state = seed | 0;
  return () => {
    const step = nextRandom(state);
    state = step.state;
    return step.value;
  };
}
