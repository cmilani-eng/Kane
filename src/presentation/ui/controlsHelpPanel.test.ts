import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { controlsHelpCopy } from './controlsHelpPanel';

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

describe('controls help copy', () => {
  it('translates the actions and keeps the key caps', () => {
    setLocale('es');
    const copy = controlsHelpCopy('brutes');
    expect(copy.title).toBe('Controles');
    expect(copy.gotIt).toBe('Entendido');
    expect(copy.body).toContain('Alto');
    expect(copy.body).toContain('Botón Atq');
    expect(copy.body).toContain('>A<');
    expect(copy.body).toContain('Q / W / E');
    expect(copy.body).not.toContain('Stop chip');
    expect(copy.body).toContain('Héroe y especie');
  });

  it('lists only the current species stance hotkey', () => {
    const brutes = controlsHelpCopy('brutes');
    expect(brutes.body).toContain('>R<');
    expect(brutes.body).toMatch(/Rage|Fúria|Furia/);
    expect(brutes.body).not.toContain('>F<');
    expect(brutes.body).not.toContain('>M<');

    const nobles = controlsHelpCopy('nobles');
    expect(nobles.body).toContain('>F<');
    expect(nobles.body).not.toContain('>R<');
    expect(nobles.body).not.toContain('>M<');

    const weirdos = controlsHelpCopy('weirdos');
    expect(weirdos.body).toContain('>M<');
    expect(weirdos.body).not.toContain('>F<');
    expect(weirdos.body).not.toContain('>R<');
  });
});
