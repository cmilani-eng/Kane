import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAiState } from './battlefieldAi';
import { stepBattlefieldSim } from './battlefieldSimStep';
import { createBattlefieldWorld, issueMoveSelected } from './battlefieldWorld';
import type { BattlefieldWorld } from './battlefieldWorld';

/** FNV-1a over the state that two clients must agree on. */
function stateHash(world: BattlefieldWorld): string {
  const text = [
    ...world.units.map((u) => `u${u.id}|${u.team}|${u.x.toFixed(3)}|${u.y.toFixed(3)}|${u.hp}`),
    ...world.buildings.map((b) => `b${b.id}|${b.team}|${b.hp}`),
    JSON.stringify(world.wallet),
    JSON.stringify(world.enemyWallet),
  ].join('\n');
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Runs a match headlessly. Every `every` steps it records a hash. On step 40 the
 * player's units are selected and sent forward, the same way on every run.
 */
function runMatch(seed: number, steps: number, every = 20): string[] {
  const world = createBattlefieldWorld('brutes', 'normal', 'crossing', seed);
  const ai = createAiState('normal');
  const hashes: string[] = [];
  for (let step = 0; step < steps; step++) {
    if (step === 40) {
      const mine = world.units.filter((u) => u.team === 'player');
      for (const u of mine) u.selected = true;
      const lead = mine[0];
      if (lead) issueMoveSelected(world, lead.x + 120, lead.y);
    }
    stepBattlefieldSim(world, ai);
    if ((step + 1) % every === 0) hashes.push(stateHash(world));
  }
  return hashes;
}

describe('battlefield simulation determinism', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('two runs with the same seed and orders end in the same state at every checkpoint', () => {
    expect(runMatch(7, 600)).toEqual(runMatch(7, 600));
  });

  it('a different seed produces a different match', () => {
    expect(runMatch(7, 600)).not.toEqual(runMatch(8, 600));
  });

  it('the match changes over time, so the checkpoints mean something', () => {
    const hashes = runMatch(7, 600);
    expect(new Set(hashes).size).toBeGreaterThan(1);
  });

  it('never calls Math.random, so only the seeded generator decides outcomes', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random called inside the battlefield simulation');
    });
    expect(() => runMatch(7, 400)).not.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
