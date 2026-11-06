import { describe, expect, it } from 'vitest';
import { mapCopy, t } from '../../i18n';
import { endMapPlayedTipLine } from './endMapPlayedTip';

describe('endMapPlayedTipLine', () => {
  it('labels the map that was played', () => {
    const name = mapCopy('ridge').label;
    expect(endMapPlayedTipLine('ridge')).toBe(t('end.mapTip', { name }));
    expect(endMapPlayedTipLine('ridge')).toContain(name);
  });
});
