/** Standard chess: endings, special moves and draws. Move counts are proved in chessPerft.test.ts. */
import { describe, expect, it } from 'vitest';
import { KNIGHT, QUEEN, ROOK, parseFen, typeOf } from './chessCore';
import { createMatch, playAction, type Match } from './chessMatch';
import { applyAction, findLegalAction, isDeadMaterial, legalMoves, positionStatus } from './chessRules';
import { destinations, move, position, sq } from './chessTestkit.testkit';

const play = (match: Match, ...moves: [string, string][]): Match =>
  moves.reduce((current, [from, to]) => {
    const result = playAction(current, move(from, to));
    if (!result) throw new Error(`Illegal in test: ${from}${to}`);
    return result.match;
  }, match);

describe('endings', () => {
  it("sees fool's mate as checkmate for Black", () => {
    const match = play(createMatch({ mode: 'classic' }), ['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']);
    expect(match.outcome).toEqual({ winner: 1, reason: 'checkmate' });
    expect(playAction(match, move('a2', 'a3'))).toBeNull();
  });

  it('tells stalemate from checkmate', () => {
    expect(positionStatus(parseFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))).toBe('stalemate');
    expect(positionStatus(parseFen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1'))).toBe('checkmate');
    expect(positionStatus(parseFen('7k/6Q1/8/8/8/8/8/K7 b - - 0 1'))).toBe('check');
  });

  it('declares a draw when a position stands for the third time', () => {
    const shuffle: [string, string][] = [['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8']];
    const twice = play(createMatch({ mode: 'classic' }), ...shuffle, ...shuffle.slice(0, 3));
    expect(twice.outcome).toBeNull();
    expect(play(twice, shuffle[3]!).outcome).toEqual({ winner: null, reason: 'repetition' });
  });

  it('declares a draw after fifty moves without a capture or a pawn move', () => {
    const start = parseFen('4k3/8/8/8/8/8/4P3/R3K3 w - - 99 80');
    expect(play(createMatch({ mode: 'classic', position: start }), ['a1', 'a2']).outcome).toEqual({
      winner: null,
      reason: 'fifty',
    });
    expect(play(createMatch({ mode: 'classic', position: start }), ['e2', 'e3']).outcome).toBeNull();
  });

  it('lets checkmate on the hundredth ply win', () => {
    const start = parseFen('7k/8/6K1/8/8/8/8/R7 w - - 99 80');
    expect(play(createMatch({ mode: 'classic', position: start }), ['a1', 'a8']).outcome).toEqual({
      winner: 0,
      reason: 'checkmate',
    });
  });

  it.each([
    ['4k3/8/8/8/8/8/8/4K3 w - - 0 1', true],
    ['4k3/8/8/8/8/8/8/4KB2 w - - 0 1', true],
    ['4k3/8/8/8/8/8/8/4KN2 w - - 0 1', true],
    ['2b1k3/8/8/8/8/8/8/4KB2 w - - 0 1', true],
    ['5bk1/8/8/8/8/8/8/4KB2 w - - 0 1', false],
    ['4k1n1/8/8/8/8/8/8/4KN2 w - - 0 1', false],
    ['4k3/8/8/8/8/8/8/3NKN2 w - - 0 1', false],
    ['4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', false],
  ])('%s is a dead draw: %s', (fen, dead) => {
    expect(isDeadMaterial(parseFen(fen))).toBe(dead);
  });
});

describe('special moves', () => {
  it('captures en passant, only straight after the double step', () => {
    const match = play(createMatch({ mode: 'classic' }), ['e2', 'e4'], ['a7', 'a6'], ['e4', 'e5'], ['d7', 'd5']);
    expect(destinations(match.pos, 'e5')).toContain('d6');
    const taken = play(match, ['e5', 'd6']);
    expect(taken.pos.board[sq('d5')]).toBe(0);
    expect(taken.captured[0]).toEqual([1]);
    const waited = play(match, ['h2', 'h3'], ['h7', 'h6']);
    expect(destinations(waited.pos, 'e5')).not.toContain('d6');
  });

  it('refuses an en passant capture that would uncover the king', () => {
    expect(destinations(parseFen('8/8/8/K2pP2r/8/8/8/4k3 w - d6 0 1'), 'e5')).toEqual(['e6']);
  });

  it('castles both ways and moves the rook', () => {
    const pos = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(destinations(pos, 'e1')).toEqual(expect.arrayContaining(['c1', 'g1']));
    const short = applyAction(pos, findLegalAction(pos, move('e1', 'g1'))!);
    expect(typeOf(short.board[sq('f1')]!)).toBe(ROOK);
    const long = applyAction(pos, findLegalAction(pos, move('e1', 'c1'))!);
    expect(typeOf(long.board[sq('d1')]!)).toBe(ROOK);
  });

  it('does not castle out of, through or into check', () => {
    for (const fen of [
      '4k3/8/8/8/8/4r3/8/4K2R w K - 0 1',
      '4k3/8/8/8/8/5r2/8/4K2R w K - 0 1',
      '4k3/8/8/8/8/6r1/8/4K2R w K - 0 1',
    ]) {
      expect(destinations(parseFen(fen), 'e1')).not.toContain('g1');
    }
  });

  it('loses the castling right once the rook has left, even if it comes back', () => {
    const start = parseFen('4k3/8/8/8/8/8/8/4K2R w K - 0 1');
    const match = play(
      createMatch({ mode: 'classic', position: start }),
      ['h1', 'h2'], ['e8', 'd8'], ['h2', 'h1'], ['d8', 'e8'],
    );
    expect(destinations(match.pos, 'e1')).not.toContain('g1');
  });

  it('offers all four promotions and plays the chosen one', () => {
    const pos = parseFen('8/P6k/8/8/8/8/8/K7 w - - 0 1');
    expect(legalMoves(pos).filter((m) => m.from === sq('a7')).map((m) => m.promo)).toHaveLength(4);
    for (const promo of [QUEEN, KNIGHT] as const) {
      const next = applyAction(pos, findLegalAction(pos, move('a7', 'a8', { promo }))!);
      expect(typeOf(next.board[sq('a8')]!)).toBe(promo);
    }
    expect(findLegalAction(pos, move('a7', 'a8'))).toBeNull();
  });

  it('never changes the position it is given', () => {
    const pos = position('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', { held: [{ teleport: 1 }, {}] });
    const before = JSON.stringify(pos);
    for (const m of legalMoves(pos)) applyAction(pos, m);
    applyAction(pos, { type: 'teleport', from: sq('a1'), to: sq('b3') });
    expect(JSON.stringify(pos)).toBe(before);
  });
});
