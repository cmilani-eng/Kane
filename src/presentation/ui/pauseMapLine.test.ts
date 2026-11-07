import { describe, expect, it } from 'vitest';
import { mapCopy, translate } from '../../i18n';

describe('pause map line', () => {
  it('names the selected skirmish map in each locale', () => {
    const ridge = mapCopy('ridge').label;
    // U+00B7 middot with single spaces — same as other HUD tips.
    expect(translate('en-GB', 'pause.map', { name: ridge })).toBe(
      'Map \u00b7 Ridge',
    );
    expect(translate('pt-BR', 'pause.map', { name: 'Cume' })).toBe(
      'Mapa \u00b7 Cume',
    );
    expect(translate('es', 'pause.map', { name: 'Cresta' })).toBe(
      'Mapa \u00b7 Cresta',
    );
  });

  it('pairs species, map, and difficulty on the pause setup line', () => {
    expect(
      translate('en-GB', 'pause.setup', {
        species: 'The Brutes',
        map: 'Gap',
        difficulty: 'Hard',
      }),
    ).toBe('The Brutes  ·  Gap  ·  Hard');
    expect(
      translate('pt-BR', 'pause.setup', {
        species: 'Os Brutos',
        map: 'Brecha',
        difficulty: 'Difícil',
      }),
    ).toBe('Os Brutos  ·  Brecha  ·  Difícil');
  });
});
