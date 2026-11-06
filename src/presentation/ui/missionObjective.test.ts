import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  missionObjectiveText,
  missionStateForDifficulty,
  pauseObjectiveTipLine,
  resolveMissionObjective,
} from './missionObjective';

describe('missionObjective', () => {
  it('resolves practice vs skirmish objective ids', () => {
    expect(resolveMissionObjective('practice')).toBe('practice_destroy');
    expect(resolveMissionObjective('hard')).toBe('destroy_or_core');
  });

  it('labels Objective · text from mission state', () => {
    const state = missionStateForDifficulty('normal');
    const text = missionObjectiveText(state);
    expect(text).toBe(t('mission.objective.destroy_or_core'));
    expect(pauseObjectiveTipLine(state)).toBe(
      t('pause.objectiveTip', { text }),
    );
    expect(pauseObjectiveTipLine(state)).toMatch(/^Objective/);
  });

  it('uses the practice destroy-base objective', () => {
    const state = missionStateForDifficulty('practice');
    expect(missionObjectiveText(state)).toBe(
      t('mission.objective.practice_destroy'),
    );
  });
});
