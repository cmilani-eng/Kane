import { describe, expect, it } from 'vitest';
import {
  BUILDING_LAST_SEEN_MS,
  enemyBuildingGhostAlpha,
  noteEnemyBuildingVisible,
  pruneBuildingGhosts,
} from './buildingLastSeenGhost';

describe('building last-seen ghost', () => {
  it('fades after leave-vision and expires', () => {
    const map = new Map<number, number>();
    noteEnemyBuildingVisible(map, 7, 1000);
    expect(enemyBuildingGhostAlpha(map, 7, 1000)).toBeCloseTo(0.42, 2);
    const mid = enemyBuildingGhostAlpha(map, 7, 1000 + BUILDING_LAST_SEEN_MS / 2);
    expect(mid).toBeGreaterThan(0.1);
    expect(mid).toBeLessThan(0.42);
    expect(enemyBuildingGhostAlpha(map, 7, 1000 + BUILDING_LAST_SEEN_MS)).toBe(0);
    expect(map.has(7)).toBe(false);
  });

  it('prunes ghosts for destroyed buildings', () => {
    const map = new Map<number, number>([
      [1, 0],
      [2, 0],
    ]);
    pruneBuildingGhosts(map, new Set([2]));
    expect(map.has(1)).toBe(false);
    expect(map.has(2)).toBe(true);
  });
});
