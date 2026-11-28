/**
 * Upgraded movement, ability by ability, and proof that check detection sees all of it:
 * attack detection must agree with move generation on random boards.
 */
import { describe, expect, it } from 'vitest';
import {
  KING,
  KNIGHT,
  QUEEN,
  ROOK,
  colorOf,
  makePiece,
  otherColor,
  parseFen,
  setFrozen,
  typeOf,
  type Color,
  type PieceType,
  type Position,
} from './chessCore';
import { seededRandom } from './chessRandom';
import { applyAction, findLegalAction, isAttacked, isDeadMaterial, isInCheck, positionStatus, pseudoMoves } from './chessRules';
import { destinations, move, position, sq } from './chessTestkit.testkit';
import { UPGRADE_IDS, maskOf, type UpgradeId } from './chessUpgrades';

const white = (...ids: UpgradeId[]): { upgrades: [UpgradeId[], UpgradeId[]] } => ({ upgrades: [ids, []] });

/** Is Black (to move) in check from White's pieces with these upgrades? */
const checks = (fen: string, ...ids: UpgradeId[]): boolean => isInCheck(position(fen, white(...ids)), 1);

describe('pawn upgrades', () => {
  const PAWN_FEN = '4k3/8/8/4p3/4P3/8/8/4K3 w - - 0 1';

  it('Sidestep moves sideways onto empty squares only', () => {
    expect(destinations(position(PAWN_FEN), 'e4')).toEqual([]);
    expect(destinations(position(PAWN_FEN, white('sidestep')), 'e4')).toEqual(['d4', 'f4']);
    const crowded = position('4k3/8/8/4p3/3rP3/8/8/4K3 w - - 0 1', white('sidestep'));
    expect(destinations(crowded, 'e4')).toEqual(['f4']);
  });

  it('Spearhead captures straight ahead and gives check that way', () => {
    expect(destinations(position(PAWN_FEN, white('spearhead')), 'e4')).toEqual(['e5']);
    const fen = '8/8/4k3/4P3/8/8/8/4K3 b - - 0 1';
    expect(checks(fen)).toBe(false);
    expect(checks(fen, 'spearhead')).toBe(true);
  });

  it('Spearhead can capture into a promotion', () => {
    const pos = position('4r2k/4P3/8/8/8/8/8/K7 w - - 0 1', white('spearhead'));
    expect(findLegalAction(pos, move('e7', 'e8', { promo: QUEEN }))).not.toBeNull();
  });
});

describe('knight upgrades', () => {
  const KNIGHT_FEN = '4k3/8/8/8/3Np3/8/8/4K3 w - - 0 1';

  it('Trot adds quiet single steps and never captures', () => {
    const extra = destinations(position(KNIGHT_FEN, white('trot')), 'd4');
    expect(extra).toEqual(expect.arrayContaining(['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e5']));
    expect(extra).not.toContain('e4');
    expect(checks('8/8/8/8/3Nk3/8/8/4K3 b - - 0 1', 'trot')).toBe(false);
  });

  it('Long Leap jumps two squares straight, captures and gives check', () => {
    const jumps = destinations(position('4k3/8/8/3P4/2PNr3/8/8/K7 w - - 0 1', white('longLeap')), 'd4');
    expect(jumps).toEqual(expect.arrayContaining(['d6', 'd2', 'b4', 'f4']));
    const fen = '8/8/8/8/3N1k2/8/8/4K3 b - - 0 1';
    expect(checks(fen)).toBe(false);
    expect(checks(fen, 'longLeap')).toBe(true);
  });
});

describe('bishop upgrades', () => {
  it('Side Slip steps or captures orthogonally and gives check', () => {
    const pos = position('4k3/8/8/8/3Br3/8/8/K7 w - - 0 1', white('sideSlip'));
    expect(destinations(pos, 'd4')).toEqual(expect.arrayContaining(['d5', 'd3', 'c4', 'e4']));
    const fen = '8/8/8/8/3Bk3/8/8/4K3 b - - 0 1';
    expect(checks(fen)).toBe(false);
    expect(checks(fen, 'sideSlip')).toBe(true);
  });

  it('Vault jumps over a piece two squares diagonally and gives check through it', () => {
    const fen = '8/8/5k2/4p3/3B4/8/8/4K3 b - - 0 1';
    expect(checks(fen)).toBe(false);
    expect(checks(fen, 'vault')).toBe(true);
    const pos = position('4k3/8/8/4p3/3B4/8/8/4K3 w - - 0 1', white('vault'));
    expect(destinations(pos, 'd4')).toContain('f6');
  });

  it('Vault adds no second copy of a square the bishop can already slide to', () => {
    const pos = position('4k3/8/8/8/3B4/8/8/4K3 w - - 0 1', white('vault'));
    expect(pseudoMoves(pos).filter((m) => m.from === sq('d4') && m.to === sq('f6'))).toHaveLength(1);
  });
});

describe('rook upgrades', () => {
  it('Corner Step steps or captures diagonally and gives check', () => {
    const pos = position('4k3/8/8/4r3/3R4/8/8/K7 w - - 0 1', white('cornerStep'));
    expect(destinations(pos, 'd4')).toEqual(expect.arrayContaining(['c3', 'c5', 'e3', 'e5']));
    const fen = '8/8/8/4k3/3R4/8/8/4K3 b - - 0 1';
    expect(checks(fen)).toBe(false);
    expect(checks(fen, 'cornerStep')).toBe(true);
  });

  it('Tunnel passes through one piece of its own side', () => {
    const fen = '4k3/8/8/8/8/4P3/8/K3R3 b - - 0 1';
    expect(checks(fen)).toBe(false);
    expect(checks(fen, 'tunnel')).toBe(true);
    const pos = position('4k3/8/8/8/8/4P3/8/K3R3 w - - 0 1', white('tunnel'));
    const moves = destinations(pos, 'e1');
    expect(moves).toEqual(expect.arrayContaining(['e2', 'e4', 'e7']));
    expect(moves).not.toContain('e3');
    expect(moves).not.toContain('e8');
  });

  it('Tunnel does not pass two pieces, or an enemy', () => {
    expect(checks('4k3/8/8/4P3/8/4P3/8/K3R3 b - - 0 1', 'tunnel')).toBe(false);
    expect(checks('4k3/8/8/8/8/4p3/8/K3R3 b - - 0 1', 'tunnel')).toBe(false);
  });
});

describe('queen upgrade', () => {
  it('Amazon jumps and gives check like a knight', () => {
    const fen = '8/8/8/4k3/8/3Q4/8/7K b - - 0 1';
    expect(checks(fen)).toBe(false);
    const knightJump = '8/8/4k3/8/3Q4/8/8/7K b - - 0 1';
    expect(checks(knightJump)).toBe(false);
    expect(checks(knightJump, 'amazon')).toBe(true);
  });
});

describe('upgrades and the end of the game', () => {
  it('can turn a stalemate into checkmate', () => {
    const fen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
    expect(positionStatus(position(fen))).toBe('stalemate');
    // With Amazon the queen on f7 also attacks h8, like a knight.
    expect(positionStatus(position(fen, white('amazon')))).toBe('checkmate');
  });

  it('lets an upgraded piece rescue a king that ordinary chess would lose', () => {
    // Back-rank mate, unless the d1 knight can Long Leap into f1.
    const fen = '6k1/8/8/8/8/8/6PP/3Nr2K w - - 0 1';
    expect(positionStatus(position(fen))).toBe('checkmate');
    const upgraded = position(fen, white('longLeap'));
    expect(positionStatus(upgraded)).toBe('check');
    expect(destinations(upgraded, 'd1')).toEqual(['f1']);
  });

  it('counts upgraded attacks when a king looks for escape squares', () => {
    const fen = '7k/8/8/7N/8/8/8/K7 b - - 0 1';
    expect(destinations(position(fen), 'h8')).toContain('h7');
    expect(destinations(position(fen, white('longLeap')), 'h8')).not.toContain('h7');
  });

  it('blocks castling through an upgraded attack', () => {
    const fen = '4k3/8/8/8/8/8/8/3nK2R w K - 0 1';
    expect(destinations(position(fen), 'e1')).toContain('g1');
    expect(destinations(position(fen, { upgrades: [[], ['longLeap']] }), 'e1')).not.toContain('g1');
  });

  it('gives a promoted piece the upgrades of its new type', () => {
    const pos = position('8/P6k/8/8/8/8/8/K7 w - - 0 1', white('longLeap'));
    const next = applyAction(pos, findLegalAction(pos, move('a7', 'a8', { promo: KNIGHT }))!);
    const again: Position = { ...next, turn: 0 };
    expect(destinations(again, 'a8')).toContain('c8');
  });

  it('keeps playing when an upgrade makes mate possible with a lone knight or bishop', () => {
    const knight = '4k3/8/8/8/8/8/8/4KN2 w - - 0 1';
    expect(isDeadMaterial(position(knight))).toBe(true);
    expect(isDeadMaterial(position(knight, white('trot')))).toBe(true);
    expect(isDeadMaterial(position(knight, white('longLeap')))).toBe(false);
    expect(isDeadMaterial(position('4k3/8/8/8/8/8/8/4KB2 w - - 0 1', white('vault')))).toBe(false);
  });
});

describe('check detection agrees with move generation', () => {
  const PIECES: PieceType[] = [1, 2, 2, 3, 3, 4, 4, 5];

  /** A random scatter of pieces; pawns stay off the first and last ranks. */
  function randomPosition(random: () => number): Position {
    const pos = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    pos.board.fill(0);
    const taken = (): number => {
      let square = Math.floor(random() * 64);
      while (pos.board[square]) square = Math.floor(random() * 64);
      return square;
    };
    for (const color of [0, 1] as Color[]) {
      const king = taken();
      pos.board[king] = makePiece(color, KING);
      pos.kings[color] = king;
    }
    for (let i = 0; i < 22; i++) {
      const square = taken();
      const type = PIECES[Math.floor(random() * PIECES.length)]!;
      if (type === 1 && (square < 8 || square > 55)) continue;
      const piece = makePiece(random() < 0.5 ? 0 : 1, type);
      pos.board[square] = setFrozen(piece, random() < 0.15);
    }
    const mask = (): number => maskOf(UPGRADE_IDS.filter(() => random() < 0.5));
    pos.upgrades = [mask(), mask()];
    pos.castling = 0;
    return pos;
  }

  it('on 1,500 random boards with random upgrades and frozen pieces', () => {
    const random = seededRandom(77);
    let attacked = 0;
    for (let n = 0; n < 1500; n++) {
      const pos = randomPosition(random);
      const by: Color = random() < 0.5 ? 0 : 1;
      for (let target = 0; target < 64; target++) {
        const there = pos.board[target]!;
        if (there && typeOf(there) === KING) continue;
        // Stand a capturable enemy on the square and see whether any move takes it.
        const board = pos.board.slice();
        board[target] = makePiece(otherColor(by), ROOK);
        const probe: Position = { ...pos, board, turn: by };
        const taken = pseudoMoves(probe).some((m) => m.to === target && colorOf(board[m.from]!) === by);
        const seen = isAttacked(pos, target, by);
        if (seen !== taken) {
          throw new Error(`board ${n}: square ${target} by ${by}: isAttacked=${seen}, moves=${taken}`);
        }
        if (seen) attacked++;
      }
    }
    expect(attacked).toBeGreaterThan(10_000);
  }, 60_000);
});
