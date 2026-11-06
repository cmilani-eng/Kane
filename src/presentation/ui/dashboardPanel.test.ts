import { beforeEach, describe, expect, it } from 'vitest';
import { emptyStatsOverview } from '../../firebase/types';
import { resetLocaleForTests, setLocale } from '../../i18n';
import {
  accountLoadErrorText,
  accountMatchesText,
  accountOverviewText,
  accountProfileText,
  accountShownName,
} from './dashboardPanel';

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
  resetLocaleForTests();
});

describe('account copy', () => {
  it('translates the empty cloud record and a match line', () => {
    setLocale('es');
    const overview = accountOverviewText(emptyStatsOverview());
    expect(overview).toContain('Por especie');
    expect(overview).toContain('Los Brutos');
    expect(overview).not.toContain('The Brutes');

    const empty = accountMatchesText([]);
    expect(empty).toContain('Partidas recientes');
    expect(empty).toContain('nube');
    expect(empty).not.toContain('Recent matches');

    const played = accountMatchesText([
      {
        won: true,
        species: 'brutes',
        difficulty: 'hard',
        durationMs: 65_000,
      },
    ]);
    expect(played).toContain('Victoria');
    expect(played).toContain('Los Brutos');
    expect(played).toContain('Difícil');
    expect(played).toContain('1:05');
    expect(played).not.toContain('1m 5s');
    expect(played).not.toContain('Win');
  });

  it('formats recent match duration as mm:ss', () => {
    setLocale('en-GB');
    const played = accountMatchesText([
      {
        won: false,
        species: 'nobles',
        difficulty: 'normal',
        durationMs: 125_000,
      },
    ]);
    expect(played).toContain('2:05');
    expect(played).not.toContain('2m');
  });

  it('translates the profile and the load failure', () => {
    setLocale('es');
    expect(accountShownName('Guest', true)).toBe('Invitado (anónimo)');
    const profile = accountProfileText({
      name: 'Ada',
      anonymous: false,
      email: 'ada@example.com',
      species: 'weirdos',
      difficulty: 'hard',
      mapId: 'ridge',
      skins: {
        brutes: 'skin_brutes_scrap',
        nobles: 'skin_default',
        weirdos: 'skin_weirdos_prism',
      },
    });
    expect(profile).toContain('Comandante  ·  Ada');
    expect(profile).toContain('ada@example.com');
    expect(profile).toContain('Los Raros');
    expect(profile).toContain('Difícil');
    expect(profile).toContain('Cresta');
    expect(profile).toMatch(/Cresta · /);
    expect(profile).toContain('Aspectos');
    expect(profile).not.toContain('Prefs');

    const failed = accountLoadErrorText({
      name: 'Ada',
      anonymous: false,
      email: 'ada@example.com',
    });
    expect(failed).toContain('No se pudieron cargar');
    expect(failed).not.toContain('Could not load');
  });
});
