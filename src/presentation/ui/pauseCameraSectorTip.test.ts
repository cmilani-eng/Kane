import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  pauseCameraSectorAt,
  pauseCameraSectorTipLine,
} from './pauseCameraSectorTip';

describe('pauseCameraSectorTipLine', () => {
  it('labels the paused camera center sector as Cam · sector', () => {
    expect(pauseCameraSectorAt(0, 0, 200, 200)).toBe('NW');
    const tip = pauseCameraSectorTipLine('NW');
    expect(tip).toBe(t('pause.camSectorTip', { sector: 'NW' }));
    expect(tip).toMatch(/^Cam ·/);
    expect(tip).toContain('NW');
  });
});
