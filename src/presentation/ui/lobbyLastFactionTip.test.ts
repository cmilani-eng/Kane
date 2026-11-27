import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { speciesCopy, setLocale, t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyFactionTipLine } from './lobbyPanel';

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

describe('lobbyLastFactionTipLine', () => {
  it('labels Last · name with middot, distinct from Favorite · / Played · / Last · duration / Last · Won / motto', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    const name = speciesCopy('brutes').name;
    const line = lobbyLastFactionTipLine();
    expect(line).toBe(t('lobby.lastFactionTip', { name }));
    expect(line).toBe('Last · The Brutes');
    expect(line).toMatch(/^Last \u00b7 /);
    expect(line).toContain(' \u00b7 ');

    // Distinct from Favorite · / Played · / selected motto tip.
    expect(line).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', { name }),
    );
    expect(lobbyFavoriteFactionTipLine()).toBe('Favorite · The Brutes');
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorite \u00b7 /);
    expect(line).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 3 }));
    expect(lobbyGamesPlayedTipLine()).toBe('Played · 3');
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Played \u00b7 /);
    expect(line).not.toBe(lobbyFactionTipLine());
    expect(lobbyFactionTipLine()).toMatch(/ · /);

    // Distinct from same-prefix Last · duration / Last · Won peers.
    expect(line).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(70_000) }),
    );
    expect(lobbyLastDurationTipLine()).toBe('Last · 1:10');
    expect(lobbyLastDurationTipLine()).toMatch(/^Last \u00b7 /);
    expect(line).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toBe('Last · Won');
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Last \u00b7 Won$/);
  });

  it('tracks the latest remembered species, distinct from Favorite ·', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);
    // Last remembered species is brutes; favorite is also brutes (2 plays).
    expect(lobbyLastFactionTipLine()).toBe('Last · The Brutes');
    expect(lobbyFavoriteFactionTipLine()).toBe('Favorite · The Brutes');
    expect(lobbyLastFactionTipLine()).not.toBe(lobbyFavoriteFactionTipLine());

    // Rematch prefs without outcome still update last faction.
    rememberMatchPrefs('weirdos', 'normal', 'crossing');
    expect(lobbyLastFactionTipLine()).toBe(
      t('lobby.lastFactionTip', { name: speciesCopy('weirdos').name }),
    );
    expect(lobbyLastFactionTipLine()).toBe('Last · The Weirdos');
    expect(lobbyLastFactionTipLine()).toMatch(/^Last \u00b7 /);
    // Favorite stays on most-played (brutes).
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', {
        name: speciesCopy('brutes').name,
      }),
    );
    expect(lobbyFavoriteFactionTipLine()).toBe('Favorite · The Brutes');
  });

  it('localizes Last · name middot for pt-BR and es; stays distinct from Favorite / Played / Last peers / motto', () => {
    rememberMatchPrefs('nobles', 'normal', 'crossing', 90_000, true);
    rememberMatchPrefs('brutes', 'easy', 'ridge', 60_000, false);
    rememberMatchPrefs('brutes', 'hard', 'gap', 70_000, true);

    setLocale('pt-BR');
    const ptName = speciesCopy('brutes').name;
    const pt = lobbyLastFactionTipLine();
    expect(pt).toBe(t('lobby.lastFactionTip', { name: ptName }));
    expect(pt).toBe('Última · Os Brutos');
    expect(pt).toMatch(/^Última \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', { name: ptName }),
    );
    expect(lobbyFavoriteFactionTipLine()).toBe('Favorita · Os Brutos');
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorita \u00b7 /);
    expect(pt).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 3 }));
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jogadas \u00b7 /);
    expect(pt).not.toBe(lobbyFactionTipLine());
    expect(pt).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(70_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(pt).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Última \u00b7 /);

    setLocale('es');
    const esName = speciesCopy('brutes').name;
    const es = lobbyLastFactionTipLine();
    expect(es).toBe(t('lobby.lastFactionTip', { name: esName }));
    expect(es).toBe('Última · Los Brutos');
    expect(es).toMatch(/^Última \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(lobbyFavoriteFactionTipLine());
    expect(lobbyFavoriteFactionTipLine()).toBe(
      t('lobby.favoriteFactionTip', { name: esName }),
    );
    expect(lobbyFavoriteFactionTipLine()).toBe('Favorita · Los Brutos');
    expect(lobbyFavoriteFactionTipLine()).toMatch(/^Favorita \u00b7 /);
    expect(es).not.toBe(lobbyGamesPlayedTipLine());
    expect(lobbyGamesPlayedTipLine()).toBe(t('lobby.gamesPlayedTip', { n: 3 }));
    expect(lobbyGamesPlayedTipLine()).toMatch(/^Jugadas \u00b7 /);
    expect(es).not.toBe(lobbyFactionTipLine());
    expect(es).not.toBe(lobbyLastDurationTipLine());
    expect(lobbyLastDurationTipLine()).toBe(
      t('lobby.lastDurationTip', { clock: formatMatchClock(70_000) }),
    );
    expect(lobbyLastDurationTipLine()).toMatch(/^Última \u00b7 /);
    expect(es).not.toBe(lobbyLastOutcomeTipLine());
    expect(lobbyLastOutcomeTipLine()).toBe(t('lobby.lastOutcomeWin'));
    expect(lobbyLastOutcomeTipLine()).toMatch(/^Última \u00b7 /);
    setLocale('en-GB');
  });
});
