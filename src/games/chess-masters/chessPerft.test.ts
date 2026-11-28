/**
 * Move generation proved with perft: the number of legal move sequences from well-known
 * positions must match the published counts exactly.
 */
import { describe, expect, it } from 'vitest';
import { parseFen, startPosition } from './chessCore';
import { perft } from './chessRules';

const KIWIPETE = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';

describe('perft', () => {
  it.each([
    [1, 20],
    [2, 400],
    [3, 8902],
    [4, 197281],
  ])('start position, depth %i = %i', (depth, nodes) => {
    expect(perft(startPosition(), depth)).toBe(nodes);
  }, 60_000);

  it.each([
    [1, 48],
    [2, 2039],
    [3, 97862],
  ])('castling-and-en-passant position, depth %i = %i', (depth, nodes) => {
    expect(perft(parseFen(KIWIPETE), depth)).toBe(nodes);
  }, 60_000);

  // Positions 3 to 5 of the usual perft suite: pins on en passant, promotions and castling.
  it.each([
    ['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', 4, 43238],
    ['r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', 3, 9467],
    ['rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', 3, 62379],
  ])('%s, depth %i = %i', (fen, depth, nodes) => {
    expect(perft(parseFen(fen), depth)).toBe(nodes);
  }, 60_000);
});
