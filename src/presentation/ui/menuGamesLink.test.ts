import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { MENU_GAMES_LINK_ID, menuGamesLinkCopy } from './menuGamesLink';

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

describe('menuGamesLink', () => {
  it('localizes the Games hub aria-label', () => {
    expect(menuGamesLinkCopy()).toEqual({
      text: '← Games',
      ariaLabel: 'Back to Games hub',
    });
    setLocale('es');
    expect(menuGamesLinkCopy().ariaLabel).toBe('Volver al selector de juegos');
    expect(menuGamesLinkCopy().text).toBe('← Juegos');
  });

  it('wires the menu DOM twin and MenuScene show/hide', () => {
    const ui = resolve(import.meta.dirname, 'menuGamesLink.ts');
    const scene = resolve(import.meta.dirname, '../scenes/MenuScene.ts');
    const mod = readFileSync(ui, 'utf8');
    const menu = readFileSync(scene, 'utf8');
    expect(mod).toContain(MENU_GAMES_LINK_ID);
    expect(mod).toContain("setAttribute('aria-label'");
    expect(mod).toContain('menu.gamesAria');
    expect(menu).toContain('showMenuGamesLink');
    expect(menu).toContain('hideMenuGamesLink');
  });
});
