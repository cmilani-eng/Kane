import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapSupplyTipText } from './minimapSupplyTip';
import { pausePopulationTipLine } from './pausePopulationTip';

describe('minimapPopulationTipText', () => {
  it('labels Pop · n, distinct from Supply tip; same en copy as pause', () => {
    expect(minimapPopulationTipText(12)).toBe(t('hud.minimapPop', { n: 12 }));
    expect(minimapPopulationTipText(12)).toMatch(/^Pop ·/);
    expect(minimapPopulationTipText(0)).toBe(t('hud.minimapPop', { n: 0 }));
    expect(minimapPopulationTipText(12)).not.toBe(
      minimapSupplyTipText(12, 36),
    );
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(minimapPopulationTipText(12)).toBe(pausePopulationTipLine(12));
  });
});
