import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { unitAttackCooldownLabel } from './unitAttackCooldown';
import { unitAttackSpeedLabel } from './unitAttackSpeed';
import {
  moveCadenceBucket,
  sharedUnitMoveCadenceLabel,
  unitMoveCadence,
  unitMoveCadenceLabel,
} from './unitMoveCadence';
import { unitMoveSpeedLabel } from './unitMoveSpeed';

beforeEach(() => {
  setLocale('en-GB');
});

describe('unitMoveCadence', () => {
  it('buckets tiles/s into Slow / Medium / Fast', () => {
    expect(moveCadenceBucket(1.5)).toBe('slow');
    expect(moveCadenceBucket(2.4)).toBe('medium');
    expect(moveCadenceBucket(3.2)).toBe('fast');
    expect(moveCadenceBucket(null)).toBeNull();
  });

  it('labels Pace · bucket with middot, distinct from Speed · / Rate · / Atk CD ·', () => {
    expect(unitMoveCadence('stomper')).toBe('slow');
    expect(unitMoveCadence('scavenger')).toBe('medium');
    expect(unitMoveCadence('wolf_rider')).toBe('fast');

    const slow = unitMoveCadenceLabel('stomper');
    expect(slow).toBe(
      t('sel.moveCadenceTip', { pace: t('sel.moveCadence.slow') }),
    );
    expect(slow).toBe('Pace · Slow');
    expect(slow).toMatch(/^Pace \u00b7 /);
    expect(slow).toContain(' \u00b7 ');
    expect(slow).not.toContain('  ·  ');

    const medium = unitMoveCadenceLabel('scavenger');
    expect(medium).toBe(
      t('sel.moveCadenceTip', { pace: t('sel.moveCadence.medium') }),
    );
    expect(medium).toBe('Pace · Medium');
    expect(medium).toMatch(/^Pace \u00b7 /);
    expect(medium).toContain(' \u00b7 ');

    const fast = unitMoveCadenceLabel('wolf_rider');
    expect(fast).toBe(
      t('sel.moveCadenceTip', { pace: t('sel.moveCadence.fast') }),
    );
    expect(fast).toBe('Pace · Fast');
    expect(fast).toMatch(/^Pace \u00b7 /);
    expect(fast).toContain(' \u00b7 ');

    // Distinct from Speed · / Rate · / Atk CD · selection peers.
    expect(slow).not.toBe(unitMoveSpeedLabel('stomper'));
    expect(unitMoveSpeedLabel('stomper')).toBe('Speed · 1.3');
    expect(unitMoveSpeedLabel('stomper')).toMatch(/^Speed \u00b7 /);
    expect(slow).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(unitAttackSpeedLabel('scavenger')).toBe('Rate · 1.1/s');
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Rate \u00b7 /);
    expect(slow).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(unitAttackCooldownLabel('scavenger')).toBe('Atk CD · 0.9s');
    expect(unitAttackCooldownLabel('scavenger')).toMatch(/^Atk CD \u00b7 /);
    expect(slow).not.toMatch(/^Speed \u00b7 /);
    expect(slow).not.toMatch(/^Rate \u00b7 /);
    expect(slow).not.toMatch(/^Atk CD \u00b7 /);
    expect(medium).not.toMatch(/^Speed \u00b7 /);
    expect(fast).not.toMatch(/^Rate \u00b7 /);

    // Pace · variants stay mutually distinct.
    expect(slow).not.toBe(medium);
    expect(slow).not.toBe(fast);
    expect(medium).not.toBe(fast);
  });

  it('localizes Pace · middot for pt-BR and es; stays distinct from Speed · / Rate · / Atk CD ·', () => {
    setLocale('pt-BR');
    const ptSlow = unitMoveCadenceLabel('stomper');
    expect(ptSlow).toBe(
      t('sel.moveCadenceTip', { pace: t('sel.moveCadence.slow') }),
    );
    expect(ptSlow).toBe('Ritmo · Lento');
    expect(ptSlow).toMatch(/^Ritmo \u00b7 /);
    expect(ptSlow).toContain(' \u00b7 ');
    expect(ptSlow).not.toContain('  ·  ');
    const ptMedium = unitMoveCadenceLabel('scavenger');
    expect(ptMedium).toBe('Ritmo · Médio');
    expect(ptMedium).toMatch(/^Ritmo \u00b7 /);
    const ptFast = unitMoveCadenceLabel('wolf_rider');
    expect(ptFast).toBe('Ritmo · Rápido');
    expect(ptFast).toMatch(/^Ritmo \u00b7 /);
    expect(ptSlow).not.toBe(unitMoveSpeedLabel('stomper'));
    expect(unitMoveSpeedLabel('stomper')).toMatch(/^Velocidade \u00b7 /);
    expect(ptSlow).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(unitAttackSpeedLabel('scavenger')).toBe('Cadência · 1.1/s');
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Cadência \u00b7 /);
    expect(ptSlow).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(unitAttackCooldownLabel('scavenger')).toMatch(/^CD atq\. \u00b7 /);
    expect(ptSlow).not.toMatch(/^Velocidade \u00b7 /);
    expect(ptSlow).not.toMatch(/^Cadência \u00b7 /);
    expect(ptSlow).not.toMatch(/^CD atq\. \u00b7 /);

    setLocale('es');
    const esSlow = unitMoveCadenceLabel('stomper');
    expect(esSlow).toBe(
      t('sel.moveCadenceTip', { pace: t('sel.moveCadence.slow') }),
    );
    expect(esSlow).toBe('Ritmo · Lento');
    expect(esSlow).toMatch(/^Ritmo \u00b7 /);
    expect(esSlow).toContain(' \u00b7 ');
    expect(esSlow).not.toContain('  ·  ');
    const esMedium = unitMoveCadenceLabel('scavenger');
    expect(esMedium).toBe('Ritmo · Medio');
    expect(esMedium).toMatch(/^Ritmo \u00b7 /);
    const esFast = unitMoveCadenceLabel('wolf_rider');
    expect(esFast).toBe('Ritmo · Rápido');
    expect(esFast).toMatch(/^Ritmo \u00b7 /);
    expect(esSlow).not.toBe(unitMoveSpeedLabel('stomper'));
    expect(unitMoveSpeedLabel('stomper')).toMatch(/^Velocidad \u00b7 /);
    expect(esSlow).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(unitAttackSpeedLabel('scavenger')).toBe('Cadencia · 1.1/s');
    expect(unitAttackSpeedLabel('scavenger')).toMatch(/^Cadencia \u00b7 /);
    expect(esSlow).not.toBe(unitAttackCooldownLabel('scavenger'));
    expect(unitAttackCooldownLabel('scavenger')).toMatch(/^CD atq\. \u00b7 /);
    expect(esSlow).not.toMatch(/^Velocidad \u00b7 /);
    expect(esSlow).not.toMatch(/^Cadencia \u00b7 /);
    expect(esSlow).not.toMatch(/^CD atq\. \u00b7 /);
    setLocale('en-GB');
  });

  it('shares a tip only when every selected unit matches pace', () => {
    expect(sharedUnitMoveCadenceLabel(['stomper', 'boom_cart'])).toBe(
      unitMoveCadenceLabel('stomper'),
    );
    expect(sharedUnitMoveCadenceLabel(['stomper', 'wolf_rider'])).toBeNull();
    expect(sharedUnitMoveCadenceLabel([])).toBeNull();
  });
});
