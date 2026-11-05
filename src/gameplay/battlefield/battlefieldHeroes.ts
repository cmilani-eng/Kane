/**
 * Hero recruit + ability casting (gameplay only).
 * Presentation reads `world.vfx` flashes for rings/pulses.
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
  spawnUnit,
  type BattlefieldTeam,
  type BattlefieldUnit,
  type BattlefieldWorld,
} from './battlefieldWorld';

export interface HeroVfx {
  x: number;
  y: number;
  radius: number;
  color: number;
  lifeMs: number;
  maxLifeMs: number;
  label?: string;
}

export interface HeroRuntime {
  heroId: HeroId;
  unitId: number;
  cds: Record<HeroAbilitySlot, number>;
  /** Buff: attack cooldown multiplier < 1 = faster. */
  angryUntilMs: number;
  orderUntilMs: number;
  decreeUntilMs: number;
}

export function ensureHeroFields(world: BattlefieldWorld): void {
  if (world.heroRuntime === undefined) world.heroRuntime = null;
  if (world.enemyHeroRuntime === undefined) world.enemyHeroRuntime = null;
  if (!world.vfx) world.vfx = [];
}

function pushVfx(
  world: BattlefieldWorld,
  x: number,
  y: number,
  radius: number,
  color: number,
  lifeMs: number,
  label?: string,
): void {
  ensureHeroFields(world);
  world.vfx.push({ x, y, radius, color, lifeMs, maxLifeMs: lifeMs, label });
}

export function findPlayerHero(world: BattlefieldWorld): BattlefieldUnit | null {
  return (
    world.units.find(
      (u) => u.team === 'player' && getUnitType(u.typeId).isHero,
    ) ?? null
  );
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
    // refund
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
  hero.name = `${def.unitTypeId === 'gruk' ? 'GRUK' : def.unitTypeId === 'boniface' ? 'KING BONIFACE' : 'ZOGGLE'}`;

  const runtime: HeroRuntime = {
    heroId: def.id,
    unitId: hero.id,
    cds: { ability1: 0, ability2: 0, ultimate: 0 },
    angryUntilMs: 0,
    orderUntilMs: 0,
    decreeUntilMs: 0,
  };
  if (team === 'player') world.heroRuntime = runtime;
  else world.enemyHeroRuntime = runtime;

  pushVfx(world, hero.x, hero.y, 60, pal.accent, 700, 'HERO');
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
  pushVfx(
    world,
    hero.x,
    hero.y,
    ab.radius,
    slot === 'ultimate' ? 0xf0c75e : SPECIES[hero.speciesId].palette.primary,
    550,
    ab.name,
  );
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

  if (id === 'ground_smash' || id === 'big_bonk' || id === 'brain_zap' || id === 'what_is_happening') {
    const power =
      id === 'big_bonk' ? hero.dmg * 2.4 : id === 'what_is_happening' ? hero.dmg * 1.6 : hero.dmg * 1.5;
    const knock = id === 'big_bonk' ? 55 : 0;
    for (const u of world.units) {
      if (u.team === hero.team || u.hp <= 0) continue;
      if (dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      u.hp -= power;
      if (id === 'what_is_happening') {
        u.inFormation = false;
        u.formationLocked = false;
      }
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

  if (id === 'get_angry') {
    rt.angryUntilMs = 4500;
  }
  if (id === 'royal_order') {
    rt.orderUntilMs = 5000;
  }
  if (id === 'emergency_repairs') {
    for (const b of world.buildings) {
      if (b.team !== hero.team) continue;
      if (dist(hero.x, hero.y, b.x, b.y) > radius) continue;
      b.hp = Math.min(b.maxHp, b.hp + 180);
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
    for (const u of world.units) {
      if (u.team !== hero.team || u.id === hero.id) continue;
      if (dist(hero.x, hero.y, u.x, u.y) > radius) continue;
      u.x += 80;
      u.y -= 20;
    }
  }
}

export function tickHeroes(world: BattlefieldWorld, dtMs: number): void {
  ensureHeroFields(world);
  for (const rt of [world.heroRuntime, world.enemyHeroRuntime]) {
    if (!rt) continue;
    const hero = world.units.find((u) => u.id === rt.unitId);
    if (!hero || hero.hp <= 0) {
      if (rt === world.heroRuntime) world.heroRuntime = null;
      else world.enemyHeroRuntime = null;
      continue;
    }
    for (const k of ['ability1', 'ability2', 'ultimate'] as HeroAbilitySlot[]) {
      rt.cds[k] = Math.max(0, rt.cds[k] - dtMs);
    }
    rt.angryUntilMs = Math.max(0, rt.angryUntilMs - dtMs);
    rt.orderUntilMs = Math.max(0, rt.orderUntilMs - dtMs);
    rt.decreeUntilMs = Math.max(0, rt.decreeUntilMs - dtMs);

    // Passive auras applied via combat helpers; temporary buffs mark units
    if (rt.angryUntilMs > 0) {
      for (const u of world.units) {
        if (u.team !== hero.team) continue;
        if (dist(hero.x, hero.y, u.x, u.y) > 140) continue;
        u.attackCd = Math.max(0, u.attackCd - dtMs * 0.35);
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

export function heroHudLine(world: BattlefieldWorld): string {
  ensureHeroFields(world);
  const rt = world.heroRuntime;
  const def = heroForSpecies(world.speciesId);
  if (!def) return '';
  if (!rt) {
    return `Hero: recruit with H at hall/den (${def.recruitCostGold}g/${def.recruitCostCrystals}c)`;
  }
  const hero = world.units.find((u) => u.id === rt.unitId);
  if (!hero) return 'Hero fallen';
  const cd = (s: HeroAbilitySlot) =>
    rt.cds[s] > 0 ? `${Math.ceil(rt.cds[s] / 1000)}s` : 'READY';
  return `${hero.name} HP ${Math.ceil(hero.hp)}  ·  Q ${def.abilities.ability1.name}[${cd('ability1')}]  W ${def.abilities.ability2.name}[${cd('ability2')}]  E ${def.abilities.ultimate.name}[${cd('ultimate')}]`;
}
