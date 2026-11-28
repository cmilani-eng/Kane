/** A whole game: spawns, capture tallies, results on the clock and by resignation. */
import { describe, expect, it } from 'vitest';
import { rankOf } from './chessCore';
import { MAX_PICKUPS, canStillMate, createMatch, flagFall, playAction, resign, type Match } from './chessMatch';
import { seededRandom } from './chessRandom';
import { legalMoves } from './chessRules';
import { move, position } from './chessTestkit.testkit';
import type { Mode } from './chessMatch';

/** Play `plies` random ordinary moves, collecting each spawn on the way. */
function randomGame(mode: Mode, seed: number, plies: number): { match: Match; spawns: string[] } {
  const random = seededRandom(seed);
  let match = createMatch({ mode, seed });
  const spawns: string[] = [];
  for (let i = 0; i < plies && !match.outcome; i++) {
    const moves = legalMoves(match.pos);
    const result = playAction(match, moves[Math.floor(random() * moves.length)]!)!;
    const { spawned } = result.report;
    if (spawned) {
      expect(rankOf(spawned.square)).toBeGreaterThanOrEqual(2);
      expect(rankOf(spawned.square)).toBeLessThanOrEqual(5);
      expect(result.match.pos.board[spawned.square]).toBe(0);
      spawns.push(`${result.match.turns}:${spawned.square}:${spawned.kind}`);
    }
    expect(Object.keys(result.match.pos.pickups).length).toBeLessThanOrEqual(MAX_PICKUPS);
    match = result.match;
  }
  return { match, spawns };
}

describe('power-ups appearing', () => {
  it('start after two turns and then keep to every fifth turn', () => {
    const { spawns } = randomGame('powerup', 5, 40);
    expect(spawns[0]).toMatch(/^2:/);
    for (const spawn of spawns) expect((Number(spawn.split(':')[0]) - 2) % 5).toBe(0);
  });

  it('come out the same from the same seed, and differently from another', () => {
    expect(randomGame('powerup', 9, 40).spawns).toEqual(randomGame('powerup', 9, 40).spawns);
    const others = [1, 2, 3, 4].map((seed) => randomGame('powerup', seed, 3).spawns.join());
    expect(new Set(others).size).toBeGreaterThan(1);
  });

  it.each(['classic', 'blitz', 'upgrades'] as const)('never appear in %s', (mode) => {
    expect(randomGame(mode, 3, 40).spawns).toEqual([]);
  });
});

describe('modes', () => {
  it('only gives upgrades to an Upgrades game', () => {
    expect(createMatch({ mode: 'upgrades', upgrades: [8, 256] }).pos.upgrades).toEqual([8, 256]);
    for (const mode of ['classic', 'powerup', 'blitz'] as const) {
      expect(createMatch({ mode, upgrades: [8, 256] }).pos.upgrades).toEqual([0, 0]);
    }
  });

  it('keeps a log and a tally of captures', () => {
    const start = createMatch({ mode: 'classic' });
    const moves = [move('e2', 'e4'), move('d7', 'd5'), move('e4', 'd5'), move('d8', 'd5')];
    const match = moves.reduce((m, action) => playAction(m, action)!.match, start);
    expect(match.captured).toEqual([[1], [1]]);
    expect(match.log).toHaveLength(4);
    expect(match.turns).toBe(4);
    expect(start.log).toHaveLength(0);
  });

  it('refuses an illegal action', () => {
    expect(playAction(createMatch({ mode: 'classic' }), move('e2', 'e5'))).toBeNull();
  });
});

describe('endings off the board', () => {
  const withRooks = '4k2r/8/8/8/8/8/8/R3K3 w - - 0 1';

  it('gives the game to the other side when a clock runs out', () => {
    const match = createMatch({ mode: 'blitz', position: position(withRooks) });
    expect(flagFall(match, 0).outcome).toEqual({ winner: 1, reason: 'timeout' });
  });

  it('is a draw on time when the other side could never give mate', () => {
    const match = createMatch({ mode: 'blitz', position: position('4k3/8/8/8/8/8/4P3/4KN2 b - - 0 1') });
    expect(flagFall(match, 0).outcome).toEqual({ winner: null, reason: 'timeout-draw' });
    expect(flagFall(match, 1).outcome).toEqual({ winner: 0, reason: 'timeout' });
  });

  it('knows what is enough to give mate', () => {
    expect(canStillMate(position('4k3/8/8/8/8/8/8/4KN2 w - - 0 1'), 0)).toBe(false);
    expect(canStillMate(position('4k3/4p3/8/8/8/8/8/4KN2 w - - 0 1'), 0)).toBe(true);
    expect(canStillMate(position('4k3/8/8/8/8/8/8/3NKN2 w - - 0 1'), 0)).toBe(true);
    expect(canStillMate(position(withRooks), 0)).toBe(true);
    expect(canStillMate(position(withRooks), 1)).toBe(true);
  });

  it('gives a resignation to the other side, and keeps the first result', () => {
    const over = resign(createMatch({ mode: 'classic' }), 0);
    expect(over.outcome).toEqual({ winner: 1, reason: 'resign' });
    expect(flagFall(over, 1).outcome).toEqual(over.outcome);
  });
});
