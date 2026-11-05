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
  palette: { primary: number; accent: number; silver?: number };
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
    motto: 'REALITY IS OPTIONAL.',
    uniqueMechanic: 'MUTATIONS',
    unitIds: [],
    mainHallId: 'weird_core',
    palette: { primary: 0x7a4aa8, accent: 0x6ecfbf },
  },
};

export function listSpecies(): SpeciesDef[] {
  return Object.values(SPECIES);
}

export function prototypeSpecies(): SpeciesDef {
  return SPECIES[PROTOTYPE_SPECIES_ID];
}
