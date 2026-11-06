import { describe, expect, it } from 'vitest';
import { setLocale } from '../../i18n';
import { createBattlefieldWorld } from './battlefieldWorld';
import {
  advanceTutorial,
  createTutorialState,
  tickTutorial,
  tutorialStepLabel,
  tutorialTip,
} from './battlefieldTutorial';

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
