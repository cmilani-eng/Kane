import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { difficultyCopy, setLocale, t } from '../../i18n';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';
import { lobbyLastDifficultyTipLine } from './lobbyLastDifficultyTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyDifficultyTipLine } from './lobbyPanel';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  setLocale('en-GB');
});

describe('lobbyLastDifficultyTipLine', () => {
  it('labels Last difficulty · label with middot, distinct from selected blurb / pause blurb / end Difficulty · / Last · faction', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');
    const label = difficultyCopy('hard').label;
    const tip = lobbyLastDifficultyTipLine();
    expect(tip).toBe(t('lobby.lastDifficultyTip', { label }));
    expect(tip).toBe('Last difficulty · Hard');
    expect(tip).toMatch(/^Last difficulty \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(label);

    // Distinct from selected difficulty label · blurb.
    expect(tip).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toBe(
      t('lobby.difficultyTip', {
        label,
        blurb: difficultyCopy('hard').blurb,
      }),
    );
    expect(lobbyDifficultyTipLine()).toBe('Hard · Fast eco · early aggression');
    expect(lobbyDifficultyTipLine()).toMatch(/ \u00b7 /);
    expect(lobbyDifficultyTipLine()).toContain(difficultyCopy('hard').blurb);

    // Same selected-blurb shape on pause; distinct key/surface.
    expect(tip).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toBe(
      t('pause.difficultyTip', {
        label,
        blurb: difficultyCopy('hard').blurb,
      }),
    );
    expect(pauseDifficultyTipLine('hard')).toBe(
      'Hard · Fast eco · early aggression',
    );
    expect(t('lobby.difficultyTip', {
      label,
      blurb: difficultyCopy('hard').blurb,
    })).toBe(
      t('pause.difficultyTip', {
        label,
        blurb: difficultyCopy('hard').blurb,
      }),
    );

    // End Difficulty · tip (same label payload, different prefix); distinct key/surface.
    expect(tip).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toBe('Difficulty · Hard');
    expect(endDifficultyPlayedTipLine('hard')).toMatch(/^Difficulty \u00b7 /);
    expect(endDifficultyPlayedTipLine('hard')).toContain(label);

    // Distinct from Last · faction same-prefix peer.
    expect(tip).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    expect(tip).not.toMatch(/^Last \u00b7 /);
  });

  it('tracks the latest remembered difficulty', () => {
    rememberMatchPrefs('nobles', 'easy', 'ridge');
    expect(lobbyLastDifficultyTipLine()).toBe('Last difficulty · Easy');
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Last difficulty \u00b7 /);

    rememberMatchPrefs('brutes', 'normal', 'gap');
    expect(lobbyLastDifficultyTipLine()).toBe(
      t('lobby.lastDifficultyTip', {
        label: difficultyCopy('normal').label,
      }),
    );
    expect(lobbyLastDifficultyTipLine()).toBe('Last difficulty · Normal');
    expect(lobbyLastDifficultyTipLine()).toMatch(/^Last difficulty \u00b7 /);
  });

  it('localizes Last difficulty · label middot for pt-BR and es; stays distinct from blurb / end / Last · faction', () => {
    rememberMatchPrefs('weirdos', 'hard', 'crossing');

    setLocale('pt-BR');
    const ptLabel = difficultyCopy('hard').label;
    const pt = lobbyLastDifficultyTipLine();
    expect(pt).toBe(t('lobby.lastDifficultyTip', { label: ptLabel }));
    expect(pt).toBe('Última dificuldade · Difícil');
    expect(pt).toMatch(/^Última dificuldade \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toBe(
      t('lobby.difficultyTip', {
        label: ptLabel,
        blurb: difficultyCopy('hard').blurb,
      }),
    );
    expect(lobbyDifficultyTipLine()).toMatch(/ \u00b7 /);
    expect(lobbyDifficultyTipLine()).toContain(difficultyCopy('hard').blurb);
    expect(pt).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pt).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label: ptLabel }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toBe('Dificuldade · Difícil');
    expect(endDifficultyPlayedTipLine('hard')).toMatch(/^Dificuldade \u00b7 /);
    expect(pt).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);

    setLocale('es');
    const esLabel = difficultyCopy('hard').label;
    const es = lobbyLastDifficultyTipLine();
    expect(es).toBe(t('lobby.lastDifficultyTip', { label: esLabel }));
    expect(es).toBe('Última dificultad · Difícil');
    expect(es).toMatch(/^Última dificultad \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(lobbyDifficultyTipLine());
    expect(lobbyDifficultyTipLine()).toBe(
      t('lobby.difficultyTip', {
        label: esLabel,
        blurb: difficultyCopy('hard').blurb,
      }),
    );
    expect(lobbyDifficultyTipLine()).toMatch(/ \u00b7 /);
    expect(lobbyDifficultyTipLine()).toContain(difficultyCopy('hard').blurb);
    expect(es).not.toBe(pauseDifficultyTipLine('hard'));
    expect(es).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe(
      t('end.difficultyTip', { label: esLabel }),
    );
    expect(endDifficultyPlayedTipLine('hard')).toBe('Dificultad · Difícil');
    expect(endDifficultyPlayedTipLine('hard')).toMatch(/^Dificultad \u00b7 /);
    expect(es).not.toBe(lobbyLastFactionTipLine());
    expect(lobbyLastFactionTipLine()).toMatch(/^Última \u00b7 /);
    setLocale('en-GB');
  });
});
