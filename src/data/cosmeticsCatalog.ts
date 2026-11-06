/**
 * Cosmetics catalog stub — skins only.
 * No gameplay stats. Not purchasable yet (free unlocks for browse/equip).
 */
import type { SpeciesId } from './speciesStub';

export type CosmeticKind = 'skin';

export interface CosmeticSkinDef {
  id: string;
  kind: 'skin';
  name: string;
  blurb: string;
  /** Species this skin applies to (visual only). */
  speciesId: SpeciesId;
  /** Accent tint for menu preview — never fed into combat math. */
  accent: number;
  /** Soft-launch: all listed skins are free / unlocked. */
  unlock: 'free';
  /** Explicit: never sold yet. */
  purchasable: false;
}

/** Default / unequipped look — always available. */
export const DEFAULT_SKIN_ID = 'skin_default';

export const COSMETIC_SKINS: readonly CosmeticSkinDef[] = [
  {
    id: 'skin_default',
    kind: 'skin',
    name: 'Standard issue',
    blurb: 'Default parade colors — no flair.',
    speciesId: 'nobles',
    accent: 0xf0c75e,
    unlock: 'free',
    purchasable: false,
  },
  {
    id: 'skin_brutes_scrap',
    kind: 'skin',
    name: 'Scrap Parade',
    blurb: 'Junkyard shine for Brutes. Looks only.',
    speciesId: 'brutes',
    accent: 0xd4782e,
    unlock: 'free',
    purchasable: false,
  },
  {
    id: 'skin_brutes_ember',
    kind: 'skin',
    name: 'Ember Trim',
    blurb: 'Warm rim light. Zero Rage bonus.',
    speciesId: 'brutes',
    accent: 0xff6a3d,
    unlock: 'free',
    purchasable: false,
  },
  {
    id: 'skin_nobles_gilded',
    kind: 'skin',
    name: 'Gilded Tabard',
    blurb: 'Fancy gold stitch. No formation buff.',
    speciesId: 'nobles',
    accent: 0xffd27a,
    unlock: 'free',
    purchasable: false,
  },
  {
    id: 'skin_nobles_midnight',
    kind: 'skin',
    name: 'Midnight Crest',
    blurb: 'Cool silver-blue. Stats unchanged.',
    speciesId: 'nobles',
    accent: 0x8ec8ff,
    unlock: 'free',
    purchasable: false,
  },
  {
    id: 'skin_weirdos_prism',
    kind: 'skin',
    name: 'Prism Goo',
    blurb: 'Shifty teal sheen. Mutation still base.',
    speciesId: 'weirdos',
    accent: 0x6ecfbf,
    unlock: 'free',
    purchasable: false,
  },
  {
    id: 'skin_weirdos_void',
    kind: 'skin',
    name: 'Void Freckles',
    blurb: 'Purple speckles. Not a power skin.',
    speciesId: 'weirdos',
    accent: 0xc48cff,
    unlock: 'free',
    purchasable: false,
  },
] as const;

export function getCosmeticSkin(id: string): CosmeticSkinDef | undefined {
  return COSMETIC_SKINS.find((s) => s.id === id);
}

export function skinsForSpecies(speciesId: SpeciesId): CosmeticSkinDef[] {
  return COSMETIC_SKINS.filter(
    (s) => s.speciesId === speciesId || s.id === DEFAULT_SKIN_ID,
  );
}

export function listAllSkins(): readonly CosmeticSkinDef[] {
  return COSMETIC_SKINS;
}
