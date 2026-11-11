/**
 * Framed window for Phaser dialogs: a dark stone panel with rounded corners, a bronze
 * edge and a soft glow, matching the bottom selection panel. Phaser rectangles cannot round their
 * corners, so this draws with Graphics. The returned object is destroyed like a rectangle.
 */
import Phaser from 'phaser';

export const PICKER_WINDOW_RADIUS = 24;

export function drawPickerWindow(
  scene: Phaser.Scene,
  cx: number,
  cy: number,
  width: number,
  height: number,
  depth: number,
): Phaser.GameObjects.Graphics {
  const left = cx - width / 2;
  const top = cy - height / 2;
  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(0x8a6a2b, 0.14);
  g.fillRoundedRect(left - 6, top - 6, width + 12, height + 12, PICKER_WINDOW_RADIUS + 6);
  g.fillStyle(0x1d1a16, 0.97);
  g.fillRoundedRect(left, top, width, height, PICKER_WINDOW_RADIUS);
  g.lineStyle(2, 0x8a6a2b, 1);
  g.strokeRoundedRect(left, top, width, height, PICKER_WINDOW_RADIUS);
  return g;
}
