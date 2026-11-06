import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale, t } from '../../i18n';
import { stockDepositTipLine } from './stockDepositTip';

beforeEach(() => {
  resetLocaleForTests();
});

describe('stockDepositTipLine', () => {
  it('reminds that gathers deposit at Keep in each locale', () => {
    setLocale('en-GB');
    expect(stockDepositTipLine()).toBe(t('hud.depositTip'));
    expect(stockDepositTipLine()).toMatch(/Keep|deposit/i);

    setLocale('pt-BR');
    expect(stockDepositTipLine()).toContain('Keep');

    setLocale('es');
    expect(stockDepositTipLine()).toContain('Keep');
  });
});
