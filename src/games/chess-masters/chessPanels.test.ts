/** The boxes: every mode and option is offered, Enter does the safe thing, in all three languages. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LOCALES, resetLocaleForTests, setLocale } from '../../i18n';
import type { GamePanelSpec } from '../../presentation/ui/gamePanel';
import { MODES } from './chessMatch';
import {
  SHOP_PIECES,
  helpPages,
  modesPanel,
  overPanel,
  pausePanel,
  promotePanel,
  setupPanel,
  shopPanel,
} from './chessPanels';
import { emptyProgress } from './chessStore';
import { endReason, endTitle } from './chessText';
import { UPGRADE_IDS } from './chessUpgrades';

afterEach(() => resetLocaleForTests());

const labels = (spec: GamePanelSpec): string[] => spec.buttons.map((b) => b.label);
/** The key Enter presses, as GamePanel chooses it. */
const enterKey = (spec: GamePanelSpec): string | undefined =>
  (spec.buttons.find((b) => b.primary) ?? spec.buttons.find((b) => !b.choice))?.label;

const nothing = (): void => undefined;
const setupActions = {
  onLevel: nothing,
  onTwoPlayers: nothing,
  onPlayAs: nothing,
  onClock: nothing,
  onWorkshop: nothing,
  onBack: nothing,
};

describe('menus', () => {
  it('offers the four modes', () => {
    const picked = vi.fn();
    const spec = modesPanel(emptyProgress(), picked);
    expect(labels(spec)).toEqual(['CLASSIC', 'POWER-UP', 'UPGRADES', 'BLITZ']);
    spec.buttons.forEach((b) => b.onClick());
    expect(picked.mock.calls.map((c) => c[0])).toEqual([...MODES]);
  });

  it('offers three levels, two players and a colour, plus the clock or Workshop where they matter', () => {
    const classic = labels(setupPanel('classic', emptyProgress(), setupActions));
    expect(classic).toEqual(['EASY', 'MEDIUM', 'HARD', '2 PLAYERS', 'Play as: White ›', 'BACK']);
    expect(labels(setupPanel('blitz', emptyProgress(), setupActions))).toContain('Clock: 3 min + 2 s ›');
    expect(labels(setupPanel('upgrades', emptyProgress(), setupActions))).toContain('WORKSHOP');
  });

  it('presses the last level played on Enter', () => {
    expect(enterKey(setupPanel('classic', { ...emptyProgress(), level: 'hard' }, setupActions))).toBe('HARD');
  });

  it('never buys with Enter in the Workshop', () => {
    const buy = vi.fn();
    for (const piece of SHOP_PIECES) {
      const spec = shopPanel(
        { title: 'WORKSHOP', picks: [], points: 20, piece, message: '' },
        { onPiece: nothing, onBuy: buy, clear: { label: 'REFUND ALL', onClick: nothing }, done: { label: 'DONE', onClick: nothing } },
      );
      expect(enterKey(spec)).toBe('DONE');
    }
    expect(buy).not.toHaveBeenCalled();
  });

  it('sells all nine upgrades, one piece at a time, and marks what is owned', () => {
    const offered: string[] = [];
    for (const piece of SHOP_PIECES) {
      const spec = shopPanel(
        { title: 'T', picks: ['amazon'], points: 0, piece, message: '' },
        {
          onPiece: nothing,
          onBuy: (id) => offered.push(id),
          clear: { label: 'C', onClick: nothing },
          done: { label: 'D', onClick: nothing },
        },
      );
      spec.buttons.filter((b) => b.label.startsWith('Buy ') || b.label.endsWith('· bought')).forEach((b) => b.onClick());
      expect(labels(spec)).toContain('▸ ' + labels(spec).find((l) => l.startsWith('▸ '))!.slice(2));
    }
    expect(offered.sort()).toEqual([...UPGRADE_IDS].sort());
  });

  it('only offers Resign while a game is on', () => {
    const actions = { onResume: nothing, onNewGame: nothing, onModes: nothing };
    expect(labels(pausePanel(false, { ...actions, onResign: nothing }))).toContain('RESIGN');
    expect(labels(pausePanel(true, actions))).not.toContain('RESIGN');
    expect(enterKey(pausePanel(false, actions))).toBe('RESUME');
  });

  it('promotes to a queen on Enter, and can be cancelled', () => {
    const spec = promotePanel(nothing, nothing);
    expect(labels(spec)).toEqual(['Queen', 'Rook', 'Bishop', 'Knight', 'CANCEL']);
    expect(enterKey(spec)).toBe('Queen');
  });

  it('shows points only when there are some to show, and plays again on Enter', () => {
    const actions = { onAgain: nothing, onBoard: nothing, onWorkshop: nothing, onModes: nothing };
    const plain = overPanel({ title: 'DRAW', reason: 'x', workshop: false }, actions);
    expect(plain.result).toBeUndefined();
    expect(enterKey(plain)).toBe('PLAY AGAIN');
    const paid = overPanel({ title: 'W', reason: 'x', workshop: true, points: { earned: 7, total: 13 } }, actions);
    expect(paid.result).toContain('7');
    expect(labels(paid)).toContain('WORKSHOP');
  });
});

describe('help', () => {
  it('explains each power-up in Power-Up mode', () => {
    const text = helpPages('powerup', []).join('\n');
    for (const name of ['Shield', 'Freeze', 'Double Move', 'Teleport']) expect(text).toContain(`${name}:`);
  });

  it('explains the upgrades in play, and only those', () => {
    const text = helpPages('upgrades', [
      { who: 'You', ids: ['trot'] },
      { who: 'Computer', ids: ['tunnel'] },
    ]).join('\n');
    expect(text).toContain('Knight · Trot:');
    expect(text).toContain('Rook · Tunnel:');
    expect(text).not.toContain('Amazon:');
  });

  it.each(LOCALES)('is complete in %s', (locale) => {
    setLocale(locale);
    for (const mode of MODES) {
      for (const page of helpPages(mode, [{ who: 'A', ids: [...UPGRADE_IDS] }])) {
        expect(page.trim().length).toBeGreaterThan(0);
        expect(page).not.toMatch(/\{\w+\}/);
      }
    }
  });
});

describe('results', () => {
  it('speaks to the player against the computer, and names the winner with two players', () => {
    const win = { winner: 0 as const, reason: 'checkmate' as const };
    expect(endTitle(win, 0)).toBe('YOU WIN!');
    expect(endTitle(win, 1)).toBe('YOU LOSE');
    expect(endTitle(win, null)).toBe('WHITE WINS');
    expect(endTitle({ winner: null, reason: 'stalemate' }, 0)).toBe('DRAW');
    expect(endReason({ winner: 1, reason: 'resign' }, 0)).toBe('You resigned.');
    expect(endReason({ winner: null, reason: 'timeout-draw' }, null)).toContain('Time ran out');
  });
});
