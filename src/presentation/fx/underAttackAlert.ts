/**
 * Under-attack screen-edge flash — brief crimson bands on viewport edges.
 * Drawn on scrollFactor-0 graphics (HUD camera); touch-friendly, not a card.
 */
import type Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;

const EDGE = 0xe85a5a;
const BAND = 14;

/** Brief edge wash while an under-attack alert is alive. */
export function drawUnderAttackEdgeFlash(
  g: G,
  width: number,
  height: number,
  lifeMs: number,
  maxLifeMs: number,
): void {
  g.clear();
  if (lifeMs <= 0 || maxLifeMs <= 0) return;
  const t = Math.max(0, Math.min(1, lifeMs / maxLifeMs));
  // Ease out so the flash pops then fades quickly.
  const a = t * t * 0.55;
  const band = BAND + (1 - t) * 6;

  g.fillStyle(EDGE, a);
  g.fillRect(0, 0, width, band);
  g.fillRect(0, height - band, width, band);
  g.fillRect(0, 0, band, height);
  g.fillRect(width - band, 0, band, height);

  // Corner chevrons — direction cue without covering the map center.
  const m = 8;
  const c = 22;
  g.lineStyle(3, EDGE, Math.min(0.95, a * 1.6));
  g.lineBetween(m, m + c, m, m);
  g.lineBetween(m, m, m + c, m);
  g.lineBetween(width - m - c, m, width - m, m);
  g.lineBetween(width - m, m, width - m, m + c);
  g.lineBetween(m, height - m - c, m, height - m);
  g.lineBetween(m, height - m, m + c, height - m);
  g.lineBetween(width - m - c, height - m, width - m, height - m);
  g.lineBetween(width - m, height - m, width - m, height - m - c);
}
