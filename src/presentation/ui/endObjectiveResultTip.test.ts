import { beforeEach, describe, expect, it } from 'vitest';
import { difficultyCopy, mapCopy, setLocale, t } from '../../i18n';
import { endDifficultyPlayedTipLine } from './endDifficultyPlayedTip';
import {
  endObjectiveResultText,
  endObjectiveResultTipLine,
} from './endObjectiveResultTip';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { formatMatchClock } from './matchClock';
import {
  missionObjectiveText,
  missionStateForDifficulty,
  pauseObjectiveTipLine,
} from './missionObjective';

beforeEach(() => {
  setLocale('en-GB');
});

describe('endObjectiveResultTipLine', () => {
  it('labels Objective · text with middot, distinct from pause Objective · / Difficulty · / Map · / meta', () => {
    expect(endObjectiveResultText(true, 'keep')).toBe(
      t('end.objectiveResult.keep.win'),
    );
    expect(endObjectiveResultText(true, 'keep')).toBe(
      'Won · Enemy Keep destroyed',
    );

    const tip = endObjectiveResultTipLine(true, 'keep');
    expect(tip).toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.keep.win'),
      }),
    );
    expect(tip).toBe('Objective · Won · Enemy Keep destroyed');
    expect(tip).toMatch(/^Objective \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).not.toMatch(/ {2}/);
    expect(tip).toContain(t('end.objectiveResult.keep.win'));

    // CORE / wipe outcomes also use Objective · middot.
    expect(endObjectiveResultTipLine(true, 'core_hold')).toBe(
      'Objective · Won · CORE held',
    );
    expect(endObjectiveResultTipLine(true, 'core_hold')).toMatch(
      /^Objective \u00b7 /,
    );
    expect(endObjectiveResultTipLine(false, 'wipe')).toBe(
      'Objective · Lost · Army wiped',
    );
    expect(endObjectiveResultTipLine(false, 'wipe')).toMatch(
      /^Objective \u00b7 /,
    );
    expect(endObjectiveResultTipLine(true, null)).toBeNull();

    // Same Objective · template as pause tip; distinct key/surface + body.
    const pauseTip = pauseObjectiveTipLine(
      missionStateForDifficulty('normal'),
    );
    expect(pauseTip).toBe(
      t('pause.objectiveTip', {
        text: missionObjectiveText(missionStateForDifficulty('normal')),
      }),
    );
    expect(pauseTip).toBe('Objective · Destroy enemy Keep or hold CORE');
    expect(pauseTip).toMatch(/^Objective \u00b7 /);
    expect(tip).not.toBe(pauseTip);
    expect(t('end.objectiveTip', { text: t('end.objectiveResult.keep.win') })).not.toBe(
      t('pause.objectiveTip', {
        text: missionObjectiveText(missionStateForDifficulty('normal')),
      }),
    );

    // Distinct from Difficulty · / Map · / meta line.
    expect(tip).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toBe('Difficulty · Hard');
    expect(endDifficultyPlayedTipLine('hard')).toMatch(/^Difficulty \u00b7 /);
    expect(tip).not.toBe(endMapPlayedTipLine('crossing'));
    expect(endMapPlayedTipLine('crossing')).toBe('Map · Crossing');
    expect(endMapPlayedTipLine('crossing')).toMatch(/^Map \u00b7 /);
    const meta = t('end.meta', {
      map: mapCopy('crossing').label,
      difficulty: difficultyCopy('hard').label,
      clock: formatMatchClock(125_000),
    });
    expect(tip).not.toBe(meta);
    expect(meta).toContain('  ·  ');

    expect(tip).not.toMatch(/^Difficulty \u00b7 /);
    expect(tip).not.toMatch(/^Map \u00b7 /);
    expect(tip).not.toContain('  ·  ');
  });

  it('localizes Objective middot for pt-BR and es; stays distinct from pause / Difficulty / Map / meta', () => {
    setLocale('pt-BR');
    const pt = endObjectiveResultTipLine(true, 'keep');
    expect(pt).toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.keep.win'),
      }),
    );
    expect(pt).toBe('Objetivo · Vitória · Keep inimigo destruído');
    expect(pt).toMatch(/^Objetivo \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toMatch(/ {2}/);
    expect(endObjectiveResultTipLine(true, 'core_hold')).toBe(
      'Objetivo · Vitória · CORE segurado',
    );
    expect(endObjectiveResultTipLine(false, 'wipe')).toBe(
      'Objetivo · Derrota · Exército eliminado',
    );
    expect(pt).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    );
    expect(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    ).toMatch(/^Objetivo \u00b7 /);
    expect(pt).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toMatch(/^Dificuldade \u00b7 /);
    expect(pt).not.toBe(endMapPlayedTipLine('crossing'));
    expect(endMapPlayedTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toBe(
      t('end.meta', {
        map: mapCopy('crossing').label,
        difficulty: difficultyCopy('hard').label,
        clock: formatMatchClock(125_000),
      }),
    );
    expect(pt).not.toMatch(/^Dificuldade \u00b7 /);
    expect(pt).not.toMatch(/^Mapa \u00b7 /);
    expect(pt).not.toContain('  ·  ');

    setLocale('es');
    const es = endObjectiveResultTipLine(true, 'keep');
    expect(es).toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.keep.win'),
      }),
    );
    expect(es).toBe('Objetivo · Victoria · Keep enemigo destruido');
    expect(es).toMatch(/^Objetivo \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toMatch(/ {2}/);
    expect(endObjectiveResultTipLine(true, 'core_hold')).toBe(
      'Objetivo · Victoria · CORE retenido',
    );
    expect(endObjectiveResultTipLine(false, 'wipe')).toBe(
      'Objetivo · Derrota · Ejército eliminado',
    );
    expect(es).not.toBe(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    );
    expect(
      pauseObjectiveTipLine(missionStateForDifficulty('normal')),
    ).toMatch(/^Objetivo \u00b7 /);
    expect(es).not.toBe(endDifficultyPlayedTipLine('hard'));
    expect(endDifficultyPlayedTipLine('hard')).toMatch(/^Dificultad \u00b7 /);
    expect(es).not.toBe(endMapPlayedTipLine('crossing'));
    expect(endMapPlayedTipLine('crossing')).toMatch(/^Mapa \u00b7 /);
    expect(es).not.toBe(
      t('end.meta', {
        map: mapCopy('crossing').label,
        difficulty: difficultyCopy('hard').label,
        clock: formatMatchClock(125_000),
      }),
    );
    expect(es).not.toMatch(/^Dificultad \u00b7 /);
    expect(es).not.toMatch(/^Mapa \u00b7 /);
    expect(es).not.toContain('  ·  ');
    setLocale('en-GB');
  });
});
