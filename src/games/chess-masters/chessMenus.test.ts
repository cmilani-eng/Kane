/** The way from the mode menu to the first move, for every kind of game. */
import { describe, expect, it } from 'vitest';
import type { GamePanelSpec } from '../../presentation/ui/gamePanel';
import { ChessMenus, dealUpgrades, freshSetup, type GameSetup, type MenuHost } from './chessMenus';
import { emptyProgress, type Progress } from './chessStore';
import { costOf } from './chessUpgrades';

/** A stand-in for the scene: remembers the open box and what the menus asked for. */
function table(initial: Partial<Progress> = {}) {
  let progress: Progress = { ...emptyProgress(), ...initial };
  let open: GamePanelSpec | null = null;
  const started: GameSetup[] = [];
  const host: MenuHost = {
    progress: () => progress,
    remember: (change) => {
      progress = { ...progress, ...change };
    },
    open: (spec) => {
      open = spec;
    },
    start: (setup) => started.push(setup),
    sound: () => undefined,
    seed: () => 7,
  };
  const press = (label: string): void => {
    const button = open?.buttons.find((b) => b.label === label || b.label === `▸ ${label}`);
    if (!button) throw new Error(`No key "${label}" among: ${open?.buttons.map((b) => b.label).join(', ')}`);
    button.onClick();
  };
  return { menus: new ChessMenus(host), press, started, panel: () => open!, progress: () => progress };
}

describe('starting a game', () => {
  it.each([
    ['CLASSIC', 'classic'],
    ['POWER-UP', 'powerup'],
    ['BLITZ', 'blitz'],
  ])('%s against the computer starts straight away', (key, mode) => {
    const game = table();
    game.menus.modes();
    game.press(key);
    game.press('MEDIUM');
    expect(game.started).toEqual([{ mode, vsComputer: true, level: 'medium', human: 0, upgrades: [[], []] }]);
    expect(game.progress().level).toBe('medium');
  });

  it('remembers the colour and the clock', () => {
    const game = table();
    game.menus.modes();
    game.press('BLITZ');
    game.press('Play as: White ›');
    game.press('Clock: 3 min + 2 s ›');
    game.press('HARD');
    expect(game.progress()).toMatchObject({ playAs: 'black', blitz: '5+0' });
    expect(game.started[0]).toMatchObject({ human: 1, level: 'hard' });
  });

  it('starts a two-player game without asking for a level', () => {
    const game = table();
    game.menus.modes();
    game.press('CLASSIC');
    game.press('2 PLAYERS');
    expect(game.started[0]).toMatchObject({ vsComputer: false });
  });
});

describe('Upgrades', () => {
  it('shows what both sides bring before a game against the computer', () => {
    const game = table({ owned: ['longLeap'] });
    game.menus.modes();
    game.press('UPGRADES');
    game.press('HARD');
    expect(game.started).toEqual([]);
    expect(game.panel().copy).toContain('You: Long Leap');
    expect(game.panel().copy).toContain('Computer · Hard:');
    game.press('START');
    const [white, black] = game.started[0]!.upgrades;
    expect(white).toEqual(['longLeap']);
    expect(costOf(black)).toBe(costOf(white) + 5);
  });

  it('buys in the Workshop, keeps it, and refunds it', () => {
    const game = table({ points: 10 });
    game.menus.modes();
    game.press('UPGRADES');
    game.press('WORKSHOP');
    game.press('Queen');
    game.press('Buy Amazon');
    expect(game.progress()).toMatchObject({ owned: ['amazon'], points: 2 });
    game.press('REFUND ALL');
    expect(game.progress()).toMatchObject({ owned: [], points: 10 });
    game.press('DONE');
    expect(game.panel().title).toBe('WHO PLAYS?');
  });

  it('gives two players equal budgets, ignoring saved upgrades and points', () => {
    const game = table({ owned: ['amazon'], points: 99 });
    game.menus.modes();
    game.press('UPGRADES');
    game.press('2 PLAYERS');
    expect(game.panel().pill).toBe('10 points to spend');
    game.press('Queen');
    game.press('Buy Amazon');
    expect(game.panel().pill).toBe('2 points to spend');
    game.press('NEXT PLAYER');
    expect(game.panel().pill).toBe('10 points to spend');
    game.press('Knight');
    game.press('Buy Trot');
    game.press('Buy Long Leap');
    game.press('START GAME');
    game.press('START');
    expect(game.started[0]!.upgrades).toEqual([['amazon'], ['trot', 'longLeap']]);
    expect(game.progress()).toMatchObject({ owned: ['amazon'], points: 99 });
  });

  it('lets a player take a pick back', () => {
    const game = table();
    game.menus.modes();
    game.press('UPGRADES');
    game.press('2 PLAYERS');
    game.press('Buy Spearhead');
    game.press('Spearhead · bought');
    expect(game.panel().pill).toBe('10 points to spend');
  });

  it('matches the computer again on "play again", after more has been bought', () => {
    const game = table({ owned: ['longLeap', 'tunnel'] });
    const before = dealUpgrades({ ...freshSetup(), mode: 'upgrades', level: 'medium' }, ['longLeap'], 1);
    game.menus.again(before);
    game.press('START');
    const [white, black] = game.started[0]!.upgrades;
    expect(white).toEqual(['longLeap', 'tunnel']);
    expect(costOf(black)).toBe(costOf(white));
  });

  it('puts the computer on the other side when the player is Black', () => {
    const setup = dealUpgrades({ ...freshSetup(), level: 'medium', human: 1 }, ['vault'], 3);
    expect(setup.upgrades[1]).toEqual(['vault']);
    expect(costOf(setup.upgrades[0])).toBe(3);
  });

  it('plays any other game again with the same settings', () => {
    const game = table();
    const setup: GameSetup = { ...freshSetup(), mode: 'blitz', vsComputer: false };
    game.menus.again(setup);
    expect(game.started).toEqual([setup]);
  });
});
