import { beforeEach, describe, expect, it } from 'vitest';
import { rememberMatchPrefs } from '../../database/matchPrefs';
import { setLocale, t } from '../../i18n';
import { endApmTipLine } from './endApmTip';
import { endAvgDurationTipLine } from './endAvgDurationTip';
import { endDurationTipLine } from './endDurationTip';
import { endVisionTipLine } from './endVisionTip';
import { formatMatchClock } from './matchClock';
import { minimapMatchClockTipText } from './minimapMatchClockTip';
import { pauseMatchClockTipLine } from './pauseMatchClockTip';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  setLocale('en-GB');
});

describe('endDurationTipLine', () => {
  it('labels Time · mm:ss with middot, distinct from APM · / Avg time · / Vision ·', () => {
    const clock = formatMatchClock(125_000);
    const tip = endDurationTipLine(125_000);
    expect(tip).toBe(t('end.durationTip', { clock }));
    expect(tip).toBe('Time · 2:05');
    expect(tip).toMatch(/^Time \u00b7 /);
    expect(tip).toContain(clock);

    expect(tip).not.toBe(endApmTipLine(120, 125_000));
    expect(endApmTipLine(120, 125_000)).toBe('APM · 58');
    expect(endApmTipLine(120, 125_000)).toMatch(/^APM \u00b7 /);

    // Career Avg time peer needs prefs with duration samples.
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);
    expect(tip).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe('Avg time · 2:00');
    expect(endAvgDurationTipLine()).toMatch(/^Avg time \u00b7 /);

    expect(tip).not.toBe(endVisionTipLine(5));
    expect(endVisionTipLine(5)).toBe('Vision · 5');
    expect(endVisionTipLine(5)).toMatch(/^Vision \u00b7 /);
    expect(tip).not.toMatch(/^APM \u00b7 /);
    expect(tip).not.toMatch(/^Avg time \u00b7 /);
    expect(tip).not.toMatch(/^Vision \u00b7 /);

    // Same en copy as pause/minimap tips; distinct i18n key / surface.
    expect(tip).toBe(pauseMatchClockTipLine(125_000));
    expect(pauseMatchClockTipLine(125_000)).toBe(
      t('pause.clockTip', { clock }),
    );
    expect(tip).toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );
    expect(endDurationTipLine(0)).toBe(
      t('end.durationTip', { clock: formatMatchClock(0) }),
    );
    expect(endDurationTipLine(0)).toBe('Time · 0:00');
  });

  it('localizes Time middot for pt-BR and es; stays distinct from APM / Avg time / Vision', () => {
    const clock = formatMatchClock(125_000);
    rememberMatchPrefs('weirdos', 'hard', 'crossing', 90_000, true);
    rememberMatchPrefs('nobles', 'normal', 'ridge', 150_000, false);

    setLocale('pt-BR');
    const pt = endDurationTipLine(125_000);
    expect(pt).toBe(t('end.durationTip', { clock }));
    expect(pt).toBe('Tempo · 2:05');
    expect(pt).toMatch(/^Tempo \u00b7 /);
    expect(pt).not.toBe(endApmTipLine(120, 125_000));
    expect(endApmTipLine(120, 125_000)).toBe('APM · 58');
    expect(pt).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe('Tempo médio · 2:00');
    expect(endAvgDurationTipLine()).toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toBe(endVisionTipLine(5));
    expect(endVisionTipLine(5)).toBe('Visão · 5');
    expect(pt).not.toMatch(/^APM \u00b7 /);
    expect(pt).not.toMatch(/^Tempo médio \u00b7 /);
    expect(pt).not.toMatch(/^Visão \u00b7 /);
    expect(pt).toBe(pauseMatchClockTipLine(125_000));
    expect(pauseMatchClockTipLine(125_000)).toBe(
      t('pause.clockTip', { clock }),
    );
    expect(pt).toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );

    setLocale('es');
    const es = endDurationTipLine(125_000);
    expect(es).toBe(t('end.durationTip', { clock }));
    expect(es).toBe('Tiempo · 2:05');
    expect(es).toMatch(/^Tiempo \u00b7 /);
    expect(es).not.toBe(endApmTipLine(120, 125_000));
    expect(endApmTipLine(120, 125_000)).toBe('APM · 58');
    expect(es).not.toBe(endAvgDurationTipLine());
    expect(endAvgDurationTipLine()).toBe('Tiempo medio · 2:00');
    expect(endAvgDurationTipLine()).toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toBe(endVisionTipLine(5));
    expect(endVisionTipLine(5)).toBe('Visión · 5');
    expect(es).not.toMatch(/^APM \u00b7 /);
    expect(es).not.toMatch(/^Tiempo medio \u00b7 /);
    expect(es).not.toMatch(/^Visión \u00b7 /);
    expect(es).toBe(pauseMatchClockTipLine(125_000));
    expect(pauseMatchClockTipLine(125_000)).toBe(
      t('pause.clockTip', { clock }),
    );
    expect(es).toBe(minimapMatchClockTipText(125_000));
    expect(minimapMatchClockTipText(125_000)).toBe(
      t('hud.minimapClock', { clock }),
    );
    setLocale('en-GB');
  });
});
