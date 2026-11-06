/**
 * Procedural species silhouettes + cheap idle/move/attack cycles.
 * Graphics-only (no textures) for Phaser 4 mobile budget.
 */
import type Phaser from 'phaser';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { getUnitType, type UnitTypeId } from '../../data/units';

type G = Phaser.GameObjects.Graphics;

export type UnitAnimPhase = 'idle' | 'move' | 'attack';

export interface SilhouetteOpts {
  x: number;
  y: number;
  radius: number;
  fill: number;
  speciesId: SpeciesId;
  typeId: UnitTypeId;
  /** Scene time ms — drives cycles. */
  timeMs: number;
  /** Stable phase offset (use unit id). */
  seed?: number;
  phase?: UnitAnimPhase;
  flash?: boolean;
  mutated?: boolean;
  inFormation?: boolean;
}

export function resolveUnitAnimPhase(u: {
  moveTarget: { x: number; y: number } | null;
  lastAttackFlashMs: number;
}): UnitAnimPhase {
  if (u.lastAttackFlashMs > 0) return 'attack';
  if (u.moveTarget != null) return 'move';
  return 'idle';
}

function cycle(t: number, period: number, seed: number): number {
  return ((t + seed * 37) % period) / period;
}

function bob(phase: UnitAnimPhase, t: number, seed: number, r: number): {
  ox: number;
  oy: number;
  squash: number;
  lean: number;
  swing: number;
} {
  if (phase === 'attack') {
    const c = cycle(t, 220, seed);
    const punch = Math.sin(c * Math.PI * 2);
    return {
      ox: punch * r * 0.22,
      oy: Math.abs(punch) * r * -0.08,
      squash: 1 + punch * 0.12,
      lean: punch * 0.18,
      swing: punch,
    };
  }
  if (phase === 'move') {
    const c = cycle(t, 320, seed);
    const step = Math.sin(c * Math.PI * 2);
    return {
      ox: step * r * 0.06,
      oy: Math.abs(Math.sin(c * Math.PI * 4)) * r * -0.1,
      squash: 1 + Math.sin(c * Math.PI * 4) * 0.08,
      lean: step * 0.1,
      swing: step,
    };
  }
  const c = cycle(t, 1400, seed);
  const breath = Math.sin(c * Math.PI * 2);
  return {
    ox: 0,
    oy: breath * r * 0.06,
    squash: 1 + breath * 0.04,
    lean: 0,
    swing: breath * 0.35,
  };
}

function fillShape(
  g: G,
  shape: NonNullable<ReturnType<typeof getUnitType>['shape']>,
  x: number,
  y: number,
  r: number,
): void {
  if (shape === 'square') {
    g.fillRect(x - r, y - r, r * 2, r * 2);
  } else if (shape === 'diamond') {
    g.fillTriangle(x, y - r, x + r, y, x, y + r);
    g.fillTriangle(x, y - r, x - r, y, x, y + r);
  } else if (shape === 'triangle') {
    g.fillTriangle(x, y - r, x + r, y + r * 0.7, x - r, y + r * 0.7);
  } else if (shape === 'hex') {
    for (let i = 0; i < 6; i++) {
      const a0 = (Math.PI / 3) * i - Math.PI / 6;
      const a1 = (Math.PI / 3) * (i + 1) - Math.PI / 6;
      g.fillTriangle(
        x,
        y,
        x + Math.cos(a0) * r,
        y + Math.sin(a0) * r,
        x + Math.cos(a1) * r,
        y + Math.sin(a1) * r,
      );
    }
  } else if (shape === 'star') {
    g.fillCircle(x, y, r * 0.72);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      g.fillCircle(
        x + Math.cos(a) * r * 0.78,
        y + Math.sin(a) * r * 0.78,
        r * 0.26,
      );
    }
  } else {
    g.fillCircle(x, y, r);
  }
}

function drawEyes(
  g: G,
  x: number,
  y: number,
  r: number,
  weird: boolean,
  blink: boolean,
): void {
  if (blink) {
    g.fillStyle(0x0a1220, 0.85);
    g.fillRect(x - r * 0.45, y - r * 0.12, r * 0.9, r * 0.1);
    return;
  }
  if (weird) {
    g.fillStyle(0xfff8e8, 0.98);
    g.fillCircle(x, y - r * 0.05, r * 0.42);
    g.fillStyle(0x1a0a28, 0.95);
    g.fillCircle(x + r * 0.06, y - r * 0.02, r * 0.18);
    g.fillStyle(0x6ecfbf, 0.85);
    g.fillCircle(x + r * 0.1, y, r * 0.07);
    return;
  }
  g.fillStyle(0xfff8e8, 0.95);
  g.fillCircle(x - r * 0.28, y - r * 0.15, r * 0.22);
  g.fillCircle(x + r * 0.28, y - r * 0.15, r * 0.22);
  g.fillStyle(0x0a1220, 0.95);
  g.fillCircle(x - r * 0.28, y - r * 0.12, r * 0.1);
  g.fillCircle(x + r * 0.28, y - r * 0.12, r * 0.1);
}

function drawBruteExtras(
  g: G,
  x: number,
  y: number,
  r: number,
  accent: number,
  swing: number,
): void {
  g.fillStyle(accent, 0.95);
  const horn = swing * r * 0.08;
  g.fillTriangle(
    x - r * 0.55,
    y - r * 0.55,
    x - r * 0.15 + horn,
    y - r * 1.0,
    x - r * 0.05,
    y - r * 0.45,
  );
  g.fillTriangle(
    x + r * 0.55,
    y - r * 0.55,
    x + r * 0.15 - horn,
    y - r * 1.0,
    x + r * 0.05,
    y - r * 0.45,
  );
  g.fillStyle(0x2a3a22, 0.55);
  g.fillEllipse(x, y + r * 0.35, r * 1.15, r * 0.48);
  // Club / fist hint
  g.fillStyle(accent, 0.85);
  g.fillCircle(x + r * 0.85 + swing * r * 0.25, y + r * 0.15, r * 0.28);
}

function drawNobleExtras(
  g: G,
  x: number,
  y: number,
  r: number,
  accent: number,
  silver: number,
  swing: number,
): void {
  g.fillStyle(accent, 0.95);
  g.fillTriangle(
    x + swing * r * 0.05,
    y - r * 1.28,
    x + r * 0.22,
    y - r * 0.55,
    x - r * 0.22,
    y - r * 0.55,
  );
  g.fillStyle(silver, 0.9);
  g.fillRect(x - r * 0.7, y - r * 0.35, r * 1.4, r * 0.22);
  g.fillStyle(silver, 0.55);
  g.fillEllipse(x - r * 0.78, y + r * 0.15, r * 0.48, r * 0.36);
  g.fillEllipse(x + r * 0.78, y + r * 0.15, r * 0.48, r * 0.36);
  // Banner tip / spear bob
  g.fillStyle(accent, 0.9);
  g.fillRect(x + r * 0.95, y - r * 0.9 + swing * r * 0.12, r * 0.1, r * 1.2);
  g.fillTriangle(
    x + r * 1.0,
    y - r * 1.15 + swing * r * 0.12,
    x + r * 1.45,
    y - r * 0.85,
    x + r * 1.0,
    y - r * 0.55,
  );
}

function drawWeirdoExtras(
  g: G,
  x: number,
  y: number,
  r: number,
  accent: number,
  pink: number,
  mutated: boolean,
  swing: number,
): void {
  g.fillStyle(pink, 0.75);
  g.fillCircle(x - r * 0.55, y + r * 0.85 + swing * r * 0.12, r * 0.24);
  g.fillCircle(x + r * 0.35, y + r * 0.95 - swing * r * 0.1, r * 0.2);
  g.fillStyle(accent, 0.7);
  g.fillCircle(x + r * 0.75, y + r * 0.5 + Math.abs(swing) * r * 0.08, r * 0.22);
  g.fillStyle(accent, 0.95);
  g.fillTriangle(
    x,
    y - r * 1.2 - Math.abs(swing) * r * 0.08,
    x + r * 0.3,
    y - r * 0.5,
    x - r * 0.3,
    y - r * 0.5,
  );
  if (mutated) {
    g.lineStyle(2, pink, 0.9);
    g.strokeCircle(x, y, r * 1.18);
  }
}

/** Draw one animated unit silhouette. */
export function drawUnitSilhouette(g: G, opts: SilhouetteOpts): void {
  const def = getUnitType(opts.typeId);
  const pal = SPECIES[opts.speciesId].palette;
  const shape = def.shape ?? 'circle';
  const seed = opts.seed ?? 0;
  const phase = opts.phase ?? 'idle';
  const anim = bob(phase, opts.timeMs, seed, opts.radius);
  const x = opts.x + anim.ox;
  const y = opts.y + anim.oy;
  const r = opts.radius * (0.92 + (anim.squash - 1) * 0.5);
  const fill = opts.flash ? 0xffffff : opts.fill;

  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(
    opts.x,
    opts.y + opts.radius * 0.65,
    opts.radius * (1.25 + Math.abs(anim.lean) * 0.2),
    opts.radius * 0.38,
  );

  if (opts.speciesId === 'weirdos' || def.isHero) {
    g.fillStyle(pal.accent, phase === 'attack' ? 0.28 : 0.16);
    g.fillCircle(x, y, r * 1.28);
  }

  g.fillStyle(fill, 1);
  if (opts.speciesId === 'brutes') {
    fillShape(g, shape, x + anim.lean * r * 0.2, y + r * 0.04, r * 1.06);
  } else if (opts.speciesId === 'weirdos') {
    g.fillEllipse(x, y + r * 0.08, r * (2.0 + anim.squash * 0.08), r * 1.7);
    if (shape !== 'circle') fillShape(g, shape, x, y - r * 0.12, r * 0.82);
  } else {
    fillShape(g, shape, x + anim.lean * r * 0.15, y, r);
  }

  const blink =
    phase === 'idle' && cycle(opts.timeMs, 2800, seed + 3) > 0.92;

  if (opts.speciesId === 'brutes') {
    drawBruteExtras(g, x, y, r, pal.accent, anim.swing);
    drawEyes(g, x, y, r, false, blink);
  } else if (opts.speciesId === 'nobles') {
    drawNobleExtras(g, x, y, r, pal.accent, pal.silver ?? 0xc0c8d4, anim.swing);
    drawEyes(g, x, y + r * 0.04, r * 0.9, false, blink);
  } else {
    drawWeirdoExtras(
      g,
      x,
      y,
      r,
      pal.accent,
      pal.pink ?? 0xe87aa8,
      !!opts.mutated,
      anim.swing,
    );
    drawEyes(g, x, y - r * 0.04, r, true, blink);
  }

  if (def.isHero) {
    g.lineStyle(2, pal.accent, 0.95);
    g.strokeCircle(x, y, r + 5);
    g.fillStyle(pal.accent, 0.9);
    g.fillCircle(x, y - r - 8 - Math.abs(anim.oy), 3.5);
  }

  // Formation rings drawn by formationVisual (cluster + links).

  // Attack slash arc (placeholder VFX)
  if (phase === 'attack' && anim.swing > 0.2) {
    g.lineStyle(2, 0xfff0c0, 0.55);
    g.beginPath();
    g.arc(x, y, r * 1.35, -0.6 + anim.swing, 0.5 + anim.swing, false);
    g.strokePath();
  }
}

/** Tiny menu card preview — idle bob. */
export function drawSpeciesPreview(
  g: G,
  speciesId: SpeciesId,
  x: number,
  y: number,
  timeMs: number,
  scale = 1,
): void {
  const pal = SPECIES[speciesId].palette;
  const typeId: UnitTypeId =
    speciesId === 'brutes'
      ? 'bonker'
      : speciesId === 'nobles'
        ? 'tin_knight'
        : 'bloblet';
  drawUnitSilhouette(g, {
    x,
    y,
    radius: 16 * scale,
    fill: pal.primary,
    speciesId,
    typeId,
    timeMs,
    seed: speciesId === 'brutes' ? 1 : speciesId === 'nobles' ? 2 : 3,
    phase: 'idle',
  });
}
