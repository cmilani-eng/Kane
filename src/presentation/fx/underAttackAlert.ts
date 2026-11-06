/**
 * Under-attack screen-edge flash — brief crimson bands on viewport edges.
 * Drawn on scrollFactor-0 graphics (HUD camera); touch-friendly, not a card.
 * Critical (Keep/hero) hits get a thicker, hotter wash.
 */
import type Phaser from 'phaser';

type G = Phaser.GameObjects.Graphics;

const EDGE = 0xe85a5a;
const EDGE_HOT = 0xff7070;
const BAND = 14;
const BAND_CRITICAL = 22;

/** Brief edge wash while an under-attack alert is alive. */
export function drawUnderAttackEdgeFlash(
  g: G,
  width: number,
  height: number,
  lifeMs: number,
  maxLifeMs: number,
  critical = false,
): void {
  g.clear();
  if (lifeMs <= 0 || maxLifeMs <= 0) return;
  const t = Math.max(0, Math.min(1, lifeMs / maxLifeMs));
  // Ease out so the flash pops then fades quickly.
  const a = t * t * (critical ? 0.78 : 0.55);
  const baseBand = critical ? BAND_CRITICAL : BAND;
  const band = baseBand + (1 - t) * (critical ? 10 : 6);
  const color = critical ? EDGE_HOT : EDGE;

  g.fillStyle(color, a);
  g.fillRect(0, 0, width, band);
  g.fillRect(0, height - band, width, band);
  g.fillRect(0, 0, band, height);
  g.fillRect(width - band, 0, band, height);

  // Corner chevrons — direction cue without covering the map center.
  const m = 8;
  const c = critical ? 28 : 22;
  g.lineStyle(critical ? 4 : 3, color, Math.min(0.98, a * 1.7));
  g.lineBetween(m, m + c, m, m);
  g.lineBetween(m, m, m + c, m);
  g.lineBetween(width - m - c, m, width - m, m);
  g.lineBetween(width - m, m, width - m, m + c);
  g.lineBetween(m, height - m - c, m, height - m);
  g.lineBetween(m, height - m, m + c, height - m);
  g.lineBetween(width - m - c, height - m, width - m, height - m);
  g.lineBetween(width - m, height - m, width - m, height - m - c);

  if (critical) {
    // Inner inset band — reads as "base/hero in danger"
    const inset = Math.max(4, band * 0.35);
    g.fillStyle(0xfff0e8, a * 0.22);
    g.fillRect(band, band, width - band * 2, inset);
    g.fillRect(band, height - band - inset, width - band * 2, inset);
  }
}
