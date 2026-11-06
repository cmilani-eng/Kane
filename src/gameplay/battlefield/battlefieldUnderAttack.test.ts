import { describe, expect, it } from 'vitest';
import type { BattlefieldWorld } from './battlefieldWorld';
import {
  CRITICAL_CHIP_LIFE_MS,
  createUnderAttackAlert,
  notifyUnderAttack,
  tickUnderAttackAlert,
} from './battlefieldUnderAttack';

function stubWorld(): BattlefieldWorld {
  return {
    underAttackAlert: createUnderAttackAlert(),
  } as unknown as BattlefieldWorld;
}

describe('critical under-attack chip auto-dismiss', () => {
  it('arms a chip window on first Keep hit and does not refresh it', () => {
    const world = stubWorld();
    notifyUnderAttack(world, 10, 20, { severity: 'critical', kind: 'keep' });
    expect(world.underAttackAlert.chipLifeMs).toBe(CRITICAL_CHIP_LIFE_MS);

    tickUnderAttackAlert(world, 500);
    const mid = world.underAttackAlert.chipLifeMs;
    expect(mid).toBe(CRITICAL_CHIP_LIFE_MS - 500);

    notifyUnderAttack(world, 10, 20, { severity: 'critical', kind: 'keep' });
    expect(world.underAttackAlert.chipLifeMs).toBe(mid);
  });

  it('dismisses the chip after a few seconds even if hits continue', () => {
    const world = stubWorld();
    notifyUnderAttack(world, 1, 1, { severity: 'critical', kind: 'hero' });
    tickUnderAttackAlert(world, CRITICAL_CHIP_LIFE_MS + 50);
    expect(world.underAttackAlert.chipLifeMs).toBe(0);

    // Sustained hit after dismiss can re-arm a fresh chip window.
    notifyUnderAttack(world, 1, 1, { severity: 'critical', kind: 'hero' });
    expect(world.underAttackAlert.chipLifeMs).toBe(CRITICAL_CHIP_LIFE_MS);
  });
});
