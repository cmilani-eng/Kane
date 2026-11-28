/**
 * Chess Masters — the boxes before a game, in order: pick a mode, pick who plays, then for
 * Upgrades the Workshop or the two-player pick and a list of the upgrades in play. It ends by
 * handing the scene a finished GameSetup. No Phaser here, so the whole flow is tested.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts
 * Tested by: src/games/chess-masters/chessMenus.test.ts
 */
import { t } from '../../i18n';
import type { GamePanelSpec } from '../../presentation/ui/gamePanel';
import { BLACK, PAWN, WHITE, type Color, type PieceType } from './chessCore';
import { TIME_CONTROLS } from './chessClock';
import type { Mode } from './chessMatch';
import { draftTitle, modesPanel, readyPanel, setupPanel, shopPanel } from './chessPanels';
import { buyUpgrade, refundUpgrades, type Progress } from './chessStore';
import { upgradeName, upgradeNames, upgradeSides } from './chessText';
import { DRAFT_BUDGET, computerUpgrades, costOf, pickUpgrade, type Level, type UpgradeId } from './chessUpgrades';

export interface GameSetup {
  mode: Mode;
  vsComputer: boolean;
  level: Level;
  /** The player's colour against the computer. */
  human: Color;
  /** Upgrades for [white, black]. */
  upgrades: [UpgradeId[], UpgradeId[]];
}

export const freshSetup = (): GameSetup => ({
  mode: 'classic',
  vsComputer: true,
  level: 'easy',
  human: WHITE,
  upgrades: [[], []],
});

/** The player's saved upgrades, and a matching set for the computer. */
export function dealUpgrades(setup: GameSetup, owned: readonly UpgradeId[], seed: number): GameSetup {
  const mine = [...owned];
  const theirs = computerUpgrades(setup.level, costOf(mine), seed);
  return { ...setup, upgrades: setup.human === WHITE ? [mine, theirs] : [theirs, mine] };
}

export interface MenuHost {
  progress(): Progress;
  /** Save a change to the player's progress. */
  remember(change: Partial<Progress>): void;
  open(spec: GamePanelSpec): void;
  /** Leave the menus and play. */
  start(setup: GameSetup): void;
  sound(kind: 'ui' | 'ability'): void;
  seed(): number;
}

export class ChessMenus {
  private setup: GameSetup = freshSetup();
  private readonly host: MenuHost;

  constructor(host: MenuHost) {
    this.host = host;
  }

  modes(): void {
    this.host.open(
      modesPanel(this.host.progress(), (mode) => {
        this.host.sound('ui');
        this.opponents(mode);
      }),
    );
  }

  opponents(mode: Mode): void {
    this.setup = { ...this.setup, mode };
    const { host } = this;
    host.open(
      setupPanel(mode, host.progress(), {
        onLevel: (level) => this.againstComputer(level),
        onTwoPlayers: () => this.twoPlayers(),
        onPlayAs: () => {
          host.remember({ playAs: host.progress().playAs === 'white' ? 'black' : 'white' });
          this.opponents(mode);
        },
        onClock: () => {
          const next = TIME_CONTROLS[(TIME_CONTROLS.indexOf(host.progress().blitz) + 1) % TIME_CONTROLS.length]!;
          host.remember({ blitz: next });
          this.opponents(mode);
        },
        onWorkshop: () => this.workshop(PAWN, ''),
        onBack: () => this.modes(),
      }),
    );
  }

  /** Spend saved points. Only games against the computer use what is bought here. */
  workshop(piece: PieceType, message: string): void {
    const { host } = this;
    const { owned, points } = host.progress();
    host.open(
      shopPanel(
        { title: t('chess.shop.title'), picks: owned, points, piece, message, note: t('chess.shop.earn') },
        {
          onPiece: (next) => this.workshop(next, ''),
          onBuy: (id) => {
            const { progress, result } = buyUpgrade(host.progress(), id);
            if (result === 'bought') {
              host.remember(progress);
              host.sound('ability');
            }
            this.workshop(piece, t(`chess.shop.${result}`, { name: upgradeName(id) }));
          },
          clear: {
            label: t('chess.shop.refund'),
            onClick: () => {
              host.remember(refundUpgrades(host.progress()));
              this.workshop(piece, t('chess.shop.refunded'));
            },
          },
          done: { label: t('chess.shop.done'), onClick: () => this.opponents('upgrades') },
        },
      ),
    );
  }

  /** "Play again" with the same settings. Points may have been spent since, so the computer is matched afresh. */
  again(previous: GameSetup): void {
    this.setup = previous;
    if (previous.mode === 'upgrades' && previous.vsComputer) {
      this.setup = dealUpgrades(previous, this.host.progress().owned, this.host.seed());
      this.ready();
    } else {
      this.host.start(previous);
    }
  }

  private againstComputer(level: Level): void {
    this.host.remember({ level });
    const human: Color = this.host.progress().playAs === 'white' ? WHITE : BLACK;
    this.setup = { ...this.setup, vsComputer: true, level, human, upgrades: [[], []] };
    if (this.setup.mode !== 'upgrades') {
      this.host.start(this.setup);
      return;
    }
    this.setup = dealUpgrades(this.setup, this.host.progress().owned, this.host.seed());
    this.ready();
  }

  private twoPlayers(): void {
    this.setup = { ...this.setup, vsComputer: false, upgrades: [[], []] };
    if (this.setup.mode === 'upgrades') this.draft(WHITE, PAWN, [], '');
    else this.host.start(this.setup);
  }

  /** Two players pick in turn from equal budgets. Tapping a pick again gives it back. */
  private draft(color: Color, piece: PieceType, picks: UpgradeId[], message: string): void {
    const points = DRAFT_BUDGET - costOf(picks);
    this.host.open(
      shopPanel(
        { title: draftTitle(color), picks, points, piece, message, note: t('chess.draft.note', { n: DRAFT_BUDGET }) },
        {
          onPiece: (next) => this.draft(color, next, picks, ''),
          onBuy: (id) => {
            if (picks.includes(id)) {
              this.draft(color, piece, picks.filter((u) => u !== id), '');
              return;
            }
            const bought = pickUpgrade(picks, points, id);
            if (bought.result === 'bought') this.host.sound('ability');
            this.draft(color, piece, bought.picks, t(`chess.shop.${bought.result}`, { name: upgradeName(id) }));
          },
          clear: { label: t('chess.draft.clear'), onClick: () => this.draft(color, piece, [], '') },
          done: {
            label: t(color === WHITE ? 'chess.draft.next' : 'chess.draft.start'),
            onClick: () => {
              const upgrades: GameSetup['upgrades'] = [this.setup.upgrades[0], this.setup.upgrades[1]];
              upgrades[color] = picks;
              this.setup = { ...this.setup, upgrades };
              if (color === WHITE) this.draft(BLACK, PAWN, [], '');
              else this.ready();
            },
          },
        },
      ),
    );
  }

  /** Before an Upgrades game, both sides' new moves are laid out. */
  private ready(): void {
    const sides = upgradeSides(this.setup).map(({ who, ids }) => ({ who, list: upgradeNames(ids) }));
    this.host.open(
      readyPanel(
        sides,
        () => this.host.start(this.setup),
        () => (this.setup.vsComputer ? this.opponents('upgrades') : this.draft(WHITE, PAWN, [], '')),
      ),
    );
  }
}
