import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { lobbyStatusLine } from './lobbyPanel';

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

describe('lobby status copy', () => {
  it('translates the join line and keeps the code', () => {
    setLocale('es');
    const line = lobbyStatusLine('joining', 'KANE01');
    expect(line).toContain('KANE01');
    expect(line).toContain('Uniéndote');
    expect(line).not.toContain('Joining');
    expect(lobbyStatusLine('blocked', null)).toBe('El código es demasiado corto');
  });
});
