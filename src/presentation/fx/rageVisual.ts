/**
 * Brutes RAGE readouts — ember rings, slash links, pack heat.
 * Pairs with Weirdos mutation FX; procedural Graphics only.
 */
import type Phaser from 'phaser';
import { RAGE } from '../../gameplay/battlefield/battlefieldRage';
import { enemyRevealed } from '../../gameplay/battlefield/battlefieldFog';
import type {
  BattlefieldUnit,
  BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { getUnitType } from '../../data/units';
import { dist } from '../../gameplay/math';

type G = Phaser.GameObjects.Graphics;

const ORANGE = 0xd4782e;
const RED = 0xe85a5a;
const EMBER = 0xf0c75e;

function enragedVisible(world: BattlefieldWorld, u: BattlefieldUnit): boolean {
  if (!u.enraged || u.hp <= 0) return false;
  if (u.speciesId !== 'brutes') return false;
  if (!getUnitType(u.typeId).canRage) return false;
  if (u.team === 'enemy' && !enemyRevealed(world.fog, u.x, u.y)) return false;
  return true;
}

/** Draw rage feedback under units (call before silhouettes). */
export function drawRageVisuals(
  g: G,
  world: BattlefieldWorld,
  timeMs: number,
): void {
  const raging = world.units.filter((u) => enragedVisible(world, u));
  if (raging.length === 0) return;

  const pulse = 0.55 + 0.35 * Math.sin(timeMs / 300);
  const throb = Math.sin(timeMs / 180);

  for (const u of raging) {
    const locked = u.rageLocked;
    const accent = locked ? RED : ORANGE;
    g.fillStyle(accent, 0.12 + pulse * 0.12);
    g.fillCircle(u.x, u.y, u.radius + 15 + Math.abs(throb) * 2);
    g.lineStyle(2.5, accent, locked ? 0.95 : 0.7);
    g.strokeCircle(u.x, u.y, u.radius + 10 + throb * 1.5);
    // Jagged outer ticks
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + timeMs / 500;
      const r0 = u.radius + 8;
      const r1 = u.radius + 14 + pulse * 3;
      g.lineStyle(2, EMBER, 0.55 + pulse * 0.25);
      g.lineBetween(
        u.x + Math.cos(ang) * r0,
        u.y + Math.sin(ang) * r0,
        u.x + Math.cos(ang) * r1,
        u.y + Math.sin(ang) * r1,
      );
    }
    if (locked) {
      g.lineStyle(1.5, EMBER, 0.9);
      g.strokeCircle(u.x, u.y, u.radius + 6);
    }
  }

  for (let i = 0; i < raging.length; i++) {
    const a = raging[i]!;
    for (let j = i + 1; j < raging.length; j++) {
      const b = raging[j]!;
      if (a.team !== b.team) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d > RAGE.radius) continue;
      const locked = a.rageLocked || b.rageLocked;
      g.lineStyle(2, locked ? RED : ORANGE, 0.35 + pulse * 0.25);
      g.lineBetween(a.x, a.y, b.x, b.y);
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      g.fillStyle(EMBER, 0.8);
      g.fillCircle(mx, my, 2.8);
    }
  }

  for (const team of ['player', 'enemy'] as const) {
    const group = raging.filter((u) => u.team === team);
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
      if (u.rageLocked) anyLocked = true;
    }
    const pad = 18;
    g.lineStyle(1.5, anyLocked ? RED : ORANGE, 0.4 + pulse * 0.2);
    g.strokeRoundedRect(
      minX - pad,
      minY - pad,
      maxX - minX + pad * 2,
      maxY - minY + pad * 2,
      10,
    );
    const cx = (minX + maxX) * 0.5;
    const top = minY - pad;
    g.fillStyle(anyLocked ? RED : ORANGE, 0.9);
    g.fillTriangle(cx, top - 12, cx + 9, top + 2, cx - 9, top + 2);
  }
}
