import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { sharedUnitDpsLabel, unitDps, unitDpsLabel } from './unitDps';

describe('unitDps', () => {
  it('rounds catalog dmg over attack cooldown to whole DPS', () => {
    // scavenger: dmg 4, cd 900ms → 4.44 → 4
    expect(unitDps('scavenger')).toBe(4);
    // boom_goblin-ish checks via tin_knight: dmg from data
    expect(unitDps('tin_knight')).toBeGreaterThan(0);
  });

  it('formats localized DPS tip', () => {
    const n = unitDps('scavenger');
    expect(n).not.toBeNull();
    const line = unitDpsLabel('scavenger');
    expect(line).toBe(t('sel.dps', { n: n! }));
    expect(line).toContain(String(n));
  });

  it('shares tip only for same-type selections', () => {
    expect(sharedUnitDpsLabel(['bonker', 'bonker'])).toBe(
      unitDpsLabel('bonker'),
    );
    expect(sharedUnitDpsLabel(['bonker', 'rock_thrower'])).toBeNull();
  });
});
