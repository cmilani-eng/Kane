import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapCameraViewportLabelText } from './minimapCameraViewportLabel';
import {
  minimapCameraSectorAt,
  minimapCameraSectorTipText,
} from './minimapCameraSectorTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';
import { pauseSelectedSectorTipLine } from './pauseSelectedSectorTip';

describe('minimapCameraSectorTip', () => {
  it('maps view-center to a 3×3 sector', () => {
    expect(minimapCameraSectorAt(0, 0, 200, 200)).toBe('NW');
    // MAP 2400×1600 — SE corner viewport center lands in SE.
    expect(minimapCameraSectorAt(2200, 1400, 200, 200)).toBe('SE');
  });

  it('labels Cam · sector with middot, distinct from View / Scout · / Focus ·', () => {
    const tip = minimapCameraSectorTipText('NW');
    expect(tip).toBe(t('hud.minimapCamSector', { sector: 'NW' }));
    expect(tip).toBe('Cam · NW');
    expect(tip).toMatch(/^Cam \u00b7 /);
    expect(tip).toContain('NW');
    expect(minimapCameraSectorTipText('C')).toBe('Cam · C');
    expect(tip).not.toBe(minimapCameraViewportLabelText());
    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(tip).not.toBe(pauseSelectedSectorTipLine('NW'));
    // Same en copy as pause Cam tip; distinct i18n key / surface.
    expect(tip).toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );
    expect(t('hud.minimapCamSector', { sector: 'NW' })).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );
  });

  it('localizes Cam · sector middot for pt-BR and es', () => {
    setLocale('pt-BR');
    expect(minimapCameraSectorTipText('NW')).toBe(
      t('hud.minimapCamSector', { sector: 'NW' }),
    );
    expect(minimapCameraSectorTipText('NW')).toBe('Câm · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Câm \u00b7 /);
    expect(minimapCameraSectorTipText('NW')).not.toBe(
      minimapScoutPulseLabelText('NW'),
    );
    expect(minimapCameraSectorTipText('NW')).not.toBe(
      pauseSelectedSectorTipLine('NW'),
    );
    expect(minimapCameraSectorTipText('NW')).not.toBe(
      minimapCameraViewportLabelText(),
    );
    // Same pt-BR copy as pause Cam tip; distinct i18n key / surface.
    expect(minimapCameraSectorTipText('NW')).toBe(
      pauseCameraSectorTipLine('NW'),
    );
    expect(pauseCameraSectorTipLine('NW')).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );

    setLocale('es');
    expect(minimapCameraSectorTipText('SE')).toBe(
      t('hud.minimapCamSector', { sector: 'SE' }),
    );
    expect(minimapCameraSectorTipText('SE')).toBe('Cám · SE');
    expect(minimapCameraSectorTipText('SE')).toMatch(/^Cám \u00b7 /);
    expect(minimapCameraSectorTipText('SE')).not.toBe(
      minimapScoutPulseLabelText('SE'),
    );
    expect(minimapCameraSectorTipText('SE')).not.toBe(
      pauseSelectedSectorTipLine('SE'),
    );
    expect(minimapCameraSectorTipText('SE')).not.toBe(
      minimapCameraViewportLabelText(),
    );
    expect(minimapCameraSectorTipText('SE')).toBe(
      pauseCameraSectorTipLine('SE'),
    );
    expect(pauseCameraSectorTipLine('SE')).toBe(
      t('pause.camSectorTip', { sector: 'SE' }),
    );
    setLocale('en-GB');
  });
});
