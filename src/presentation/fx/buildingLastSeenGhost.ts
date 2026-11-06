/**
 * Brief leave-vision silhouette for enemy buildings.
 * Presentation-only — does not change fog targeting / minimap.
 */

export const BUILDING_LAST_SEEN_MS = 1100;

export function noteEnemyBuildingVisible(
  map: Map<number, number>,
  buildingId: number,
  nowMs: number,
): void {
  map.set(buildingId, nowMs);
}

/**
 * Fade alpha while a building just left vision.
 * Returns 0 when expired (and deletes the map entry).
 */
export function enemyBuildingGhostAlpha(
  map: Map<number, number>,
  buildingId: number,
  nowMs: number,
  lifeMs = BUILDING_LAST_SEEN_MS,
): number {
  const last = map.get(buildingId);
  if (last == null) return 0;
  const age = nowMs - last;
  if (age >= lifeMs) {
    map.delete(buildingId);
    return 0;
  }
  return 0.42 * (1 - age / lifeMs);
}

export function pruneBuildingGhosts(
  map: Map<number, number>,
  livingIds: ReadonlySet<number>,
): void {
  for (const id of [...map.keys()]) {
    if (!livingIds.has(id)) map.delete(id);
  }
}
