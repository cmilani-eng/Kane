import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import {
  resetMatchSummaries,
  writeMatchSummary,
} from '../../database/matchSummary';
import { mapCopy, resetLocaleForTests, setLocale, t } from '../../i18n';
import {
  lobbyDifficultyTipLine,
  lobbyFactionTipLine,
  lobbyMapTipLine,
  lobbyMatchLengthTipLine,
  lobbySetupLine,
  lobbyStatusLine,
  type LobbyButtonLayout,
  lobbyButtonLayout,
} from './lobbyPanel';
import { memoryStorage } from '../../test/memoryStorage';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  resetLocaleForTests();
});

describe('lobby status copy', () => {
  it('translates the join line and keeps the code', () => {
    setLocale('es');
    const line = lobbyStatusLine('joining', 'KANE01');
    expect(line).toContain('KANE01');
    expect(line).toContain('Uniéndote');
    expect(line).not.toContain('Joining');
    expect(lobbyStatusLine('blocked', null, 'lobby.codeShort')).toBe('El código es demasiado corto');
    expect(lobbyStatusLine('blocked', null)).toBe('Sala no disponible.');
  });

  it('surfaces the selected skirmish map label · blurb tip', () => {
    rememberMatchPrefs('nobles', 'normal', 'ridge');
    setLocale('en-GB');
    const map = mapCopy('ridge');
    expect(lobbyMapTipLine()).toBe(
      t('lobby.mapTip', { label: map.label, blurb: map.blurb }),
    );
    expect(lobbyMapTipLine()).toBe('Ridge · Diagonal bases · shifted belt');
    expect(lobbyMapTipLine()).toMatch(/^Ridge \u00b7 /);
    expect(lobbyMapTipLine()).toContain(' \u00b7 ');
    setLocale('pt-BR');
    expect(lobbyMapTipLine()).toMatch(/^Cume \u00b7 /);
  });

  it('pairs species, map, and difficulty for lobby setup context', () => {
    rememberMatchPrefs('brutes', 'hard', 'gap');
    setLocale('en-GB');
    expect(lobbySetupLine()).toBe('The Brutes  ·  Gap  ·  Hard');
  });

  it('surfaces the selected faction motto as a blurb tip', () => {
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    setLocale('en-GB');
    const tip = lobbyFactionTipLine();
    expect(tip).toBe('The Weirdos · WE KNOW WHAT WE ARE DOING. PROBABLY.');
    expect(tip).toMatch(/^The Weirdos \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    setLocale('pt-BR');
    expect(lobbyFactionTipLine()).toMatch(/^Os Doidos \u00b7 /);
  });

  it('surfaces the selected difficulty label · blurb tip', () => {
    rememberMatchPrefs('nobles', 'easy', 'ridge');
    setLocale('en-GB');
    const tip = lobbyDifficultyTipLine();
    expect(tip).toBe('Easy · Newcomer cushion · slow AI eco');
    expect(tip).toMatch(/^Easy \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    setLocale('es');
    expect(lobbyDifficultyTipLine()).toMatch(/^Fácil \u00b7 /);
  });

  it('estimates match length from recent summaries, else a default tip', () => {
    setLocale('en-GB');
    resetMatchSummaries();
    expect(lobbyMatchLengthTipLine()).toContain('10');
    writeMatchSummary({
      id: 'm-a',
      version: 1,
      endedAtMs: 1,
      durationMs: 8 * 60_000,
      result: 'victory',
      won: true,
      species: 'brutes',
      difficulty: 'normal',
      playerUnitsLeft: 1,
      enemyUnitsLeft: 0,
      playerBuildingsLeft: 1,
      enemyBuildingsLeft: 0,
      sink: 'localStorage',
    });
    writeMatchSummary({
      id: 'm-b',
      version: 1,
      endedAtMs: 2,
      durationMs: 12 * 60_000,
      result: 'defeat',
      won: false,
      species: 'brutes',
      difficulty: 'normal',
      playerUnitsLeft: 0,
      enemyUnitsLeft: 1,
      playerBuildingsLeft: 0,
      enemyBuildingsLeft: 1,
      sink: 'localStorage',
    });
    expect(lobbyMatchLengthTipLine()).toContain('10');
  });
});


describe('lobby button layout', () => {
  const btnH = 38;
  const noteH = 28;

  /** Every button inside the row width and above the panel bottom, none overlapping, the note above them all. */
  function expectClear(
    { buttons, noteY }: LobbyButtonLayout,
    widths: readonly number[],
    cx: number,
    bottom: number,
    maxRowW: number,
  ): void {
    const boxes = buttons.map((b, i) => ({
      left: b.x - widths[i] / 2,
      right: b.x + widths[i] / 2,
      top: b.y - btnH / 2,
      bottom: b.y + btnH / 2,
    }));
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(cx - maxRowW / 2);
      expect(box.right).toBeLessThanOrEqual(cx + maxRowW / 2);
      expect(box.bottom).toBeLessThanOrEqual(bottom);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const apart = a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top;
        expect(apart).toBe(true);
      }
    }
    expect(noteY + noteH / 2).toBeLessThanOrEqual(Math.min(...boxes.map((b) => b.top)));
  }

  it('keeps pt-BR buttons on one row on a 390px phone, clear of a three-line status', () => {
    // 390×844 viewport: panelW 362, cy 422, bottom 612. Criar código / Entrar… / Sair.
    const widths = [114, 83, 58] as const;
    const layout = lobbyButtonLayout(195, 612, 330, widths, btnH, noteH);
    expectClear(layout, widths, 195, 612, 330);
    expect(new Set(layout.buttons.map((b) => b.y)).size).toBe(1);
    // Status starts at cy + 24; three 14px lines with 5px spacing end near cy + 85.
    expect(layout.noteY - noteH / 2).toBeGreaterThanOrEqual(422 + 85);
  });

  it('puts Create and Join over Leave when three do not fit', () => {
    // en-GB on a 360px phone: panelW 332, row limit 300.
    const widths = [113, 109, 72] as const;
    const layout = lobbyButtonLayout(180, 612, 300, widths, btnH, noteH);
    expectClear(layout, widths, 180, 612, 300);
    expect(layout.buttons[0].y).toBe(layout.buttons[1].y);
    expect(layout.buttons[2].y).toBeGreaterThan(layout.buttons[0].y);
  });

  it('stacks inside a short, narrow panel with the note above Create', () => {
    // en-GB at 280×480: short panel, panelW 256, bottom 472, row limit 224; the pair needs 234.
    const widths = [113, 109, 72] as const;
    const layout = lobbyButtonLayout(140, 472, 224, widths, btnH, noteH);
    expectClear(layout, widths, 140, 472, 224);
    expect(new Set(layout.buttons.map((b) => b.y)).size).toBe(3);
  });
});
