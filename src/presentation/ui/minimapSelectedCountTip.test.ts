import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';

describe('minimapSelectedCountTipText', () => {
  it('labels Selected · n on the minimap chrome key', () => {
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toMatch(/^Selected ·/);
    expect(minimapSelectedCountTipText(0)).toBe(
      t('hud.minimapSelected', { n: 0 }),
    );
    // Distinct surface from pause tip (own i18n key); en copy may match.
    expect(minimapSelectedCountTipText(3)).toBe(pauseSelectionCountTipLine(3));
    expect(t('hud.minimapSelected', { n: 1 })).toContain('Selected');
    expect(t('pause.selectionCountTip', { n: 1 })).toContain('Selected');
  });
});
