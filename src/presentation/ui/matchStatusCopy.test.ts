import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { coreHudModel, seedCoreFragments } from '../../gameplay/battlefield/battlefieldCoreFragments';
import { heroHudState } from '../../gameplay/battlefield/battlefieldHeroes';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { CORE_TONE_COLOR, formatCoreLine, formatHeroLine } from './matchStatusCopy';
import { memoryStorage } from '../../test/memoryStorage';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  resetLocaleForTests();
});

describe('CORE and hero status copy', () => {
  it('hides the CORE line until fragments exist, then reports tone without English', () => {
    const world = createBattlefieldWorld();
    world.coreFragments = [];
    expect(coreHudModel(world)).toBeNull();

    seedCoreFragments(world);
    const idle = coreHudModel(world);
    expect(idle?.tone).toBe('idle');
    expect(idle?.open).toBe(3);

    const first = world.coreFragments[0];
    if (!first) throw new Error('expected a fragment');
    first.captureTeam = 'player';
    first.captureProgress = 0.5;
    expect(coreHudModel(world)?.tone).toBe('capture');

    for (const fragment of world.coreFragments.slice(0, 2)) {
      fragment.owner = 'player';
      fragment.captureTeam = null;
      fragment.captureProgress = 0;
    }
    const win = coreHudModel(world);
    expect(win?.tone).toBe('win');
    expect(win?.clock).toBe('1:00');
  });

  it('formats the Spanish win line and the GRUK recruit hint', () => {
    setLocale('es');
    const world = createBattlefieldWorld('brutes');
    seedCoreFragments(world);
    for (const fragment of world.coreFragments.slice(0, 2)) {
      fragment.owner = 'player';
    }
    const model = coreHudModel(world);
    if (!model) throw new Error('expected a CORE model');
    const line = formatCoreLine(model);
    expect(line).toContain('Victoria');
    expect(line).not.toContain('Win hold');
    expect(CORE_TONE_COLOR.win).toBe('#f0c75e');

    const hero = formatHeroLine(heroHudState(world));
    expect(hero).toContain('GRUK');
    expect(hero).toContain('recluta');
  });
});
