/**
 * Nobles FORMATIONS readouts — rings, link lines, cluster glow.
 * Procedural Graphics only; cheap for mobile.
 */
import type Phaser from 'phaser';
import { FORMATION } from '../../gameplay/battlefield/battlefieldFormations';
import type { BattlefieldUnit, BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { enemyRevealed } from '../../gameplay/battlefield/battlefieldFog';
import { getUnitType } from '../../data/units';
import { dist } from '../../gameplay/math';

type G = Phaser.GameObjects.Graphics;

const SILVER = 0xc0c8d4;
const GOLD = 0xf0c75e;
const BLUE = 0x3d7ea6;

function formedVisible(world: BattlefieldWorld, u: BattlefieldUnit): boolean {
  if (!u.inFormation || u.hp <= 0) return false;
  if (u.speciesId !== 'nobles') return false;
  if (!getUnitType(u.typeId).usesFormation) return false;
  if (u.team === 'enemy' && !enemyRevealed(world.fog, u.x, u.y)) return false;
  return true;
}

/** Draw formation feedback under units (call before unit silhouettes). */
export function drawFormationVisuals(
  g: G,
  world: BattlefieldWorld,
  timeMs: number,
): void {
  const formed = world.units.filter((u) => formedVisible(world, u));
  if (formed.length === 0) return;

  const pulse = 0.55 + 0.25 * Math.sin(timeMs / 420);

  // Soft ground glow per formed unit
  for (const u of formed) {
    const locked = u.formationLocked;
    const glow = locked ? GOLD : SILVER;
    g.fillStyle(glow, 0.12 + pulse * 0.08);
    g.fillCircle(u.x, u.y, u.radius + 14);
    g.lineStyle(2, glow, locked ? 0.95 : 0.7);
    g.strokeCircle(u.x, u.y, u.radius + 10);
    if (locked) {
      // Inner lock chevron ticks
      g.lineStyle(1.5, GOLD, 0.85);
      g.strokeCircle(u.x, u.y, u.radius + 6);
    }
  }

  // Link lines between nearby formed allies (same team) — one undirected edge
  for (let i = 0; i < formed.length; i++) {
    const a = formed[i]!;
    for (let j = i + 1; j < formed.length; j++) {
      const b = formed[j]!;
      if (a.team !== b.team) continue;
      const d = dist(a.x, a.y, b.x, b.y);
      if (d > FORMATION.radius) continue;
      const locked = a.formationLocked || b.formationLocked;
      g.lineStyle(2, locked ? GOLD : BLUE, 0.35 + pulse * 0.25);
      g.lineBetween(a.x, a.y, b.x, b.y);
      // Midpoint knot
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      g.fillStyle(locked ? GOLD : SILVER, 0.7);
      g.fillCircle(mx, my, 2.5);
    }
  }

  // Per-team cluster hull (AABB rounded) when ≥2 formed
  for (const team of ['player', 'enemy'] as const) {
    const group = formed.filter((u) => u.team === team);
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
      if (u.formationLocked) anyLocked = true;
    }
    const pad = 18;
    g.lineStyle(1.5, anyLocked ? GOLD : SILVER, 0.4 + pulse * 0.15);
    g.strokeRoundedRect(
      minX - pad,
      minY - pad,
      maxX - minX + pad * 2,
      maxY - minY + pad * 2,
      12,
    );
    // Banner flag at top-center
    const cx = (minX + maxX) * 0.5;
    const top = minY - pad;
    g.fillStyle(anyLocked ? GOLD : BLUE, 0.85);
    g.fillTriangle(cx, top - 10, cx + 10, top + 4, cx - 10, top + 4);
  }
}
