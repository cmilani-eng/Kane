import { describe, expect, it } from 'vitest';
import { mapCopy, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { pauseMapTipLine } from './pauseMapTip';
import { pauseSpeciesMottoTipLine } from './pauseSpeciesMottoTip';

describe('pauseMapTipLine', () => {
  it('labels Map · name, distinct from end tip key and motto tip', () => {
    const name = mapCopy('ridge').label;
    expect(pauseMapTipLine('ridge')).toBe(t('pause.map', { name }));
    expect(pauseMapTipLine('ridge')).toMatch(/^Map ·/);
    expect(pauseMapTipLine('ridge')).toContain(name);
    expect(pauseMapTipLine('ridge')).not.toBe(
      pauseSpeciesMottoTipLine('nobles'),
    );
    // Same en copy as end tip; distinct i18n key / surface.
    expect(pauseMapTipLine('ridge')).toBe(endMapPlayedTipLine('ridge'));
    expect(endMapPlayedTipLine('ridge')).toBe(t('end.mapTip', { name }));
  });
});
