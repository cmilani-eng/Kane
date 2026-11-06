import { describe, expect, it } from 'vitest';
import { difficultyCopy, setLocale } from '../../i18n';
import { createAiState, tickBattlefieldAi } from './battlefieldAi';
import { createBattlefieldWorld, spawnUnit } from './battlefieldWorld';

describe('practice difficulty', () => {
  it('never marches, even with a large garrison', () => {
    const world = createBattlefieldWorld('brutes', 'practice', 'crossing');
    const ai = createAiState('practice');
    for (let i = 0; i < 8; i++) {
      spawnUnit(world, {
        team: 'enemy',
        typeId: 'bonker',
        x: 200 + i * 12,
        y: 200,
        color: 0xff4400,
      });
    }
    for (let i = 0; i < 12; i++) tickBattlefieldAi(world, ai, 2000);
    const fighters = world.units.filter((u) => u.team === 'enemy' && !u.canGather);
    expect(fighters.length).toBeGreaterThanOrEqual(8);
    expect(fighters.every((u) => u.attackTargetId == null)).toBe(true);
    expect(ai.phase).not.toBe('attack');
  });

  it('still lets Normal march once the army is large enough', () => {
    const world = createBattlefieldWorld('brutes', 'normal', 'crossing');
    const ai = createAiState('normal');
    for (let i = 0; i < 8; i++) {
      spawnUnit(world, {
        team: 'enemy',
        typeId: 'bonker',
        x: 200 + i * 12,
        y: 200,
        color: 0xff4400,
      });
    }
    tickBattlefieldAi(world, ai, 2000);
    const fighters = world.units.filter((u) => u.team === 'enemy' && !u.canGather);
    expect(fighters.some((u) => u.attackTargetId != null)).toBe(true);
    expect(ai.phase).toBe('attack');
  });

  it('names Practice in each locale', () => {
    setLocale('en-GB');
    expect(difficultyCopy('practice').label).toBe('Practice');
    expect(difficultyCopy('practice').blurb).toContain('never attacks');
    setLocale('pt-BR');
    expect(difficultyCopy('practice').label).toBe('Treino');
    setLocale('es');
    expect(difficultyCopy('practice').label).toBe('Práctica');
    setLocale('en-GB');
  });
});
