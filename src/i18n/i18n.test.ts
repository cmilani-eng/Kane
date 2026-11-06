import { beforeEach, describe, expect, it } from 'vitest';
import {
  CATALOGS,
  getLocale,
  resetLocaleForTests,
  setLocale,
  subscribeLocale,
  t,
  translate,
} from './index';
import { enGB, type MessageKey } from './messages';

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

describe('catalogs', () => {
  const sourceKeys = Object.keys(enGB).sort();

  it('gives pt-BR and es every en-GB key and no extras', () => {
    expect(Object.keys(CATALOGS['pt-BR']).sort()).toEqual(sourceKeys);
    expect(Object.keys(CATALOGS.es).sort()).toEqual(sourceKeys);
  });

  it('has no empty strings', () => {
    for (const catalog of Object.values(CATALOGS)) {
      for (const value of Object.values(catalog)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('translates a shell string in each locale', () => {
    expect(translate('en-GB', 'pause.paused')).toBe('Paused');
    expect(translate('pt-BR', 'pause.paused')).toBe('Pausado');
    expect(translate('es', 'end.victory')).toBe('VICTORIA');
  });
});

describe('translate', () => {
  it('fills placeholders and leaves unknown ones in place', () => {
    expect(translate('en-GB', 'volume.label', { pct: 40 })).toBe('Volume  40%');
    expect(translate('es', 'end.victoryBody', { species: 'Los Nobles' })).toContain(
      'Los Nobles',
    );
    expect(translate('en-GB', 'volume.label', {})).toBe('Volume  {pct}%');
  });

  it('falls back to en-GB when a locale string is blank', () => {
    const key: MessageKey = 'menu.play';
    const table = CATALOGS['pt-BR'] as Record<MessageKey, string>;
    const original = table[key];
    table[key] = '';
    expect(translate('pt-BR', key)).toBe('Play');
    table[key] = original;
  });
});

describe('locale persistence', () => {
  it('defaults to en-GB and ignores an unknown stored value', () => {
    expect(getLocale()).toBe('en-GB');
    localStorage.setItem('kane.locale.v1', 'es-ES');
    expect(getLocale()).toBe('en-GB');
    expect(t('menu.play')).toBe('Play');
  });

  it('stores the choice and notifies subscribers once', () => {
    const seen: string[] = [];
    const stop = subscribeLocale(() => seen.push(getLocale()));
    setLocale('pt-BR');
    setLocale('pt-BR');
    expect(getLocale()).toBe('pt-BR');
    expect(localStorage.getItem('kane.locale.v1')).toBe('pt-BR');
    expect(t('menu.stats')).toBe('Placar');
    expect(seen).toEqual(['pt-BR']);
    stop();
    setLocale('es');
    expect(seen).toEqual(['pt-BR']);
    expect(t('menu.stats')).toBe('Marcas');
  });
});
