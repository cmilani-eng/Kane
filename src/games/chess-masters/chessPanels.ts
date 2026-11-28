/**
 * Chess Masters — what each box says and which keys it has: the mode menu, the opponent
 * choice, the Workshop (and the two-player pick), pause, promotion, help and game over.
 * These build plain specs for the shared GamePanel, so the scene only has to open them.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts
 * Tested by: src/games/chess-masters/chessPanels.test.ts
 */
import { t } from '../../i18n';
import type { GamePanelButton, GamePanelSpec } from '../../presentation/ui/gamePanel';
import { BISHOP, KNIGHT, PAWN, POWER_KINDS, PROMOTION_TYPES, QUEEN, ROOK, type Color, type PieceType } from './chessCore';
import type { TimeControlId } from './chessClock';
import { MODES, type Mode } from './chessMatch';
import type { Progress } from './chessStore';
import {
  colorName,
  modeHelp,
  modeName,
  pieceName,
  powerHelp,
  powerName,
  upgradeHelp,
  upgradeName,
  upgradeNames,
} from './chessText';
import { DRAFT_BUDGET, LEVELS, abilitiesOfPiece, maskOf, upgradesFor, type Level, type UpgradeId } from './chessUpgrades';

const GAME_TITLE = 'Chess Masters';
/** The pieces the Workshop sells moves for. */
export const SHOP_PIECES: readonly PieceType[] = [PAWN, KNIGHT, BISHOP, ROOK, QUEEN];

export function modesPanel(progress: Progress, onPick: (mode: Mode) => void): GamePanelSpec {
  const played = progress.wins + progress.losses + progress.draws;
  return {
    pill: t('chess.pill'),
    title: GAME_TITLE,
    copy: t('chess.copy'),
    chain: t('chess.modes.list'),
    note: played ? t('chess.record', { wins: progress.wins, losses: progress.losses, draws: progress.draws }) : undefined,
    buttons: MODES.map((mode) => ({ label: modeName(mode), choice: true, onClick: () => onPick(mode) })),
  };
}

export interface SetupActions {
  onLevel: (level: Level) => void;
  onTwoPlayers: () => void;
  onPlayAs: () => void;
  onClock: () => void;
  onWorkshop: () => void;
  onBack: () => void;
}

export function setupPanel(mode: Mode, progress: Progress, actions: SetupActions): GamePanelSpec {
  const buttons: GamePanelButton[] = [
    ...LEVELS.map((level) => ({
      label: t(`chess.level.${level}`),
      primary: level === progress.level,
      onClick: () => actions.onLevel(level),
    })),
    { label: t('chess.twoPlayers'), onClick: actions.onTwoPlayers },
    { label: t('chess.playAs', { color: colorName(progress.playAs === 'white' ? 0 : 1) }), onClick: actions.onPlayAs },
  ];
  if (mode === 'blitz') {
    const time = t(`chess.time.${progress.blitz as TimeControlId}`);
    buttons.push({ label: t('chess.clock.button', { time }), onClick: actions.onClock });
  }
  if (mode === 'upgrades') buttons.push({ label: t('chess.workshop'), onClick: actions.onWorkshop });
  buttons.push({ label: t('chess.back'), onClick: actions.onBack });

  const upgrades =
    mode === 'upgrades'
      ? `${t('chess.upgrades.yours', { list: upgradeNames(progress.owned) })}\n${t('chess.upgrades.points', { n: progress.points })}`
      : undefined;
  return {
    pill: modeName(mode),
    title: t('chess.setup.title'),
    copy: modeHelp(mode),
    chain: upgrades,
    note: mode === 'upgrades' ? t('chess.upgrades.setupNote', { n: DRAFT_BUDGET }) : t('chess.setup.copy'),
    buttons,
  };
}

export interface ShopState {
  title: string;
  /** What has been bought (the saved set, or one player's picks in a two-player game). */
  picks: readonly UpgradeId[];
  points: number;
  piece: PieceType;
  message: string;
  note?: string;
}

export interface ShopActions {
  onPiece: (piece: PieceType) => void;
  onBuy: (id: UpgradeId) => void;
  /** Refund the saved set, or clear a player's picks. */
  clear: { label: string; onClick: () => void };
  done: { label: string; onClick: () => void };
}

/** One piece at a time: tabs for the five pieces, then that piece's upgrades. */
export function shopPanel(state: ShopState, actions: ShopActions): GamePanelSpec {
  const offers = upgradesFor(state.piece);
  const lines = offers.map((u) =>
    state.picks.includes(u.id)
      ? t('chess.shop.lineOwned', { name: upgradeName(u.id), help: upgradeHelp(u.id) })
      : t('chess.shop.line', { name: upgradeName(u.id), cost: u.cost, help: upgradeHelp(u.id) }),
  );
  return {
    pill: t('chess.shop.pill', { n: state.points }),
    title: state.title,
    copy: `${pieceName(state.piece).toLocaleUpperCase()}\n${lines.join('\n')}`,
    result: state.message,
    note: state.note,
    buttons: [
      ...SHOP_PIECES.map((piece) => {
        const owned = abilitiesOfPiece(maskOf(state.picks), piece).length;
        const chosen = piece === state.piece;
        const label = `${chosen ? '▸ ' : ''}${pieceName(piece)}${owned ? ` (${owned})` : ''}`;
        return { label, onClick: () => actions.onPiece(piece) };
      }),
      ...offers.map((u, i) => ({
        label: state.picks.includes(u.id)
          ? t('chess.shop.has', { name: upgradeName(u.id) })
          : t('chess.shop.buy', { name: upgradeName(u.id) }),
        newRow: i === 0,
        onClick: () => actions.onBuy(u.id),
      })),
      { label: actions.clear.label, newRow: true, onClick: actions.clear.onClick },
      // Enter closes the shop; it never buys.
      { label: actions.done.label, primary: true, onClick: actions.done.onClick },
    ],
  };
}

export function readyPanel(sides: readonly { who: string; list: string }[], onStart: () => void, onBack: () => void): GamePanelSpec {
  return {
    pill: t('chess.ready.pill'),
    title: t('chess.ready.title'),
    copy: sides.map((side) => t('chess.ready.side', side)).join('\n'),
    note: t('chess.info.hint.upgrades'),
    buttons: [
      { label: t('chess.ready.start'), primary: true, onClick: onStart },
      { label: t('chess.back'), onClick: onBack },
    ],
  };
}

export interface PauseActions {
  onResume: () => void;
  onNewGame: () => void;
  /** Absent once the game is over, and while it is not your turn to give up. */
  onResign?: () => void;
  onModes: () => void;
}

export function pausePanel(over: boolean, actions: PauseActions): GamePanelSpec {
  return {
    pill: t('chess.pause.pill'),
    title: over ? t('chess.status.over').toLocaleUpperCase() : t('chess.pause.title'),
    copy: over ? undefined : t('chess.pause.copy'),
    buttons: [
      { label: over ? t('chess.close') : t('chess.resume'), primary: true, onClick: actions.onResume },
      { label: t('chess.newGame'), onClick: actions.onNewGame },
      ...(actions.onResign ? [{ label: t('chess.resign'), onClick: actions.onResign }] : []),
      { label: t('chess.changeMode'), onClick: actions.onModes },
    ],
  };
}

export function promotePanel(onPick: (type: PieceType) => void, onCancel: () => void): GamePanelSpec {
  return {
    pill: t('chess.promote.pill'),
    title: t('chess.promote.title'),
    buttons: [
      ...PROMOTION_TYPES.map((type) => ({
        label: pieceName(type),
        choice: true,
        primary: type === QUEEN,
        onClick: () => onPick(type),
      })),
      { label: t('chess.cancel'), onClick: onCancel },
    ],
  };
}

/**
 * The help, a page at a time so it stays readable on a phone: the mode and the controls, then
 * the power-ups or the upgrades in this game.
 */
export function helpPages(mode: Mode, upgradesInPlay: readonly { who: string; ids: readonly UpgradeId[] }[]): string[] {
  const pages = [`${modeHelp(mode)}\n\n${t('chess.help.controls')}`, t('chess.help.marks')];
  if (mode === 'powerup') {
    const entries = POWER_KINDS.map((kind) => `${powerName(kind)}: ${powerHelp(kind)}`);
    pages.push(entries.slice(0, 2).join('\n\n'), entries.slice(2).join('\n\n'));
  }
  if (mode === 'upgrades') {
    const seen = new Set<UpgradeId>(upgradesInPlay.flatMap((side) => side.ids));
    const who = upgradesInPlay.map((side) => t('chess.ready.side', { who: side.who, list: upgradeNames(side.ids) }));
    pages.push(who.join('\n'));
    const entries = SHOP_PIECES.flatMap((piece) => upgradesFor(piece))
      .filter((u) => seen.has(u.id))
      .map((u) => `${pieceName(u.piece)} · ${upgradeName(u.id)}: ${upgradeHelp(u.id)}`);
    for (let i = 0; i < entries.length; i += 3) pages.push(entries.slice(i, i + 3).join('\n\n'));
  }
  return pages;
}

export function helpPanel(pages: readonly string[], page: number, onNext: () => void, onClose: () => void): GamePanelSpec {
  return {
    pill: t('chess.help.pill', { page: page + 1, pages: pages.length }),
    title: t('chess.help.title'),
    copy: pages[page],
    buttons: [
      ...(pages.length > 1 ? [{ label: t('chess.help.next'), onClick: onNext }] : []),
      { label: t('chess.close'), primary: true, onClick: onClose },
    ],
  };
}

export interface OverState {
  title: string;
  reason: string;
  /** Upgrades games against the computer: what this game earned. */
  points?: { earned: number; total: number };
  workshop: boolean;
}

export function overPanel(
  state: OverState,
  actions: { onAgain: () => void; onBoard: () => void; onWorkshop: () => void; onModes: () => void },
): GamePanelSpec {
  return {
    pill: t('chess.over.pill'),
    title: state.title,
    copy: state.reason,
    result: state.points ? t('chess.over.points', state.points) : undefined,
    buttons: [
      { label: t('chess.again'), primary: true, onClick: actions.onAgain },
      { label: t('chess.viewBoard'), onClick: actions.onBoard },
      ...(state.workshop ? [{ label: t('chess.workshop'), onClick: actions.onWorkshop }] : []),
      { label: t('chess.changeMode'), onClick: actions.onModes },
    ],
  };
}

export const draftTitle = (color: Color): string => t('chess.draft.title', { color: colorName(color).toLocaleUpperCase() });
