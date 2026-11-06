/**
 * Move / attack-move ground waypoint markers.
 * Stay solid while units march toward them, then fade out.
 */
import { dist } from '../math';
import type { BattlefieldWorld } from './battlefieldWorld';

export type WaypointKind = 'move' | 'attackMove';

export interface WaypointMarker {
  id: number;
  x: number;
  y: number;
  kind: WaypointKind;
  /** Units ordered to this point (formation offsets allowed nearby). */
  unitIds: number[];
  /** False until march complete, then fade. */
  fading: boolean;
  lifeMs: number;
  maxLifeMs: number;
}

const MAX_MARKERS = 12;
const FADE_MS = 450;
/** Goal within this of marker counts as still marching here. */
const GOAL_NEAR = 100;

let nextMarkerId = 1;

export function ensureWaypointMarkers(world: BattlefieldWorld): void {
  if (!world.waypointMarkers) world.waypointMarkers = [];
}

export function spawnWaypointMarker(
  world: BattlefieldWorld,
  x: number,
  y: number,
  kind: WaypointKind,
  unitIds: number[],
): void {
  if (unitIds.length === 0) return;
  ensureWaypointMarkers(world);
  const list = world.waypointMarkers;
  if (list.length >= MAX_MARKERS) list.shift();
  list.push({
    id: nextMarkerId++,
    x,
    y,
    kind,
    unitIds: unitIds.slice(),
    fading: false,
    lifeMs: FADE_MS,
    maxLifeMs: FADE_MS,
  });
}

function unitStillMarchingTo(
  world: BattlefieldWorld,
  unitId: number,
  mx: number,
  my: number,
): boolean {
  const u = world.units.find((o) => o.id === unitId);
  if (!u || u.hp <= 0) return false;
  const goal =
    u.path.length > 0 ? u.path[u.path.length - 1]! : u.moveTarget;
  if (!goal) return false;
  return dist(goal.x, goal.y, mx, my) <= GOAL_NEAR;
}

export function tickWaypointMarkers(
  world: BattlefieldWorld,
  dtMs: number,
): void {
  ensureWaypointMarkers(world);
  const list = world.waypointMarkers;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i]!;
    if (!m.fading) {
      const marching = m.unitIds.some((id) =>
        unitStillMarchingTo(world, id, m.x, m.y),
      );
      if (!marching) {
        m.fading = true;
        m.lifeMs = FADE_MS;
        m.maxLifeMs = FADE_MS;
      }
      continue;
    }
    m.lifeMs -= dtMs;
    if (m.lifeMs <= 0) list.splice(i, 1);
  }
}
