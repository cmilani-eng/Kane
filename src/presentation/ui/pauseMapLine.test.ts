import { describe, expect, it } from 'vitest';
import { mapCopy, translate } from '../../i18n';

describe('pause map line', () => {
  it('names the selected skirmish map in each locale', () => {
    const ridge = mapCopy('ridge').label;
    expect(translate('en-GB', 'pause.map', { name: ridge })).toBe(
      'Map  ·  Ridge',
    );
    expect(translate('pt-BR', 'pause.map', { name: 'Cume' })).toBe(
      'Mapa  ·  Cume',
    );
    expect(translate('es', 'pause.map', { name: 'Cresta' })).toBe(
      'Mapa  ·  Cresta',
    );
  });

  it('pairs map + difficulty on the pause setup line', () => {
    expect(
      translate('en-GB', 'pause.setup', { map: 'Gap', difficulty: 'Hard' }),
    ).toBe('Gap  ·  Hard');
    expect(
      translate('pt-BR', 'pause.setup', { map: 'Brecha', difficulty: 'Difícil' }),
    ).toBe('Brecha  ·  Difícil');
  });
});
