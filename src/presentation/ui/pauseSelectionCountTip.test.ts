import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapSelectedCountTipText } from './minimapSelectedCountTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

describe('pauseSelectionCountTipLine', () => {
  it('labels Selected · n with middot, distinct surface from minimap tip', () => {
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toBe('Selected · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selected \u00b7 /);
    expect(pauseSelectionCountTipLine(0)).toBe(
      t('pause.selectionCountTip', { n: 0 }),
    );
    expect(pauseSelectionCountTipLine(0)).toBe('Selected · 0');
    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(pauseSelectionCountTipLine(4)).toBe(minimapSelectedCountTipText(4));
    expect(minimapSelectedCountTipText(4)).toBe(
      t('hud.minimapSelected', { n: 4 }),
    );
  });

  it('localizes Selected middot for pt-BR and es; keys stay pause-scoped', () => {
    setLocale('pt-BR');
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toBe('Selecionados · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Selecionados \u00b7 /);
    expect(pauseSelectionCountTipLine(4)).toBe(minimapSelectedCountTipText(4));

    setLocale('es');
    expect(pauseSelectionCountTipLine(4)).toBe(
      t('pause.selectionCountTip', { n: 4 }),
    );
    expect(pauseSelectionCountTipLine(4)).toBe('Seleccionados · 4');
    expect(pauseSelectionCountTipLine(4)).toMatch(/^Seleccionados \u00b7 /);
    expect(pauseSelectionCountTipLine(4)).toBe(minimapSelectedCountTipText(4));
    setLocale('en-GB');
  });
});
