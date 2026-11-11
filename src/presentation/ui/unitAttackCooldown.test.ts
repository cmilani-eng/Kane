import { beforeEach, describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { setLocale, t } from '../../i18n';
import { unitAttackSpeedLabel } from './unitAttackSpeed';
import {
  attackCooldownSec,
  sharedUnitAttackCooldownLabel,
  unitAttackCooldown,
  unitAttackCooldownLabel,
} from './unitAttackCooldown';
import { unitDpsLabel } from './unitDps';
import { unitTrainDurationLabel } from './unitTrainDuration';

beforeEach(() => {
  setLocale('en-GB');
});

describe('unitAttackCooldown', () => {
  it('converts attack cooldown ms to seconds', () => {
    expect(attackCooldownSec(900)).toBe(0.9);
    expect(attackCooldownSec(1000)).toBe(1);
    expect(attackCooldownSec(0)).toBeNull();
  });

  it('labels Atk CD · ns with middot, distinct from Rate · / DPS · / hero Cooldown / Train ·', () => {
    const n = unitAttackCooldown('scavenger');
    expect(n).toBe(attackCooldownSec(getUnitType('scavenger').attackCooldownMs));
    const line = unitAttackCooldownLabel('scavenger')!;
    expect(line).toBe(t('sel.atkCdTip', { n: n! }));
    expect(line).toBe('Atk CD · 0.9s');
    expect(line).toMatch(/^Atk CD \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).not.toContain('  ·  ');
    expect(line).not.toMatch(/ {2}/);
    expect(line).toMatch(/0\.9s$/);

    // Distinct from Rate · n/s (attacks-per-second twin).
    expect(line).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(unitAttackSpeedLabel('scavenger')).toBe('Rate · 1.1/s');
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Rate \u00b7 /);
    expect(line).not.toMatch(/^Rate \u00b7 /);

    // Distinct from DPS · n.
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(unitDpsLabel('scavenger')).toMatch(/^DPS \u00b7 /);
    expect(line).not.toMatch(/^DPS \u00b7 /);

    // Distinct from hero ability Cooldown Ns (no Atk CD · prefix).
    expect(line).not.toBe(t('sel.cooldown', { n: n! }));
    expect(t('sel.cooldown', { n: n! })).toBe('Cooldown 0.9s');
    expect(t('sel.cooldown', { n: n! })).not.toContain(' \u00b7 ');

    // Distinct from Train · {n}s catalog twin (production vs attack interval).
    const train = unitTrainDurationLabel('scavenger');
    if (train != null) {
      expect(line).not.toBe(train);
      expect(train).toMatch(/^Train \u00b7 /);
    }
    expect(line).not.toMatch(/^Train \u00b7 /);

    expect(sharedUnitAttackCooldownLabel(['scavenger', 'scavenger'])).toBe(
      line,
    );
    expect(
      sharedUnitAttackCooldownLabel(['scavenger', 'tin_knight']),
    ).toBeNull();
    expect(sharedUnitAttackCooldownLabel([])).toBeNull();
  });

  it('localizes Atk CD middot for pt-BR and es; stays distinct from Rate · / DPS · / hero Cooldown / Train ·', () => {
    const n = unitAttackCooldown('scavenger')!;

    setLocale('pt-BR');
    const pt = unitAttackCooldownLabel('scavenger')!;
    expect(pt).toBe(t('sel.atkCdTip', { n }));
    expect(pt).toBe('CD atq. · 0.9s');
    expect(pt).toMatch(/^CD atq\. \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toContain('  ·  ');
    expect(pt).not.toMatch(/ {2}/);
    expect(pt).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(unitAttackSpeedLabel('scavenger')).toBe('Cadência · 1.1/s');
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Cadência \u00b7 /);
    expect(pt).not.toMatch(/^Cadência \u00b7 /);
    expect(pt).not.toBe(unitDpsLabel('scavenger'));
    expect(unitDpsLabel('scavenger')).toMatch(/^DPS \u00b7 /);
    expect(pt).not.toMatch(/^DPS \u00b7 /);
    expect(pt).not.toBe(t('sel.cooldown', { n }));
    expect(t('sel.cooldown', { n })).toBe('Recarga 0.9s');
    expect(t('sel.cooldown', { n })).not.toContain(' \u00b7 ');
    const ptTrain = unitTrainDurationLabel('scavenger');
    if (ptTrain != null) {
      expect(pt).not.toBe(ptTrain);
      expect(ptTrain).toMatch(/^Treino \u00b7 /);
    }
    expect(pt).not.toMatch(/^Treino \u00b7 /);

    setLocale('es');
    const es = unitAttackCooldownLabel('scavenger')!;
    expect(es).toBe(t('sel.atkCdTip', { n }));
    expect(es).toBe('CD atq. · 0.9s');
    expect(es).toMatch(/^CD atq\. \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toContain('  ·  ');
    expect(es).not.toMatch(/ {2}/);
    expect(es).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(unitAttackSpeedLabel('scavenger')).toBe('Cadencia · 1.1/s');
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Cadencia \u00b7 /);
    expect(es).not.toMatch(/^Cadencia \u00b7 /);
    expect(es).not.toBe(unitDpsLabel('scavenger'));
    expect(unitDpsLabel('scavenger')).toMatch(/^DPS \u00b7 /);
    expect(es).not.toMatch(/^DPS \u00b7 /);
    expect(es).not.toBe(t('sel.cooldown', { n }));
    expect(t('sel.cooldown', { n })).toBe('Enfriamiento 0.9s');
    expect(t('sel.cooldown', { n })).not.toContain(' \u00b7 ');
    const esTrain = unitTrainDurationLabel('scavenger');
    if (esTrain != null) {
      expect(es).not.toBe(esTrain);
      expect(esTrain).toMatch(/^Entreno \u00b7 /);
    }
    expect(es).not.toMatch(/^Entreno \u00b7 /);
    setLocale('en-GB');
  });
});
