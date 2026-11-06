/**
 * Hero ability cast VFX — GRUK / Boniface / ZOGGLE.
 * Readable flashes + rings for phone distance; procedural Graphics only.
 */
import type Phaser from 'phaser';
import type { HeroVfx } from '../../gameplay/battlefield/battlefieldHeroes';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

export function drawHeroAbilityVfxList(
  g: G,
  list: HeroVfx[],
  view?: ViewBounds | null,
): void {
  for (const v of list) {
    if (view && !inView(view, v.x, v.y)) continue;
    const t = Math.max(0.05, v.lifeMs / v.maxLifeMs);
    switch (v.kind) {
      case 'smash':
        drawSmash(g, v, t);
        break;
      case 'buff':
        drawBuff(g, v, t);
        break;
      case 'heal':
        drawHeal(g, v, t);
        break;
      case 'zap':
        drawZap(g, v, t);
        break;
      case 'portal':
        drawPortal(g, v, t);
        break;
      case 'chaos':
        drawChaos(g, v, t);
        break;
      case 'chaos_tick':
        drawChaosTick(g, v, t);
        break;
      case 'recruit':
        drawRecruit(g, v, t);
        break;
      default:
        drawRing(g, v, t);
    }
  }
}

function drawRing(g: G, v: HeroVfx, t: number): void {
  const expand = 1.05 + (1 - t) * 0.35;
  g.lineStyle(3, v.color, t);
  g.strokeCircle(v.x, v.y, v.radius * expand);
  g.fillStyle(v.color, t * 0.12);
  g.fillCircle(v.x, v.y, v.radius * 0.55);
}

/** GRUK smash / BIG BONK — impact flash + radial shock lines. */
function drawSmash(g: G, v: HeroVfx, t: number): void {
  const expand = 0.85 + (1 - t) * 0.7;
  const r = v.radius * expand;
  g.fillStyle(0xfff0c8, t * 0.35);
  g.fillCircle(v.x, v.y, r * 0.35);
  g.fillStyle(v.color, t * 0.22);
  g.fillCircle(v.x, v.y, r * 0.7);
  g.lineStyle(4, v.color, t * 0.95);
  g.strokeCircle(v.x, v.y, r);
  g.lineStyle(2, 0xf0c75e, t * 0.7);
  g.strokeCircle(v.x, v.y, r * 0.62);
  const rays = v.abilityId === 'big_bonk' ? 8 : 6;
  for (let i = 0; i < rays; i++) {
    const ang = (i / rays) * Math.PI * 2 + (1 - t) * 0.2;
    const r0 = r * 0.4;
    const r1 = r * (0.95 + (1 - t) * 0.25);
    g.lineStyle(2.5, 0xd4782e, t * 0.85);
    g.lineBetween(
      v.x + Math.cos(ang) * r0,
      v.y + Math.sin(ang) * r0,
      v.x + Math.cos(ang) * r1,
      v.y + Math.sin(ang) * r1,
    );
  }
}

/** Boniface / Get Angry buff aura — nested regal rings + ticks. */
function drawBuff(g: G, v: HeroVfx, t: number): void {
  const expand = 0.9 + (1 - t) * 0.45;
  const r = v.radius * expand;
  const isRoyal = v.heroId === 'boniface';
  const outer = isRoyal ? 0xf0c75e : 0xd4782e;
  const inner = isRoyal ? 0xc0c8d4 : 0x4a7a3a;
  g.fillStyle(outer, t * 0.1);
  g.fillCircle(v.x, v.y, r * 0.55);
  g.lineStyle(3.5, outer, t);
  g.strokeCircle(v.x, v.y, r);
  g.lineStyle(2, inner, t * 0.75);
  g.strokeCircle(v.x, v.y, r * 0.72);
  const ticks = isRoyal ? 8 : 6;
  for (let i = 0; i < ticks; i++) {
    const ang = (i / ticks) * Math.PI * 2;
    const r0 = r * 0.88;
    const r1 = r * 1.08;
    g.lineStyle(2.2, outer, t * 0.9);
    g.lineBetween(
      v.x + Math.cos(ang) * r0,
      v.y + Math.sin(ang) * r0,
      v.x + Math.cos(ang) * r1,
      v.y + Math.sin(ang) * r1,
    );
  }
  if (isRoyal) {
    // Tiny crown tip flash
    g.fillStyle(0xfff8d8, t * 0.9);
    g.fillTriangle(
      v.x,
      v.y - r * 0.25,
      v.x + 7,
      v.y - r * 0.05,
      v.x - 7,
      v.y - r * 0.05,
    );
  }
}

/** Emergency Repairs — soft green cross pulses. */
function drawHeal(g: G, v: HeroVfx, t: number): void {
  const expand = 0.95 + (1 - t) * 0.4;
  const r = v.radius * expand;
  g.fillStyle(0x5dce6a, t * 0.14);
  g.fillCircle(v.x, v.y, r * 0.5);
  g.lineStyle(3, 0x5dce6a, t);
  g.strokeCircle(v.x, v.y, r);
  g.lineStyle(2, 0xf0c75e, t * 0.7);
  g.strokeCircle(v.x, v.y, r * 0.7);
  const arm = r * 0.28 * t;
  g.lineStyle(4, 0xb8f0c0, t * 0.95);
  g.lineBetween(v.x - arm, v.y, v.x + arm, v.y);
  g.lineBetween(v.x, v.y - arm, v.x, v.y + arm);
}

/** ZOGGLE Brain Zap — jagged bolt ring + spark nodes. */
function drawZap(g: G, v: HeroVfx, t: number): void {
  const expand = 0.8 + (1 - t) * 0.65;
  const r = v.radius * expand;
  g.fillStyle(0x6ecfbf, t * 0.18);
  g.fillCircle(v.x, v.y, r * 0.4);
  g.lineStyle(2.5, 0xe87aa8, t);
  g.strokeCircle(v.x, v.y, r);
  const bolts = 5;
  for (let i = 0; i < bolts; i++) {
    const ang = (i / bolts) * Math.PI * 2 + (1 - t) * 0.4;
    const mid = r * 0.55;
    const tip = r * 0.95;
    const mx = v.x + Math.cos(ang + 0.25) * mid;
    const my = v.y + Math.sin(ang + 0.25) * mid;
    const tx = v.x + Math.cos(ang) * tip;
    const ty = v.y + Math.sin(ang) * tip;
    g.lineStyle(2.2, 0x6ecfbf, t * 0.95);
    g.lineBetween(v.x, v.y, mx, my);
    g.lineBetween(mx, my, tx, ty);
    g.fillStyle(0xffffff, t * 0.9);
    g.fillCircle(tx, ty, 2.5 + (1 - t));
  }
}

/** Portal Trick blink puffs. */
function drawPortal(g: G, v: HeroVfx, t: number): void {
  const expand = 0.7 + (1 - t) * 0.9;
  const r = v.radius * expand;
  g.fillStyle(v.color, t * 0.25);
  g.fillCircle(v.x, v.y, r * 0.55);
  g.lineStyle(2.5, v.color, t);
  g.strokeCircle(v.x, v.y, r);
  g.lineStyle(1.5, 0xffffff, t * 0.6);
  g.strokeCircle(v.x, v.y, r * 0.55);
  // Tiny diamond “rift”
  const s = r * 0.35;
  g.fillStyle(0xffffff, t * 0.55);
  g.fillTriangle(v.x, v.y - s, v.x + s * 0.55, v.y, v.x - s * 0.55, v.y);
  g.fillTriangle(v.x, v.y + s, v.x + s * 0.55, v.y, v.x - s * 0.55, v.y);
}

/** WHAT IS HAPPENING? — wobbling multi-ring chaos. */
function drawChaos(g: G, v: HeroVfx, t: number): void {
  const expand = 0.9 + (1 - t) * 0.55;
  const r = v.radius * expand;
  g.fillStyle(0xe87aa8, t * 0.16);
  g.fillCircle(v.x, v.y, r * 0.5);
  g.lineStyle(3.5, 0xe87aa8, t);
  g.strokeCircle(v.x, v.y, r);
  g.lineStyle(2.5, 0x7a4aa8, t * 0.85);
  g.strokeCircle(v.x, v.y, r * 0.72);
  g.lineStyle(2, 0x6ecfbf, t * 0.7);
  g.strokeCircle(v.x, v.y, r * 1.12);
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2 + (1 - t) * 1.2;
    const d = r * (0.55 + ((i % 3) * 0.12));
    const sx = v.x + Math.cos(ang) * d;
    const sy = v.y + Math.sin(ang) * d;
    g.fillStyle(i % 2 === 0 ? 0xe87aa8 : 0x6ecfbf, t * 0.9);
    g.fillCircle(sx, sy, 3 + (1 - t) * 2);
  }
}

function drawChaosTick(g: G, v: HeroVfx, t: number): void {
  const r = v.radius * (0.95 + (1 - t) * 0.2);
  g.lineStyle(2, v.color, t * 0.75);
  g.strokeCircle(v.x, v.y, r);
  g.fillStyle(0xe87aa8, t * 0.08);
  g.fillCircle(v.x, v.y, r * 0.4);
}

function drawRecruit(g: G, v: HeroVfx, t: number): void {
  const expand = 0.85 + (1 - t) * 0.5;
  const r = v.radius * expand;
  g.fillStyle(v.color, t * 0.2);
  g.fillCircle(v.x, v.y, r * 0.5);
  g.lineStyle(3, v.color, t);
  g.strokeCircle(v.x, v.y, r);
  g.lineStyle(2, 0xfff8e8, t * 0.7);
  g.strokeCircle(v.x, v.y, r * 0.65);
}
