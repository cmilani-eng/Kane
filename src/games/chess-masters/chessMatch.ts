/**
 * Chess Masters — one game from the first move to its result, in any of the four modes.
 * It adds what a single position cannot know: the history for threefold repetition, who has
 * captured what, power-ups appearing on the board, and how the game ended. Pure: spawns come
 * from a seed kept inside the match, and every function returns a new match.
 *
 * Power-ups appear in Power-Up mode only, on empty squares of ranks 3-6: first after 2 turns,
 * then every 5 turns (an odd number, so each side takes it in turn to move next), at most 2
 * on the board at once.
 *
 * Called by: chessAi.ts, ChessMastersScene.ts
 * Tested by: src/games/chess-masters/chessMatch.test.ts
 */
import {
  BISHOP,
  KING,
  KNIGHT,
  PAWN,
  POWER_KINDS,
  colorOf,
  otherColor,
  squareAt,
  startPosition,
  typeOf,
  type Action,
  type Color,
  type PieceType,
  type Position,
  type PowerKind,
} from './chessCore';
import { nextRandom } from './chessRandom';
import { applyAction, findLegalAction, isDeadMaterial, isInCheck, positionKey, positionStatus } from './chessRules';
import { ABILITY } from './chessUpgrades';

export const MODES = ['classic', 'powerup', 'upgrades', 'blitz'] as const;
export type Mode = (typeof MODES)[number];

export type EndReason =
  | 'checkmate'
  | 'stalemate'
  | 'repetition'
  | 'fifty'
  | 'material'
  | 'timeout'
  | 'timeout-draw'
  | 'resign';

export interface Outcome {
  /** null for a draw. */
  winner: Color | null;
  reason: EndReason;
}

export interface LogEntry {
  color: Color;
  action: Action;
  /** The piece that moved or was targeted. */
  piece: PieceType;
  captured: PieceType | null;
  check: boolean;
}

export interface Match {
  mode: Mode;
  pos: Position;
  /** How often each position has stood at the start of a turn. */
  seen: Record<string, number>;
  /** Piece types captured by [white, black]. */
  captured: [PieceType[], PieceType[]];
  /** Completed turns. */
  turns: number;
  rng: number;
  log: LogEntry[];
  outcome: Outcome | null;
}

export interface TurnReport {
  captured: PieceType | null;
  collected: PowerKind | null;
  spawned: { square: number; kind: PowerKind } | null;
  turnEnded: boolean;
  /** A Double Move whose first half gave check, so there is no second half. */
  doubleCutShort: boolean;
  check: boolean;
}

export const SPAWN_FIRST_TURN = 2;
export const SPAWN_EVERY = 5;
export const MAX_PICKUPS = 2;
const SPAWN_WEIGHTS: Readonly<Record<PowerKind, number>> = { shield: 3, freeze: 3, double: 2, teleport: 2 };

export interface MatchOptions {
  mode: Mode;
  /** Upgrade masks for [white, black]; only Upgrades mode uses them. */
  upgrades?: [number, number];
  seed?: number;
  /** A starting position other than the usual one (tests). */
  position?: Position;
}

export function createMatch({ mode, upgrades = [0, 0], seed = 1, position }: MatchOptions): Match {
  const pos = position ?? startPosition(mode === 'upgrades' ? upgrades : [0, 0]);
  const match: Match = {
    mode,
    pos,
    seen: { [positionKey(pos)]: 1 },
    captured: [[], []],
    turns: 0,
    rng: seed | 0,
    log: [],
    outcome: null,
  };
  return { ...match, outcome: resultOf(pos, match.seen, mode) };
}

/** How the game stands at the start of a turn: null while it goes on. */
function resultOf(pos: Position, seen: Record<string, number>, mode: Mode): Outcome | null {
  const status = positionStatus(pos);
  // Checkmate counts even if it also completes fifty moves.
  if (status === 'checkmate') return { winner: otherColor(pos.turn), reason: 'checkmate' };
  if (status === 'stalemate') return { winner: null, reason: 'stalemate' };
  if (isDeadMaterial(pos, mode === 'powerup')) return { winner: null, reason: 'material' };
  if (pos.halfmove >= 100) return { winner: null, reason: 'fifty' };
  if ((seen[positionKey(pos)] ?? 0) >= 3) return { winner: null, reason: 'repetition' };
  return null;
}

function spawnPickup(pos: Position, rng: number): { pos: Position; rng: number; spawned: TurnReport['spawned'] } {
  const free: number[] = [];
  for (let rank = 2; rank <= 5; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = squareAt(file, rank);
      if (!pos.board[square] && !pos.pickups[square]) free.push(square);
    }
  }
  if (free.length === 0) return { pos, rng, spawned: null };

  const where = nextRandom(rng);
  const what = nextRandom(where.state);
  const square = free[Math.floor(where.value * free.length)]!;
  let left = what.value * POWER_KINDS.reduce((sum, k) => sum + SPAWN_WEIGHTS[k], 0);
  const kind = POWER_KINDS.find((k) => (left -= SPAWN_WEIGHTS[k]) < 0) ?? 'shield';
  return { pos: { ...pos, pickups: { ...pos.pickups, [square]: kind } }, rng: what.state, spawned: { square, kind } };
}

const spawnDue = (turns: number): boolean => turns >= SPAWN_FIRST_TURN && (turns - SPAWN_FIRST_TURN) % SPAWN_EVERY === 0;

/** What an action captures, if anything. */
function victimOf(pos: Position, action: Action): PieceType | null {
  if (action.type !== 'move') return null;
  if (action.flag === 'ep') return PAWN;
  const target = pos.board[action.to]!;
  return target ? typeOf(target) : null;
}

/** Play one action, or return null if it is not legal right now. */
export function playAction(match: Match, wanted: Action): { match: Match; report: TurnReport } | null {
  if (match.outcome) return null;
  const action = findLegalAction(match.pos, wanted);
  if (!action) return null;

  const before = match.pos;
  const side = before.turn;
  const subject =
    action.type === 'shield' || action.type === 'freeze' ? before.board[action.target]! : before.board[action.from]!;
  const victim = victimOf(before, action);
  const landed = action.type === 'move' || action.type === 'teleport' ? action.to : -1;
  let pos = applyAction(before, action);

  const turnEnded = pos.turn !== side;
  const check = isInCheck(pos, otherColor(side));
  const captured: Match['captured'] = [[...match.captured[0]], [...match.captured[1]]];
  if (victim) captured[side].push(victim);

  let { rng, turns, seen } = match;
  let spawned: TurnReport['spawned'] = null;
  let outcome: Outcome | null = null;
  const collected = landed >= 0 ? (before.pickups[landed] ?? null) : null;

  if (turnEnded) {
    turns += 1;
    if (match.mode === 'powerup' && spawnDue(turns) && Object.keys(pos.pickups).length < MAX_PICKUPS) {
      ({ pos, rng, spawned } = spawnPickup(pos, rng));
    }
    const key = positionKey(pos);
    seen = { ...seen, [key]: (seen[key] ?? 0) + 1 };
    outcome = resultOf(pos, seen, match.mode);
  }

  const entry: LogEntry = { color: side, action, piece: typeOf(subject), captured: victim, check };
  return {
    match: { ...match, pos, seen, captured, turns, rng, outcome, log: [...match.log, entry] },
    report: {
      captured: victim,
      collected,
      spawned,
      turnEnded,
      doubleCutShort: action.type === 'move' && action.double === true && turnEnded && check,
      check,
    },
  };
}

/** Could `side` ever give checkmate? Decides a Blitz game whose opponent runs out of time. */
export function canStillMate(pos: Position, side: Color): boolean {
  const mine: PieceType[] = [];
  let theirs = 0;
  for (const piece of pos.board) {
    if (!piece || typeOf(piece) === KING) continue;
    if (colorOf(piece) === side) mine.push(typeOf(piece));
    else theirs++;
  }
  if (mine.length === 0) return false;
  const loneMinor = mine.length === 1 && (mine[0] === KNIGHT || mine[0] === BISHOP);
  const attackUpgrade = (pos.upgrades[side] & (ABILITY.longLeap | ABILITY.sideSlip | ABILITY.vault)) !== 0;
  // Against a bare king, one knight or bishop is not enough.
  return !(loneMinor && theirs === 0 && !attackUpgrade);
}

/** `loser`'s clock ran out: a loss, unless the other side could never give mate. */
export function flagFall(match: Match, loser: Color): Match {
  if (match.outcome) return match;
  const winner = otherColor(loser);
  const outcome: Outcome = canStillMate(match.pos, winner)
    ? { winner, reason: 'timeout' }
    : { winner: null, reason: 'timeout-draw' };
  return { ...match, outcome };
}

export function resign(match: Match, loser: Color): Match {
  if (match.outcome) return match;
  return { ...match, outcome: { winner: otherColor(loser), reason: 'resign' } };
}
