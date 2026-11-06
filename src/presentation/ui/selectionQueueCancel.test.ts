import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';

describe('queue cancel flash copy', () => {
  it('formats refund flash lines', () => {
    expect(t('sel.cancelFlash')).toMatch(/Refund/i);
    expect(t('sel.cancelFlashNamed', { name: 'Bonker' })).toContain('Bonker');
  });
});
