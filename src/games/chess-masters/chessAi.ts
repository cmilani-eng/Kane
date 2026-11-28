/**
 * Chess Masters — the computer opponent: an alpha-beta search written for this game (no
 * outside engine). It uses the same rules module as the players, so it moves, upgrades and
 * power-ups exactly as they do, and every reply it returns is a legal action. It never sees
 * where the next power-up will appear.
 *
 * It looks at every ordinary move. Power-ups are too many to try them all (a Teleport alone
 * has hundreds of uses), so it picks sensible candidates for its own turn; deeper down it
 * only considers them when there is no ordinary move left.
 *
 * Called by: chessAi.worker.ts, chessAiClient.ts
 * Tested by: src/games/chess-masters/chessAi.test.ts
 */
import { KING, PAWN, colorOf, otherColor, typeOf, type Action, type MoveAction, type Position } from './chessCore';
import { PIECE_VALUE, evaluate, pieceValues } from './chessEval';
import { nextRandom, seededRandom } from './chessRandom';
import {
  applyAction,
  canTeleportTo,
  findLegalAction,
  heldCount,
  isAttacked,
  isDeadMaterial,
  isInCheck,
  isPowerTarget,
  legalActions,
  legalMoves,
  positionKey,
  powerActions,
  pseudoMoves,
} from './chessRules';
import type { Level } from './chessUpgrades';

export interface AiInput {
  pos: Position;
  /** How often each position has stood, so the computer knows when it would draw by repetition. */
  seen: Record<string, number>;
  /** Power-Up games use a stricter dead-draw rule. */
  powerUps: boolean;
}

export interface AiSettings {
  level: Level;
  seed: number;
  /** Longest it may think, in milliseconds. Defaults to the level's own limit. */
  timeMs?: number;
  maxDepth?: number;
}

export interface AiReply {
  action: Action;
  /** The deepest search it finished. */
  depth: number;
  nodes: number;
  score: number;
}

interface Strength {
  timeMs: number;
  maxDepth: number;
  /** How many captures past the horizon it follows. */
  quiet: number;
  /** Random wobble added to each of its options, in hundredths of a pawn. */
  noise: number;
}

export const STRENGTH: Readonly<Record<Level, Strength>> = {
  easy: { timeMs: 500, maxDepth: 1, quiet: 1, noise: 140 },
  medium: { timeMs: 1200, maxDepth: 3, quiet: 6, noise: 24 },
  hard: { timeMs: 2500, maxDepth: 12, quiet: 8, noise: 0 },
};

const MATE = 100_000;
const MATE_ZONE = MATE - 1000;
/** Replies tried when only a power-up can answer, deep in the search. */
const DEEP_POWER_LIMIT = 8;

class OutOfTime extends Error {}

interface Search {
  values: number[][];
  strength: Strength;
  powerUps: boolean;
  nodes: number;
  deadline: number;
  /** The first depth always finishes, so there is always an answer. */
  canStop: boolean;
  killers: (number | undefined)[];
  history: Map<number, number>;
  now: () => number;
}

const moveCode = (m: MoveAction): number => m.from | (m.to << 6) | ((m.promo ?? 0) << 12);

/** Likely-good moves first, which is what makes alpha-beta fast. */
function order(pos: Position, moves: MoveAction[], search: Search, ply: number): MoveAction[] {
  const scored = moves.map((m) => {
    const victim = m.flag === 'ep' ? PAWN : typeOf(pos.board[m.to]!);
    const attacker = PIECE_VALUE[typeOf(pos.board[m.from]!)]!;
    if (pos.board[m.to] || m.flag === 'ep') return { m, score: 100_000 + PIECE_VALUE[victim]! * 10 - attacker / 10 };
    if (m.promo) return { m, score: 90_000 + PIECE_VALUE[m.promo]! };
    if (search.killers[ply] === moveCode(m)) return { m, score: 80_000 };
    return { m, score: search.history.get(moveCode(m)) ?? 0 };
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.m);
}

function tick(search: Search): void {
  if ((++search.nodes & 511) === 0 && search.canStop && search.now() >= search.deadline) throw new OutOfTime();
}

/** Follow captures until things calm down, so a half-finished exchange is not misjudged. */
function quiesce(pos: Position, alpha: number, beta: number, depth: number, search: Search): number {
  tick(search);
  const stand = evaluate(pos, search.values);
  if (stand >= beta) return stand;
  if (depth <= 0) return stand;
  let best = stand;
  if (stand > alpha) alpha = stand;
  for (const move of order(pos, pseudoMoves(pos, true), search, 63)) {
    const next = applyAction(pos, move);
    if (isInCheck(next, pos.turn)) continue;
    const score = -quiesce(next, -beta, -alpha, depth - 1, search);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}

function negamax(pos: Position, depth: number, alpha: number, beta: number, ply: number, search: Search): number {
  tick(search);
  if (isDeadMaterial(pos, search.powerUps)) return 0;
  const check = isInCheck(pos, pos.turn);
  // Look one ply further when in check, so mates near the horizon are seen.
  if (depth <= 0 && check && ply < search.strength.maxDepth * 2 && search.strength.maxDepth > 1) depth = 1;
  if (depth <= 0) return quiesce(pos, alpha, beta, search.strength.quiet, search);

  let best = -Infinity;
  const consider = (next: Position): number => {
    // A Double Move's first half leaves the same side to play.
    const score =
      next.turn === pos.turn
        ? negamax(next, depth, alpha, beta, ply + 1, search)
        : -negamax(next, depth - 1, -beta, -alpha, ply + 1, search);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    return score;
  };

  for (const move of order(pos, pseudoMoves(pos), search, ply)) {
    const next = applyAction(pos, move);
    if (isInCheck(next, pos.turn)) continue;
    // Fifty moves without progress is a draw, unless this move mates.
    if (next.halfmove >= 100 && !isInCheck(next, next.turn)) {
      if (0 > best) best = 0;
      if (0 > alpha) alpha = 0;
    } else {
      consider(next);
    }
    if (alpha >= beta) {
      if (!pos.board[move.to]) {
        search.killers[ply] = moveCode(move);
        search.history.set(moveCode(move), (search.history.get(moveCode(move)) ?? 0) + depth * depth);
      }
      return best;
    }
  }
  if (best > -Infinity) return best;

  // No ordinary move. It is only mate or stalemate if no power-up can be used either.
  if (!pos.second && heldCount(pos, pos.turn) > 0) {
    for (const action of powerActions(pos).slice(0, DEEP_POWER_LIMIT)) {
      consider(applyAction(pos, action));
      if (alpha >= beta) break;
    }
    if (best > -Infinity) return best;
  }
  return check ? -MATE + ply : 0;
}

// ---------------------------------------------------------------- the computer's own options

const isSafeUse = (pos: Position, action: Action): boolean => findLegalAction(pos, action) !== null;

/** A short list of power-up uses worth thinking about on the computer's own turn. */
export function powerCandidatesFor(pos: Position): Action[] {
  const side = pos.turn;
  const enemy = otherColor(side);
  const held = pos.held[side];
  if (pos.second || heldCount(pos, side) === 0) return [];
  // In check, only a few uses can help, so take them all.
  if (isInCheck(pos, side)) return powerActions(pos).filter((a) => a.type !== 'move');

  const squares = Array.from({ length: 64 }, (_, square) => square);
  const worth = (square: number): number => PIECE_VALUE[typeOf(pos.board[square]!)]!;
  const mostValuable = (list: number[], count: number): number[] =>
    list.sort((a, b) => worth(b) - worth(a)).slice(0, count);
  const mine = squares.filter((s) => pos.board[s] && colorOf(pos.board[s]!) === side);
  const theirs = squares.filter((s) => pos.board[s] && colorOf(pos.board[s]!) === enemy);
  const threatened = mine.filter((s) => typeOf(pos.board[s]!) !== KING && isAttacked(pos, s, enemy));
  const actions: Action[] = [];

  if (held.shield > 0) {
    for (const target of mostValuable(threatened.slice(), 3)) actions.push({ type: 'shield', target });
  }
  if (held.freeze > 0) {
    // Pieces we are already hitting (so they cannot run away) and big pieces that could hurt.
    const hit = theirs.filter((s) => isPowerTarget(pos, 'freeze', s) && isAttacked(pos, s, side));
    const big = theirs.filter((s) => isPowerTarget(pos, 'freeze', s) && !hit.includes(s));
    for (const target of [...mostValuable(hit, 4), ...mostValuable(big, 2)]) actions.push({ type: 'freeze', target });
  }
  if (held.teleport > 0) {
    const travellers = mostValuable(mine.filter((s) => isPowerTarget(pos, 'teleport', s)), 8);
    const found: { action: Action; score: number }[] = [];
    for (const from of travellers) {
      for (const to of squares) {
        if (!canTeleportTo(pos, from, to)) continue;
        const board = pos.board.slice();
        board[to] = board[from]!;
        board[from] = 0;
        const moved: Position = { ...pos, board };
        if (isAttacked(moved, to, enemy)) continue;
        let score = pos.pickups[to] ? 150 : 0;
        if (threatened.includes(from)) score += worth(from) / 2;
        // Landing where it will threaten something worth more.
        const nextTurn = pseudoMoves({ ...moved, turn: side }, true).filter((m) => m.from === to);
        for (const capture of nextTurn) {
          const gain = worth(capture.to);
          if (gain > 0) score = Math.max(score, gain / 3 + (pos.pickups[to] ? 150 : 0));
        }
        if (score > 0) found.push({ action: { type: 'teleport', from, to }, score });
      }
    }
    for (const { action } of found.sort((a, b) => b.score - a.score).slice(0, 10)) actions.push(action);
  }
  return actions.filter((action) => isSafeUse(pos, action));
}

interface Option {
  action: Action;
  /** The positions this option can end the turn in: several for a Double Move, one otherwise. */
  ends: Position[];
}

/** Double Move pairs: the likeliest first moves, each with its most promising second moves. */
function doubleOptions(pos: Position, search: Search): Option[] {
  if (pos.second || pos.held[pos.turn].double < 1) return [];
  const promising = (from: Position, count: number): { move: MoveAction; next: Position }[] =>
    legalMoves(from)
      .map((move) => {
        const next = applyAction(from, move);
        const capture = from.board[move.to] ? PIECE_VALUE[typeOf(from.board[move.to]!)]! * 4 : 0;
        const pickup = from.pickups[move.to] ? 120 : 0;
        return { move, next, score: capture + pickup - evaluate(next, search.values) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

  const options: Option[] = [];
  for (const { move } of promising(pos, 10)) {
    const first: MoveAction = { ...move, double: true };
    const after = applyAction(pos, first);
    // A first half that gives check ends the turn, which is the same as an ordinary move.
    if (!after.second) continue;
    const ends = promising(after, 5).map((second) => second.next);
    if (ends.length) options.push({ action: first, ends });
  }
  return options;
}

function rootOptions(pos: Position, search: Search): Option[] {
  const plain: Action[] = [...legalMoves(pos), ...powerCandidatesFor(pos)];
  const options = plain.map((action) => ({ action, ends: [applyAction(pos, action)] }));
  return [...options, ...doubleOptions(pos, search)];
}

/** Pick the computer's action, or null if it has none (the game is over). */
export function chooseAction(input: AiInput, settings: AiSettings, now: () => number = () => performance.now()): AiReply | null {
  const { pos, seen, powerUps } = input;
  const base = STRENGTH[settings.level];
  const strength: Strength = { ...base, maxDepth: settings.maxDepth ?? base.maxDepth };
  const search: Search = {
    values: [pieceValues(pos.upgrades[0]), pieceValues(pos.upgrades[1])],
    strength,
    powerUps,
    nodes: 0,
    deadline: now() + (settings.timeMs ?? base.timeMs),
    canStop: false,
    killers: [],
    history: new Map(),
    now,
  };

  const budget = settings.timeMs ?? base.timeMs;
  const started = now();
  let options = rootOptions(pos, search);
  if (options.length === 0) {
    // The candidate lists can miss a usable power-up; the rules never do.
    const fallback = legalActions(pos)[0];
    return fallback ? { action: fallback, depth: 0, nodes: 0, score: 0 } : null;
  }

  const random = seededRandom(nextRandom(settings.seed).state ^ (pos.fullmove * 2 + pos.turn));
  const wobble = new Map(options.map((o) => [o, (random() - 0.5) * strength.noise]));
  let best = { option: options[0]!, score: -Infinity };
  let finished = 0;

  const scoreEnd = (end: Position, depth: number, alpha: number): number => {
    const repeats = end.turn !== pos.turn && (seen[positionKey(end)] ?? 0) >= 2;
    if (repeats) return 0;
    if (end.turn === pos.turn) return negamax(end, depth, alpha, Infinity, 1, search);
    return -negamax(end, depth - 1, -Infinity, -alpha, 1, search);
  };

  for (let depth = 1; depth <= strength.maxDepth; depth++) {
    search.canStop = depth > 1;
    const results: { option: Option; score: number; judged: number }[] = [];
    let alpha = -Infinity;
    try {
      for (const option of options) {
        let score = -Infinity;
        for (const end of option.ends) {
          score = Math.max(score, scoreEnd(end, depth, Math.max(alpha, score) - 1));
        }
        const judged = Math.abs(score) < MATE_ZONE ? score + wobble.get(option)! : score;
        results.push({ option, score, judged });
        // Keep scores near the best exact, so the wobble compares like with like.
        alpha = Math.max(alpha, score - strength.noise);
      }
    } catch (error) {
      if (!(error instanceof OutOfTime)) throw error;
      break;
    }
    results.sort((a, b) => b.judged - a.judged);
    best = { option: results[0]!.option, score: results[0]!.score };
    options = results.map((r) => r.option);
    finished = depth;
    // A deeper pass takes several times longer, so past half the time it would not finish.
    if (Math.abs(best.score) >= MATE_ZONE || options.length === 1 || now() - started >= budget * 0.5) break;
  }

  return { action: best.option.action, depth: finished, nodes: search.nodes, score: best.score };
}
