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
    expect(minimapCameraSectorTipText('C')).toMatch(/^Cam \u00b7 /);

    expect(tip).not.toBe(minimapCameraViewportLabelText());
    expect(minimapCameraViewportLabelText()).toBe(t('hud.minimapCamView'));
    expect(minimapCameraViewportLabelText()).toBe('View');
    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Scout · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Scout \u00b7 /);
    expect(tip).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Focus · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Focus \u00b7 /);
    expect(tip).not.toMatch(/^Scout \u00b7 /);
    expect(tip).not.toMatch(/^Focus \u00b7 /);
    expect(tip).not.toBe('View');

    // Same en copy as pause Cam tip; distinct i18n key / surface.
    expect(tip).toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );
    expect(pauseCameraSectorTipLine('NW')).toBe('Cam · NW');
    expect(pauseCameraSectorTipLine('NW')).toMatch(/^Cam \u00b7 /);
    expect(t('hud.minimapCamSector', { sector: 'NW' })).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );
  });

  it('localizes Cam · sector middot for pt-BR and es; stays distinct from View / Scout / Focus', () => {
    setLocale('pt-BR');
    expect(minimapCameraSectorTipText('NW')).toBe(
      t('hud.minimapCamSector', { sector: 'NW' }),
    );
    expect(minimapCameraSectorTipText('NW')).toBe('Câm · NW');
    expect(minimapCameraSectorTipText('NW')).toMatch(/^Câm \u00b7 /);

    const tipPt = minimapCameraSectorTipText('NW');
    expect(tipPt).not.toBe(minimapCameraViewportLabelText());
    expect(minimapCameraViewportLabelText()).toBe('Vista');
    expect(tipPt).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(minimapScoutPulseLabelText('NW')).toBe('Revela · NW');
    expect(minimapScoutPulseLabelText('NW')).toMatch(/^Revela \u00b7 /);
    expect(tipPt).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Foco · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Foco \u00b7 /);
    expect(tipPt).not.toMatch(/^Revela \u00b7 /);
    expect(tipPt).not.toMatch(/^Foco \u00b7 /);
    expect(tipPt).not.toBe('Vista');
    // Same pt-BR copy as pause Cam tip; distinct i18n key / surface.
    expect(tipPt).toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe(
      t('pause.camSectorTip', { sector: 'NW' }),
    );
    expect(pauseCameraSectorTipLine('NW')).toBe('Câm · NW');
    expect(pauseCameraSectorTipLine('NW')).toMatch(/^Câm \u00b7 /);

    setLocale('es');
    expect(minimapCameraSectorTipText('SE')).toBe(
      t('hud.minimapCamSector', { sector: 'SE' }),
    );
    expect(minimapCameraSectorTipText('SE')).toBe('Cám · SE');
    expect(minimapCameraSectorTipText('SE')).toMatch(/^Cám \u00b7 /);

    const tipEs = minimapCameraSectorTipText('SE');
    expect(tipEs).not.toBe(minimapCameraViewportLabelText());
    expect(minimapCameraViewportLabelText()).toBe('Vista');
    expect(tipEs).not.toBe(minimapScoutPulseLabelText('SE'));
    expect(minimapScoutPulseLabelText('SE')).toBe('Explora · SE');
    expect(minimapScoutPulseLabelText('SE')).toMatch(/^Explora \u00b7 /);
    expect(tipEs).not.toBe(pauseSelectedSectorTipLine('SE'));
    expect(pauseSelectedSectorTipLine('SE')).toBe('Foco · SE');
    expect(pauseSelectedSectorTipLine('SE')).toMatch(/^Foco \u00b7 /);
    expect(tipEs).not.toMatch(/^Explora \u00b7 /);
    expect(tipEs).not.toMatch(/^Foco \u00b7 /);
    expect(tipEs).not.toBe('Vista');
    expect(tipEs).toBe(pauseCameraSectorTipLine('SE'));
    expect(pauseCameraSectorTipLine('SE')).toBe(
      t('pause.camSectorTip', { sector: 'SE' }),
    );
    expect(pauseCameraSectorTipLine('SE')).toBe('Cám · SE');
    expect(pauseCameraSectorTipLine('SE')).toMatch(/^Cám \u00b7 /);
    setLocale('en-GB');
  });
});
