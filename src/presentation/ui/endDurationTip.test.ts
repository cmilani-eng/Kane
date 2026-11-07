import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';
import { endApmTipLine } from './endApmTip';
import { endDurationTipLine } from './endDurationTip';
import { minimapMatchClockTipText } from './minimapMatchClockTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

describe('endDurationTipLine', () => {
  it('labels Time · mm:ss, distinct from APM and pause/minimap tip keys', () => {
    const clock = formatMatchClock(125_000);
    expect(endDurationTipLine(125_000)).toBe(
      t('end.durationTip', { clock }),
    );
    expect(endDurationTipLine(125_000)).toMatch(/^Time \u00b7/);
    expect(endDurationTipLine(125_000)).toContain(clock);
    expect(endDurationTipLine(125_000)).not.toBe(
      endApmTipLine(120, 125_000),
    );
    // Same en copy as pause/minimap tips; distinct i18n key / surface.
    expect(endDurationTipLine(125_000)).toBe(pauseMatchClockTipLine(125_000));
    expect(pauseMatchClockTipLine(125_000)).toBe(
      t('pause.clockTip', { clock }),
    );
    expect(endDurationTipLine(125_000)).toBe(
      minimapMatchClockTipText(125_000),
    );
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );
  });
});
