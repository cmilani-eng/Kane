import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';

describe('minimapSelectedCountTipText', () => {
  it('labels Selected · n with middot, distinct surface from pause tip', () => {
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toBe('Selected · 3');
    expect(minimapSelectedCountTipText(3)).toMatch(/^Selected \u00b7 /);
    expect(minimapSelectedCountTipText(0)).toBe(
      t('hud.minimapSelected', { n: 0 }),
    );
    expect(minimapSelectedCountTipText(0)).toBe('Selected · 0');
    expect(minimapSelectedCountTipText(0)).toMatch(/^Selected \u00b7 /);
    // Same en copy as pause tip; distinct i18n key / surface.
    expect(minimapSelectedCountTipText(3)).toBe(pauseSelectionCountTipLine(3));
    expect(pauseSelectionCountTipLine(3)).toBe(
      t('pause.selectionCountTip', { n: 3 }),
    );
    expect(pauseSelectionCountTipLine(3)).toBe('Selected · 3');
    expect(pauseSelectionCountTipLine(3)).toMatch(/^Selected \u00b7 /);
    expect(t('hud.minimapSelected', { n: 1 })).toBe(
      t('pause.selectionCountTip', { n: 1 }),
    );
    expect(t('hud.minimapSelected', { n: 1 })).not.toBe(
      t('pause.selectedSectorTip', { sector: 'NW' }),
    );
  });

  it('localizes Selected middot for pt-BR and es; keys stay hud-scoped', () => {
    setLocale('pt-BR');
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toBe('Selecionados · 3');
    expect(minimapSelectedCountTipText(3)).toMatch(/^Selecionados \u00b7 /);
    expect(minimapSelectedCountTipText(3)).toBe(pauseSelectionCountTipLine(3));
    expect(pauseSelectionCountTipLine(3)).toBe(
      t('pause.selectionCountTip', { n: 3 }),
    );

    setLocale('es');
    expect(minimapSelectedCountTipText(3)).toBe(
      t('hud.minimapSelected', { n: 3 }),
    );
    expect(minimapSelectedCountTipText(3)).toBe('Seleccionados · 3');
    expect(minimapSelectedCountTipText(3)).toMatch(/^Seleccionados \u00b7 /);
    expect(minimapSelectedCountTipText(3)).toBe(pauseSelectionCountTipLine(3));
    expect(pauseSelectionCountTipLine(3)).toBe(
      t('pause.selectionCountTip', { n: 3 }),
    );
    setLocale('en-GB');
  });
});
