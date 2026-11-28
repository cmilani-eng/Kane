/**
 * Chess Masters — what a tap on the board means: choosing a piece, moving it (by two taps or a
 * drag), or aiming a power-up. Pure: each function returns the new choice, and the action to
 * play if the tap made one. Call these only when the player may act.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts, chessText.ts
 * Tested by: src/games/chess-masters/chessSelection.test.ts
 */
import { colorOf, isFrozen, type Action, type Position, type PowerKind } from './chessCore';
import { legalMoves, powerActions } from './chessRules';

/** A square the player may tap next: somewhere to move, or something a power-up can be used on. */
export type TargetKind = 'move' | 'power';

/** Why a tap did not work; each is a message key. */
export type Problem = 'chess.frozenPiece' | 'chess.noMoves' | 'chess.noTarget' | 'chess.badTarget';

export interface Choice {
  /** The chosen piece's square, or -1. */
  selected: number;
  /** A power-up being aimed; `from` is the piece already chosen for a Teleport. */
  power: { kind: PowerKind; from: number } | null;
  targets: ReadonlyMap<number, TargetKind>;
  problem: Problem | null;
  /** What the note under the buttons should explain. */
  about: { square: number } | { power: PowerKind } | null;
}

export interface TapResult {
  choice: Choice;
  action?: Action;
  /** The move needs a promotion piece first. */
  promotion?: { from: number; to: number; double: boolean };
}

/** A finger or mouse button that went down on the board. */
export interface Press {
  square: number;
  /** It went down on the piece already chosen, so lifting it there lets go of the piece. */
  deselects: boolean;
}

export const noChoice = (): Choice => ({ selected: -1, power: null, targets: new Map(), problem: null, about: null });

/** A Double Move stays switched on while the player changes which piece to move. */
const doubleOnly = (choice: Choice): Choice['power'] => (choice.power?.kind === 'double' ? choice.power : null);

/** Shield, Freeze and Teleport are aimed at squares; a Double Move is played like any move. */
const isAiming = (choice: Choice): boolean => choice.power !== null && choice.power.kind !== 'double';

const isMovers = (pos: Position, square: number): boolean => {
  const piece = pos.board[square]!;
  return piece !== 0 && colorOf(piece) === pos.turn;
};

export function selectPiece(pos: Position, choice: Choice, square: number): Choice {
  const moves = legalMoves(pos).filter((m) => m.from === square);
  return {
    selected: square,
    power: doubleOnly(choice),
    targets: new Map(moves.map((m) => [m.to, 'move' as TargetKind])),
    problem: isFrozen(pos.board[square]!) ? 'chess.frozenPiece' : moves.length ? null : 'chess.noMoves',
    about: { square },
  };
}

/** The way down: picking a piece up now is what lets it be dragged. */
export function pressBoard(pos: Position, choice: Choice, square: number): { choice: Choice; press: Press } {
  const press = { square, deselects: false };
  if (isAiming(choice)) return { choice, press };
  if (square === choice.selected) return { choice, press: { square, deselects: true } };
  if (isMovers(pos, square) && !choice.targets.has(square)) return { choice: selectPiece(pos, choice, square), press };
  return { choice, press };
}

/** The way up, on the same square (a tap) or another one (a drag). */
export function releaseBoard(pos: Position, choice: Choice, press: Press, square: number): TapResult {
  if (isAiming(choice)) return square === press.square ? aim(pos, choice, square) : { choice };
  if (choice.selected >= 0 && choice.targets.has(square)) return moveSelected(pos, choice, square);
  if (square === choice.selected) {
    const letGo = press.deselects && square === press.square;
    return { choice: letGo ? { ...noChoice(), power: doubleOnly(choice) } : choice };
  }
  if (isMovers(pos, square)) return { choice };
  return { choice: { ...noChoice(), power: doubleOnly(choice), about: { square } } };
}

function moveSelected(pos: Position, choice: Choice, to: number): TapResult {
  const from = choice.selected;
  const moves = legalMoves(pos).filter((m) => m.from === from && m.to === to);
  const double = choice.power?.kind === 'double';
  if (moves.length > 1) return { choice, promotion: { from, to, double } };
  return moves[0] ? { choice: noChoice(), action: { ...moves[0], double } } : { choice };
}

/** A tap while aiming Shield, Freeze or Teleport. */
function aim(pos: Position, choice: Choice, square: number): TapResult {
  const power = choice.power!;
  const refused: TapResult = { choice: { ...choice, problem: 'chess.badTarget', about: { square } } };
  if (power.kind === 'shield' || power.kind === 'freeze') {
    return choice.targets.has(square) ? { choice: noChoice(), action: { type: power.kind, target: square } } : refused;
  }
  if (power.from >= 0 && choice.targets.has(square)) {
    return { choice: noChoice(), action: { type: 'teleport', from: power.from, to: square } };
  }
  // Otherwise the tap chooses (or changes) the piece that will travel.
  const landings = powerActions(pos).flatMap((a) => (a.type === 'teleport' && a.from === square ? [a.to] : []));
  if (landings.length === 0) return refused;
  return {
    choice: {
      ...choice,
      power: { kind: 'teleport', from: square },
      targets: new Map(landings.map((to) => [to, 'power' as TargetKind])),
      problem: null,
    },
  };
}

/**
 * A tap on a power-up button. When it cannot be used (not your turn, none held, nothing to aim
 * at) the button still explains it. Tapping the one being aimed puts it away.
 */
export function tapPower(pos: Position, choice: Choice, kind: PowerKind, canAct: boolean): Choice {
  const about = { power: kind };
  if (canAct && choice.power?.kind === kind) return noChoice();
  if (!canAct || pos.second || pos.held[pos.turn][kind] === 0) return { ...choice, about };

  const usable = powerActions(pos);
  const targets = new Map<number, TargetKind>();
  for (const action of usable) {
    if ((action.type === 'shield' || action.type === 'freeze') && action.type === kind) targets.set(action.target, 'power');
    if (action.type === 'teleport' && kind === 'teleport') targets.set(action.from, 'power');
  }
  const available = kind === 'double' ? usable.some((a) => a.type === 'move' && a.double) : targets.size > 0;
  if (!available) return { ...noChoice(), problem: 'chess.noTarget', about };
  return { selected: -1, power: { kind, from: -1 }, targets, problem: null, about };
}
