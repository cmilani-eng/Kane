import { describe, expect, it } from 'vitest';
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

describe('unitAttackCooldown', () => {
  it('converts attack cooldown ms to seconds', () => {
    expect(attackCooldownSec(900)).toBe(0.9);
    expect(attackCooldownSec(1000)).toBe(1);
    expect(attackCooldownSec(0)).toBeNull();
  });

  it('labels Atk CD · ns with middot, distinct from Rate / DPS / hero Cooldown', () => {
    const n = unitAttackCooldown('scavenger');
    expect(n).toBe(attackCooldownSec(getUnitType('scavenger').attackCooldownMs));
    const line = unitAttackCooldownLabel('scavenger');
    expect(line).toBe(t('sel.atkCdTip', { n: n! }));
    expect(line).toBe('Atk CD · 0.9s');
    expect(line).toMatch(/^Atk CD \u00b7 /);
    expect(line).toMatch(/0\.9s$/);
    expect(line).not.toBe(unitAttackSpeedLabel('scavenger'));
    expect(line).not.toBe(unitDpsLabel('scavenger'));
    expect(line).not.toBe(t('sel.cooldown', { n: n! }));
    expect(sharedUnitAttackCooldownLabel(['scavenger', 'scavenger'])).toBe(
      line,
    );
    expect(
      sharedUnitAttackCooldownLabel(['scavenger', 'tin_knight']),
    ).toBeNull();
    expect(sharedUnitAttackCooldownLabel([])).toBeNull();
  });

  it('localizes Atk CD middot for pt-BR and es', () => {
    const n = unitAttackCooldown('scavenger')!;
    setLocale('pt-BR');
    expect(unitAttackCooldownLabel('scavenger')).toBe(
      t('sel.atkCdTip', { n }),
    );
    expect(unitAttackCooldownLabel('scavenger')).toBe('CD atq. · 0.9s');
    expect(unitAttackCooldownLabel('scavenger')).toMatch(/^CD atq\. ·/);
    expect(unitAttackCooldownLabel('scavenger')).not.toBe(
      unitAttackSpeedLabel('scavenger'),
    );
    expect(unitAttackCooldownLabel('scavenger')).not.toBe(
      t('sel.cooldown', { n }),
    );
    setLocale('es');
    expect(unitAttackCooldownLabel('scavenger')).toBe(
      t('sel.atkCdTip', { n }),
    );
    expect(unitAttackCooldownLabel('scavenger')).toBe('CD atq. · 0.9s');
    expect(unitAttackCooldownLabel('scavenger')).toMatch(/^CD atq\. ·/);
    expect(unitAttackCooldownLabel('scavenger')).not.toBe(
      unitAttackSpeedLabel('scavenger'),
    );
    expect(unitAttackCooldownLabel('scavenger')).not.toBe(
      t('sel.cooldown', { n }),
    );
    setLocale('en-GB');
  });
});
