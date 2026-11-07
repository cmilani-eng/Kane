import { describe, expect, it } from 'vitest';
import { unitArmorClass } from './unitArmorClass';

describe('unitArmorClass', () => {
  it('maps GDD roles for glanceable selection labels', () => {
    expect(unitArmorClass('serf')).toBe('worker');
    expect(unitArmorClass('tin_knight')).toBe('infantry');
    expect(unitArmorClass('hammer_dwarf')).toBe('heavy');
    expect(unitArmorClass('bolt_boy')).toBe('ranged');
    expect(unitArmorClass('boar_knight')).toBe('cavalry');
    expect(unitArmorClass('boom_cart')).toBe('siege');
    expect(unitArmorClass('eyebat')).toBe('flying');
    expect(unitArmorClass('grabber')).toBe('control');
    expect(unitArmorClass('boniface')).toBe('hero');
  });
});
