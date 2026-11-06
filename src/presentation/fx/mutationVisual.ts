/**
 * Weirdos MUTATION readouts — aura rings, drip links, cluster haze.
 * Procedural Graphics only; cheap for mobile.
 */
import type Phaser from 'phaser';
import { MUTATION } from '../../gameplay/battlefield/battlefieldMutations';
import { enemyRevealed } from '../../gameplay/battlefield/battlefieldFog';
import type {
  BattlefieldUnit,
  BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { getUnitType } from '../../data/units';
import { dist } from '../../gameplay/math';

type G = Phaser.GameObjects.Graphics;

const PINK = 0xe87aa8;
const TEAL = 0x6ecfbf;
const PURPLE = 0x7a4aa8;

function mutatedVisible(world: BattlefieldWorld, u: BattlefieldUnit): boolean {
  if (!u.mutated || u.hp <= 0) return false;
  if (u.speciesId !== 'weirdos') return false;
  if (!getUnitType(u.typeId).canMutate) return false;
  if (u.team === 'enemy' && !enemyRevealed(world.fog, u.x, u.y)) return false;
  return true;
}

/** Draw mutation feedback under units (call before silhouettes). */
export function drawMutationVisuals(
  g: G,
  world: BattlefieldWorld,
  timeMs: number,
): void {
  const muts = world.units.filter((u) => mutatedVisible(world, u));
  if (muts.length === 0) return;

  const pulse = 0.5 + 0.3 * Math.sin(timeMs / 360);
  const wobble = Math.sin(timeMs / 280);

  for (const u of muts) {
    const locked = u.mutationLocked;
    const accent = locked ? PINK : TEAL;
    g.fillStyle(accent, 0.1 + pulse * 0.1);
    g.fillCircle(u.x, u.y, u.radius + 16 + wobble * 2);
    g.lineStyle(2.5, accent, locked ? 0.95 : 0.65);
    g.strokeCircle(u.x, u.y, u.radius + 11 + Math.abs(wobble));
    if (locked) {
      g.lineStyle(1.5, PURPLE, 0.8);
      g.strokeCircle(u.x, u.y, u.radius + 7);
      // Orbit speck
      const ang = timeMs / 200 + u.id;
      g.fillStyle(PINK, 0.9);
      g.fillCircle(
        u.x + Math.cos(ang) * (u.radius + 14),
        u.y + Math.sin(ang) * (u.radius + 14),
        2.8,
      );
    }
  }

  for (let i = 0; i < muts.length; i++) {
    const a = muts[i]!;
    for (let j = i + 1; j < muts.length; j++) {
      const b = muts[j]!;
      if (a.team !== b.team) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d > MUTATION.radius) continue;
      const locked = a.mutationLocked || b.mutationLocked;
      g.lineStyle(2, locked ? PINK : TEAL, 0.3 + pulse * 0.25);
      g.lineBetween(a.x, a.y, b.x, b.y);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      g.fillStyle(locked ? PINK : TEAL, 0.75);
      g.fillCircle(mx, my + wobble * 1.5, 3);
    }
  }

  for (const team of ['player', 'enemy'] as const) {
    const group = muts.filter((u) => u.team === team);
    if (group.length < 2) continue;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let anyLocked = false;
    for (const u of group) {
      minX = Math.min(minX, u.x - u.radius);
      minY = Math.min(minY, u.y - u.radius);
      maxX = Math.max(maxX, u.x + u.radius);
      maxY = Math.max(maxY, u.y + u.radius);
      if (u.mutationLocked) anyLocked = true;
    }
    const pad = 20;
    g.lineStyle(1.5, anyLocked ? PINK : TEAL, 0.35 + pulse * 0.2);
    g.strokeRoundedRect(
      minX - pad,
      minY - pad,
      maxX - minX + pad * 2,
      maxY - minY + pad * 2,
      16,
    );
    const cx = (minX + maxX) * 0.5;
    const top = minY - pad;
    g.fillStyle(anyLocked ? PINK : TEAL, 0.85);
    g.fillCircle(cx, top - 6, 5 + pulse * 2);
  }
}
