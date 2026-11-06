import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';

describe('hero ability hotkey tip copy', () => {
  it('lists Q/W/E ability names', () => {
    const line = t('sel.heroHotkeys', {
      q: 'Q',
      qName: 'Ground Smash',
      w: 'W',
      wName: 'Get Angry',
      e: 'E',
      eName: 'BIG BONK',
    });
    expect(line).toContain('Q');
    expect(line).toContain('Ground Smash');
    expect(line).toContain('W');
    expect(line).toContain('E');
    expect(line).toContain('BIG BONK');
  });
});
