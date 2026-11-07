import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatQueueCancelFlash } from './selectionPanel';

describe('queue cancel flash copy', () => {
  it('formats refund flash lines with Gold and Crystal amounts', () => {
    expect(t('sel.cancelFlash')).toMatch(/Refund/i);
    expect(t('sel.cancelFlashNamed', { name: 'Bonker' })).toContain('Bonker');
    expect(
      formatQueueCancelFlash({ unitName: 'Bonker', gold: 50, crystals: 10 }),
    ).toBe('Refunded Bonker · Gold 50 · Crystal 10');
    expect(formatQueueCancelFlash({ gold: 40, crystals: 0 })).toBe(
      'Refunded · Gold 40',
    );
    expect(formatQueueCancelFlash({ gold: 0, crystals: 25 })).toBe(
      'Refunded · Crystal 25',
    );
  });
});
