import { describe, expect, it } from 'vitest';
import { minimapSelectedUnitBlip } from './minimapSelectedBlip';

describe('minimapSelectedUnitBlip', () => {
  it('uses a brighter fill than the default army green/red dots', () => {
    const player = minimapSelectedUnitBlip(true);
    const enemy = minimapSelectedUnitBlip(false);
    expect(player.fill).toBe(0xfff0a8);
    expect(enemy.fill).toBe(0xffb0b0);
    expect(player.ringR).toBeGreaterThan(player.r);
    expect(player.r).toBeGreaterThan(2.4);
  });
});
