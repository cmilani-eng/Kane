import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../src/i18n';
import { hubBlurb, hubChrome } from './hubCopy';

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

describe('hub copy', () => {
  it('translates the picker and leaves an unknown blurb as written', () => {
    setLocale('es');
    const chrome = hubChrome();
    expect(chrome.title).toBe('Juegos');
    expect(chrome.documentTitle).toBe('KANE · Selector de juegos');
    expect(chrome.meta).toBe('KANE · Selector de juegos — RTS de fantasía y más.');
    expect(chrome.play).toBe('Jugar');
    expect(chrome.subtitle).toContain('Enter');
    expect(chrome.live).toBe('En vivo');
    expect(chrome.experimental).toBe('Prelanzamiento');
    expect(chrome.privacy).toBe('Privacidad');
    expect(hubBlurb('kane', 'English fallback')).toContain('especie');
    expect(hubBlurb('kane', 'English fallback')).not.toContain('Pick a species');
    expect(hubBlurb('blob-evolution', 'English fallback')).toContain('Ángel');
    expect(hubBlurb('later', 'Keep this')).toBe('Keep this');
  });
});
