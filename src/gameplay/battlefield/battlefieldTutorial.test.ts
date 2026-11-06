import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { createBattlefieldWorld } from './battlefieldWorld';
import {
  advanceTutorial,
  createTutorialState,
  tickTutorial,
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
    expect(tutorialStepLabel(state)).toBe('Tip 1/8');

    setLocale('pt-BR');
    expect(tutorialTip(state)).toContain('comandante');
    expect(tutorialStepLabel(state)).toBe('Dica 1/8');

    setLocale('es');
    expect(tutorialTip(state)).toContain('comandante');
    expect(tutorialStepLabel(state)).toBe('Consejo 1/8');
  });
});

describe('map coach tip', () => {
  it('names Crossing and Ridge and says Rematch keeps the map', () => {
    setLocale('en-GB');
    const state = createTutorialState();
    state.step = 'map';
    expect(tutorialTip(state, 'crossing')).toContain('Crossing');
    expect(tutorialTip(state, 'crossing')).toContain('Rematch keeps this map');
    expect(tutorialTip(state, 'ridge')).toContain('Ridge');
    expect(tutorialTip(state, 'ridge')).toContain('north-west');

    setLocale('pt-BR');
    expect(tutorialTip(state, 'ridge')).toContain('Cume');
    setLocale('es');
    expect(tutorialTip(state, 'crossing')).toContain('Cruce');
    setLocale('en-GB');
  });

  it('shows the map tip after welcome, then moves on', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'ridge');
    const state = createTutorialState();
    tickTutorial(world, state, 4501);
    expect(state.step).toBe('map');
    expect(tutorialStepLabel(state)).toBe('Tip 2/8');
    tickTutorial(world, state, 5501);
    expect(state.step).toBe('select');
  });

  it('advances from the map tip to select', () => {
    const state = createTutorialState();
    state.step = 'map';
    advanceTutorial(state);
    expect(state.step).toBe('select');
  });
});
