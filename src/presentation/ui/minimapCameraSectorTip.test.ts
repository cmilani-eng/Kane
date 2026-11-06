import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  minimapCameraSectorAt,
  minimapCameraSectorTipText,
} from './minimapCameraSectorTip';

describe('minimapCameraSectorTip', () => {
  it('labels the camera center sector as Cam · sector', () => {
    expect(minimapCameraSectorAt(0, 0, 200, 200)).toBe('NW');
    expect(minimapCameraSectorTipText('NW')).toBe(
      t('hud.minimapCamSector', { sector: 'NW' }),
    );
    expect(minimapCameraSectorTipText('C')).toMatch(/C/);
  });
});
