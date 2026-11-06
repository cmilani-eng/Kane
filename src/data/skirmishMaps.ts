/**
 * Skirmish layouts. World size stays `MAP` so fog and pathfinding grids
 * do not change. A map only moves bases, Scrap (gold), and Core.
 */
import { MAP } from '../config/balance';
import type { ResourceId } from './resources';

export type SkirmishMapId = 'meadow' | 'ford';

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapNodeSpot extends MapPoint {
  resourceId: ResourceId;
  amount: number;
}

export interface SkirmishMapDef {
  id: SkirmishMapId;
  playerBase: MapPoint;
  enemyBase: MapPoint;
  nodes: MapNodeSpot[];
  cores: MapPoint[];
}

export const SKIRMISH_MAP_ORDER: SkirmishMapId[] = ['meadow', 'ford'];

const meadowNodes: MapNodeSpot[] = [
  { x: 520, y: MAP.height - 280, resourceId: 'gold', amount: 120 },
  { x: 700, y: MAP.height - 520, resourceId: 'gold', amount: 100 },
  { x: 300, y: MAP.height - 600, resourceId: 'gold', amount: 90 },
  { x: 900, y: MAP.height - 360, resourceId: 'magic_crystals', amount: 60 },
  { x: 1100, y: MAP.height - 500, resourceId: 'magic_crystals', amount: 50 },
  { x: MAP.width * 0.65, y: MAP.height * 0.55, resourceId: 'gold', amount: 100 },
  { x: MAP.width * 0.7, y: MAP.height * 0.35, resourceId: 'magic_crystals', amount: 55 },
];

const meadowCores: MapPoint[] = [
  { x: MAP.width * 0.42, y: MAP.height * 0.48 },
  { x: MAP.width * 0.58, y: MAP.height * 0.42 },
  { x: MAP.width * 0.5, y: MAP.height * 0.62 },
];

/** Opposite corners. Gold and Core sit on a horizontal crossing. */
const fordNodes: MapNodeSpot[] = [
  { x: 760, y: 560, resourceId: 'gold', amount: 120 },
  { x: 400, y: 700, resourceId: 'gold', amount: 100 },
  { x: 900, y: 320, resourceId: 'gold', amount: 90 },
  { x: 1100, y: 800, resourceId: 'magic_crystals', amount: 60 },
  { x: 1400, y: 760, resourceId: 'magic_crystals', amount: 50 },
  { x: 1680, y: 840, resourceId: 'gold', amount: 100 },
  { x: 1760, y: 1040, resourceId: 'magic_crystals', amount: 55 },
];

const fordCores: MapPoint[] = [
  { x: 1080, y: 800 },
  { x: 1400, y: 900 },
  { x: 1720, y: 780 },
];

export const SKIRMISH_MAPS: Record<SkirmishMapId, SkirmishMapDef> = {
  meadow: {
    id: 'meadow',
    playerBase: { x: 420, y: MAP.height - 420 },
    enemyBase: { x: MAP.width * 0.55, y: MAP.height * 0.45 },
    nodes: meadowNodes,
    cores: meadowCores,
  },
  ford: {
    id: 'ford',
    playerBase: { x: 480, y: 420 },
    enemyBase: { x: MAP.width - 480, y: MAP.height - 420 },
    nodes: fordNodes,
    cores: fordCores,
  },
};

export function getSkirmishMap(id: unknown): SkirmishMapDef {
  if (id === 'ford') return SKIRMISH_MAPS.ford;
  return SKIRMISH_MAPS.meadow;
}
