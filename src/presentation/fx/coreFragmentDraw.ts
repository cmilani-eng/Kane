/**
 * Draw CORE fragments + capture progress rings.
 */
import type Phaser from 'phaser';
import {
  CORE_FRAGMENT,
  type CoreFragment,
} from '../../gameplay/battlefield/battlefieldCoreFragments';
import { isExplored } from '../../gameplay/battlefield/battlefieldFog';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

export function drawCoreFragments(
  g: G,
  world: BattlefieldWorld,
  timeMs: number,
  view?: ViewBounds | null,
): void {
  const list = world.coreFragments ?? [];
  const pulse = 0.65 + 0.35 * Math.sin(timeMs / 380);
  for (const f of list) {
    if (view && !inView(view, f.x, f.y)) continue;
    if (!isExplored(world.fog, f.x, f.y)) continue;
    drawOne(g, f, pulse, timeMs);
  }
}

function ownerColor(f: CoreFragment): number {
  if (f.owner === 'player') return 0x7ec8ff;
  if (f.owner === 'enemy') return 0xe87aa8;
  return 0xb8c9d9;
}

function drawOne(g: G, f: CoreFragment, pulse: number, timeMs: number): void {
  const col = ownerColor(f);
  // Soft aura
  g.fillStyle(col, 0.12 + pulse * 0.08);
  g.fillCircle(f.x, f.y, f.radius * 1.8);
  // Crystal shard body
  g.fillStyle(0x1a2a40, 0.85);
  g.fillCircle(f.x, f.y + 4, f.radius * 0.55);
  g.fillStyle(col, 0.95);
  g.fillTriangle(
    f.x,
    f.y - f.radius * 1.1,
    f.x + f.radius * 0.7,
    f.y + f.radius * 0.55,
    f.x - f.radius * 0.7,
    f.y + f.radius * 0.55,
  );
  g.fillStyle(0xffffff, 0.55);
  g.fillTriangle(
    f.x,
    f.y - f.radius * 0.55,
    f.x + f.radius * 0.28,
    f.y + f.radius * 0.2,
    f.x - f.radius * 0.28,
    f.y + f.radius * 0.2,
  );
  g.lineStyle(2, col, 0.9);
  g.strokeCircle(f.x, f.y, f.radius);

  // Capture / hold progress arc — denser ticks for glanceable %
  if (f.captureTeam && f.captureProgress > 0.02) {
    const c = f.captureTeam === 'player' ? 0x7ec8ff : 0xe87aa8;
    const r = CORE_FRAGMENT.captureRange * 0.55;
    g.lineStyle(2.5, c, 0.28);
    g.strokeCircle(f.x, f.y, r);
    const total = 24;
    const ticks = Math.max(1, Math.floor(f.captureProgress * total));
    for (let i = 0; i < ticks; i++) {
      const ang = -Math.PI / 2 + (i / total) * Math.PI * 2;
      const inner = r - 5;
      g.lineStyle(3.5, c, 0.9);
      g.lineBetween(
        f.x + Math.cos(ang) * inner,
        f.y + Math.sin(ang) * inner,
        f.x + Math.cos(ang) * r,
        f.y + Math.sin(ang) * r,
      );
    }
    // Percent pip at progress tip
    const tip = -Math.PI / 2 + f.captureProgress * Math.PI * 2;
    g.fillStyle(0xfff8e8, 0.95);
    g.fillCircle(
      f.x + Math.cos(tip) * r,
      f.y + Math.sin(tip) * r,
      3.2,
    );
  }

  // Idle spin speck when owned
  if (f.owner !== 'neutral') {
    const ang = timeMs / 400;
    g.fillStyle(0xfff8e8, 0.9);
    g.fillCircle(
      f.x + Math.cos(ang) * (f.radius + 8),
      f.y + Math.sin(ang) * (f.radius + 8),
      2.5,
    );
  }
}
