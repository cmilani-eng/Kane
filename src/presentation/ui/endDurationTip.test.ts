import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endDurationTipLine } from './endDurationTip';

describe('endDurationTipLine', () => {
  it('labels match duration for the end screen tip', () => {
    const clock = formatMatchClock(125_000);
    expect(endDurationTipLine(125_000)).toBe(
      t('end.durationTip', { clock }),
    );
    expect(endDurationTipLine(125_000)).toContain(clock);
  });
});
