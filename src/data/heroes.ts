/**
 * Stars of KANE — data-driven heroes (1 per species for now).
 */
import type { SpeciesId } from './speciesStub';
import type { UnitTypeId } from './units';

export type HeroId = 'gruk' | 'boniface' | 'zoggle';
export type HeroAbilitySlot = 'ability1' | 'ability2' | 'ultimate';

export interface HeroAbilityDef {
  id: string;
  name: string;
  hotkey: string;
  cooldownMs: number;
  /** Gold / crystal cost to cast (usually 0). */
  costCrystals: number;
  radius: number;
  description: string;
}

export interface HeroDef {
  id: HeroId;
  unitTypeId: UnitTypeId;
  speciesId: SpeciesId;
  title: string;
  passive: string;
  recruitCostGold: number;
  recruitCostCrystals: number;
  abilities: Record<HeroAbilitySlot, HeroAbilityDef>;
}

export const HEROES: Record<HeroId, HeroDef> = {
  gruk: {
    id: 'gruk',
    unitTypeId: 'gruk',
    speciesId: 'brutes',
    title: 'The Big Boss',
    passive: 'Nearby Brutes deal +10% damage (aura).',
    recruitCostGold: 150,
    recruitCostCrystals: 15,
    abilities: {
      ability1: {
        id: 'ground_smash',
        name: 'Ground Smash',
        hotkey: 'Q',
        cooldownMs: 8000,
        costCrystals: 0,
        radius: 90,
        description: 'Slam — damage nearby enemies.',
      },
      ability2: {
        id: 'get_angry',
        name: 'Get Angry',
        hotkey: 'W',
        cooldownMs: 12000,
        costCrystals: 0,
        radius: 140,
        description: 'Nearby allies attack faster for a few seconds.',
      },
      ultimate: {
        id: 'big_bonk',
        name: 'BIG BONK',
        hotkey: 'E',
        cooldownMs: 28000,
        costCrystals: 5,
        radius: 130,
        description: 'Massive AoE smash + knockback.',
      },
    },
  },
  boniface: {
    id: 'boniface',
    unitTypeId: 'boniface',
    speciesId: 'nobles',
    title: 'The Unreasonably Important',
    passive: 'Nearby allies take −10% damage (aura).',
    recruitCostGold: 160,
    recruitCostCrystals: 15,
    abilities: {
      ability1: {
        id: 'royal_order',
        name: 'Royal Order',
        hotkey: 'Q',
        cooldownMs: 10000,
        costCrystals: 0,
        radius: 150,
        description: 'Strengthen nearby soldiers’ damage briefly.',
      },
      ability2: {
        id: 'emergency_repairs',
        name: 'Emergency Repairs',
        hotkey: 'W',
        cooldownMs: 14000,
        costCrystals: 0,
        radius: 180,
        description: 'Repair nearby friendly buildings.',
      },
      ultimate: {
        id: 'royal_decree',
        name: 'ROYAL DECREE',
        hotkey: 'E',
        cooldownMs: 30000,
        costCrystals: 5,
        radius: 160,
        description: 'Force formation + heavy defense buff.',
      },
    },
  },
  zoggle: {
    id: 'zoggle',
    unitTypeId: 'zoggle',
    speciesId: 'weirdos',
    title: 'The All-Seeing (Except When Sleeping)',
    passive: 'Slightly larger vision radius.',
    recruitCostGold: 155,
    recruitCostCrystals: 20,
    abilities: {
      ability1: {
        id: 'brain_zap',
        name: 'Brain Zap',
        hotkey: 'Q',
        cooldownMs: 9000,
        costCrystals: 0,
        radius: 100,
        description: 'Damage and interrupt nearest enemies.',
      },
      ability2: {
        id: 'portal_trick',
        name: 'Portal Trick',
        hotkey: 'W',
        cooldownMs: 15000,
        costCrystals: 0,
        radius: 120,
        description: 'Blink nearby friendlies forward a short hop.',
      },
      ultimate: {
        id: 'what_is_happening',
        name: 'WHAT IS HAPPENING?',
        hotkey: 'E',
        cooldownMs: 32000,
        costCrystals: 8,
        radius: 150,
        description: 'Chaos zone — damage + break enemy formations.',
      },
    },
  },
};

export function heroForSpecies(speciesId: SpeciesId): HeroDef | null {
  return (
    Object.values(HEROES).find((h) => h.speciesId === speciesId) ?? null
  );
}
