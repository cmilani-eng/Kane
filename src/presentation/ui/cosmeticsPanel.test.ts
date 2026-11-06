import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { cosmeticsSkinCopy } from './cosmeticsPanel';

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

describe('cosmetics copy', () => {
  it('translates a skin name and blurb without changing the id', () => {
    setLocale('es');
    const copy = cosmeticsSkinCopy('skin_brutes_scrap');
    expect(copy.name).toBe('Desfile de Chatarra');
    expect(copy.blurb).toContain('Brutos');
    expect(copy.blurb).not.toContain('Junkyard');
    expect(cosmeticsSkinCopy('missing').name).toBe('missing');
  });
});
