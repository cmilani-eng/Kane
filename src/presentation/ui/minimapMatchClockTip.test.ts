import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endDurationTipLine } from './endDurationTip';
import { formatMatchClock } from './matchClock';
import { minimapMatchClockTipText } from './minimapMatchClockTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

describe('minimapMatchClockTipText', () => {
  it('labels Time · mm:ss, distinct from pause/end tip keys', () => {
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock: formatMatchClock(125_000) }),
    );
    expect(minimapMatchClockTipText(125_000)).toMatch(/^Time ·/);
    expect(minimapMatchClockTipText(125_000)).toContain(
      formatMatchClock(125_000),
    );
    // Same en copy as pause/end tips; distinct i18n key / surface.
    expect(minimapMatchClockTipText(125_000)).toBe(
      pauseMatchClockTipLine(125_000),
    );
    expect(minimapMatchClockTipText(125_000)).toBe(
      endDurationTipLine(125_000),
    );
    expect(minimapMatchClockTipText(0)).toBe(
      t('hud.minimapClock', { clock: formatMatchClock(0) }),
    );
  });
});
