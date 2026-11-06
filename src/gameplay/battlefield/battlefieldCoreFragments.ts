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
  /** Own this many fragments to start the victory hold clock. */
  holdNeeded: 2,
  /** Hold duration to win once threshold is met (Wardstone analog). */
  holdWinMs: 60_000,
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

export function seedCoreFragments(
  world: BattlefieldWorld,
  spots?: Array<{ x: number; y: number }>,
): void {
  const list =
    spots ??
    [
      { x: MAP.width * 0.42, y: MAP.height * 0.48 },
      { x: MAP.width * 0.58, y: MAP.height * 0.42 },
      { x: MAP.width * 0.5, y: MAP.height * 0.62 },
    ];
  world.coreFragments = list.map((p, i) => ({
    id: 9000 + i,
    x: p.x,
    y: p.y,
    radius: CORE_FRAGMENT.radius,
    owner: 'neutral' as const,
    captureTeam: null,
    captureProgress: 0,
  }));
}

export function teamPresent(
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

export function countOwnedCores(
  world: BattlefieldWorld,
  team: BattlefieldTeam,
): number {
  let n = 0;
  for (const f of world.coreFragments ?? []) {
    if (f.owner === team) n++;
  }
  return n;
}

/** Tick victory-hold clocks (Wardstone-style accumulate / 2× decay). */
export function tickCoreHoldTimers(world: BattlefieldWorld, dtMs: number): void {
  if (world.playerCoreHoldMs == null) world.playerCoreHoldMs = 0;
  if (world.enemyCoreHoldMs == null) world.enemyCoreHoldMs = 0;
  const needed = CORE_FRAGMENT.holdNeeded;
  for (const team of ['player', 'enemy'] as const) {
    const owned = countOwnedCores(world, team);
    if (owned >= needed) {
      if (team === 'player') world.playerCoreHoldMs += dtMs;
      else world.enemyCoreHoldMs += dtMs;
    } else if (team === 'player') {
      world.playerCoreHoldMs = Math.max(0, world.playerCoreHoldMs - dtMs * 2);
    } else {
      world.enemyCoreHoldMs = Math.max(0, world.enemyCoreHoldMs - dtMs * 2);
    }
  }
}

export type CoreHoldBannerState = {
  visible: boolean;
  /** Whose hold clock is the threat/win being shown. */
  side: 'player' | 'enemy' | null;
  owned: number;
  needed: number;
  /** ms remaining until that side wins. */
  remainMs: number;
  totalMs: number;
};

/** Glanceable victory-hold banner payload (only while a side is at threshold). */
export function coreHoldBannerState(world: BattlefieldWorld): CoreHoldBannerState {
  const needed = CORE_FRAGMENT.holdNeeded;
  const totalMs = CORE_FRAGMENT.holdWinMs;
  const playerOwned = countOwnedCores(world, 'player');
  const enemyOwned = countOwnedCores(world, 'enemy');
  const playerMs = world.playerCoreHoldMs ?? 0;
  const enemyMs = world.enemyCoreHoldMs ?? 0;

  if (playerOwned >= needed) {
    return {
      visible: true,
      side: 'player',
      owned: playerOwned,
      needed,
      remainMs: Math.max(0, totalMs - playerMs),
      totalMs,
    };
  }
  if (enemyOwned >= needed) {
    return {
      visible: true,
      side: 'enemy',
      owned: enemyOwned,
      needed,
      remainMs: Math.max(0, totalMs - enemyMs),
      totalMs,
    };
  }
  return {
    visible: false,
    side: null,
    owned: 0,
    needed,
    remainMs: totalMs,
    totalMs,
  };
}

function formatHoldClock(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Compact HUD line for CORE ownership + active hold/contest. */
export function coreHudSummary(world: BattlefieldWorld): string {
  const list = world.coreFragments ?? [];
  if (list.length === 0) return '';

  let ours = 0;
  let theirs = 0;
  let open = 0;
  let best:
    | { priority: number; text: string }
    | null = null;

  for (const f of list) {
    if (f.owner === 'player') ours++;
    else if (f.owner === 'enemy') theirs++;
    else open++;

    const { player, enemy } = teamPresent(world, f);
    if (player > 0 && enemy > 0) {
      const text = 'Contested';
      if (!best || best.priority < 3) best = { priority: 3, text };
      continue;
    }
    if (f.captureTeam === 'player' && f.captureProgress > 0.02) {
      const pct = Math.floor(f.captureProgress * 100);
      const text = `Capturing ${pct}%`;
      if (!best || best.priority < 2) best = { priority: 2, text };
      continue;
    }
    if (f.captureTeam === 'enemy' && f.captureProgress > 0.02) {
      const pct = Math.floor(f.captureProgress * 100);
      const text = `Enemy capture ${pct}%`;
      if (!best || best.priority < 1) best = { priority: 1, text };
    }
  }

  const banner = coreHoldBannerState(world);
  if (banner.visible && banner.side === 'player') {
    best = {
      priority: 4,
      text: `Win hold ${banner.owned}/${banner.needed} · ${formatHoldClock(banner.remainMs)}`,
    };
  } else if (banner.visible && banner.side === 'enemy') {
    best = {
      priority: 4,
      text: `Enemy win ${banner.owned}/${banner.needed} · ${formatHoldClock(banner.remainMs)}`,
    };
  }

  const ownership = `You ${ours} · Enemy ${theirs}${open > 0 ? ` · ${open} open` : ''}`;
  if (best) return `CORE  ·  ${ownership}  ·  ${best.text}`;
  return `CORE  ·  ${ownership}`;
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

  tickCoreHoldTimers(world, dtMs);
}
