import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapHeroStatusTipText, type MinimapHeroStatus } from './minimapHeroStatusTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseCameraSectorTipLine } from './pauseCameraSectorTip';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';
import { pauseSelectedSectorTipLine } from './pauseSelectedSectorTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseHeroStatusTipLine', () => {
  it('labels Hero · Ready / Down / sector with middot, distinct from Cam · / Focus · / Army · / Selected ·', () => {
    const ready: MinimapHeroStatus = { kind: 'ready' };
    const down: MinimapHeroStatus = { kind: 'down' };
    const live: MinimapHeroStatus = { kind: 'live', sector: 'NW' };

    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));
    expect(pauseHeroStatusTipLine(ready)).toBe('Hero · Ready');
    expect(pauseHeroStatusTipLine(ready)).toMatch(/^Hero \u00b7 /);
    expect(pauseHeroStatusTipLine(down)).toBe(t('pause.heroDown'));
    expect(pauseHeroStatusTipLine(down)).toBe('Hero · Down');
    expect(pauseHeroStatusTipLine(down)).toMatch(/^Hero \u00b7 /);
    expect(pauseHeroStatusTipLine(live)).toBe(
      t('pause.heroSector', { sector: 'NW' }),
    );
    expect(pauseHeroStatusTipLine(live)).toBe('Hero · NW');
    expect(pauseHeroStatusTipLine(live)).toMatch(/^Hero \u00b7 /);

    const liveTip = pauseHeroStatusTipLine(live);
    expect(liveTip).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(liveTip).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(liveTip).not.toBe(pauseArmySizeTipLine(1));
    expect(liveTip).not.toBe(pauseSelectionCountTipLine(1));
    expect(liveTip).not.toMatch(/^Cam \u00b7 /);
    expect(liveTip).not.toMatch(/^Focus \u00b7 /);
    expect(liveTip).not.toMatch(/^Army \u00b7 /);
    expect(liveTip).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(pauseHeroStatusTipLine(ready)).toBe(minimapHeroStatusTipText(ready));
    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));
    expect(pauseHeroStatusTipLine(down)).toBe(minimapHeroStatusTipText(down));
    expect(minimapHeroStatusTipText(down)).toBe(t('hud.minimapHeroDown'));
    expect(pauseHeroStatusTipLine(live)).toBe(minimapHeroStatusTipText(live));
    expect(minimapHeroStatusTipText(live)).toBe(
      t('hud.minimapHeroSector', { sector: 'NW' }),
    );
  });

  it('localizes Hero middot for pt-BR and es; stays distinct from Cam / Focus / Army / Selected', () => {
    const ready: MinimapHeroStatus = { kind: 'ready' };
    const down: MinimapHeroStatus = { kind: 'down' };
    const live: MinimapHeroStatus = { kind: 'live', sector: 'NW' };

    setLocale('pt-BR');
    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));
    expect(pauseHeroStatusTipLine(ready)).toBe('Herói · Pronto');
    expect(pauseHeroStatusTipLine(ready)).toMatch(/^Herói \u00b7 /);
    expect(pauseHeroStatusTipLine(down)).toBe('Herói · Caído');
    expect(pauseHeroStatusTipLine(down)).toMatch(/^Herói \u00b7 /);
    expect(pauseHeroStatusTipLine(live)).toBe('Herói · NW');
    expect(pauseHeroStatusTipLine(live)).toMatch(/^Herói \u00b7 /);

    const livePt = pauseHeroStatusTipLine(live);
    expect(livePt).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(livePt).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(livePt).not.toBe(pauseArmySizeTipLine(1));
    expect(livePt).not.toBe(pauseSelectionCountTipLine(1));
    expect(livePt).not.toMatch(/^Câm \u00b7 /);
    expect(livePt).not.toMatch(/^Foco \u00b7 /);
    expect(livePt).not.toMatch(/^Tropa \u00b7 /);
    expect(livePt).not.toMatch(/^Selecionados \u00b7 /);
    expect(pauseHeroStatusTipLine(ready)).toBe(minimapHeroStatusTipText(ready));
    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));

    setLocale('es');
    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));
    expect(pauseHeroStatusTipLine(ready)).toBe('Héroe · Listo');
    expect(pauseHeroStatusTipLine(ready)).toMatch(/^Héroe \u00b7 /);
    expect(pauseHeroStatusTipLine(down)).toBe('Héroe · Caído');
    expect(pauseHeroStatusTipLine(down)).toMatch(/^Héroe \u00b7 /);
    expect(pauseHeroStatusTipLine(live)).toBe('Héroe · NW');
    expect(pauseHeroStatusTipLine(live)).toMatch(/^Héroe \u00b7 /);

    const liveEs = pauseHeroStatusTipLine(live);
    expect(liveEs).not.toBe(pauseCameraSectorTipLine('NW'));
    expect(liveEs).not.toBe(pauseSelectedSectorTipLine('NW'));
    expect(liveEs).not.toBe(pauseArmySizeTipLine(1));
    expect(liveEs).not.toBe(pauseSelectionCountTipLine(1));
    expect(liveEs).not.toMatch(/^Cám \u00b7 /);
    expect(liveEs).not.toMatch(/^Foco \u00b7 /);
    expect(liveEs).not.toMatch(/^Tropa \u00b7 /);
    expect(liveEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(pauseHeroStatusTipLine(ready)).toBe(minimapHeroStatusTipText(ready));
    expect(minimapHeroStatusTipText(ready)).toBe(t('hud.minimapHeroReady'));
    setLocale('en-GB');
  });
});
