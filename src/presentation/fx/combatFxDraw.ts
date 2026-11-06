/**
 * Draw combat hit / death pops — procedural Graphics only.
 */
import type Phaser from 'phaser';
import type { CombatFx } from '../../gameplay/battlefield/battlefieldCombatFx';

type G = Phaser.GameObjects.Graphics;

export function drawCombatFxList(g: G, list: CombatFx[]): void {
  for (const fx of list) {
    const t = Math.max(0, fx.lifeMs / fx.maxLifeMs);
    if (fx.kind === 'hit') drawHit(g, fx, t);
    else if (fx.kind === 'building_hit') drawBuildingHit(g, fx, t);
    else if (fx.kind === 'core_pulse') drawCorePulse(g, fx, t);
    else if (fx.kind === 'core_burst') drawCoreBurst(g, fx, t);
    else drawDeath(g, fx, t);
  }
}

function drawCorePulse(g: G, fx: CombatFx, t: number): void {
  const a = t * 0.9;
  const r = fx.radius * (0.85 + (1 - t) * 0.7);
  g.lineStyle(2.5, fx.color, a);
  g.strokeCircle(fx.x, fx.y, r);
  g.fillStyle(fx.color, a * 0.15);
  g.fillCircle(fx.x, fx.y, r * 0.5);
}

function drawCoreBurst(g: G, fx: CombatFx, t: number): void {
  const a = Math.max(0.1, t);
  const expand = 1 + (1 - t) * 1.8;
  g.fillStyle(0xffffff, a * 0.35);
  g.fillCircle(fx.x, fx.y, fx.radius * 0.4 * expand);
  g.lineStyle(3, fx.color, a);
  g.strokeCircle(fx.x, fx.y, fx.radius * expand);
  g.lineStyle(1.5, 0xfff8e8, a * 0.7);
  g.strokeCircle(fx.x, fx.y, fx.radius * expand * 0.65);
  const shards = 6;
  for (let i = 0; i < shards; i++) {
    const ang = (i / shards) * Math.PI * 2 + (fx.seed % 3) * 0.15;
    const d = fx.radius * (0.5 + (1 - t) * 1.5);
    const cx = fx.x + Math.cos(ang) * d;
    const cy = fx.y + Math.sin(ang) * d;
    const s = 5 + (1 - t) * 4;
    g.fillStyle(fx.color, a * 0.95);
    g.fillTriangle(
      cx,
      cy - s,
      cx + s * 0.7,
      cy + s * 0.5,
      cx - s * 0.7,
      cy + s * 0.5,
    );
  }
}

function drawHit(g: G, fx: CombatFx, t: number): void {
  const a = t;
  const r = fx.radius * (1.1 + (1 - t) * 0.55);
  g.lineStyle(2, 0xfff4d0, a * 0.95);
  g.strokeCircle(fx.x, fx.y, r);
  g.fillStyle(fx.color, a * 0.35);
  g.fillCircle(fx.x, fx.y, r * 0.45);
  // 3 sparks
  for (let i = 0; i < 3; i++) {
    const ang = ((fx.seed + i * 2.1) % 7) * 0.95;
    const dist = r * (0.7 + (1 - t) * 0.8);
    const sx = fx.x + Math.cos(ang) * dist;
    const sy = fx.y + Math.sin(ang) * dist;
    g.fillStyle(0xfff8e8, a * 0.9);
    g.fillCircle(sx, sy, 2.2 + (1 - t));
  }
}

function drawBuildingHit(g: G, fx: CombatFx, t: number): void {
  const a = t * 0.9;
  g.lineStyle(2, fx.color, a);
  g.strokeCircle(fx.x, fx.y, fx.radius * (1 + (1 - t) * 0.4));
  g.fillStyle(0xffffff, a * 0.2);
  g.fillCircle(fx.x, fx.y, fx.radius * 0.35);
}

function drawDeath(g: G, fx: CombatFx, t: number): void {
  const a = t;
  const expand = 1 + (1 - t) * 1.4;
  g.fillStyle(fx.color, a * 0.28);
  g.fillCircle(fx.x, fx.y, fx.radius * expand);
  g.lineStyle(2, 0xfff0c8, a * 0.75);
  g.strokeCircle(fx.x, fx.y, fx.radius * expand * 0.85);
  // Chunk pops
  const chunks = 5;
  for (let i = 0; i < chunks; i++) {
    const ang = (i / chunks) * Math.PI * 2 + (fx.seed % 5) * 0.2;
    const dist = fx.radius * (0.4 + (1 - t) * 1.6);
    const cx = fx.x + Math.cos(ang) * dist;
    const cy = fx.y + Math.sin(ang) * dist;
    const s = fx.radius * 0.28 * (0.5 + t * 0.5);
    g.fillStyle(fx.color, a * 0.9);
    g.fillTriangle(
      cx,
      cy - s,
      cx + s * 0.85,
      cy + s * 0.55,
      cx - s * 0.85,
      cy + s * 0.55,
    );
  }
}
