import { beforeEach, describe, expect, it } from 'vitest';
import { difficultyCopy, mapCopy, setLocale, speciesName, t } from '../../i18n';
import { endObjectiveResultTipLine } from './endObjectiveResultTip';
import {
  missionObjectiveText,
  missionStateForDifficulty,
  pauseObjectiveTipLine,
  resolveMissionObjective,
} from './missionObjective';
import { pauseDifficultyTipLine } from './pauseDifficultyTip';
import { pauseMapTipLine } from './pauseMapTip';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('missionObjective', () => {
  it('resolves practice vs skirmish objective ids', () => {
    expect(resolveMissionObjective('practice')).toBe('practice_destroy');
    expect(resolveMissionObjective('hard')).toBe('destroy_or_core');
  });

  it('labels Objective · text with middot, distinct from end Objective · / Difficulty · / Map · / motto / setup', () => {
    const state = missionStateForDifficulty('normal');
    const text = missionObjectiveText(state);
    expect(text).toBe(t('mission.objective.destroy_or_core'));
    expect(text).toBe('Destroy enemy Keep or hold CORE');

    const tip = pauseObjectiveTipLine(state);
    expect(tip).toBe(t('pause.objectiveTip', { text }));
    expect(tip).toBe('Objective · Destroy enemy Keep or hold CORE');
    expect(tip).toMatch(/^Objective \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain(text);

    // Practice destroy-base objective also uses Objective · middot.
    const practice = missionStateForDifficulty('practice');
    expect(missionObjectiveText(practice)).toBe(
      t('mission.objective.practice_destroy'),
    );
    expect(missionObjectiveText(practice)).toBe('Destroy the enemy base');
    expect(pauseObjectiveTipLine(practice)).toBe(
      'Objective · Destroy the enemy base',
    );
    expect(pauseObjectiveTipLine(practice)).toMatch(/^Objective \u00b7 /);

    // Same Objective · template as end result tip; distinct key/surface + body.
    const endTip = endObjectiveResultTipLine(true, 'core_hold');
    expect(endTip).toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.core_hold.win'),
      }),
    );
    expect(endTip).toBe('Objective · Won · CORE held');
    expect(endTip).toMatch(/^Objective \u00b7 /);
    expect(tip).not.toBe(endTip);
    expect(t('pause.objectiveTip', { text })).not.toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.core_hold.win'),
      }),
    );

    // Distinct from sibling pause chrome tips and setup line.
    const d = difficultyCopy('hard');
    expect(tip).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toBe(
      t('pause.difficultyTip', { label: d.label, blurb: d.blurb }),
    );
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Hard \u00b7 /);
    expect(tip).not.toBe(pauseMapTipLine('crossing'));
    expect(pauseMapTipLine('crossing')).toMatch(/^Map \u00b7 /);
    expect(tip).not.toBe(pauseSpeciesMottoTipLine('weirdos'));
    expect(pauseSpeciesMottoTipLine('weirdos')).toMatch(/ \u00b7 /);

    const setup = t('pause.setup', {
      species: speciesName('weirdos'),
      map: mapCopy('crossing').label,
      difficulty: d.label,
    });
    expect(tip).not.toBe(setup);
    expect(setup).toContain('  ·  ');

    expect(tip).not.toMatch(/^Hard \u00b7 /);
    expect(tip).not.toMatch(/^Map \u00b7 /);
    expect(tip).not.toContain('  ·  ');
  });

  it('localizes Objective middot for pt-BR and es; stays distinct from end / Difficulty / Map / motto', () => {
    const state = missionStateForDifficulty('hard');

    setLocale('pt-BR');
    const ptText = missionObjectiveText(state);
    expect(ptText).toBe(t('mission.objective.destroy_or_core'));
    expect(ptText).toBe('Destrua o Keep inimigo ou segure o CORE');
    const pt = pauseObjectiveTipLine(state);
    expect(pt).toBe(t('pause.objectiveTip', { text: ptText }));
    expect(pt).toBe('Objetivo · Destrua o Keep inimigo ou segure o CORE');
    expect(pt).toMatch(/^Objetivo \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pauseObjectiveTipLine(missionStateForDifficulty('practice'))).toBe(
      'Objetivo · Destrua a base inimiga',
    );
    expect(pt).not.toBe(endObjectiveResultTipLine(true, 'core_hold'));
    expect(endObjectiveResultTipLine(true, 'core_hold')).toMatch(
      /^Objetivo \u00b7 /,
    );
    expect(pt).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Difícil \u00b7 /);
    expect(pt).not.toBe(pauseMapTipLine('crossing'));
    expect(pauseMapTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(pauseSpeciesMottoTipLine('weirdos'));
    expect(pt).not.toMatch(/^Difícil \u00b7 /);
    expect(pt).not.toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toContain('  ·  ');

    setLocale('es');
    const esText = missionObjectiveText(state);
    expect(esText).toBe(t('mission.objective.destroy_or_core'));
    expect(esText).toBe('Destruye el Keep enemigo o retén el CORE');
    const es = pauseObjectiveTipLine(state);
    expect(es).toBe(t('pause.objectiveTip', { text: esText }));
    expect(es).toBe('Objetivo · Destruye el Keep enemigo o retén el CORE');
    expect(es).toMatch(/^Objetivo \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(pauseObjectiveTipLine(missionStateForDifficulty('practice'))).toBe(
      'Objetivo · Destruye la base enemiga',
    );
    expect(es).not.toBe(endObjectiveResultTipLine(true, 'core_hold'));
    expect(endObjectiveResultTipLine(true, 'core_hold')).toMatch(
      /^Objetivo \u00b7 /,
    );
    expect(es).not.toBe(pauseDifficultyTipLine('hard'));
    expect(pauseDifficultyTipLine('hard')).toMatch(/^Difícil \u00b7 /);
    expect(es).not.toBe(pauseMapTipLine('crossing'));
    expect(es).not.toMatch(/^Difícil \u00b7 /);
    expect(es).not.toMatch(/^Mapa \u00b7 /);
    expect(es).not.toContain('  ·  ');
    setLocale('en-GB');
  });
});
