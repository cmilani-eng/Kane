import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { abilityChargesLeft } from './abilityCharges';

describe('abilityChargesLeft', () => {
  it('returns null for free abilities', () => {
    expect(abilityChargesLeft(50, 0)).toBeNull();
  });

  it('floors wallet crystals by cast cost', () => {
    expect(abilityChargesLeft(14, 5)).toBe(2);
    expect(abilityChargesLeft(4, 5)).toBe(0);
    expect(abilityChargesLeft(0, 5)).toBe(0);
  });
});

describe('hud.abilityCharges copy', () => {
  it('shows the ability name with remaining cast count', () => {
    const line = t('hud.abilityCharges', { name: 'BIG BONK', n: 2 });
    expect(line).toContain('BIG BONK');
    expect(line).toContain('2');
  });
});
