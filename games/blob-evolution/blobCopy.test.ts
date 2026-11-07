import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../src/i18n';
import {
  blobChain,
  blobEaten,
  blobHudLine,
  blobRpsTie,
  blobStageName,
} from './blobCopy';

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

describe('blob evolution copy', () => {
  it('translates stages, the chain, the HUD, and a tie', () => {
    setLocale('es');
    expect(blobStageName(5)).toBe('Ángel');
    expect(blobChain()).toContain('Arcoíris');
    expect(blobChain()).not.toContain('Rainbow');

    const hud = blobHudLine(1, 0.58, 3.05, 12);
    expect(hud.startsWith('BLOB EVOLUTION')).toBe(true);
    expect(hud).toContain('TAMAÑO');
    expect(hud).toContain('RIVALES: 12');
    expect(hud).not.toContain('SIZE');

    const tie = blobRpsTie('rock');
    expect(tie).toContain('Piedra');
    expect(tie).not.toContain('Both chose');

    expect(blobEaten().title).toContain('comieron');
  });
});
