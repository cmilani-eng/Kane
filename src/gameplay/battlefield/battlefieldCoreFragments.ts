/**
 * CORE fragments — capturable map relics (GDD: shattered KANE CORE).
 * Claiming fires pulse/burst FX for presentation.
 */
import { MAP } from '../../config/balance';
import { dist } from '../math';
import { pushCombatFx } from './battlefieldCombatFx';
import { walletOf } from './battlefieldEconomy';
import type { BattlefieldTeam, BattlefieldWorld } from './battlefieldWorld';

export const CORE_FRAGMENT = {
  captureRange: 78,
  captureMs: 2800,
  radius: 22,
  claimCrystals: 8,
} as const;

export interface CoreFragment {
  id: number;
  x: number;
  y: number;
  radius: number;
  owner: BattlefieldTeam | 'neutral';
  captureTeam: BattlefieldTeam | null;
  captureProgress: number;
}

export function seedCoreFragments(world: BattlefieldWorld): void {
  const spots = [
    { x: MAP.width * 0.42, y: MAP.height * 0.48 },
    { x: MAP.width * 0.58, y: MAP.height * 0.42 },
    { x: MAP.width * 0.5, y: MAP.height * 0.62 },
  ];
  world.coreFragments = spots.map((p, i) => ({
    id: 9000 + i,
    x: p.x,
    y: p.y,
    radius: CORE_FRAGMENT.radius,
    owner: 'neutral' as const,
    captureTeam: null,
    captureProgress: 0,
  }));
}

function teamPresent(
  world: BattlefieldWorld,
  f: CoreFragment,
): { player: number; enemy: number } {
  let player = 0;
  let enemy = 0;
  for (const u of world.units) {
    if (u.hp <= 0) continue;
    if (dist(u.x, u.y, f.x, f.y) > CORE_FRAGMENT.captureRange) continue;
    if (u.team === 'player') player++;
    else if (u.team === 'enemy') enemy++;
  }
  return { player, enemy };
}

function claimBurst(
  world: BattlefieldWorld,
  f: CoreFragment,
  team: BattlefieldTeam,
): void {
  const color = team === 'player' ? 0x7ec8ff : 0xe87aa8;
  pushCombatFx(world, 'core_burst', f.x, f.y, color, f.radius * 2.2, 520);
  // Extra spark rings
  pushCombatFx(world, 'core_pulse', f.x, f.y, 0xfff8e8, f.radius * 1.4, 280);
  walletOf(world, team).magic_crystals += CORE_FRAGMENT.claimCrystals;
  world.coreClaimFlashMs = 200;
}

export function tickCoreFragments(world: BattlefieldWorld, dtMs: number): void {
  if (!world.coreFragments) world.coreFragments = [];
  if (world.coreClaimFlashMs > 0) {
    world.coreClaimFlashMs = Math.max(0, world.coreClaimFlashMs - dtMs);
  }

  for (const f of world.coreFragments) {
    const { player, enemy } = teamPresent(world, f);
    let contester: BattlefieldTeam | null = null;
    if (player > 0 && enemy === 0) contester = 'player';
    else if (enemy > 0 && player === 0) contester = 'enemy';

    if (contester && contester !== f.owner) {
      if (f.captureTeam !== contester) {
        f.captureTeam = contester;
        f.captureProgress = 0;
      }
      const prev = f.captureProgress;
      f.captureProgress = Math.min(
        1,
        f.captureProgress + dtMs / CORE_FRAGMENT.captureMs,
      );
      // Soft pulse while contesting (throttle via progress notches)
      if (Math.floor(prev * 4) !== Math.floor(f.captureProgress * 4)) {
        const c = contester === 'player' ? 0x7ec8ff : 0xe87aa8;
        pushCombatFx(
          world,
          'core_pulse',
          f.x,
          f.y,
          c,
          f.radius * (1.1 + f.captureProgress),
          220,
        );
      }
      if (f.captureProgress >= 1) {
        f.owner = contester;
        f.captureProgress = 0;
        f.captureTeam = null;
        claimBurst(world, f, contester);
      }
    } else if (!contester) {
      f.captureTeam = null;
      f.captureProgress = Math.max(
        0,
        f.captureProgress - dtMs / CORE_FRAGMENT.captureMs,
      );
    }
  }
}
