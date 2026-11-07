import { describe, expect, it } from 'vitest';
import { mapCopy, translate } from '../../i18n';
import { pauseMapTipLine } from './pauseMapTip';

describe('pauseMapTipLine', () => {
  it('names the current skirmish map for the pause tip', () => {
    const ridge = mapCopy('ridge').label;
    expect(pauseMapTipLine('ridge')).toBe(
      translate('en-GB', 'pause.map', { name: ridge }),
    );
    expect(pauseMapTipLine('ridge')).toContain(ridge);
  });
});
