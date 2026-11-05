/**
 * Data-driven resource IDs (GDD v2).
 * Economy systems later spend/earn by these IDs — not by display names.
 * Milestone 1 does not gather or spend; stubs exist so UI/code never hardcode
 * retired labels (Gold, Magic Crystals, Forage, Aura).
 */

export type ResourceId = 'scrap' | 'core';

export interface ResourceDef {
  id: ResourceId;
  /** Short UI label */
  label: string;
  /** How the player gets it (design copy; unused in M1). */
  source: string;
  /** What it typically buys (design copy; unused in M1). */
  spendsOn: string;
}

export const RESOURCES: Record<ResourceId, ResourceDef> = {
  scrap: {
    id: 'scrap',
    label: 'Scrap',
    source: 'Map gather nodes (species-flavored props)',
    spendsOn: 'Workers, basic units, basic buildings',
  },
  core: {
    id: 'core',
    label: 'Core',
    source: 'Held KANE CORE fragments (passive tick)',
    spendsOn: 'Advanced units, upgrades, hero recruitment, signatures',
  },
};

/** Match wallet shape for later economy — amounts are placeholders. */
export type ResourceWallet = Record<ResourceId, number>;

export function emptyWallet(starting: Partial<ResourceWallet> = {}): ResourceWallet {
  return {
    scrap: starting.scrap ?? 0,
    core: starting.core ?? 0,
  };
}

export function listResources(): ResourceDef[] {
  return Object.values(RESOURCES);
}
