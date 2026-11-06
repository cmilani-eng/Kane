import { describe, expect, it } from 'vitest';
import { mapCopy, t } from '../../i18n';
import { formatMatchClock } from './matchClock';

describe('end screen map + duration meta', () => {
  it('formats map name and mm:ss duration for the panel line', () => {
    const map = mapCopy('ridge').label;
    const clock = formatMatchClock(125_000);
    expect(clock).toBe('2:05');
    expect(t('end.meta', { map, clock })).toContain(map);
    expect(t('end.meta', { map, clock })).toContain('2:05');
  });

  it('keeps minutes past 59 for long skirmishes', () => {
    expect(formatMatchClock(3_661_000)).toBe('61:01');
  });

  it('formats standing forces from match-summary left counts', () => {
    const line = t('end.recap', { units: 4, buildings: 2 });
    expect(line).toContain('4');
    expect(line).toContain('2');
  });
});
