/** What the game says beside the board. */
import { describe, expect, it } from 'vitest';
import { createMatch, playAction } from './chessMatch';
import { freshSetup, type GameSetup } from './chessMenus';
import { noChoice } from './chessSelection';
import { freeze, move, position, sq } from './chessTestkit.testkit';
import { describeSquare, eventText, infoText, playerName, statusLines } from './chessText';

const solo: GameSetup = { ...freshSetup(), level: 'hard' };
const pair: GameSetup = { ...freshSetup(), vsComputer: false };

describe('names', () => {
  it('speaks to the player against the computer, and by colour with two players', () => {
    expect(playerName(solo, 0)).toBe('You');
    expect(playerName(solo, 1)).toBe('Computer · Hard');
    expect(playerName(pair, 1)).toBe('Black');
  });
});

describe('status', () => {
  const start = createMatch({ mode: 'classic' });

  it("says whose turn it is, and when the computer is thinking", () => {
    expect(statusLines(start, solo, noChoice(), true, '').headline).toBe('Your turn');
    expect(statusLines(start, solo, noChoice(), false, '').headline).toBe('Computer is thinking…');
    expect(statusLines(start, pair, noChoice(), true, '').headline).toBe('White to move');
  });

  it('announces check', () => {
    const match = createMatch({ mode: 'classic', position: position('4k3/8/8/8/8/8/8/K3R3 b - - 0 1') });
    expect(statusLines(match, pair, noChoice(), true, '')).toMatchObject({ headline: 'Check! Black to move', alert: true });
  });

  it('explains a failed tap ahead of the last event, and prompts while aiming', () => {
    const problem = { ...noChoice(), problem: 'chess.noMoves' as const };
    expect(statusLines(start, solo, problem, true, 'news').detail).toBe('That piece has no legal move.');
    expect(statusLines(start, solo, noChoice(), true, 'news').detail).toBe('news');
    const aiming = { ...noChoice(), power: { kind: 'teleport' as const, from: 8 } };
    expect(statusLines(start, solo, aiming, true, '').detail).toBe('Teleport: now tap a marked square.');
  });

  it('says when only a power-up can help', () => {
    const pos = position('6k1/8/8/8/8/8/6PP/4r2K w - - 0 1', { held: [{ freeze: 1 }, {}] });
    const match = createMatch({ mode: 'powerup', position: pos });
    expect(statusLines(match, solo, noChoice(), true, '').detail).toBe('Only a power-up can save the king.');
  });
});

describe('events and squares', () => {
  it('reports a power-up used and one collected', () => {
    const pos = position('4k3/8/8/2r5/8/8/8/R3K3 w - - 0 1', { held: [{ freeze: 1 }, {}], pickups: { a4: 'shield' } });
    const used = playAction(createMatch({ mode: 'powerup', position: pos }), freeze('c5'))!;
    expect(eventText(freeze('c5'), used.report, solo, 0)).toContain('You used Freeze on c5.');
    const got = playAction(createMatch({ mode: 'powerup', position: pos }), move('a1', 'a4'))!;
    expect(eventText(move('a1', 'a4'), got.report, solo, 0)).toContain('You collected: Shield');
    expect(eventText(move('a1', 'a4'), got.report, pair, 0)).toContain('White collected: Shield');
  });

  it('describes a piece with its upgrades and state, and a collectable', () => {
    const pos = position('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1', {
      upgrades: [['trot', 'longLeap'], []],
      shielded: ['b1'],
      pickups: { a4: 'double' },
    });
    const knight = describeSquare(pos, sq('b1'));
    for (const part of ['Knight · White', 'Trot:', 'Long Leap:', 'Shield: 2']) expect(knight).toContain(part);
    expect(describeSquare(pos, sq('a4'))).toContain('Double Move:');
    expect(describeSquare(pos, sq('d4'))).toBe('');
  });

  it('falls back to a hint for the mode on an empty square', () => {
    const match = createMatch({ mode: 'powerup' });
    expect(infoText(match, { square: sq('d4') }, 0)).toContain('glowing orb');
    expect(infoText(match, { power: 'shield' }, 0)).toContain('Shield:');
  });
});
