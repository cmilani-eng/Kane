import { describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import {
  attackRangeLabel,
  attackRangeTiles,
  sharedUnitAttackRangeLabel,
  unitAttackRange,
  unitAttackRangeLabel,
} from './unitAttackRange';

describe('unitAttackRange', () => {
  it('converts world-pixel range to map tiles', () => {
    expect(attackRangeTiles(MAP.tile)).toBe(1);
    expect(attackRangeTiles(MAP.tile * 3)).toBe(3);
    expect(attackRangeTiles(0)).toBe(0);
  });

  it('labels catalog range as Range · n', () => {
    const def = getUnitType('scavenger');
    const n = attackRangeTiles(def.range);
    expect(n).toBeGreaterThan(0);
    expect(attackRangeLabel(def.range)).toBe(t('sel.rangeTip', { n }));
    expect(unitAttackRange('scavenger')).toBe(n);
    expect(unitAttackRangeLabel('scavenger')).toBe(t('sel.rangeTip', { n }));
    expect(unitAttackRangeLabel('scavenger')).toMatch(/^Range ·/);
    expect(sharedUnitAttackRangeLabel(['scavenger', 'scavenger'])).toBe(
      t('sel.rangeTip', { n }),
    );
    expect(
      sharedUnitAttackRangeLabel(['scavenger', 'boom_goblin']),
    ).toBeNull();
  });
});
