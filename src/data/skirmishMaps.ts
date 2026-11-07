/**
 * Skirmish map catalog — layout seeds for bases, nodes, CORE, and tile paint.
 * Same systems for every map; only placement / tileSeed differ.
 */
import { MAP } from '../config/balance';
import type { ResourceId } from './resources';

export type SkirmishMapId = 'crossing' | 'ridge' | 'gap';

export interface SkirmishMapSpot {
  x: number;
  y: number;
  resourceId: ResourceId;
  amount: number;
}

export interface SkirmishMapDef {
  id: SkirmishMapId;
  /** Procedural ground paint variant. */
  tileSeed: number;
  playerBase: { x: number; y: number };
  enemyBase: { x: number; y: number };
  nodes: SkirmishMapSpot[];
  cores: Array<{ x: number; y: number }>;
}

/** Classic bottom-left vs mid-field crossing (original layout). */
const CROSSING: SkirmishMapDef = {
  id: 'crossing',
  tileSeed: 1,
  playerBase: { x: 420, y: MAP.height - 420 },
  enemyBase: { x: MAP.width * 0.55, y: MAP.height * 0.45 },
  nodes: [
    { x: 520, y: MAP.height - 280, resourceId: 'gold', amount: 1200 },
    { x: 700, y: MAP.height - 520, resourceId: 'gold', amount: 1000 },
    { x: 300, y: MAP.height - 600, resourceId: 'gold', amount: 900 },
    { x: 400, y: 420, resourceId: 'gold', amount: 900 },
    { x: 1100, y: 1400, resourceId: 'gold', amount: 1000 },
    { x: 1500, y: 280, resourceId: 'gold', amount: 1100 },
    { x: 1900, y: 980, resourceId: 'gold', amount: 1000 },
    { x: 2100, y: 420, resourceId: 'gold', amount: 900 },
    { x: 900, y: MAP.height - 360, resourceId: 'magic_crystals', amount: 60 },
    { x: 1100, y: MAP.height - 500, resourceId: 'magic_crystals', amount: 50 },
    {
      x: MAP.width * 0.65,
      y: MAP.height * 0.55,
      resourceId: 'gold',
      amount: 1000,
    },
    {
      x: MAP.width * 0.7,
      y: MAP.height * 0.35,
      resourceId: 'magic_crystals',
      amount: 55,
    },
  ],
  cores: [
    { x: MAP.width * 0.42, y: MAP.height * 0.48 },
    { x: MAP.width * 0.58, y: MAP.height * 0.42 },
    { x: MAP.width * 0.5, y: MAP.height * 0.62 },
  ],
};

/** Ridge — player north-west, enemy south-east, shifted resource / CORE belt. */
const RIDGE: SkirmishMapDef = {
  id: 'ridge',
  tileSeed: 17,
  playerBase: { x: 380, y: 380 },
  enemyBase: { x: MAP.width - 420, y: MAP.height - 380 },
  nodes: [
    { x: 560, y: 280, resourceId: 'gold', amount: 1100 },
    { x: 720, y: 520, resourceId: 'gold', amount: 1000 },
    { x: 280, y: 620, resourceId: 'gold', amount: 950 },
    { x: 1200, y: 260, resourceId: 'gold', amount: 1000 },
    { x: 1680, y: 480, resourceId: 'gold', amount: 1100 },
    { x: 900, y: 1100, resourceId: 'gold', amount: 900 },
    { x: 2000, y: 360, resourceId: 'gold', amount: 1000 },
    { x: 880, y: 360, resourceId: 'magic_crystals', amount: 58 },
    { x: 1040, y: 560, resourceId: 'magic_crystals', amount: 52 },
    {
      x: MAP.width * 0.48,
      y: MAP.height * 0.52,
      resourceId: 'gold',
      amount: 1050,
    },
    {
      x: MAP.width * 0.62,
      y: MAP.height * 0.68,
      resourceId: 'magic_crystals',
      amount: 60,
    },
    {
      x: MAP.width - 520,
      y: MAP.height - 280,
      resourceId: 'gold',
      amount: 1000,
    },
  ],
  cores: [
    { x: MAP.width * 0.38, y: MAP.height * 0.4 },
    { x: MAP.width * 0.55, y: MAP.height * 0.55 },
    { x: MAP.width * 0.68, y: MAP.height * 0.38 },
  ],
};

/** Gap — player on the west edge, enemy on the east, CORE in a vertical line. */
const GAP: SkirmishMapDef = {
  id: 'gap',
  tileSeed: 29,
  playerBase: { x: 380, y: MAP.height / 2 },
  enemyBase: { x: MAP.width - 380, y: MAP.height / 2 },
  nodes: [
    { x: 560, y: 640, resourceId: 'gold', amount: 1150 },
    { x: 500, y: 980, resourceId: 'gold', amount: 1000 },
    { x: 900, y: 280, resourceId: 'gold', amount: 1000 },
    { x: 1400, y: 260, resourceId: 'gold', amount: 1100 },
    { x: 1100, y: 1320, resourceId: 'gold', amount: 900 },
    { x: 2000, y: 280, resourceId: 'gold', amount: 1000 },
    { x: 720, y: 800, resourceId: 'magic_crystals', amount: 55 },
    { x: 980, y: 620, resourceId: 'gold', amount: 1050 },
    { x: 1420, y: 980, resourceId: 'magic_crystals', amount: 58 },
    { x: 1880, y: 700, resourceId: 'gold', amount: 1100 },
    { x: 1760, y: 1040, resourceId: 'gold', amount: 950 },
    { x: 1680, y: 780, resourceId: 'magic_crystals', amount: 50 },
  ],
  cores: [
    { x: MAP.width / 2, y: MAP.height * 0.32 },
    { x: MAP.width / 2, y: MAP.height / 2 },
    { x: MAP.width / 2, y: MAP.height * 0.68 },
  ],
};

export const SKIRMISH_MAPS: Record<SkirmishMapId, SkirmishMapDef> = {
  crossing: CROSSING,
  ridge: RIDGE,
  gap: GAP,
};

export const SKIRMISH_MAP_ORDER: SkirmishMapId[] = ['crossing', 'ridge', 'gap'];

export const DEFAULT_SKIRMISH_MAP: SkirmishMapId = 'crossing';

export function isSkirmishMapId(v: unknown): v is SkirmishMapId {
  return typeof v === 'string' && v in SKIRMISH_MAPS;
}

export function getSkirmishMap(id?: string | null): SkirmishMapDef {
  if (id && isSkirmishMapId(id)) return SKIRMISH_MAPS[id];
  return SKIRMISH_MAPS[DEFAULT_SKIRMISH_MAP];
}
