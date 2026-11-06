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
    const copy = controlsHelpCopy();
    expect(copy.title).toBe('Controles');
    expect(copy.gotIt).toBe('Entendido');
    expect(copy.body).toContain('Alto');
    expect(copy.body).toContain('Botón Atq');
    expect(copy.body).toContain('>A<');
    expect(copy.body).toContain('Q / W / E');
    expect(copy.body).not.toContain('Stop chip');
    expect(copy.body).toContain('Héroe y especie');
  });
});
