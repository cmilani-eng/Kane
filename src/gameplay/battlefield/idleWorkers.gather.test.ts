import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from './battlefieldWorld';
import {
  listIdleWorkers,
  nearestIdleGatherResource,
} from './idleWorkers';

describe('nearestIdleGatherResource', () => {
  it('hints the nearest remaining resource for empty-handed idle workers', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    const idles = listIdleWorkers(world).filter((u) => u.carrying <= 0);
    expect(idles.length).toBeGreaterThan(0);

    const hint = nearestIdleGatherResource(world);
    expect(hint === 'gold' || hint === 'magic_crystals').toBe(true);

    for (const n of world.nodes) n.remaining = 0;
    expect(nearestIdleGatherResource(world)).toBeNull();
  });
});
