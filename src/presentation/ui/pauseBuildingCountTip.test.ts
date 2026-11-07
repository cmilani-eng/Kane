import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapBuildingCountTipText } from './minimapBuildingCountTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseBuildingCountTipLine } from './pauseBuildingCountTip';

describe('pauseBuildingCountTipLine', () => {
  it('labels Buildings · n with middot, distinct from Army tip and minimap tip key', () => {
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toBe('Buildings · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Buildings \u00b7 /);
    expect(pauseBuildingCountTipLine(0)).toBe(
      t('pause.buildingsTip', { n: 0 }),
    );
    expect(pauseBuildingCountTipLine(0)).toBe('Buildings · 0');
    expect(pauseBuildingCountTipLine(0)).toMatch(/^Buildings \u00b7 /);
    expect(pauseBuildingCountTipLine(4)).not.toBe(pauseArmySizeTipLine(4));
    expect(pauseBuildingCountTipLine(4)).not.toMatch(/^Army \u00b7 /);
    // Same en copy as minimap buildings tip; distinct i18n key / surface.
    expect(pauseBuildingCountTipLine(4)).toBe(minimapBuildingCountTipText(4));
    expect(minimapBuildingCountTipText(4)).toBe(
      t('hud.minimapBuildings', { n: 4 }),
    );
    expect(t('pause.buildingsTip', { n: 1 })).toBe(
      t('hud.minimapBuildings', { n: 1 }),
    );
  });

  it('localizes Buildings middot for pt-BR and es; keys stay pause-scoped', () => {
    setLocale('pt-BR');
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toBe('Prédios · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Prédios \u00b7 /);
    expect(pauseBuildingCountTipLine(4)).toBe(minimapBuildingCountTipText(4));
    expect(minimapBuildingCountTipText(4)).toBe(
      t('hud.minimapBuildings', { n: 4 }),
    );

    setLocale('es');
    expect(pauseBuildingCountTipLine(4)).toBe(
      t('pause.buildingsTip', { n: 4 }),
    );
    expect(pauseBuildingCountTipLine(4)).toBe('Edificios · 4');
    expect(pauseBuildingCountTipLine(4)).toMatch(/^Edificios \u00b7 /);
    expect(pauseBuildingCountTipLine(4)).toBe(minimapBuildingCountTipText(4));
    expect(minimapBuildingCountTipText(4)).toBe(
      t('hud.minimapBuildings', { n: 4 }),
    );
    setLocale('en-GB');
  });
});
