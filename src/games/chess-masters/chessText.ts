/**
 * Chess Masters — everything the game says: names for pieces, power-ups and upgrades, the
 * status lines, what happened last, what a tapped square is, and how a game ended.
 *
 * Called by: ChessMastersScene.ts, chessMenus.ts, chessPanels.ts
 * Tested by: src/games/chess-masters/chessText.test.ts, chessPanels.test.ts
 */
import { t, type MessageKey } from '../../i18n';
import {
  BLACK,
  WHITE,
  colorOf,
  isFrozen,
  shieldTurns,
  squareName,
  typeOf,
  type Action,
  type Color,
  type PieceType,
  type Position,
  type PowerKind,
} from './chessCore';
import type { Match, Mode, Outcome, TurnReport } from './chessMatch';
import type { GameSetup } from './chessMenus';
import { hasLegalMove, isInCheck } from './chessRules';
import type { Choice } from './chessSelection';
import { abilitiesOfPiece, idsOf, type UpgradeId } from './chessUpgrades';

const PIECE_KEYS: Readonly<Record<PieceType, MessageKey>> = {
  1: 'chess.piece.pawn',
  2: 'chess.piece.knight',
  3: 'chess.piece.bishop',
  4: 'chess.piece.rook',
  5: 'chess.piece.queen',
  6: 'chess.piece.king',
};

export const pieceName = (type: PieceType): string => t(PIECE_KEYS[type]);
export const colorName = (color: Color): string => t(color === WHITE ? 'chess.color.white' : 'chess.color.black');
export const powerName = (kind: PowerKind): string => t(`chess.power.${kind}`);
export const powerHelp = (kind: PowerKind): string => t(`chess.power.${kind}.help`);
export const upgradeName = (id: UpgradeId): string => t(`chess.up.${id}`);
export const upgradeHelp = (id: UpgradeId): string => t(`chess.up.${id}.help`);
export const modeName = (mode: Mode): string => t(`chess.mode.${mode}`);
export const modeHelp = (mode: Mode): string => t(`chess.help.${mode}`);

export const upgradeNames = (ids: readonly UpgradeId[]): string =>
  ids.length ? ids.map(upgradeName).join(', ') : t('chess.upgrades.none');

export const maskNames = (mask: number): string => upgradeNames(idsOf(mask));

/** Why the game ended, from the point of view of `human` (null with two players). */
export function endReason(outcome: Outcome, human: Color | null): string {
  if (outcome.reason === 'resign' && human !== null && outcome.winner !== human) return t('chess.end.youResigned');
  return t(`chess.end.${outcome.reason}`);
}

/** The big headline on the game-over box. */
export function endTitle(outcome: Outcome, human: Color | null): string {
  if (outcome.winner === null) return t('chess.over.draw');
  if (human !== null) return t(outcome.winner === human ? 'chess.over.win' : 'chess.over.loss');
  return t(outcome.winner === WHITE ? 'chess.over.white' : 'chess.over.black');
}

/** "White" and "Black" with two players; "You" and "Computer · Easy" against the computer. */
export function playerName(setup: GameSetup, color: Color): string {
  if (!setup.vsComputer) return colorName(color);
  if (color === setup.human) return t('chess.you');
  return t('chess.computer', { level: t(`chess.levelName.${setup.level}`) });
}

export const upgradeSides = (setup: GameSetup): { who: string; ids: UpgradeId[] }[] =>
  [WHITE, BLACK].map((color) => ({ who: playerName(setup, color), ids: setup.upgrades[color] }));

/** What is on a square: a power-up to collect, a piece, its upgrades and its state. */
export function describeSquare(pos: Position, square: number): string {
  const lines: string[] = [];
  const pickup = pos.pickups[square];
  if (pickup) lines.push(describePower(pickup));
  const piece = pos.board[square]!;
  if (piece) {
    const color = colorOf(piece);
    lines.push(`${pieceName(typeOf(piece))} · ${colorName(color)}`);
    for (const id of abilitiesOfPiece(pos.upgrades[color], typeOf(piece))) {
      lines.push(`${upgradeName(id)}: ${upgradeHelp(id)}`);
    }
    if (shieldTurns(piece)) lines.push(t('chess.info.shield', { n: shieldTurns(piece) }));
    if (isFrozen(piece)) lines.push(t('chess.info.frozen'));
  }
  return lines.join('\n');
}

export const describePower = (kind: PowerKind): string => `${powerName(kind)}: ${powerHelp(kind)}`;

/** The note under the buttons: what was tapped, or the result, or a hint for the mode. */
export function infoText(match: Match, about: Choice['about'], human: Color | null): string {
  let text = '';
  if (about) text = 'power' in about ? describePower(about.power) : describeSquare(match.pos, about.square);
  if (text) return text;
  if (match.outcome) return endReason(match.outcome, human);
  return match.mode === 'powerup' || match.mode === 'upgrades' ? t(`chess.info.hint.${match.mode}`) : t('chess.info.hint');
}

/** What the last action did, beyond what the board shows. */
export function eventText(action: Action, report: TurnReport, setup: GameSetup, mover: Color): string {
  const who = playerName(setup, mover);
  const mine = setup.vsComputer && mover === setup.human;
  const lines: string[] = [];
  if (action.type !== 'move') {
    const square = squareName(action.type === 'teleport' ? action.to : action.target);
    lines.push(t('chess.used', { who, power: powerName(action.type), square }));
  } else if (report.doubleCutShort) {
    lines.push(t('chess.doubleCut'));
  }
  if (report.collected) {
    const power = powerName(report.collected);
    lines.push(mine ? t('chess.collected.you', { power }) : t('chess.collected', { who, power }));
  }
  if (report.spawned) {
    lines.push(t('chess.spawned', { power: powerName(report.spawned.kind), square: squareName(report.spawned.square) }));
  }
  return lines.join(' ');
}

export interface Status {
  headline: string;
  detail: string;
  alert: boolean;
}

/** The two lines beside the board: whose turn it is, then what to do or what just happened. */
export function statusLines(match: Match, setup: GameSetup, choice: Choice, humanTurn: boolean, event: string): Status {
  const { pos, outcome } = match;
  if (outcome) {
    return { headline: endTitle(outcome, setup.vsComputer ? setup.human : null), detail: '', alert: true };
  }
  const check = isInCheck(pos, pos.turn);
  let headline = setup.vsComputer
    ? t(humanTurn ? 'chess.status.yourTurn' : 'chess.status.thinking')
    : t('chess.status.toMove', { color: colorName(pos.turn) });
  if (check) headline = `${t('chess.status.check')} ${headline}`;

  let detail = choice.problem ? t(choice.problem) : event;
  if (pos.second && humanTurn) {
    detail = t('chess.second');
  } else if (choice.power) {
    const { kind, from } = choice.power;
    const prompt = t(kind === 'teleport' && from >= 0 ? 'chess.pick.teleportTo' : `chess.pick.${kind}`);
    detail = choice.problem ? `${t(choice.problem)} ${prompt}` : prompt;
  } else if (humanTurn && match.mode === 'powerup' && !hasLegalMove(pos)) {
    detail = t(check ? 'chess.status.onlyPowerCheck' : 'chess.status.onlyPowerStale');
  }
  return { headline, detail, alert: check };
}
