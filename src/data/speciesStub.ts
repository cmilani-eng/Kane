/**
 * Data-driven species registry — STUB for later phases.
 * Species design: Brutes / Nobles / Weirdos (see kane-three-species-full.md).
 * Milestone 1 does not load full rosters; placeholders use generic units.
 */

export type SpeciesId = 'brutes' | 'nobles' | 'weirdos';

export interface SpeciesDef {
  id: SpeciesId;
  name: string;
  motto: string;
  uniqueMechanic: string;
  /** Unit / building keys will be data tables in later milestones. */
  unitIds: string[];
}

export const SPECIES: Record<SpeciesId, SpeciesDef> = {
  brutes: {
    id: 'brutes',
    name: 'The Brutes',
    motto: 'WHY BUILD WALL WHEN ENEMY WALL?',
    uniqueMechanic: 'RAGE',
    unitIds: [],
  },
  nobles: {
    id: 'nobles',
    name: 'The Nobles',
    motto: 'WE HAVE A PLAN. IT IS PROBABLY EXPENSIVE.',
    uniqueMechanic: 'FORMATIONS',
    unitIds: [],
  },
  weirdos: {
    id: 'weirdos',
    name: 'The Weirdos',
    motto: 'REALITY IS OPTIONAL.',
    uniqueMechanic: 'MUTATIONS',
    unitIds: [],
  },
};

export function listSpecies(): SpeciesDef[] {
  return Object.values(SPECIES);
}
