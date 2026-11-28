/** The computer: only legal actions in every mode, sensible choices, and it answers in time. */
import { describe, expect, it } from 'vitest';
import { QUEEN, parseFen, typeOf } from './chessCore';
import { chooseAction, powerCandidatesFor, type AiInput, type AiSettings } from './chessAi';
import { evaluate, pieceValues } from './chessEval';
import { MODES, createMatch, playAction, type Match } from './chessMatch';
import { seededRandom } from './chessRandom';
import { findLegalAction, isInCheck, legalActions } from './chessRules';
import { describeAction, position, sq } from './chessTestkit.testkit';
import { LEVELS, UPGRADE_IDS, maskOf, type Level } from './chessUpgrades';

const inputOf = (match: Match): AiInput => ({ pos: match.pos, seen: match.seen, powerUps: match.mode === 'powerup' });

const ask = (pos: AiInput['pos'], level: Level, extra: Partial<AiSettings> = {}): string => {
  const reply = chooseAction({ pos, seen: {}, powerUps: true }, { level, seed: 1, timeMs: 1000, ...extra });
  return describeAction(reply!.action);
};

describe('only ever legal', () => {
  it.each(MODES)(
    'in %s games, against random play, at every level',
    (mode) => {
      const random = seededRandom(31);
      let powerUses = 0;
      for (const level of LEVELS) {
        const everything = maskOf(UPGRADE_IDS);
        let match = createMatch({ mode, upgrades: [everything, everything], seed: 8 });
        if (mode === 'powerup') {
          const stocked = { shield: 1, freeze: 1, double: 1, teleport: 0 };
          match = { ...match, pos: { ...match.pos, held: [{ ...stocked, teleport: 1 }, stocked] } };
        }
        for (let ply = 0; ply < 40 && !match.outcome; ply++) {
          let action;
          if (ply % 2 === 0 || match.pos.second) {
            const reply = chooseAction(inputOf(match), { level, seed: ply, timeMs: 60, maxDepth: 2 });
            expect(reply).not.toBeNull();
            action = reply!.action;
            expect(findLegalAction(match.pos, action)).not.toBeNull();
            if (action.type !== 'move' || action.double) powerUses++;
          } else {
            const options = legalActions(match.pos);
            action = options[Math.floor(random() * options.length)]!;
          }
          const result = playAction(match, action);
          expect(result).not.toBeNull();
          match = result!.match;
        }
      }
      expect(powerUses > 0).toBe(mode === 'powerup');
    },
    120_000,
  );
});

describe('good choices', () => {
  it.each(['medium', 'hard'] as const)('%s mates in one', (level) => {
    expect(ask(parseFen('6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1'), level)).toBe('a1a8');
  });

  it.each(LEVELS)('%s takes a queen left undefended', (level) => {
    expect(ask(parseFen('4k3/8/8/3q4/8/8/8/3QK3 w - - 0 1'), level)).toBe('d1d5');
  });

  it('wins by force when mate is two moves away', () => {
    const reply = chooseAction(
      { pos: parseFen('7k/8/5K2/8/8/8/8/6R1 w - - 0 1'), seen: {}, powerUps: false },
      { level: 'hard', seed: 1, timeMs: 4000 },
    )!;
    expect(reply.score).toBeGreaterThan(90_000);
  });

  it('does not throw away its queen for a pawn', () => {
    const pos = parseFen('4k3/2p5/3p4/8/8/8/3Q4/4K3 w - - 0 1');
    expect(ask(pos, 'medium')).not.toBe('d2d6');
  });

  it('does not stalemate a bare king when it is winning', () => {
    const pos = parseFen('7k/8/6K1/8/8/8/5Q2/8 w - - 0 1');
    expect(ask(pos, 'hard')).not.toBe('f2f7');
  });

  it("respects an enemy knight's Long Leap", () => {
    // Without the upgrade d4 is safe from the d6 knight; with it, a queen going there is lost.
    const fen = '4k3/8/3n4/8/8/8/3Q4/4K3 w - - 0 1';
    const upgraded = position(fen, { upgrades: [[], ['longLeap']] });
    const reply = chooseAction({ pos: upgraded, seen: {}, powerUps: false }, { level: 'medium', seed: 1, timeMs: 5000 })!;
    expect(describeAction(reply.action)).not.toBe('d2d4');
  });

  it('finds the Freeze that saves it from checkmate', () => {
    const pos = position('6k1/8/8/8/8/8/6PP/4r2K w - - 0 1', { held: [{ freeze: 1 }, {}] });
    expect(ask(pos, 'easy')).toBe('freeze:e1');
  });

  it('finds the Teleport that blocks a check', () => {
    const pos = position('6k1/8/8/8/8/N7/6PP/4r2K w - - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(ask(pos, 'medium')).toMatch(/^teleport:a3(f1|g1)$/);
  });

  it('keeps a power-up rather than spending it for nothing', () => {
    const pos = position('4k3/pppp4/8/8/8/8/PPPP4/4K3 w - - 0 1', { held: [{ shield: 1, freeze: 1, teleport: 1 }, {}] });
    expect(ask(pos, 'hard', { maxDepth: 3 })).toMatch(/^[a-h][1-8][a-h][1-8]$/);
  });

  it('uses a Double Move to win a queen', () => {
    // Two steps are needed to reach the queen, which one ordinary move cannot do.
    const pos = position('3q3k/8/8/8/8/8/8/R5K1 w - - 0 1', { held: [{ double: 1 }, {}] });
    let match = createMatch({ mode: 'powerup', position: pos });
    for (let half = 0; half < 2 && match.pos.turn === 0; half++) {
      const reply = chooseAction(inputOf(match), { level: 'medium', seed: 1, timeMs: 5000 })!;
      match = playAction(match, reply.action)!.match;
    }
    expect(match.captured[0]).toContain(QUEEN);
  });

  it('collects a power-up it can safely reach', () => {
    const pos = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { pickups: { a4: 'double' } });
    // Looking further it may do something else first and fetch it a move later.
    expect(ask(pos, 'medium', { maxDepth: 2 })).toBe('a1a4');
  });
});

describe('limits', () => {
  const MIDDLEGAME = 'r1bq1rk1/pp2bppp/2n2n2/3p4/3P4/2NB1N2/PP3PPP/R1BQ1RK1 w - - 0 10';

  it('answers within its time budget, however deep it is allowed to look', () => {
    const everything = maskOf(UPGRADE_IDS);
    const pos = { ...parseFen(MIDDLEGAME, [everything, everything]) };
    pos.held = [{ shield: 1, freeze: 1, double: 1, teleport: 0 }, { shield: 1, freeze: 1, double: 0, teleport: 1 }];
    const started = performance.now();
    const reply = chooseAction({ pos, seen: {}, powerUps: true }, { level: 'hard', seed: 1, timeMs: 400 })!;
    expect(performance.now() - started).toBeLessThan(2500);
    expect(findLegalAction(pos, reply.action)).not.toBeNull();
  });

  it('gives the same answer to the same question', () => {
    const run = (): string => ask(parseFen(MIDDLEGAME), 'medium', { maxDepth: 2 });
    expect(run()).toBe(run());
  });

  it('returns nothing once the game is over', () => {
    const mated = parseFen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1');
    expect(chooseAction({ pos: mated, seen: {}, powerUps: false }, { level: 'hard', seed: 1 })).toBeNull();
  });

  it('only suggests legal power-up uses', () => {
    const pos = position(MIDDLEGAME, { held: [{ shield: 1, freeze: 1, teleport: 1 }, {}] });
    const candidates = powerCandidatesFor(pos);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.length).toBeLessThan(40);
    for (const action of candidates) expect(findLegalAction(pos, action)).not.toBeNull();
    expect(isInCheck(pos, 0)).toBe(false);
  });
});

describe('judging a position', () => {
  it('is even at the start and counts upgrades as extra material', () => {
    const plain = [pieceValues(0), pieceValues(0)];
    const start = parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    expect(evaluate(start, plain)).toBe(0);
    const richer = [pieceValues(maskOf(['amazon'])), pieceValues(0)];
    expect(evaluate(start, richer)).toBeGreaterThan(150);
    expect(typeOf(start.board[sq('d1')]!)).toBe(QUEEN);
  });
});
