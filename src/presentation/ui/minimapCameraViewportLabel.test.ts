import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapCameraViewportLabelText } from './minimapCameraViewportLabel';

describe('minimapCameraViewportLabel', () => {
  it('labels the camera viewport on the minimap', () => {
    expect(minimapCameraViewportLabelText()).toBe(t('hud.minimapCamView'));
  });
});
