import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

describe('pauseMatchClockTipLine', () => {
  it('labels Time · mm:ss from elapsed ms', () => {
    expect(pauseMatchClockTipLine(125_000)).toBe(
      t('pause.clockTip', { clock: formatMatchClock(125_000) }),
    );
    expect(pauseMatchClockTipLine(125_000)).toMatch(/^Time ·/);
    expect(pauseMatchClockTipLine(0)).toBe(
      t('pause.clockTip', { clock: formatMatchClock(0) }),
    );
  });
});

