/** The power-up rules, one promise at a time, then a fuzz test of the ones that must never break. */
import { describe, expect, it } from 'vitest';
import { KING, POWER_KINDS, colorOf, isFrozen, otherColor, shieldTurns, typeOf, type Position } from './chessCore';
import { createMatch, playAction, type Match } from './chessMatch';
import { seededRandom } from './chessRandom';
import { applyAction, findLegalAction, heldCount, isInCheck, legalActions, legalMoves, positionStatus } from './chessRules';
import { actionNames, destinations, freeze, move, position, shield, sq, teleport } from './chessTestkit.testkit';
import type { Action } from './chessCore';

const matchAt = (pos: Position): Match => createMatch({ mode: 'powerup', position: pos });

const play = (match: Match, ...actions: Action[]): Match =>
  actions.reduce((current, action) => {
    const result = playAction(current, action);
    if (!result) throw new Error(`Illegal in test: ${JSON.stringify(action)}`);
    return result.match;
  }, match);

// White's king is caught on the back rank by a rook: mate in ordinary chess.
const BACK_RANK = '6k1/8/8/8/8/8/6PP/4r2K w - - 0 1';
// Black's king has no square and the a5 pawn is blocked: stalemate in ordinary chess.
const STALE = '7k/5Q2/6K1/p7/P7/8/8/8 b - - 0 1';

describe('the king is protected from power-ups', () => {
  it('cannot be shielded, frozen or teleported', () => {
    const pos = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { held: [{ shield: 1, freeze: 1, teleport: 1 }, {}] });
    const names = actionNames(pos);
    expect(names).not.toContain('shield:e1');
    expect(names).not.toContain('freeze:e8');
    expect(names.some((n) => n.startsWith('teleport:e1'))).toBe(false);
    expect(findLegalAction(pos, shield('e1'))).toBeNull();
    expect(findLegalAction(pos, freeze('e8'))).toBeNull();
    expect(findLegalAction(pos, teleport('e1', 'e3'))).toBeNull();
  });

  it('is never a capture target', () => {
    const pos = position('4k3/8/8/8/8/8/8/4RK2 w - - 0 1');
    expect(destinations(pos, 'e1')).not.toContain('e8');
  });
});

describe('Shield', () => {
  const START = '4k3/8/8/2r5/8/8/2N5/4K3 w - - 0 1';

  it('stops a capture for exactly two of the opponent turns', () => {
    let match = play(matchAt(position(START, { held: [{ shield: 1 }, {}] })), shield('c2'));
    expect(heldCount(match.pos, 0)).toBe(0);
    expect(destinations(match.pos, 'c5')).not.toContain('c2');
    match = play(match, move('e8', 'e7'), move('e1', 'f1'));
    expect(destinations(match.pos, 'c5')).not.toContain('c2');
    match = play(match, move('e7', 'e8'), move('f1', 'e1'));
    expect(destinations(match.pos, 'c5')).toContain('c2');
  });

  it('travels with the piece', () => {
    const match = play(matchAt(position(START, { held: [{ shield: 1 }, {}] })), shield('c2'), move('e8', 'e7'), move('c2', 'a3'));
    expect(shieldTurns(match.pos.board[sq('a3')]!)).toBe(1);
  });

  it('also stops an en passant capture', () => {
    const pos = position('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', { shielded: ['d5'] });
    expect(destinations(pos, 'e5')).toEqual(['e6']);
  });

  it('turns a check the king could capture into checkmate', () => {
    const fen = '7k/6Q1/8/8/8/8/8/K7 b - - 0 1';
    expect(positionStatus(position(fen))).toBe('check');
    expect(positionStatus(position(fen, { shielded: ['g7'] }))).toBe('checkmate');
  });

  it('never gets anyone out of check', () => {
    const pos = position(BACK_RANK, { held: [{ shield: 3 }, {}] });
    expect(positionStatus(pos)).toBe('checkmate');
  });

  it('blocks Freeze as well', () => {
    const pos = position('4k3/8/8/2r5/8/8/8/4K3 w - - 0 1', { held: [{ freeze: 1 }, {}], shielded: ['c5'] });
    expect(findLegalAction(pos, freeze('c5'))).toBeNull();
  });
});

describe('Freeze', () => {
  it('holds a piece for one of its turns', () => {
    let match = play(matchAt(position('4k3/8/8/2r5/8/8/8/4K3 w - - 0 1', { held: [{ freeze: 1 }, {}] })), freeze('c5'));
    expect(isFrozen(match.pos.board[sq('c5')]!)).toBe(true);
    expect(destinations(match.pos, 'c5')).toEqual([]);
    match = play(match, move('e8', 'e7'));
    expect(isFrozen(match.pos.board[sq('c5')]!)).toBe(false);
    match = play(match, move('e1', 'f1'));
    expect(destinations(match.pos, 'c5').length).toBeGreaterThan(0);
  });

  it('stops a frozen piece giving check', () => {
    const fen = '4k3/8/8/8/8/8/8/K3R3 b - - 0 1';
    expect(isInCheck(position(fen), 1)).toBe(true);
    expect(isInCheck(position(fen, { frozen: ['e1'] }), 1)).toBe(false);
  });

  it('is an escape from what would otherwise be checkmate', () => {
    expect(positionStatus(position(BACK_RANK))).toBe('checkmate');
    const pos = position(BACK_RANK, { held: [{ freeze: 1 }, {}] });
    expect(positionStatus(pos)).toBe('check');
    expect(actionNames(pos)).toEqual(['freeze:e1']);
    expect(createMatch({ mode: 'powerup', position: pos }).outcome).toBeNull();
  });

  it('only delays: the check is back when the piece thaws', () => {
    const match = play(matchAt(position(BACK_RANK, { held: [{ freeze: 1 }, {}] })), freeze('e1'), move('g8', 'f8'));
    expect(isInCheck(match.pos, 0)).toBe(true);
    expect(match.outcome).toEqual({ winner: 1, reason: 'checkmate' });
  });

  it('keeps a frozen rook from castling', () => {
    const pos = position('4k3/8/8/8/8/8/8/4K2R w K - 0 1', { frozen: ['h1'] });
    expect(destinations(pos, 'e1')).not.toContain('g1');
  });
});

describe('Teleport', () => {
  it('can block a check that would otherwise be checkmate', () => {
    const fen = '6k1/8/8/8/8/N7/6PP/4r2K w - - 0 1';
    expect(positionStatus(position(fen))).toBe('checkmate');
    const pos = position(fen, { held: [{ teleport: 1 }, {}] });
    expect(positionStatus(pos)).toBe('check');
    expect(actionNames(pos).sort()).toEqual(['teleport:a3f1', 'teleport:a3g1']);
  });

  it('keeps pawns off the first and last ranks', () => {
    const pos = position('4k3/8/8/8/8/8/P7/4K3 w - - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(findLegalAction(pos, teleport('a2', 'b1'))).toBeNull();
    expect(findLegalAction(pos, teleport('a2', 'b8'))).toBeNull();
    expect(findLegalAction(pos, teleport('a2', 'b7'))).not.toBeNull();
  });

  it('only goes to an empty square', () => {
    const pos = position('4k3/8/8/8/8/2r5/8/R3K3 w - - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(findLegalAction(pos, teleport('a1', 'c3'))).toBeNull();
  });

  it('may not give check, directly or by uncovering one', () => {
    const direct = position('7k/8/8/8/8/8/8/R3K3 w - - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(findLegalAction(direct, teleport('a1', 'a8'))).toBeNull();
    expect(findLegalAction(direct, teleport('a1', 'h2'))).toBeNull();
    expect(findLegalAction(direct, teleport('a1', 'b2'))).not.toBeNull();
    const uncovered = position('R2N2k1/8/8/8/8/8/8/4K3 w - - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(findLegalAction(uncovered, teleport('d8', 'd3'))).toBeNull();
  });

  it('may not leave your own king in check', () => {
    const pos = position('4r2k/8/8/8/8/8/4B3/4K3 w - - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(findLegalAction(pos, teleport('e2', 'a6'))).toBeNull();
    expect(findLegalAction(pos, teleport('e2', 'e4'))).not.toBeNull();
  });

  it('cannot move a frozen piece, and loses the castling right of a moved rook', () => {
    const frozen = position('4k3/8/8/8/8/8/8/4K2R w K - 0 1', { held: [{ teleport: 1 }, {}], frozen: ['h1'] });
    expect(findLegalAction(frozen, teleport('h1', 'h4'))).toBeNull();
    const free = position('4k3/8/8/8/8/8/8/4K2R w K - 0 1', { held: [{ teleport: 1 }, {}] });
    expect(applyAction(free, teleport('h1', 'h3')).castling).toBe(0);
  });
});

describe('stalemate counts every usable power-up', () => {
  it('is stalemate without one', () => {
    expect(positionStatus(position(STALE))).toBe('stalemate');
  });

  it.each(['shield', 'freeze', 'teleport'] as const)('is not stalemate while %s can be used', (kind) => {
    const pos = position(STALE, { held: [{}, { [kind]: 1 }] });
    expect(positionStatus(pos)).toBe('normal');
    expect(legalActions(pos).length).toBeGreaterThan(0);
  });

  it('is still stalemate with only a Double Move, which needs a move to start', () => {
    expect(positionStatus(position(STALE, { held: [{}, { double: 1 }] }))).toBe('stalemate');
  });

  it('is stalemate when the power-up has nothing to aim at', () => {
    expect(positionStatus(position('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', { held: [{}, { shield: 1 }] }))).toBe('stalemate');
  });

  it('can be forced with a Freeze on the only piece that could move', () => {
    const pos = position('7k/5Q2/6K1/p7/8/8/8/8 w - - 0 1', { held: [{ freeze: 1 }, {}] });
    const match = play(matchAt(pos), freeze('a5'));
    expect(match.outcome).toEqual({ winner: null, reason: 'stalemate' });
  });
});

describe('Double Move', () => {
  const OPEN = '4k3/8/8/8/8/8/1N6/R3K3 w - - 0 1';

  it('makes two moves in one turn and spends the power-up', () => {
    let match = play(matchAt(position(OPEN, { held: [{ double: 1 }, {}] })), move('b2', 'c4', { double: true }));
    expect(match.pos.turn).toBe(0);
    expect(match.pos.second).toBe(true);
    expect(heldCount(match.pos, 0)).toBe(0);
    expect(match.turns).toBe(0);
    match = play(match, move('c4', 'a5'));
    expect(match.pos.turn).toBe(1);
    expect(match.pos.second).toBe(false);
    expect(match.turns).toBe(1);
  });

  it('allows only ordinary moves as the second half', () => {
    const pos = position(OPEN, { held: [{ double: 1, shield: 1, teleport: 1 }, {}] });
    const match = play(matchAt(pos), move('b2', 'c4', { double: true }));
    expect(legalActions(match.pos).every((a) => a.type === 'move' && !a.double)).toBe(true);
    expect(playAction(match, shield('a1'))).toBeNull();
    expect(playAction(match, move('c4', 'a5', { double: true }))).toBeNull();
  });

  it('ends at once when the first half gives check', () => {
    const pos = position(OPEN, { held: [{ double: 1 }, {}] });
    const result = playAction(matchAt(pos), move('a1', 'a8', { double: true }))!;
    expect(result.report).toMatchObject({ turnEnded: true, doubleCutShort: true, check: true });
    expect(result.match.pos.turn).toBe(1);
    expect(heldCount(result.match.pos, 0)).toBe(0);
    // The king is still there and Black must answer the check.
    expect(typeOf(result.match.pos.board[sq('e8')]!)).toBe(KING);
    expect(isInCheck(result.match.pos, 1)).toBe(true);
  });

  it('cannot take the king: no second move can ever start with the enemy king in check', () => {
    const pos = position(OPEN, { held: [{ double: 1 }, {}] });
    for (const first of legalActions(pos)) {
      if (first.type !== 'move' || !first.double) continue;
      const next = applyAction(pos, first);
      if (!next.second) continue;
      expect(isInCheck(next, 1)).toBe(false);
      expect(legalMoves(next).some((m) => m.to === next.kings[1])).toBe(false);
    }
  });

  it('needs each half to keep your own king safe', () => {
    // The bishop is pinned: it may not step aside even if it meant to come back.
    const pinned = position('4r2k/8/8/8/8/8/4B3/4K3 w - - 0 1', { held: [{ double: 1 }, {}] });
    expect(findLegalAction(pinned, move('e2', 'd3', { double: true }))).toBeNull();
    // In check, the first half has to deal with it.
    const checked = position('4r2k/8/8/8/8/8/R7/4K3 w - - 0 1', { held: [{ double: 1 }, {}] });
    expect(findLegalAction(checked, move('a2', 'a8', { double: true }))).toBeNull();
    expect(findLegalAction(checked, move('a2', 'e2', { double: true }))).not.toBeNull();
  });

  it('does not save a checkmated king', () => {
    expect(positionStatus(position(BACK_RANK, { held: [{ double: 2 }, {}] }))).toBe('checkmate');
  });

  it('ends after the first half when there is no second move', () => {
    // The queen boxes the king in, and one step later the only pawn is blocked too.
    const pos = position('4k3/7p/8/7P/8/1q6/8/K7 w - - 0 1', { held: [{ double: 1 }, {}] });
    expect(legalMoves(pos)).toHaveLength(1);
    const result = playAction(matchAt(pos), move('h5', 'h6', { double: true }))!;
    expect(result.report).toMatchObject({ turnEnded: true, doubleCutShort: false, check: false });
    expect(result.match.pos.turn).toBe(1);
    expect(result.match.pos.second).toBe(false);
  });

  it('gives en passant only against a double step that finished the turn', () => {
    const fen = '4k3/8/8/8/3p4/8/4P3/4K1N1 w - - 0 1';
    const first = play(matchAt(position(fen, { held: [{ double: 1 }, {}] })), move('e2', 'e4', { double: true }), move('g1', 'f3'));
    expect(destinations(first.pos, 'd4')).not.toContain('e3');
    const last = play(matchAt(position(fen, { held: [{ double: 1 }, {}] })), move('g1', 'f3', { double: true }), move('e2', 'e4'));
    expect(destinations(last.pos, 'd4')).toContain('e3');
  });

  it('keeps en passant when a checking double step cuts the move short', () => {
    const pos = position('8/8/8/3k4/3p4/8/4P3/4K3 w - - 0 1', { held: [{ double: 1 }, {}] });
    const match = play(matchAt(pos), move('e2', 'e4', { double: true }));
    expect(match.pos.turn).toBe(1);
    expect(destinations(match.pos, 'd4')).toContain('e3');
  });
});

describe('collecting', () => {
  it('picks up what a piece lands on, three at most', () => {
    const pos = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { pickups: { a4: 'freeze' } });
    const result = playAction(matchAt(pos), move('a1', 'a4'))!;
    expect(result.report.collected).toBe('freeze');
    expect(result.match.pos.held[0].freeze).toBe(1);
    expect(result.match.pos.pickups[sq('a4')]).toBeUndefined();

    const full = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { held: [{ shield: 3 }, {}], pickups: { a4: 'freeze' } });
    const after = playAction(matchAt(full), move('a1', 'a4'))!.match.pos;
    expect(heldCount(after, 0)).toBe(3);
    expect(after.pickups[sq('a4')]).toBeUndefined();
  });

  it.each(['double', 'teleport'] as const)('frees its slot before a %s lands on a collectable', (kind) => {
    const pos = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', {
      held: [{ shield: 2, [kind]: 1 }, {}],
      pickups: { a4: 'freeze' },
    });
    const action = kind === 'double' ? move('a1', 'a4', { double: true }) : teleport('a1', 'a4');
    const after = playAction(matchAt(pos), action)!.match.pos;
    expect(after.held[0]).toEqual({ shield: 2, freeze: 1, double: 0, teleport: 0 });
  });

  it('passes over a collectable without picking it up', () => {
    const pos = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { pickups: { a4: 'freeze' } });
    const after = playAction(matchAt(pos), move('a1', 'a6'))!.match.pos;
    expect(heldCount(after, 0)).toBe(0);
    expect(after.pickups[sq('a4')]).toBe('freeze');
  });
});

describe('random power-up games never break the rules', () => {
  it('keeps both kings, and never leaves the side that just moved in check', () => {
    const random = seededRandom(2024);
    let doubles = 0;
    for (let game = 0; game < 60; game++) {
      let match = createMatch({ mode: 'powerup', seed: game + 1 });
      // Hand out power-ups so the unusual rules come up often.
      const stocked = { shield: 1, freeze: 1, double: 1, teleport: 0 };
      match = { ...match, pos: { ...match.pos, held: [stocked, { ...stocked, teleport: 1 }] } };
      for (let ply = 0; ply < 90 && !match.outcome; ply++) {
        const actions = legalActions(match.pos);
        expect(actions.length).toBeGreaterThan(0);
        const doubled = actions.filter((a) => a.type === 'move' && a.double);
        const powers = actions.filter((a) => a.type !== 'move');
        const pool = doubled.length && random() < 0.2 ? doubled : powers.length && random() < 0.2 ? powers : actions;
        const mover = match.pos.turn;
        const result = playAction(match, pool[Math.floor(random() * pool.length)]!);
        expect(result).not.toBeNull();
        match = result!.match;
        const kings = match.pos.board.filter((p) => p && typeOf(p) === KING);
        expect(kings.map(colorOf).sort()).toEqual([0, 1]);
        for (const color of [0, 1] as const) {
          const king = match.pos.board[match.pos.kings[color]]!;
          expect(typeOf(king)).toBe(KING);
          expect(shieldTurns(king)).toBe(0);
          expect(isFrozen(king)).toBe(false);
          expect(POWER_KINDS.every((k) => match.pos.held[color][k] >= 0)).toBe(true);
        }
        if (result!.report.turnEnded) {
          expect(isInCheck(match.pos, mover)).toBe(false);
          expect(match.pos.turn).toBe(otherColor(mover));
        } else {
          doubles++;
          expect(isInCheck(match.pos, otherColor(mover))).toBe(false);
        }
      }
    }
    expect(doubles).toBeGreaterThan(20);
  }, 120_000);
});
