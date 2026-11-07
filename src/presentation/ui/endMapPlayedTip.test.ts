import { describe, expect, it } from 'vitest';
import { mapCopy, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';
import { endMapSizeTipLine } from './endMapSizeTip';

describe('endMapPlayedTipLine', () => {
  it('labels Map · name from mapId, distinct from Map size tip', () => {
    const name = mapCopy('ridge').label;
    expect(endMapPlayedTipLine('ridge')).toBe(t('end.mapTip', { name }));
    expect(endMapPlayedTipLine('ridge')).toMatch(/^Map ·/);
    expect(endMapPlayedTipLine('ridge')).toContain(name);
    expect(endMapPlayedTipLine('ridge')).not.toBe(endMapSizeTipLine('ridge'));
    expect(endMapSizeTipLine('ridge')).toMatch(/^Map ·/);
    expect(endMapSizeTipLine('ridge')).toMatch(/×/);
  });
});
