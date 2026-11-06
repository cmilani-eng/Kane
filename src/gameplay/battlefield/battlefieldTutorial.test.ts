import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import {
  createTutorialState,
  tutorialStepLabel,
  tutorialTip,
} from './battlefieldTutorial';

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

describe('tutorial copy', () => {
  it('follows the active locale', () => {
    const state = createTutorialState();
    expect(tutorialTip(state)).toContain('Hi commander');
    expect(tutorialStepLabel(state)).toBe('Tip 1/7');

    setLocale('pt-BR');
    expect(tutorialTip(state)).toContain('comandante');
    expect(tutorialStepLabel(state)).toBe('Dica 1/7');

    setLocale('es');
    expect(tutorialTip(state)).toContain('comandante');
    expect(tutorialStepLabel(state)).toBe('Consejo 1/7');
  });
});
