/** Skate Rush 3 — the put-downs at the top of the screen: Extreme only, and a new one every 4 seconds. */
import { describe, expect, it } from 'vitest';
import { CATALOGS, LOCALES } from '../../i18n';
import { LEVEL_IDS } from './skateLevels';
import { CRASH_TAUNT_KEY, TAUNT_KEYS, TAUNT_STEPS, tauntFor } from './skateTaunts';

const at = (frame: number, first = 0, over = false) => tauntFor({ level: 'extreme', frame, over }, first);

describe('taunts', () => {
  it.each(LEVEL_IDS.filter((id) => id !== 'extreme'))('%s has none, running or crashed', (level) => {
    for (const over of [false, true]) {
      for (let frame = 0; frame < 6000; frame += 50) expect(tauntFor({ level, frame, over }, 3)).toBeUndefined();
    }
  });

  it('Extreme has one up from the first step', () => {
    expect(at(0)).toBe(TAUNT_KEYS[0]);
  });

  it('changes every 4 seconds, and never says the same thing twice in a row', () => {
    expect(TAUNT_STEPS).toBe(240);
    for (let n = 0; n < 40; n++) {
      const start = n * TAUNT_STEPS;
      expect(at(start + TAUNT_STEPS - 1)).toBe(at(start));
      expect(at(start + TAUNT_STEPS)).not.toBe(at(start));
    }
  });

  it('gets through all of them, from whichever one a run starts with', () => {
    for (let first = 0; first < TAUNT_KEYS.length; first++) {
      const said = TAUNT_KEYS.map((_, n) => at(n * TAUNT_STEPS, first));
      expect(said[0]).toBe(TAUNT_KEYS[first]);
      expect(new Set(said).size).toBe(TAUNT_KEYS.length);
    }
  });

  it('has a last word after a crash', () => {
    expect(at(500, 2, true)).toBe(CRASH_TAUNT_KEY);
  });

  it.each(LOCALES)('are all different, and short enough for the top of a phone, in %s', (locale) => {
    const lines = [...TAUNT_KEYS, CRASH_TAUNT_KEY].map((key) => CATALOGS[locale][key]);
    expect(new Set(lines).size).toBe(lines.length);
    for (const line of lines) expect(line.length, line).toBeLessThanOrEqual(36);
  });
});
