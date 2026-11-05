/**
 * Data-driven resources.
 * Dev brief canonical: Gold + Magic Crystals.
 * GDD Scrap / Core map as aliases → same wallet keys.
 */

export type ResourceId = 'gold' | 'magic_crystals';

/** GDD names → brief IDs (for docs / future content). */
export const RESOURCE_ALIASES = {
  scrap: 'gold',
  core: 'magic_crystals',
} as const satisfies Record<string, ResourceId>;

export interface ResourceDef {
  id: ResourceId;
  label: string;
  /** GDD alias label (shown in HUD tip). */
  gddAlias: string;
  source: string;
  spendsOn: string;
  color: number;
}

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  gold: {
    id: 'gold',
    label: 'Gold',
    gddAlias: 'Scrap',
    source: 'Map gather piles',
    spendsOn: 'Workers, basic units, basic buildings',
    color: 0xf0c75e,
  },
  magic_crystals: {
    id: 'magic_crystals',
    label: 'Magic Crystals',
    gddAlias: 'Core',
    source: 'Crystal nodes on the map',
    spendsOn: 'Advanced units, upgrades, heroes',
    color: 0x7ec8ff,
  },
};

export type ResourceWallet = Record<ResourceId, number>;

export function emptyWallet(starting: Partial<ResourceWallet> = {}): ResourceWallet {
  return {
    gold: starting.gold ?? 0,
    magic_crystals: starting.magic_crystals ?? 0,
  };
}

export function listResources(): ResourceDef[] {
  return Object.values(RESOURCES);
}

export function resolveResourceId(idOrAlias: string): ResourceId {
  if (idOrAlias === 'gold' || idOrAlias === 'magic_crystals') return idOrAlias;
  const mapped = RESOURCE_ALIASES[idOrAlias as keyof typeof RESOURCE_ALIASES];
  if (mapped) return mapped;
  throw new Error(`Unknown resource id: ${idOrAlias}`);
}
