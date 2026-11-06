/**
 * Brief leave-vision silhouette for enemy buildings.
 * Presentation-only — does not change fog targeting / minimap.
 */

/** Fade window — long enough to read whole-second last-seen age. */
export const BUILDING_LAST_SEEN_MS = 2500;

export function noteEnemyBuildingVisible(
  map: Map<number, number>,
  buildingId: number,
  nowMs: number,
): void {
  map.set(buildingId, nowMs);
}

/** Milliseconds since last vision; null when no active ghost. */
export function enemyBuildingGhostAgeMs(
  map: Map<number, number>,
  buildingId: number,
  nowMs: number,
  lifeMs = BUILDING_LAST_SEEN_MS,
): number | null {
  const last = map.get(buildingId);
  if (last == null) return null;
  const age = nowMs - last;
  if (age < 0 || age >= lifeMs) return null;
  return age;
}

/** Whole seconds since last vision while the ghost is still alive. */
export function enemyBuildingGhostAgeSec(
  map: Map<number, number>,
  buildingId: number,
  nowMs: number,
  lifeMs = BUILDING_LAST_SEEN_MS,
): number | null {
  const age = enemyBuildingGhostAgeMs(map, buildingId, nowMs, lifeMs);
  if (age == null) return null;
  return Math.floor(age / 1000);
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
  const age = enemyBuildingGhostAgeMs(map, buildingId, nowMs, lifeMs);
  if (age == null) {
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
