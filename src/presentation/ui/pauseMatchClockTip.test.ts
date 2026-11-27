import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { endDurationTipLine } from './endDurationTip';
import { formatMatchClock } from './matchClock';
import { minimapMatchClockTipText } from './minimapMatchClockTip';
import { minimapVisionTipText } from './minimapVisionTip';
import { pauseApmTipLine } from './pauseApmTip';
import { pauseAvgDurationTipLine } from './pauseAvgDurationTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseMatchClockTipLine', () => {
  it('labels Time · mm:ss with middot, distinct from APM · / Avg time · / Vision ·', () => {
    const clock = formatMatchClock(125_000);
    const tip = pauseMatchClockTipLine(125_000);
    expect(tip).toBe(t('pause.clockTip', { clock }));
    expect(tip).toBe('Time · 2:05');
    expect(tip).toMatch(/^Time \u00b7 /);
    expect(tip).toContain(clock);

    expect(tip).not.toBe(pauseApmTipLine(120, 125_000));
    expect(pauseApmTipLine(120, 125_000)).toBe('APM · 58');
    expect(pauseApmTipLine(120, 125_000)).toMatch(/^APM \u00b7 /);
    expect(tip).not.toBe(pauseAvgDurationTipLine(125_000));
    expect(pauseAvgDurationTipLine(125_000)).toBe('Avg time · 2:05');
    expect(pauseAvgDurationTipLine(125_000)).toMatch(/^Avg time \u00b7 /);
    expect(tip).not.toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe('Vision · 5');
    expect(minimapVisionTipText(5)).toMatch(/^Vision \u00b7 /);
    expect(tip).not.toMatch(/^APM \u00b7 /);
    expect(tip).not.toMatch(/^Avg time \u00b7 /);
    expect(tip).not.toMatch(/^Vision \u00b7 /);

    // Same en copy as minimap/end tips; distinct i18n key / surface.
    expect(tip).toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );
    expect(tip).toBe(endDurationTipLine(125_000));
    expect(endDurationTipLine(125_000)).toBe(t('end.durationTip', { clock }));
    expect(pauseMatchClockTipLine(0)).toBe(
      t('pause.clockTip', { clock: formatMatchClock(0) }),
    );
    expect(pauseMatchClockTipLine(0)).toBe('Time · 0:00');
  });

  it('localizes Time middot for pt-BR and es; stays distinct from APM / Avg time / Vision', () => {
    const clock = formatMatchClock(125_000);

    setLocale('pt-BR');
    const pt = pauseMatchClockTipLine(125_000);
    expect(pt).toBe(t('pause.clockTip', { clock }));
    expect(pt).toBe('Tempo · 2:05');
    expect(pt).toMatch(/^Tempo \u00b7 /);
    expect(pt).not.toBe(pauseApmTipLine(120, 125_000));
    expect(pauseApmTipLine(120, 125_000)).toBe('APM · 58');
    expect(pt).not.toBe(pauseAvgDurationTipLine(125_000));
    expect(pauseAvgDurationTipLine(125_000)).toBe('Tempo médio · 2:05');
    expect(pauseAvgDurationTipLine(125_000)).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe('Visão · 5');
    expect(pt).not.toMatch(/^APM \u00b7 /);
    expect(pt).not.toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^Visão \u00b7 /);
    expect(pt).toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );
    expect(pt).toBe(endDurationTipLine(125_000));
    expect(endDurationTipLine(125_000)).toBe(t('end.durationTip', { clock }));

    setLocale('es');
    const es = pauseMatchClockTipLine(125_000);
    expect(es).toBe(t('pause.clockTip', { clock }));
    expect(es).toBe('Tiempo · 2:05');
    expect(es).toMatch(/^Tiempo \u00b7 /);
    expect(es).not.toBe(pauseApmTipLine(120, 125_000));
    expect(pauseApmTipLine(120, 125_000)).toBe('APM · 58');
    expect(es).not.toBe(pauseAvgDurationTipLine(125_000));
    expect(pauseAvgDurationTipLine(125_000)).toBe('Tiempo medio · 2:05');
    expect(pauseAvgDurationTipLine(125_000)).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toBe(minimapVisionTipText(5));
    expect(minimapVisionTipText(5)).toBe('Visión · 5');
    expect(es).not.toMatch(/^APM \u00b7 /);
    expect(es).not.toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^Visión \u00b7 /);
    expect(es).toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );
    expect(es).toBe(endDurationTipLine(125_000));
    expect(endDurationTipLine(125_000)).toBe(t('end.durationTip', { clock }));
    setLocale('en-GB');
  });
});
