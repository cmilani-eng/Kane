import { describe, expect, it } from 'vitest';
import { mapCopy, t } from '../../i18n';
import { formatMatchClock } from './matchClock';

describe('end screen map + duration meta', () => {
  it('formats map, difficulty, and mm:ss duration for the panel line', () => {
    const map = mapCopy('ridge').label;
    const clock = formatMatchClock(125_000);
    expect(clock).toBe('2:05');
    const line = t('end.meta', { map, difficulty: 'Hard', clock });
    expect(line).toContain(map);
    expect(line).toContain('Hard');
    expect(line).toContain('2:05');
  });

  it('keeps minutes past 59 for long skirmishes', () => {
    expect(formatMatchClock(3_661_000)).toBe('61:01');
  });

  it('formats standing forces from match-summary left counts', () => {
    const line = t('end.recap', { units: 4, buildings: 2 });
    expect(line).toContain('4');
    expect(line).toContain('2');
  });

  it('formats kill / loss ratio from combat tallies', () => {
    const line = t('end.killRatio', { kills: 7, losses: 3 });
    expect(line).toContain('7');
    expect(line).toContain('3');
  });

  it('formats gold and crystal gathered from deposit tallies', () => {
    const line = t('end.gathered', { gold: 120, crystals: 45 });
    expect(line).toContain('120');
    expect(line).toContain('45');
  });
});

