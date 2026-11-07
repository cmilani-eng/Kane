import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  minimapHeroStatusTipText,
  type MinimapHeroStatus,
} from './minimapHeroStatusTip';
import { pauseHeroStatusTipLine } from './pauseHeroStatusTip';

describe('pauseHeroStatusTipLine', () => {
  it('labels Ready / Down / sector like minimap, distinct i18n keys', () => {
    const ready: MinimapHeroStatus = { kind: 'ready' };
    const down: MinimapHeroStatus = { kind: 'down' };
    const live: MinimapHeroStatus = { kind: 'live', sector: 'NW' };

    expect(pauseHeroStatusTipLine(ready)).toBe(t('pause.heroReady'));
    expect(pauseHeroStatusTipLine(ready)).toMatch(/^Hero ·/);
    expect(pauseHeroStatusTipLine(down)).toBe(t('pause.heroDown'));
    expect(pauseHeroStatusTipLine(live)).toBe(
      t('pause.heroSector', { sector: 'NW' }),
    );

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(pauseHeroStatusTipLine(ready)).toBe(minimapHeroStatusTipText(ready));
    expect(pauseHeroStatusTipLine(down)).toBe(minimapHeroStatusTipText(down));
    expect(pauseHeroStatusTipLine(live)).toBe(minimapHeroStatusTipText(live));
  });
});
