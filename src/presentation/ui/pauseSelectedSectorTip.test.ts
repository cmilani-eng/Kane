import { beforeEach, describe, expect, it } from 'vitest';
import { MAP } from '../../config/balance';
import { setLocale, t } from '../../i18n';
import { minimapScoutPulseLabelText } from './minimapScoutPulseLabel';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import {
  pauseSelectedSectorAt,
  pauseSelectedSectorTipLine,
} from './pauseSelectedSectorTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseSelectedSectorTip', () => {
  it('maps selection centroid to a 3×3 sector', () => {
    expect(pauseSelectedSectorAt([])).toBeNull();
    expect(pauseSelectedSectorAt([{ x: 0, y: 0 }])).toBe('NW');
    expect(
      pauseSelectedSectorAt([
        { x: MAP.width - 1, y: MAP.height - 1 },
        { x: MAP.width - 1, y: MAP.height - 1 },
      ]),
    ).toBe('SE');
    expect(
      pauseSelectedSectorAt([
        { x: 0, y: 0 },
        { x: MAP.width - 1, y: MAP.height - 1 },
      ]),
    ).toBe('C');
  });

  it('labels Focus · sector with middot, distinct from Cam · / Hero · / Selected · / Scout ·', () => {
    const tip = pauseSelectedSectorTipLine('NW');
    expect(tip).toBe(t('pause.selectedSectorTip', { sector: 'NW' }));
    expect(tip).toBe('Focus · NW');
    expect(tip).toMatch(/^Focus \u00b7 /);
    expect(tip).toContain(' \u00b7 ');
    expect(tip).toContain('NW');
    expect(pauseSelectedSectorTipLine('C')).toBe('Focus · C');
    expect(pauseSelectedSectorTipLine('C')).toMatch(/^Focus \u00b7 /);

    expect(tip).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe('Cam · NW');
    expect(pauseCameraSectorTipLine('NW')).toMatch(/^Cam \u00b7 /);
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
    expect(tip).not.toMatch(/^Cam \u00b7 /);
    expect(tip).not.toMatch(/^Hero \u00b7 /);
    expect(tip).not.toMatch(/^Selected \u00b7 /);
  });

  it('localizes Focus · sector middot for pt-BR and es; stays distinct from Cam / Hero / Selected / Scout', () => {
    setLocale('pt-BR');
    const pt = pauseSelectedSectorTipLine('NW');
    expect(pt).toBe(t('pause.selectedSectorTip', { sector: 'NW' }));
    expect(pt).toBe('Foco · NW');
    expect(pt).toMatch(/^Foco \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(pauseCameraSectorTipLine('NW')).toBe('Câm · NW');
    expect(pauseCameraSectorTipLine('NW')).toMatch(/^Câm \u00b7 /);
    expect(pt).not.toBe(
      pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' }),
    );
    expect(pauseHeroStatusTipLine({ kind: 'live', sector: 'NW' })).toBe(
      'Herói · NW',
    );
    expect(pt).not.toBe(pauseSelectionCountTipLine(1));
    expect(pauseSelectionCountTipLine(1)).toBe('Selecionados · 1');
    expect(pt).not.toBe(minimapScoutPulseLabelText('NW'));
    expect(pt).not.toMatch(/^Câm \u00b7 /);
    expect(pt).not.toMatch(/^Herói \u00b7 /);
    expect(pt).not.toMatch(/^Selecionados \u00b7 /);

    setLocale('es');
    const es = pauseSelectedSectorTipLine('SE');
    expect(es).toBe(t('pause.selectedSectorTip', { sector: 'SE' }));
    expect(es).toBe('Foco · SE');
    expect(es).toMatch(/^Foco \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toBe(pauseCameraSectorTipLine('SE'));
    expect(pauseCameraSectorTipLine('SE')).toBe('Cám · SE');
    expect(pauseCameraSectorTipLine('SE')).toMatch(/^Cám \u00b7 /);
    expect(es).not.toBe(
      pauseHeroStatusTipLine({ kind: 'live', sector: 'SE' }),
    );
    expect(pauseHeroStatusTipLine({ kind: 'live', sector: 'SE' })).toBe(
      'Héroe · SE',
    );
    expect(es).not.toBe(pauseSelectionCountTipLine(1));
    expect(pauseSelectionCountTipLine(1)).toBe('Seleccionados · 1');
    expect(es).not.toBe(minimapScoutPulseLabelText('SE'));
    expect(es).not.toMatch(/^Cám \u00b7 /);
    expect(es).not.toMatch(/^Héroe \u00b7 /);
    expect(es).not.toMatch(/^Seleccionados \u00b7 /);
    setLocale('en-GB');
  });
});
