/**
 * Data-driven species registry — STUB aligned to GDD v2.
 * Full rosters / mechanics land in later milestones.
 * Prototype order: Nobles → Brutes → Weirdos.
 */

export type SpeciesId = 'brutes' | 'nobles' | 'weirdos';

/** GDD v2: ship Nobles first (classic RTS clarity). */
export const PROTOTYPE_SPECIES_ID: SpeciesId = 'nobles';

export interface SpeciesDef {
  id: SpeciesId;
  name: string;
  motto: string;
  uniqueMechanic: string;
  /** Unit keys — data tables fill these later. */
  unitIds: string[];
  /** Main hall building key (GDD). */
  mainHallId: string;
  palette: { primary: number; accent: number; silver?: number; pink?: number };
}

export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  brutes: {
    id: 'brutes',
    name: 'The Brutes',
    motto: 'WHY BUILD WALL WHEN ENEMY WALL?',
    uniqueMechanic: 'RAGE',
    unitIds: [
      'bonker',
      'rock_thrower',
      'big_bonker',
      'wolf_rider',
      'stomper',
      'boom_goblin',
    ],
    mainHallId: 'junkyard',
    palette: { primary: 0x4a7a3a, accent: 0xd4782e },
  },
  nobles: {
    id: 'nobles',
    name: 'The Nobles',
    motto: 'WE HAVE A PLAN. IT IS PROBABLY EXPENSIVE.',
    uniqueMechanic: 'FORMATIONS',
    unitIds: [
      'tin_knight',
      'bolt_boy',
      'hammer_dwarf',
      'boar_knight',
      'walking_tank',
      'boom_cart',
    ],
    mainHallId: 'royal_keep',
    palette: { primary: 0x3d7ea6, accent: 0xf0c75e, silver: 0xc0c8d4 },
  },
  weirdos: {
    id: 'weirdos',
    name: 'The Weirdos',
    motto: 'WE KNOW WHAT WE ARE DOING. PROBABLY.',
    uniqueMechanic: 'MUTATION',
    unitIds: [
      'goo_worker',
      'bloblet',
      'eyebat',
      'shroom_mage',
      'floaty',
      'grabber',
      'crystal_freak',
      'zoggle',
    ],
    mainHallId: 'weird_core',
    palette: { primary: 0x7a4aa8, accent: 0x6ecfbf, pink: 0xe87aa8 },
  },
};

/**
 * Teaching matchup triangle from GDD §6.0 — not rock-paper auto-win.
 * Phrases are existing GDD copy only (no invented balance numbers).
 *
 *   Brutes swarm overwhelm Nobles
 *   Weirdos disrupt Brutes
 *   Nobles engineering/ranged counter Weirdos
 */
export interface SpeciesMatchupTip {
  strongVs: SpeciesId;
  weakVs: SpeciesId;
  /** GDD verb fragment for Strong vs. */
  strongPhrase: string;
  /** GDD verb fragment for Weak vs. */
  weakPhrase: string;
}

export const SPECIES_MATCHUP_TIP: Record<SpeciesId, SpeciesMatchupTip> = {
  brutes: {
    strongVs: 'nobles',
    weakVs: 'weirdos',
    strongPhrase: 'swarm overwhelm',
    weakPhrase: 'disrupt',
  },
  nobles: {
    strongVs: 'weirdos',
    weakVs: 'brutes',
    strongPhrase: 'engineering/ranged counter',
    weakPhrase: 'swarm overwhelm',
  },
  weirdos: {
    strongVs: 'brutes',
    weakVs: 'nobles',
    strongPhrase: 'disrupt',
    weakPhrase: 'engineering/ranged counter',
  },
};

/** Short selection-panel tip: Strong vs X · Weak vs Y (GDD names only). */
export function speciesCounterTip(speciesId: SpeciesId): string {
  const tip = SPECIES_MATCHUP_TIP[speciesId];
  const strong = SPECIES[tip.strongVs].name.replace(/^The /, '');
  const weak = SPECIES[tip.weakVs].name.replace(/^The /, '');
  return `Strong vs ${strong} · Weak vs ${weak}`;
}

export function listSpecies(): SpeciesDef[] {
  return Object.values(SPECIES);
}

export function prototypeSpecies(): SpeciesDef {
  return SPECIES[PROTOTYPE_SPECIES_ID];
}
