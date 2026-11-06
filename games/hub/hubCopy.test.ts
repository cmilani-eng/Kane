import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale, t } from '../../src/i18n';
import { hubBlurb, hubChrome, hubFooterYear } from './hubCopy';

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
    expect(chrome.year).toMatch(/^© \d{4}$/);
    expect(hubBlurb('kane', 'English fallback')).toContain('especie');
    expect(hubBlurb('kane', 'English fallback')).not.toContain('Pick a species');
    expect(hubBlurb('blob-evolution', 'English fallback')).toContain('Ángel');
    expect(hubBlurb('later', 'Keep this')).toBe('Keep this');
  });

  it('formats the hub footer year from the calendar year', () => {
    expect(hubFooterYear(2026)).toBe('© 2026');
    expect(hubFooterYear(2031)).toBe('© 2031');
  });

  it('localizes the Live badge accessible label', () => {
    expect(t('hub.liveAria')).toBe('Status: Live');
    setLocale('pt-BR');
    expect(t('hub.liveAria')).toBe('Estado: Ao vivo');
  });

  it('localizes the Soft launch badge accessible label', () => {
    expect(t('hub.experimentalAria')).toBe('Status: Soft launch');
    setLocale('es');
    expect(t('hub.experimentalAria')).toBe('Estado: Prelanzamiento');
  });
});
