/**
 * Hero recruit + ability casting (gameplay only).
 * Presentation reads `world.vfx` flashes for rings/pulses.
 * Heroes: GRUK (Brutes), KING BONIFACE (Nobles), ZOGGLE (Weirdos).
 */
import {
  heroForSpecies,
  type HeroAbilitySlot,
  type HeroDef,
  type HeroId,
} from '../../data/heroes';
import { SPECIES } from '../../data/speciesStub';
import { getUnitType } from '../../data/units';
import { getBuildingType } from '../../data/buildings';
import { dist } from '../math';
import { walletOf } from './battlefieldEconomy';
import { canAfford, pay } from './battlefieldBuildings';
import { damageBuilding } from './battlefieldBuildings';
import {
  recordPlayerAction,
  spawnUnit,
  type BattlefieldTeam,
  type BattlefieldUnit,
  type BattlefieldWorld,
} from './battlefieldWorld';

/** Presentation kind — readable cast flashes per hero/ability. */
export type HeroVfxKind =
  | 'recruit'
  | 'smash'
  | 'buff'
  | 'heal'
  | 'zap'
  | 'portal'
  | 'chaos'
  | 'chaos_tick'
  | 'ring';

export interface HeroVfx {
  x: number;
  y: number;
  radius: number;
  color: number;
  lifeMs: number;
  maxLifeMs: number;
  label?: string;
  heroId?: HeroId;
  abilityId?: string;
  kind: HeroVfxKind;
}

export interface HeroRuntime {
  heroId: HeroId;
  unitId: number;
  cds: Record<HeroAbilitySlot, number>;
  /** Buff: attack cooldown multiplier < 1 = faster. */
  angryUntilMs: number;
  orderUntilMs: number;
  decreeUntilMs: number;
  /** ZOGGLE ultimate chaos zone remaining. */
  chaosUntilMs: number;
  chaosX: number;
  chaosY: number;
  chaosRadius: number;
  chaosTickMs: number;
}

const HERO_DISPLAY: Record<HeroId, string> = {
  gruk: 'GRUK',
  boniface: 'KING BONIFACE',
  zoggle: 'ZOGGLE',
};

export function ensureHeroFields(world: BattlefieldWorld): void {
  if (world.heroRuntime === undefined) world.heroRuntime = null;
  if (world.enemyHeroRuntime === undefined) world.enemyHeroRuntime = null;
  if (world.playerHeroDown === undefined) world.playerHeroDown = false;
  if (!world.vfx) world.vfx = [];
}

function pushVfx(
  world: BattlefieldWorld,
  x: number,
  y: number,
  radius: number,
  color: number,
  lifeMs: number,
  opts: {
    label?: string;
    heroId?: HeroId;
    abilityId?: string;
    kind?: HeroVfxKind;
  } = {},
): void {
  ensureHeroFields(world);
  world.vfx.push({
    x,
    y,
    radius,
    color,
    lifeMs,
    maxLifeMs: lifeMs,
    label: opts.label,
    heroId: opts.heroId,
    abilityId: opts.abilityId,
    kind: opts.kind ?? 'ring',
  });
}

function kindForAbility(abilityId: string): HeroVfxKind {
  switch (abilityId) {
    case 'ground_smash':
    case 'big_bonk':
      return 'smash';
    case 'get_angry':
    case 'royal_order':
    case 'royal_decree':
      return 'buff';
    case 'emergency_repairs':
      return 'heal';
    case 'brain_zap':
      return 'zap';
    case 'portal_trick':
      return 'portal';
    case 'what_is_happening':
      return 'chaos';
    default:
      return 'ring';
  }
}

export function findPlayerHero(world: BattlefieldWorld): BattlefieldUnit | null {
  return (
    world.units.find(
      (u) => u.team === 'player' && getUnitType(u.typeId).isHero,
    ) ?? null
  );
}

function emptyRuntime(heroId: HeroId, unitId: number): HeroRuntime {
  return {
    heroId,
    unitId,
    cds: { ability1: 0, ability2: 0, ultimate: 0 },
    angryUntilMs: 0,
    orderUntilMs: 0,
    decreeUntilMs: 0,
    chaosUntilMs: 0,
    chaosX: 0,
    chaosY: 0,
    chaosRadius: 0,
    chaosTickMs: 0,
  };
}

export function recruitHero(
  world: BattlefieldWorld,
  team: BattlefieldTeam = 'player',
): boolean {
  ensureHeroFields(world);
  const species = team === 'player' ? world.speciesId : world.enemySpeciesId;
  const def = heroForSpecies(species);
  if (!def) return false;
  if (world.units.some((u) => u.team === team && getUnitType(u.typeId).isHero)) {
    return false;
  }
  const wallet = walletOf(world, team);
  const cost = {
    gold: def.recruitCostGold,
    magic_crystals: def.recruitCostCrystals,
  };
  if (!canAfford(wallet, cost) || !pay(wallet, cost)) return false;

  const hall = world.buildings.find(
    (b) =>
      b.team === team &&
      b.complete &&
      (getBuildingType(b.typeId).isMainHall ||
        getBuildingType(b.typeId).recruitsHero),
  );
  if (!hall) {
    wallet.gold += cost.gold;
    wallet.magic_crystals += cost.magic_crystals ?? 0;
    return false;
  }

  const pal = SPECIES[species].palette;
  const hero = spawnUnit(world, {
    team,
    typeId: def.unitTypeId,
    x: hall.x + 50,
    y: hall.y,
    color: pal.accent,
    speciesId: species,
  });
  hero.name = HERO_DISPLAY[def.id];

  // ZOGGLE passive: larger personal vision
  if (def.id === 'zoggle') {
    hero.vision = Math.max(hero.vision, 420);
  }

  const runtime = emptyRuntime(def.id, hero.id);
  if (team === 'player') {
    world.heroRuntime = runtime;
    world.playerHeroDown = false;
  } else world.enemyHeroRuntime = runtime;

  pushVfx(world, hero.x, hero.y, 60, pal.accent, 700, {
    label: 'HERO',
    heroId: def.id,
    kind: 'recruit',
  });
  return true;
}

export function castHeroAbility(
  world: BattlefieldWorld,
  slot: HeroAbilitySlot,
  team: BattlefieldTeam = 'player',
): boolean {
  ensureHeroFields(world);
  const rt = team === 'player' ? world.heroRuntime : world.enemyHeroRuntime;
  if (!rt || rt.cds[slot] > 0) return false;
  const hero = world.units.find((u) => u.id === rt.unitId);
  if (!hero || hero.hp <= 0) return false;
  const def = heroForSpecies(hero.speciesId);
  if (!def) return false;
  const ab = def.abilities[slot];
  const wallet = walletOf(world, team);
  if (ab.costCrystals > 0) {
    if (wallet.magic_crystals < ab.costCrystals) return false;
    wallet.magic_crystals -= ab.costCrystals;
  }

  rt.cds[slot] = ab.cooldownMs;
  applyAbility(world, hero, def, slot, ab.radius, rt);
  const pal = SPECIES[hero.speciesId].palette;
  const color =
    slot === 'ultimate'
      ? def.id === 'zoggle'
        ? 0xe87aa8
        : def.id === 'boniface'
          ? 0xf0c75e
          : 0xd4782e
      : def.id === 'zoggle'
        ? pal.accent
        : def.id === 'boniface'
          ? pal.accent
          : pal.primary;
  const life =
    slot === 'ultimate' ? 720 : kindForAbility(ab.id) === 'buff' ? 640 : 560;
  pushVfx(world, hero.x, hero.y, ab.radius, color, life, {
    label: ab.name,
    heroId: def.id,
    abilityId: ab.id,
    kind: kindForAbility(ab.id),
  });
  if (team === 'player') recordPlayerAction(world);
  return true;
}

function applyAbility(
  world: BattlefieldWorld,
  hero: BattlefieldUnit,
  def: HeroDef,
  slot: HeroAbilitySlot,
  radius: number,
  rt: HeroRuntime,
): void {
  const id = def.abilities[slot].id;

  if (id === 'ground_smash' || id === 'big_bonk') {
    const power = id === 'big_bonk' ? hero.dmg * 2.4 : hero.dmg * 1.5;
    const knock = id === 'big_bonk' ? 55 : 0;
    for (const u of world.units) {
      if (u.team === hero.team || u.hp <= 0) continue;
      if (dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      u.hp -= power;
      if (knock > 0) {
        const d = dist(hero.x, hero.y, u.x, u.y) || 1;
        u.x += ((u.x - hero.x) / d) * knock;
        u.y += ((u.y - hero.y) / d) * knock;
      }
      if (u.hp <= 0) u.hp = 0;
    }
    for (const b of world.buildings) {
      if (b.team === hero.team || b.hp <= 0) continue;
      if (dist(hero.x, hero.y, b.x, b.y) > radius) continue;
      damageBuilding(world, b, power * 0.6);
    }
  }

  if (id === 'brain_zap') {
    // Damage + interrupt nearest enemies (clear orders / stun attack CD)
    for (const u of world.units) {
      if (u.team === hero.team || u.hp <= 0) continue;
      if (dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      u.hp -= hero.dmg * 1.55;
      u.attackTargetId = null;
      u.path = [];
      u.moveTarget = null;
      u.gatherNodeId = null;
      u.attackCd = Math.max(u.attackCd, 1400);
      u.inFormation = false;
      u.formationLocked = false;
      u.enraged = false;
      u.rageLocked = false;
      u.rageCombatMs = 0;
      if (u.hp <= 0) u.hp = 0;
    }
  }

  if (id === 'what_is_happening') {
    const power = hero.dmg * 1.35;
    for (const u of world.units) {
      if (u.team === hero.team || u.hp <= 0) continue;
      if (dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      u.hp -= power;
      u.inFormation = false;
      u.formationLocked = false;
      u.mutated = false;
      u.mutationLocked = false;
      u.enraged = false;
      u.rageLocked = false;
      u.rageCombatMs = 0;
      u.attackTargetId = null;
      if (u.hp <= 0) u.hp = 0;
    }
    rt.chaosUntilMs = 5500;
    rt.chaosX = hero.x;
    rt.chaosY = hero.y;
    rt.chaosRadius = radius;
    rt.chaosTickMs = 400;
    pushVfx(world, hero.x, hero.y, radius * 1.05, 0xe87aa8, 900, {
      label: 'CHAOS',
      heroId: 'zoggle',
      abilityId: 'what_is_happening',
      kind: 'chaos',
    });
  }

  if (id === 'get_angry') {
    rt.angryUntilMs = 4500;
  }
  if (id === 'royal_order') {
    rt.orderUntilMs = 5000;
  }
  if (id === 'emergency_repairs') {
    const healHp = Math.max(0, def.abilities[slot].healHp ?? 0);
    for (const b of world.buildings) {
      if (b.team !== hero.team) continue;
      if (dist(hero.x, hero.y, b.x, b.y) > radius) continue;
      b.hp = Math.min(b.maxHp, b.hp + healHp);
    }
  }
  if (id === 'royal_decree') {
    rt.decreeUntilMs = 6000;
    for (const u of world.units) {
      if (u.team !== hero.team) continue;
      if (dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      if (getUnitType(u.typeId).usesFormation) {
        u.inFormation = true;
        u.formationLocked = true;
      }
    }
  }
  if (id === 'portal_trick') {
    // Blink friendlies (and ZOGGLE) toward nearest enemy cluster / eastward
    let tx = hero.x + 100;
    let ty = hero.y - 30;
    let bestD = Infinity;
    for (const e of world.units) {
      if (e.team === hero.team || e.hp <= 0) continue;
      const d = dist(hero.x, hero.y, e.x, e.y);
      if (d < bestD) {
        bestD = d;
        tx = e.x;
        ty = e.y;
      }
    }
    const dx = tx - hero.x;
    const dy = ty - hero.y;
    const len = Math.hypot(dx, dy) || 1;
    const hop = 95;
    const ox = (dx / len) * hop;
    const oy = (dy / len) * hop;
    for (const u of world.units) {
      if (u.team !== hero.team) continue;
      if (u.id !== hero.id && dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      pushVfx(world, u.x, u.y, 28, 0x6ecfbf, 340, {
        heroId: 'zoggle',
        abilityId: 'portal_trick',
        kind: 'portal',
      });
      u.x += ox;
      u.y += oy;
      pushVfx(world, u.x, u.y, 28, 0xe87aa8, 340, {
        heroId: 'zoggle',
        abilityId: 'portal_trick',
        kind: 'portal',
      });
    }
  }
}

export function tickHeroes(world: BattlefieldWorld, dtMs: number): void {
  ensureHeroFields(world);
  for (const rt of [world.heroRuntime, world.enemyHeroRuntime]) {
    if (!rt) continue;
    const hero = world.units.find((u) => u.id === rt.unitId);
    if (!hero || hero.hp <= 0) {
      if (rt === world.heroRuntime) {
        world.heroRuntime = null;
        world.playerHeroDown = true;
      } else world.enemyHeroRuntime = null;
      continue;
    }
    for (const k of ['ability1', 'ability2', 'ultimate'] as HeroAbilitySlot[]) {
      rt.cds[k] = Math.max(0, rt.cds[k] - dtMs);
    }
    rt.angryUntilMs = Math.max(0, rt.angryUntilMs - dtMs);
    rt.orderUntilMs = Math.max(0, rt.orderUntilMs - dtMs);
    rt.decreeUntilMs = Math.max(0, rt.decreeUntilMs - dtMs);

    if (rt.angryUntilMs > 0) {
      for (const u of world.units) {
        if (u.team !== hero.team) continue;
        if (dist(hero.x, hero.y, u.x, u.y) > 140) continue;
        u.attackCd = Math.max(0, u.attackCd - dtMs * 0.35);
      }
    }

    // ZOGGLE passive: slight vision buff to nearby allies
    if (rt.heroId === 'zoggle') {
      for (const u of world.units) {
        if (u.team !== hero.team || u.id === hero.id) continue;
        if (dist(hero.x, hero.y, u.x, u.y) <= 180) {
          const base = getUnitType(u.typeId).vision;
          u.vision = Math.max(u.vision, base + 40);
        }
      }
    }

    // Chaos zone DoT + disruption
    if (rt.chaosUntilMs > 0) {
      rt.chaosUntilMs = Math.max(0, rt.chaosUntilMs - dtMs);
      rt.chaosTickMs -= dtMs;
      if (rt.chaosTickMs <= 0) {
        rt.chaosTickMs = 450;
        const tickDmg = hero.dmg * 0.35;
        for (const u of world.units) {
          if (u.team === hero.team || u.hp <= 0) continue;
          if (dist(rt.chaosX, rt.chaosY, u.x, u.y) > rt.chaosRadius) continue;
          u.hp -= tickDmg;
          u.inFormation = false;
          u.formationLocked = false;
          if (u.hp <= 0) u.hp = 0;
        }
        pushVfx(
          world,
          rt.chaosX,
          rt.chaosY,
          rt.chaosRadius * 0.85,
          0x7a4aa8,
          280,
          {
            heroId: 'zoggle',
            abilityId: 'what_is_happening',
            kind: 'chaos_tick',
          },
        );
      }
    }
  }

  for (let i = world.vfx.length - 1; i >= 0; i--) {
    const v = world.vfx[i]!;
    v.lifeMs -= dtMs;
    if (v.lifeMs <= 0) world.vfx.splice(i, 1);
  }
}

/** Passive + temporary buffs for outgoing damage. */
export function heroOutgoingMult(
  world: BattlefieldWorld,
  attacker: BattlefieldUnit,
): number {
  ensureHeroFields(world);
  let m = 1;
  const allyHero = world.units.find(
    (u) => u.team === attacker.team && getUnitType(u.typeId).isHero,
  );
  if (allyHero && getUnitType(allyHero.typeId).id === 'gruk') {
    if (dist(allyHero.x, allyHero.y, attacker.x, attacker.y) <= 150) m *= 1.1;
  }
  const rt =
    attacker.team === 'player' ? world.heroRuntime : world.enemyHeroRuntime;
  if (rt && rt.orderUntilMs > 0 && allyHero) {
    if (dist(allyHero.x, allyHero.y, attacker.x, attacker.y) <= 150) m *= 1.25;
  }
  return m;
}

export function heroIncomingMult(
  world: BattlefieldWorld,
  defender: BattlefieldUnit,
): number {
  ensureHeroFields(world);
  let m = 1;
  const allyHero = world.units.find(
    (u) => u.team === defender.team && getUnitType(u.typeId).isHero,
  );
  if (allyHero && getUnitType(allyHero.typeId).id === 'boniface') {
    if (dist(allyHero.x, allyHero.y, defender.x, defender.y) <= 150) m *= 0.9;
  }
  const rt =
    defender.team === 'player' ? world.heroRuntime : world.enemyHeroRuntime;
  if (rt && rt.decreeUntilMs > 0 && allyHero) {
    if (dist(allyHero.x, allyHero.y, defender.x, defender.y) <= 160) m *= 0.7;
  }
  return m;
}

export interface HeroAbilityHud {
  name: string;
  ready: boolean;
  sec: number;
}

/** Facts for the hero HUD line. Presentation translates the chrome. */
export type HeroHudState =
  | { kind: 'none' }
  | { kind: 'recruit'; id: HeroId; gold: number; crystals: number }
  | { kind: 'fallen' }
  | {
      kind: 'live';
      name: string;
      hp: number;
      q: HeroAbilityHud;
      w: HeroAbilityHud;
      e: HeroAbilityHud;
      chaosSec: number | null;
    };

export function heroHudState(world: BattlefieldWorld): HeroHudState {
  ensureHeroFields(world);
  const rt = world.heroRuntime;
  const def = heroForSpecies(world.speciesId);
  if (!def) return { kind: 'none' };
  if (!rt) {
    return {
      kind: 'recruit',
      id: def.id,
      gold: def.recruitCostGold,
      crystals: def.recruitCostCrystals,
    };
  }
  const hero = world.units.find((u) => u.id === rt.unitId);
  if (!hero) return { kind: 'fallen' };
  const slot = (s: HeroAbilitySlot, name: string): HeroAbilityHud => {
    const ms = rt.cds[s];
    return {
      name,
      ready: ms <= 0,
      sec: ms > 0 ? Math.ceil(ms / 1000) : 0,
    };
  };
  return {
    kind: 'live',
    name: hero.name,
    hp: Math.ceil(hero.hp),
    q: slot('ability1', def.abilities.ability1.name),
    w: slot('ability2', def.abilities.ability2.name),
    e: slot('ultimate', def.abilities.ultimate.name),
    chaosSec: rt.chaosUntilMs > 0 ? Math.ceil(rt.chaosUntilMs / 1000) : null,
  };
}
