/**
 * Kane locales. en-GB is the source and the default.
 * es is neutral Spanish (not es-ES or es-419).
 * A missing key falls back to en-GB so the player never sees a raw key.
 */
import type { BuildingTypeId } from '../data/buildings';
import type { UnitTypeId } from '../data/units';
import { CATALOGS, enGB, type MessageKey } from './messages';

export type { MessageKey } from './messages';
export { CATALOGS } from './messages';

export const LOCALES = ['en-GB', 'pt-BR', 'es'] as const;
export type LocaleId = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: LocaleId = 'en-GB';
export const LOCALE_STORAGE_KEY = 'kane.locale.v1';

export const LOCALE_CHOICES: { id: LocaleId; short: string; label: string }[] = [
  { id: 'en-GB', short: 'EN', label: 'English (UK)' },
  { id: 'pt-BR', short: 'PT', label: 'Português (BR)' },
  { id: 'es', short: 'ES', label: 'Español' },
];

type Vars = Record<string, string | number>;
type SpeciesId = 'brutes' | 'nobles' | 'weirdos';
type DifficultyId = 'practice' | 'easy' | 'normal' | 'hard';
type MapId = 'crossing' | 'ridge' | 'gap';

const listeners = new Set<() => void>();
let sessionLocale: LocaleId | null = null;

function isLocaleId(value: string | null): value is LocaleId {
  return value === 'en-GB' || value === 'pt-BR' || value === 'es';
}

export function getLocale(): LocaleId {
  try {
    const raw = globalThis.localStorage?.getItem(LOCALE_STORAGE_KEY) ?? null;
    if (isLocaleId(raw)) return raw;
  } catch {
    // Private mode or a blocked storage API. Use the session choice.
  }
  return sessionLocale ?? DEFAULT_LOCALE;
}

export function setLocale(next: LocaleId): void {
  if (getLocale() === next) return;
  sessionLocale = next;
  try {
    globalThis.localStorage?.setItem(LOCALE_STORAGE_KEY, next);
  } catch {
    // sessionLocale already holds the choice for this page load.
  }
  applyDocumentLanguage(next);
  for (const listener of listeners) listener();
}

export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function applyDocumentLanguage(locale: LocaleId = getLocale()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = locale;
}

/** Clears session state. Tests only. */
export function resetLocaleForTests(): void {
  sessionLocale = null;
  listeners.clear();
  try {
    globalThis.localStorage?.removeItem(LOCALE_STORAGE_KEY);
  } catch {
    // No storage in this environment.
  }
}

function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (token, name: string) => {
    const value = vars[name];
    return value === undefined ? token : String(value);
  });
}

export function translate(locale: LocaleId, key: MessageKey, vars?: Vars): string {
  const table = CATALOGS[locale];
  const raw = table[key] || enGB[key];
  return fill(raw, vars);
}

export function t(key: MessageKey, vars?: Vars): string {
  return translate(getLocale(), key, vars);
}

export function speciesCopy(id: SpeciesId): { name: string; motto: string; mechanic: string } {
  switch (id) {
    case 'brutes':
      return {
        name: t('species.brutes.name'),
        motto: t('species.brutes.motto'),
        mechanic: t('species.brutes.mechanic'),
      };
    case 'nobles':
      return {
        name: t('species.nobles.name'),
        motto: t('species.nobles.motto'),
        mechanic: t('species.nobles.mechanic'),
      };
    case 'weirdos':
      return {
        name: t('species.weirdos.name'),
        motto: t('species.weirdos.motto'),
        mechanic: t('species.weirdos.mechanic'),
      };
  }
}

export function speciesName(id: SpeciesId): string {
  return speciesCopy(id).name;
}

const UNIT_NAME_KEY = {
  scavenger: 'unit.scavenger.name',
  bonker: 'unit.bonker.name',
  rock_thrower: 'unit.rock_thrower.name',
  big_bonker: 'unit.big_bonker.name',
  wolf_rider: 'unit.wolf_rider.name',
  stomper: 'unit.stomper.name',
  boom_goblin: 'unit.boom_goblin.name',
  gruk: 'unit.gruk.name',
  serf: 'unit.serf.name',
  tin_knight: 'unit.tin_knight.name',
  bolt_boy: 'unit.bolt_boy.name',
  hammer_dwarf: 'unit.hammer_dwarf.name',
  boar_knight: 'unit.boar_knight.name',
  walking_tank: 'unit.walking_tank.name',
  boom_cart: 'unit.boom_cart.name',
  boniface: 'unit.boniface.name',
  goo_worker: 'unit.goo_worker.name',
  bloblet: 'unit.bloblet.name',
  eyebat: 'unit.eyebat.name',
  shroom_mage: 'unit.shroom_mage.name',
  floaty: 'unit.floaty.name',
  grabber: 'unit.grabber.name',
  crystal_freak: 'unit.crystal_freak.name',
  zoggle: 'unit.zoggle.name',
} as const satisfies Record<UnitTypeId, MessageKey>;

const BUILDING_NAME_KEY = {
  junkyard: 'building.junkyard.name',
  bonker_hut: 'building.bonker_hut.name',
  beast_pen: 'building.beast_pen.name',
  scrap_works: 'building.scrap_works.name',
  big_boss_den: 'building.big_boss_den.name',
  royal_keep: 'building.royal_keep.name',
  barracks: 'building.barracks.name',
  archery_hall: 'building.archery_hall.name',
  stable: 'building.stable.name',
  engineering_yard: 'building.engineering_yard.name',
  watchtower: 'building.watchtower.name',
  royal_academy: 'building.royal_academy.name',
  weird_core: 'building.weird_core.name',
  blob_factory: 'building.blob_factory.name',
  eye_nest: 'building.eye_nest.name',
  mushroom_lab: 'building.mushroom_lab.name',
  mutation_pool: 'building.mutation_pool.name',
  magic_bubble: 'building.magic_bubble.name',
  portal_of_chaos: 'building.portal_of_chaos.name',
} as const satisfies Record<BuildingTypeId, MessageKey>;

/** Display name. Data tables stay English. GRUK, KING BONIFACE, and ZOGGLE stay as written. */
export function unitDisplayName(id: UnitTypeId): string {
  const key = (UNIT_NAME_KEY as Partial<Record<string, MessageKey>>)[id];
  return key ? t(key) : id;
}

/** Display name. The building id and the data-table name stay English. */
export function buildingDisplayName(id: BuildingTypeId): string {
  const key = (BUILDING_NAME_KEY as Partial<Record<string, MessageKey>>)[id];
  return key ? t(key) : id;
}

export function difficultyCopy(id: DifficultyId): { label: string; blurb: string } {
  switch (id) {
    case 'practice':
      return {
        label: t('difficulty.practice.label'),
        blurb: t('difficulty.practice.blurb'),
      };
    case 'easy':
      return { label: t('difficulty.easy.label'), blurb: t('difficulty.easy.blurb') };
    case 'normal':
      return { label: t('difficulty.normal.label'), blurb: t('difficulty.normal.blurb') };
    case 'hard':
      return { label: t('difficulty.hard.label'), blurb: t('difficulty.hard.blurb') };
  }
}

export function mapCopy(id: MapId): { label: string; blurb: string } {
  switch (id) {
    case 'crossing':
      return { label: t('map.crossing.label'), blurb: t('map.crossing.blurb') };
    case 'ridge':
      return { label: t('map.ridge.label'), blurb: t('map.ridge.blurb') };
    case 'gap':
      return { label: t('map.gap.label'), blurb: t('map.gap.blurb') };
  }
}
