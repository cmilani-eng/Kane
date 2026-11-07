/**
 * Picker-style window for Phaser dialogs: a deep navy panel with rounded corners, a gold
 * edge and a soft glow, as on the games picker cards. Phaser rectangles cannot round their
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
  g.fillStyle(0xf0c75e, 0.1);
  g.fillRoundedRect(left - 6, top - 6, width + 12, height + 12, PICKER_WINDOW_RADIUS + 6);
  g.fillStyle(0x12253c, 0.98);
  g.fillRoundedRect(left, top, width, height, PICKER_WINDOW_RADIUS);
  g.lineStyle(2, 0xf0c75e, 0.85);
  g.strokeRoundedRect(left, top, width, height, PICKER_WINDOW_RADIUS);
  return g;
}
