/**
 * Local cosmetics loadout — equip skins per species (localStorage).
 * Never touches gameplay stats; not a shop.
 */
import {
  DEFAULT_SKIN_ID,
  getCosmeticSkin,
  listAllSkins,
  type CosmeticSkinDef,
} from '../data/cosmeticsCatalog';
import type { SpeciesId } from '../data/speciesStub';

const KEY = 'kane.cosmeticsLoadout.v1';

export interface CosmeticsLoadout {
  version: 1;
  /** Equipped skin id per species. */
  equipped: Record<SpeciesId, string>;
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function emptyLoadout(): CosmeticsLoadout {
  return {
    version: 1,
    equipped: {
      brutes: 'skin_brutes_scrap',
      nobles: DEFAULT_SKIN_ID,
      weirdos: 'skin_weirdos_prism',
    },
  };
}

export function loadCosmeticsLoadout(): CosmeticsLoadout {
  const base = emptyLoadout();
  if (!canStore()) return base;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<CosmeticsLoadout>;
    const equipped = { ...base.equipped };
    for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
      const v = parsed.equipped?.[id];
      if (typeof v === 'string' && getCosmeticSkin(v)) equipped[id] = v;
    }
    return { version: 1, equipped };
  } catch {
    return base;
  }
}

function save(loadout: CosmeticsLoadout): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(loadout));
  } catch {
    // ignore
  }
}

export function getEquippedSkinId(speciesId: SpeciesId): string {
  return loadCosmeticsLoadout().equipped[speciesId] ?? DEFAULT_SKIN_ID;
}

export function getEquippedSkin(speciesId: SpeciesId): CosmeticSkinDef {
  const id = getEquippedSkinId(speciesId);
  return getCosmeticSkin(id) ?? getCosmeticSkin(DEFAULT_SKIN_ID)!;
}

/** Equip a free skin locally. Rejects unknown / wrong-species ids. */
export function equipSkin(
  speciesId: SpeciesId,
  skinId: string,
): CosmeticsLoadout {
  const skin = getCosmeticSkin(skinId);
  const loadout = loadCosmeticsLoadout();
  if (!skin || skin.purchasable) return loadout;
  if (skin.id !== DEFAULT_SKIN_ID && skin.speciesId !== speciesId) {
    return loadout;
  }
  loadout.equipped[speciesId] = skin.id;
  save(loadout);
  return loadout;
}

export function ownedSkinIds(): string[] {
  // Soft-launch stub: entire free catalog is owned; nothing for sale.
  return listAllSkins()
    .filter((s) => s.unlock === 'free' && !s.purchasable)
    .map((s) => s.id);
}

export function formatLoadoutSummary(
  loadout: CosmeticsLoadout = loadCosmeticsLoadout(),
): string {
  const lines = ['Cosmetics (skins only · not for sale):'];
  for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
    const skin = getCosmeticSkin(loadout.equipped[id]);
    lines.push(`  ${id}: ${skin?.name ?? loadout.equipped[id]}`);
  }
  return lines.join('\n');
}
