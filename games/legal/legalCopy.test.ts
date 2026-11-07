import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../src/i18n';
import { legalChrome, privacyCopy, termsCopy } from './legalCopy';

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

describe('legal page copy', () => {
  it('translates the privacy and terms pages', () => {
    setLocale('es');
    const chrome = legalChrome();
    expect(chrome.games).toBe('← Juegos');
    expect(chrome.play).toBe('Jugar KANE');
    expect(chrome.privacy).toBe('Privacidad');

    const privacy = privacyCopy();
    expect(privacy.title).toContain('Privacidad');
    expect(privacy.note).toContain('adsEnabled=false');
    expect(privacy.body).toContain('localStorage');
    expect(privacy.body).not.toContain('this device');
    expect(privacy.points.join(' ')).toContain('Cassio');
    expect(privacy.points.join(' ')).not.toContain('No sale of personal data');

    const terms = termsCopy();
    expect(terms.title).toContain('Términos');
    expect(terms.note).toContain('13+');
    expect(terms.points.join(' ')).toContain('aspecto');
    expect(terms.points.join(' ')).not.toContain('pay-to-win');
  });
});
