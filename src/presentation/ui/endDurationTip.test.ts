import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endApmTipLine } from './endApmTip';
import { endDurationTipLine } from './endDurationTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

describe('endDurationTipLine', () => {
  it('labels Time · mm:ss from match elapsed', () => {
    const clock = formatMatchClock(125_000);
    expect(endDurationTipLine(125_000)).toBe(
      t('end.durationTip', { clock }),
    );
    expect(endDurationTipLine(125_000)).toMatch(/^Time ·/);
    expect(endDurationTipLine(125_000)).toContain(clock);
    expect(endDurationTipLine(125_000)).toBe(
      pauseMatchClockTipLine(125_000),
    );
    expect(endDurationTipLine(125_000)).not.toBe(
      endApmTipLine(120, 125_000),
    );
  });
});
