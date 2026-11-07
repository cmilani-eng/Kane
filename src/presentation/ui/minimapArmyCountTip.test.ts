import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';

describe('minimapArmyCountTipText', () => {
  it('labels Army · n', () => {
    expect(minimapArmyCountTipText(5)).toBe(t('hud.minimapArmy', { n: 5 }));
    expect(minimapArmyCountTipText(5)).toMatch(/^Army ·/);
    expect(minimapArmyCountTipText(0)).toBe(t('hud.minimapArmy', { n: 0 }));
  });
});
