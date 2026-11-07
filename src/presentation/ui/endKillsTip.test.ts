import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endKillsTipLine } from './endKillsTip';

describe('endKillsTipLine', () => {
  it('labels Kills · n', () => {
    expect(endKillsTipLine(7)).toBe(t('end.killsTip', { n: 7 }));
    expect(endKillsTipLine(7)).toMatch(/^Kills ·/);
    expect(endKillsTipLine(0)).toBe(t('end.killsTip', { n: 0 }));
  });
});
