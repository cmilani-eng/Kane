/**
 * Chess Masters — the rules: full legal chess, plus upgraded piece movement and power-ups.
 * Pure and deterministic (nothing random happens here), so the computer opponent can use the
 * same code to look ahead. `applyAction` never changes the position it is given.
 *
 * The special rules, all covered by tests:
 * - The king is never captured, shielded, frozen or teleported.
 * - No action may leave your own king in check. That includes each half of a Double Move.
 * - A shielded piece cannot be captured or frozen. A frozen piece cannot move, be teleported,
 *   capture or give check.
 * - Shield, Freeze and Teleport each use the whole turn. A Teleport may not leave the enemy
 *   king in check, and a pawn can only teleport to ranks 2-7.
 * - A Double Move ends after its first half if that half gives check.
 * - Checkmate and stalemate mean "no legal action at all": no move and no usable power-up.
 *
 * Called by: chessMatch.ts, chessAi.ts, ChessMastersScene.ts
 * Tested by: chessRules.test.ts, chessPerft.test.ts, chessPowerups.test.ts
 */
import {
  BISHOP,
  BLACK,
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  KING,
  KNIGHT,
  PAWN,
  POWER_KINDS,
  PROMOTION_TYPES,
  QUEEN,
  ROOK,
  WHITE,
  colorOf,
  fileOf,
  isFrozen,
  makePiece,
  otherColor,
  rankOf,
  setFrozen,
  setShield,
  shieldTurns,
  squareAt,
  typeOf,
  type Action,
  type Color,
  type MoveAction,
  type PieceType,
  type Position,
  type PowerKind,
} from './chessCore';
import { ABILITY } from './chessUpgrades';

/** A new shield lasts through this many of the opponent's turns. */
export const SHIELD_TURNS = 2;
/** The most power-ups one side can hold; a collectable picked up when full is lost. */
export const MAX_HELD = 3;

// ---------------------------------------------------------------- geometry

type Delta = readonly [number, number];
const ORTHO: readonly Delta[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG: readonly Delta[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT_DELTAS: readonly Delta[] = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
const twice = (deltas: readonly Delta[]): Delta[] => deltas.map(([f, r]) => [f * 2, r * 2]);

const inside = (file: number, rank: number): boolean => file >= 0 && file < 8 && rank >= 0 && rank < 8;

function stepTable(deltas: readonly Delta[]): number[][] {
  return Array.from({ length: 64 }, (_, from) =>
    deltas.flatMap(([df, dr]) => {
      const f = fileOf(from) + df;
      const r = rankOf(from) + dr;
      return inside(f, r) ? [squareAt(f, r)] : [];
    }),
  );
}

function rayTable(deltas: readonly Delta[]): number[][][] {
  return Array.from({ length: 64 }, (_, from) =>
    deltas
      .map(([df, dr]) => {
        const ray: number[] = [];
        for (let f = fileOf(from) + df, r = rankOf(from) + dr; inside(f, r); f += df, r += dr) {
          ray.push(squareAt(f, r));
        }
        return ray;
      })
      .filter((ray) => ray.length > 0),
  );
}

const KNIGHT_TO = stepTable(KNIGHT_DELTAS);
const KING_TO = stepTable([...ORTHO, ...DIAG]);
const ORTHO_TO = stepTable(ORTHO);
const DIAG_TO = stepTable(DIAG);
const LEAP_ORTHO_TO = stepTable(twice(ORTHO));
const LEAP_DIAG_TO = stepTable(twice(DIAG));
const ORTHO_RAYS = rayTable(ORTHO);
const DIAG_RAYS = rayTable(DIAG);

/** Castling rights that survive a piece leaving or landing on each square. */
const KEEP_CASTLING: readonly number[] = Array.from({ length: 64 }, (_, square) => {
  if (square === 0) return 15 & ~CASTLE_WQ;
  if (square === 4) return 15 & ~(CASTLE_WK | CASTLE_WQ);
  if (square === 7) return 15 & ~CASTLE_WK;
  if (square === 56) return 15 & ~CASTLE_BQ;
  if (square === 60) return 15 & ~(CASTLE_BK | CASTLE_BQ);
  if (square === 63) return 15 & ~CASTLE_BK;
  return 15;
});

// ---------------------------------------------------------------- attacks

/** Matches a piece of the right colour and type that is not frozen: a frozen piece threatens nothing. */
const ACTIVE = 64 | 15;

function anyOn(board: readonly number[], squares: readonly number[], piece: number): boolean {
  for (const square of squares) if ((board[square]! & ACTIVE) === piece) return true;
  return false;
}

/** Could a piece of colour `by` capture whatever stands on `square`? Shields are not considered. */
export function isAttacked(pos: Position, square: number, by: Color): boolean {
  const { board } = pos;
  const mask = pos.upgrades[by];
  const pawn = makePiece(by, PAWN);
  const knight = makePiece(by, KNIGHT);
  const bishop = makePiece(by, BISHOP);
  const rook = makePiece(by, ROOK);
  const queen = makePiece(by, QUEEN);

  const file = fileOf(square);
  const pawnRank = rankOf(square) - (by === WHITE ? 1 : -1);
  if (pawnRank >= 0 && pawnRank < 8) {
    const base = pawnRank * 8;
    if (file > 0 && (board[base + file - 1]! & ACTIVE) === pawn) return true;
    if (file < 7 && (board[base + file + 1]! & ACTIVE) === pawn) return true;
    if (mask & ABILITY.spearhead && (board[base + file]! & ACTIVE) === pawn) return true;
  }

  if (anyOn(board, KNIGHT_TO[square]!, knight)) return true;
  if (mask & ABILITY.amazon && anyOn(board, KNIGHT_TO[square]!, queen)) return true;
  if (mask & ABILITY.longLeap && anyOn(board, LEAP_ORTHO_TO[square]!, knight)) return true;
  if (anyOn(board, KING_TO[square]!, makePiece(by, KING))) return true;
  if (mask & ABILITY.sideSlip && anyOn(board, ORTHO_TO[square]!, bishop)) return true;
  if (mask & ABILITY.vault && anyOn(board, LEAP_DIAG_TO[square]!, bishop)) return true;
  if (mask & ABILITY.cornerStep && anyOn(board, DIAG_TO[square]!, rook)) return true;

  for (const ray of DIAG_RAYS[square]!) {
    for (const target of ray) {
      const piece = board[target]!;
      if (!piece) continue;
      const active = piece & ACTIVE;
      if (active === bishop || active === queen) return true;
      break;
    }
  }
  const tunnel = (mask & ABILITY.tunnel) !== 0;
  for (const ray of ORTHO_RAYS[square]!) {
    let passed = false;
    for (const target of ray) {
      const piece = board[target]!;
      if (!piece) continue;
      const active = piece & ACTIVE;
      if (passed) {
        if (active === rook) return true;
        break;
      }
      if (active === rook || active === queen) return true;
      // A rook with Tunnel can look through one piece of its own side.
      if (!tunnel || colorOf(piece) !== by) break;
      passed = true;
    }
  }
  return false;
}

export function isInCheck(pos: Position, color: Color): boolean {
  return isAttacked(pos, pos.kings[color], otherColor(color));
}

// ---------------------------------------------------------------- move generation

function canTake(target: number, side: Color): boolean {
  return target !== 0 && colorOf(target) !== side && typeOf(target) !== KING && shieldTurns(target) === 0;
}

/** Moves that follow how the pieces travel, before asking whether they leave the king in check. */
export function pseudoMoves(pos: Position, tacticalOnly = false): MoveAction[] {
  const { board, turn: side } = pos;
  const mask = pos.upgrades[side];
  const moves: MoveAction[] = [];

  const quiet = (from: number, to: number): void => {
    if (!tacticalOnly) moves.push({ type: 'move', from, to });
  };
  /** A destination that may be moved to when empty and captured on when it holds an enemy. */
  const step = (from: number, to: number): void => {
    const target = board[to]!;
    if (!target) quiet(from, to);
    else if (canTake(target, side)) moves.push({ type: 'move', from, to });
  };
  const steps = (from: number, squares: readonly number[]): void => {
    for (const to of squares) step(from, to);
  };
  const slides = (from: number, rays: readonly number[][], throughOwn: boolean): void => {
    for (const ray of rays) {
      let passed = false;
      for (const to of ray) {
        const target = board[to]!;
        if (!target) {
          quiet(from, to);
          continue;
        }
        if (canTake(target, side)) moves.push({ type: 'move', from, to });
        if (!throughOwn || passed || colorOf(target) !== side) break;
        passed = true;
      }
    }
  };

  const forward = side === WHITE ? 8 : -8;
  const startRank = side === WHITE ? 1 : 6;
  const lastRank = side === WHITE ? 7 : 0;
  const pawnMove = (from: number, to: number): void => {
    if (rankOf(to) === lastRank) {
      for (const promo of PROMOTION_TYPES) moves.push({ type: 'move', from, to, promo });
    } else {
      moves.push({ type: 'move', from, to });
    }
  };

  for (let from = 0; from < 64; from++) {
    const piece = board[from]!;
    if (!piece || colorOf(piece) !== side || isFrozen(piece)) continue;
    switch (typeOf(piece)) {
      case PAWN: {
        const ahead = from + forward;
        if (ahead < 0 || ahead > 63) break;
        if (!board[ahead]) {
          if (!tacticalOnly || rankOf(ahead) === lastRank) pawnMove(from, ahead);
          if (!tacticalOnly && rankOf(from) === startRank && !board[ahead + forward]) {
            moves.push({ type: 'move', from, to: ahead + forward, flag: 'push2' });
          }
        } else if (mask & ABILITY.spearhead && canTake(board[ahead]!, side)) {
          pawnMove(from, ahead);
        }
        for (const df of [-1, 1]) {
          const file = fileOf(from) + df;
          if (file < 0 || file > 7) continue;
          const to = ahead + df;
          if (canTake(board[to]!, side)) pawnMove(from, to);
          else if (to === pos.ep && !board[to] && canTake(board[to - forward]!, side)) {
            moves.push({ type: 'move', from, to, flag: 'ep' });
          }
          const beside = from + df;
          if (mask & ABILITY.sidestep && !board[beside]) quiet(from, beside);
        }
        break;
      }
      case KNIGHT:
        steps(from, KNIGHT_TO[from]!);
        if (mask & ABILITY.longLeap) steps(from, LEAP_ORTHO_TO[from]!);
        if (mask & ABILITY.trot) {
          for (const to of KING_TO[from]!) if (!board[to]) quiet(from, to);
        }
        break;
      case BISHOP:
        slides(from, DIAG_RAYS[from]!, false);
        if (mask & ABILITY.sideSlip) steps(from, ORTHO_TO[from]!);
        if (mask & ABILITY.vault) {
          // With nothing in between, the ordinary slide already reaches the square.
          for (const to of LEAP_DIAG_TO[from]!) if (board[(from + to) >> 1]) step(from, to);
        }
        break;
      case ROOK:
        slides(from, ORTHO_RAYS[from]!, (mask & ABILITY.tunnel) !== 0);
        if (mask & ABILITY.cornerStep) steps(from, DIAG_TO[from]!);
        break;
      case QUEEN:
        slides(from, DIAG_RAYS[from]!, false);
        slides(from, ORTHO_RAYS[from]!, false);
        if (mask & ABILITY.amazon) steps(from, KNIGHT_TO[from]!);
        break;
      case KING:
        steps(from, KING_TO[from]!);
        if (!tacticalOnly) addCastling(pos, from, moves);
        break;
    }
  }
  return moves;
}

function addCastling(pos: Position, from: number, moves: MoveAction[]): void {
  const side = pos.turn;
  const home = side === WHITE ? 4 : 60;
  if (from !== home) return;
  const kingSide = side === WHITE ? CASTLE_WK : CASTLE_BK;
  const queenSide = side === WHITE ? CASTLE_WQ : CASTLE_BQ;
  if (!(pos.castling & (kingSide | queenSide))) return;
  const { board } = pos;
  const enemy = otherColor(side);
  const rook = makePiece(side, ROOK);
  const safe = (...squares: number[]): boolean => squares.every((square) => !isAttacked(pos, square, enemy));
  const ready = (corner: number): boolean => (board[corner]! & ACTIVE) === rook;

  if (pos.castling & kingSide && ready(home + 3) && !board[home + 1] && !board[home + 2] && safe(home, home + 1, home + 2)) {
    moves.push({ type: 'move', from: home, to: home + 2, flag: 'castle' });
  }
  if (
    pos.castling & queenSide &&
    ready(home - 4) &&
    !board[home - 1] &&
    !board[home - 2] &&
    !board[home - 3] &&
    safe(home, home - 1, home - 2)
  ) {
    moves.push({ type: 'move', from: home, to: home - 2, flag: 'castle' });
  }
}

// ---------------------------------------------------------------- applying actions

const copy = (pos: Position): Position => ({ ...pos, board: pos.board.slice(), kings: [pos.kings[0], pos.kings[1]] });

export const heldCount = (pos: Position, side: Color): number =>
  POWER_KINDS.reduce((sum, kind) => sum + pos.held[side][kind], 0);

function changeHeld(pos: Position, side: Color, kind: PowerKind, by: number): void {
  const held: Position['held'] = [pos.held[0], pos.held[1]];
  held[side] = { ...held[side], [kind]: held[side][kind] + by };
  pos.held = held;
}

function collect(pos: Position, square: number, side: Color): void {
  const kind = pos.pickups[square];
  if (!kind) return;
  const pickups = { ...pos.pickups };
  delete pickups[square];
  pos.pickups = pickups;
  if (heldCount(pos, side) < MAX_HELD) changeHeld(pos, side, kind, 1);
}

/** A copy with the piece moved; the turn has not been handed over yet. */
function shiftPiece(pos: Position, move: MoveAction): Position {
  const next = copy(pos);
  const { board } = next;
  const piece = board[move.from]!;
  const side = colorOf(piece);
  const forward = side === WHITE ? 8 : -8;
  const captureAt = move.flag === 'ep' ? move.to - forward : move.to;
  const captured = board[captureAt]!;
  board[captureAt] = 0;
  board[move.from] = 0;
  board[move.to] = move.promo ? (piece & ~7) | move.promo : piece;
  if (typeOf(piece) === KING) next.kings[side] = move.to;

  let rookTo = -1;
  if (move.flag === 'castle') {
    const short = move.to > move.from;
    const rookFrom = short ? move.from + 3 : move.from - 4;
    rookTo = short ? move.from + 1 : move.from - 1;
    board[rookTo] = board[rookFrom]!;
    board[rookFrom] = 0;
  }
  next.castling &= KEEP_CASTLING[move.from]! & KEEP_CASTLING[move.to]!;
  next.ep = move.flag === 'push2' ? move.from + forward : -1;
  next.halfmove = typeOf(piece) === PAWN || captured ? 0 : pos.halfmove + 1;
  collect(next, move.to, side);
  if (rookTo >= 0) collect(next, rookTo, side);
  return next;
}

/** Hand the turn over (on a fresh copy): the mover's frozen pieces thaw and the other side's shields wear down. */
function endTurn(pos: Position): Position {
  const mover = pos.turn;
  const { board } = pos;
  for (let square = 0; square < 64; square++) {
    const piece = board[square]!;
    // Bits 4-6 are the only statuses; most pieces have none.
    if (piece < 16) continue;
    if (colorOf(piece) === mover) board[square] = setFrozen(piece, false);
    else if (shieldTurns(piece) > 0) board[square] = setShield(piece, shieldTurns(piece) - 1);
  }
  pos.turn = otherColor(mover);
  if (mover === BLACK) pos.fullmove++;
  pos.second = false;
  return pos;
}

/** The position after an action. The action must be legal (see `legalActions`). */
export function applyAction(pos: Position, action: Action): Position {
  const side = pos.turn;
  if (action.type === 'move') {
    // A Double Move is spent before the piece lands, so its slot is free for what it picks up.
    let before = pos;
    if (action.double) {
      before = { ...pos };
      changeHeld(before, side, 'double', -1);
    }
    const next = shiftPiece(before, action);
    if (action.double) {
      if (!isInCheck(next, otherColor(side))) {
        // The turn goes on only when there is a second move to make.
        const waiting: Position = { ...next, ep: -1, second: true };
        if (hasLegalMove(waiting)) return waiting;
      }
    }
    return endTurn(next);
  }

  const next = copy(pos);
  next.ep = -1;
  next.halfmove = pos.halfmove + 1;
  if (action.type === 'shield') {
    next.board[action.target] = setShield(next.board[action.target]!, SHIELD_TURNS);
    changeHeld(next, side, 'shield', -1);
  } else if (action.type === 'freeze') {
    next.board[action.target] = setFrozen(next.board[action.target]!, true);
    changeHeld(next, side, 'freeze', -1);
  } else {
    const piece = next.board[action.from]!;
    next.board[action.to] = piece;
    next.board[action.from] = 0;
    next.castling &= KEEP_CASTLING[action.from]! & KEEP_CASTLING[action.to]!;
    if (typeOf(piece) === PAWN) next.halfmove = 0;
    changeHeld(next, side, 'teleport', -1);
    collect(next, action.to, side);
  }
  return endTurn(next);
}

// ---------------------------------------------------------------- legality

export function keepsKingSafe(pos: Position, move: MoveAction): boolean {
  return !isInCheck(shiftPiece(pos, move), pos.turn);
}

export function legalMoves(pos: Position): MoveAction[] {
  return pseudoMoves(pos).filter((move) => keepsKingSafe(pos, move));
}

export function hasLegalMove(pos: Position): boolean {
  return pseudoMoves(pos).some((move) => keepsKingSafe(pos, move));
}

/** Whether a piece may be the target of Shield or Freeze, or the traveller of a Teleport. */
export function isPowerTarget(pos: Position, kind: 'shield' | 'freeze' | 'teleport', square: number): boolean {
  const piece = pos.board[square]!;
  if (!piece || typeOf(piece) === KING) return false;
  const own = colorOf(piece) === pos.turn;
  if (kind === 'shield') return own && shieldTurns(piece) === 0;
  if (kind === 'freeze') return !own && shieldTurns(piece) === 0 && !isFrozen(piece);
  return own && !isFrozen(piece);
}

export function canTeleportTo(pos: Position, from: number, to: number): boolean {
  if (pos.board[to] !== 0) return false;
  if (typeOf(pos.board[from]!) !== PAWN) return true;
  return rankOf(to) >= 1 && rankOf(to) <= 6;
}

/** Power-up uses that aim at something allowed, before asking whether they are safe. */
function* powerCandidates(pos: Position): Generator<Action> {
  if (pos.second) return;
  const held = pos.held[pos.turn];
  for (let square = 0; square < 64; square++) {
    if (held.shield > 0 && isPowerTarget(pos, 'shield', square)) yield { type: 'shield', target: square };
    if (held.freeze > 0 && isPowerTarget(pos, 'freeze', square)) yield { type: 'freeze', target: square };
    if (held.teleport > 0 && isPowerTarget(pos, 'teleport', square)) {
      for (let to = 0; to < 64; to++) {
        if (canTeleportTo(pos, square, to)) yield { type: 'teleport', from: square, to };
      }
    }
  }
}

/** Does a Shield, Freeze or Teleport obey the check rules? */
function isSafePower(pos: Position, action: Action): boolean {
  const next = applyAction(pos, action);
  if (isInCheck(next, pos.turn)) return false;
  return action.type !== 'teleport' || !isInCheck(next, next.turn);
}

/** Every legal Shield, Freeze and Teleport, and the first halves of a Double Move. */
export function powerActions(pos: Position): Action[] {
  const actions: Action[] = [];
  for (const action of powerCandidates(pos)) if (isSafePower(pos, action)) actions.push(action);
  if (!pos.second && pos.held[pos.turn].double > 0) {
    for (const move of legalMoves(pos)) actions.push({ ...move, double: true });
  }
  return actions;
}

export function legalActions(pos: Position): Action[] {
  return [...legalMoves(pos), ...powerActions(pos)];
}

export function hasLegalAction(pos: Position): boolean {
  if (hasLegalMove(pos)) return true;
  // A Double Move needs a legal move to start with, so only the others can help here.
  for (const action of powerCandidates(pos)) if (isSafePower(pos, action)) return true;
  return false;
}

/**
 * The legal action matching what was asked for, or null. Used for everything that comes from
 * outside the rules (a tap, the computer's reply), so only legal actions are ever played.
 */
export function findLegalAction(pos: Position, wanted: Action): Action | null {
  if (wanted.type === 'move') {
    if (wanted.double && (pos.second || pos.held[pos.turn].double < 1)) return null;
    const move = legalMoves(pos).find((m) => m.from === wanted.from && m.to === wanted.to && m.promo === wanted.promo);
    if (!move) return null;
    return wanted.double ? { ...move, double: true } : move;
  }
  for (const action of powerCandidates(pos)) {
    if (action.type !== wanted.type) continue;
    const same =
      action.type === 'teleport'
        ? wanted.type === 'teleport' && action.from === wanted.from && action.to === wanted.to
        : 'target' in action && 'target' in wanted && action.target === wanted.target;
    if (same) return isSafePower(pos, action) ? action : null;
  }
  return null;
}

export type PositionStatus = 'normal' | 'check' | 'checkmate' | 'stalemate';

export function positionStatus(pos: Position): PositionStatus {
  const check = isInCheck(pos, pos.turn);
  if (hasLegalAction(pos)) return check ? 'check' : 'normal';
  return check ? 'checkmate' : 'stalemate';
}

// ---------------------------------------------------------------- draws

/** The same key means the same position for the threefold-repetition rule. */
export function positionKey(pos: Position): string {
  // An en passant square only makes positions differ when the capture is actually playable.
  const epPlayable = pos.ep >= 0 && pseudoMoves(pos).some((m) => m.flag === 'ep' && keepsKingSafe(pos, m));
  const held = pos.held.map((inv) => POWER_KINDS.map((kind) => inv[kind]).join('')).join('/');
  const pickups = Object.entries(pos.pickups)
    .map(([square, kind]) => `${square}${kind[1]}`)
    .join(',');
  return `${String.fromCharCode(...pos.board.map((p) => p + 32))}|${pos.turn}|${pos.castling}|${epPlayable ? pos.ep : -1}|${held}|${pickups}`;
}

const ATTACK_UPGRADES: Partial<Record<PieceType, number>> = {
  [KNIGHT]: ABILITY.longLeap,
  [BISHOP]: ABILITY.sideSlip | ABILITY.vault,
};

/**
 * Is checkmate impossible for both sides? Bare kings, a single knight or bishop, or (in a game
 * without power-ups) bishops that all stand on one square colour. An upgrade that changes what
 * a knight or bishop attacks can make mate possible, so those never count as a dead draw.
 */
export function isDeadMaterial(pos: Position, powerUps = false): boolean {
  const minors: { type: PieceType; shade: number }[] = [];
  for (let square = 0; square < 64; square++) {
    const piece = pos.board[square]!;
    const type = typeOf(piece);
    if (!piece || type === KING) continue;
    if (type === PAWN || type === ROOK || type === QUEEN) return false;
    if (pos.upgrades[colorOf(piece)] & (ATTACK_UPGRADES[type] ?? 0)) return false;
    minors.push({ type, shade: (fileOf(square) + rankOf(square)) % 2 });
  }
  if (minors.length <= 1) return true;
  // A Teleport can move a bishop to the other square colour, so keep playing with power-ups.
  if (powerUps) return false;
  return minors.every((m) => m.type === BISHOP && m.shade === minors[0]!.shade);
}

/** Count the legal move sequences of a given length (standard chess move-generation check). */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let nodes = 0;
  for (const move of moves) nodes += perft(applyAction(pos, move), depth - 1);
  return nodes;
}
