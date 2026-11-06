/**
 * Highlight gather / deposit destinations for selected player workers.
 */
import type Phaser from 'phaser';
import { RESOURCES } from '../../data/resources';
import { stockpileOf } from '../../gameplay/battlefield/battlefieldEconomy';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { inView, type ViewBounds } from '../perf/mobileBudget';

type G = Phaser.GameObjects.Graphics;

type TargetMark = {
  key: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  kind: 'gather' | 'deposit';
};

/**
 * Ring (+ soft spokes) for the current gather node or stockpile of selected
 * player workers. Dedupes when several workers share a target.
 */
export function drawGatherTargetHighlights(
  g: G,
  world: BattlefieldWorld,
  timeMs: number,
  view?: ViewBounds | null,
): void {
  const targets = new Map<string, TargetMark>();
  const spokes: { x: number; y: number; tx: number; ty: number; color: number }[] =
    [];

  for (const u of world.units) {
    if (!u.selected || u.team !== 'player' || u.hp <= 0 || !u.canGather) {
      continue;
    }

    if (u.carrying > 0) {
      const pile = stockpileOf(world, 'player');
      if (!pile) continue;
      const key = `pile:${pile.id}`;
      if (!targets.has(key)) {
        targets.set(key, {
          key,
          x: pile.x,
          y: pile.y,
          radius: Math.max(pile.radius, 18) + 6,
          color: u.carryingResource
            ? RESOURCES[u.carryingResource].color
            : 0xf0c75e,
          kind: 'deposit',
        });
      }
      const t = targets.get(key)!;
      spokes.push({ x: u.x, y: u.y, tx: t.x, ty: t.y, color: t.color });
      continue;
    }

    if (u.gatherNodeId == null) continue;
    const node = world.nodes.find((n) => n.id === u.gatherNodeId);
    if (!node || node.remaining <= 0) continue;
    const key = `node:${node.id}`;
    if (!targets.has(key)) {
      targets.set(key, {
        key,
        x: node.x,
        y: node.y,
        radius: node.radius + 10,
        color:
          node.resourceId === 'magic_crystals' ? 0x7ec8ff : 0xf0c75e,
        kind: 'gather',
      });
    }
    const t = targets.get(key)!;
    spokes.push({ x: u.x, y: u.y, tx: t.x, ty: t.y, color: t.color });
  }

  if (targets.size === 0) return;

  const pulse = 1 + 0.04 * Math.sin(timeMs / 200);

  for (const t of targets.values()) {
    if (view && !inView(view, t.x, t.y)) continue;
    const r = t.radius * pulse;
    g.lineStyle(2.5, t.color, 0.92);
    g.strokeCircle(t.x, t.y, r);
    // Inner tick so deposit vs gather reads at a glance
    g.lineStyle(1.5, t.color, 0.55);
    g.strokeCircle(t.x, t.y, r * 0.72);
    if (t.kind === 'deposit') {
      // Soft blot under drop-off
      g.fillStyle(t.color, 0.14);
      g.fillEllipse(t.x, t.y + 2, r * 1.4, r * 0.55);
    }
  }

  // Cap spokes so multi-select stays readable
  const maxSpokes = 8;
  for (let i = 0; i < Math.min(spokes.length, maxSpokes); i++) {
    const s = spokes[i]!;
    if (
      view &&
      !inView(view, s.x, s.y) &&
      !inView(view, s.tx, s.ty)
    ) {
      continue;
    }
    g.lineStyle(1.25, s.color, 0.4);
    g.lineBetween(s.x, s.y, s.tx, s.ty);
  }
}
