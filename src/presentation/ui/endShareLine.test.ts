import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { formatEndShareLine } from './endShareLine';

beforeEach(() => {
  resetLocaleForTests();
});

describe('formatEndShareLine', () => {
  it('builds a one-line KANE result from known end facts', () => {
    const line = formatEndShareLine({
      win: true,
      speciesName: 'The Brutes',
      mapLabel: 'Crossing',
      difficultyLabel: 'Hard',
      clock: '03:21',
      units: 8,
      buildings: 3,
    });
    expect(line).toContain('KANE');
    expect(line).toContain('VICTORY');
    expect(line).toContain('The Brutes');
    expect(line).toContain('Crossing');
    expect(line).toContain('Hard');
    expect(line).toContain('03:21');
    expect(line).toContain('8');
    expect(line).toContain('3');
  });

  it('omits standing when counts are missing', () => {
    setLocale('es');
    const line = formatEndShareLine({
      win: false,
      speciesName: 'Los Nobles',
      mapLabel: 'Ridge',
      clock: '01:02',
    });
    expect(line).toContain('KANE');
    expect(line).toContain('DERROTA');
    expect(line).not.toMatch(/\bu\b/);
  });
});
