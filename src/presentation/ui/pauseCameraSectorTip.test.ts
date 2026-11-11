import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapCameraSectorTipText } from './minimapCameraSectorTip';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';
import {
  pauseCameraSectorAt,
  pauseCameraSectorTipLine,
} from './pauseCameraSectorTip';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';
import { pauseSelectedSectorTipLine } from './pauseSelectedSectorTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseCameraSectorTipLine', () => {
  it('labels Cam · sector with middot, distinct from Focus · / Hero · / Selected · / Scout ·', () => {
    expect(pauseCameraSectorAt(0, 0, 200, 200)).toBe('NW');
    const tip = pauseCameraSectorTipLine('NW');
    expect(tip).toBe(t('pause.camSectorTip', { sector: 'NW' }));
    expect(tip).toBe('Cam · NW');
    expect(tip).toMatch(/^Cam \u00b7 /);
    expect(tip).toContain('NW');
    expect(pauseCameraSectorTipLine('C')).toBe('Cam · C');
    expect(pauseCameraSectorTipLine('C')).toMatch(/^Cam \u00b7 /);

    expect(tip).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Focus · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Focus \u00b7 /);
    expect(tip).not.toBe(
      pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' }),
    );
    expect(pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' })).toBe(
      'Hero · NW',
    );
    expect(
      pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' }),
    ).toMatch(/^Hero \u00b7 /);
    expect(tip).not.toBe(pauseSelectionCountTipLine(1));
    expect(pauseSelectionCountTipLine(1)).toBe('Selected · 1');
    expect(pauseSelectionCountTipLine(1)).toMatch(/^Selected \u00b7 /);
    expect(tip).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(tip).not.toMatch(/^Focus \u00b7 /);
    expect(tip).not.toMatch(/^Hero \u00b7 /);
    expect(tip).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(tip).toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe(
      t('hud.minimapCamSector', { sector: 'NW' }),
    );
    expect(t('pause.camSectorTip', { sector: 'NW' })).toBe(
      t('hud.minimapCamSector', { sector: 'NW' }),
    );
  });

  it('localizes Cam · sector middot for pt-BR and es; stays distinct from Focus / Hero / Selected / Scout', () => {
    setLocale('pt-BR');
    const pt = pauseCameraSectorTipLine('NW');
    expect(pt).toBe(t('pause.camSectorTip', { sector: 'NW' }));
    expect(pt).toBe('Câm · NW');
    expect(pt).toMatch(/^Câm \u00b7 /);
    expect(pt).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(pauseSelectedSectorTipLine('NW')).toBe('Foco · NW');
    expect(pauseSelectedSectorTipLine('NW')).toMatch(/^Foco \u00b7 /);
    expect(pt).not.toBe(
      pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' }),
    );
    expect(pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' })).toBe(
      'Herói · NW',
    );
    expect(pt).not.toBe(pauseSelectionCountTipLine(1));
    expect(pauseSelectionCountTipLine(1)).toBe('Selecionados · 1');
    expect(pt).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(pt).not.toMatch(/^Foco \u00b7 /);
    expect(pt).not.toMatch(/^Herói \u00b7 /);
    expect(pt).not.toMatch(/^Selecionados \u00b7 /);
    expect(pt).toBe(minimapCameraSectorTipText('NW'));
    expect(minimapCameraSectorTipText('NW')).toBe(
      t('hud.minimapCamSector', { sector: 'NW' }),
    );

    setLocale('es');
    const es = pauseCameraSectorTipLine('SE');
    expect(es).toBe(t('pause.camSectorTip', { sector: 'SE' }));
    expect(es).toBe('Cám · SE');
    expect(es).toMatch(/^Cám \u00b7 /);
    expect(es).not.toBe(pauseSelectedSectorTipLine('SE'));
    expect(pauseSelectedSectorTipLine('SE')).toBe('Foco · SE');
    expect(pauseSelectedSectorTipLine('SE')).toMatch(/^Foco \u00b7 /);
    expect(es).not.toBe(
      pauseHeroStatusTipLine({ kind: 'live', sector: 'SE' }),
    );
    expect(pauseHeroStatusTipLine({ kind: 'live', sector: 'SE' })).toBe(
      'Héroe · SE',
    );
    expect(es).not.toBe(pauseSelectionCountTipLine(1));
    expect(pauseSelectionCountTipLine(1)).toBe('Seleccionados · 1');
    expect(es).not.toBe(minimapScoutPulseLabelText('SE'));
    expect(es).not.toMatch(/^Foco \u00b7 /);
    expect(es).not.toMatch(/^Héroe \u00b7 /);
    expect(es).not.toMatch(/^Seleccionados \u00b7 /);
    expect(es).toBe(minimapCameraSectorTipText('SE'));
    expect(minimapCameraSectorTipText('SE')).toBe(
      t('hud.minimapCamSector', { sector: 'SE' }),
    );
    setLocale('en-GB');
  });
});
