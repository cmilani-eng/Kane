/**
 * Procedural tileset + unit sprite sheets for Phaser 4 tilemaps / anims.
 * Placeholder art until production sheets land — still a real sprite-sheet + tilemap pipeline.
 * APIs verified against https://docs.phaser.io/ (textures / tilemaps).
 */
import Phaser from 'phaser';

export const TILE = {
  grass: 1,
  dirt: 2,
  path: 3,
  moss: 4,
} as const;

/** 5 tiles @ 40×40 in a horizontal sheet → key `tileset-kane`. */
export function generateTilesetTexture(scene: Phaser.Scene): void {
  const size = 40;
  const canvas = document.createElement('canvas');
  canvas.width = size * 5;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const draw = (index: number, fill: string, accent: string) => {
    const x = index * size;
    ctx.fillStyle = fill;
    ctx.fillRect(x, 0, size, size);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + 12, 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 28, 26, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 6, 30, 14, 3);
  };
  draw(0, '#1a2a20', '#1a2a20'); // unused gid 0 padding look
  draw(1, '#2d4a3e', '#355447');
  draw(2, '#5a4a32', '#6b573c');
  draw(3, '#4a4030', '#5c4e38');
  draw(4, '#3a5544', '#4a6a55');
  if (scene.textures.exists('tileset-kane')) scene.textures.remove('tileset-kane');
  scene.textures.addCanvas('tileset-kane', canvas);
}

/** 4-frame walk sheets (40×40) for scout/melee/ranged × teams. */
export function generateUnitSpriteSheets(scene: Phaser.Scene): void {
  makeSheet(scene, 'sheet-scout', '#3d7ea6', '#f0c75e', 'circle');
  makeSheet(scene, 'sheet-melee', '#3d7ea6', '#f0c75e', 'diamond');
  makeSheet(scene, 'sheet-ranged', '#3d7ea6', '#f0c75e', 'triangle');
  makeSheet(scene, 'sheet-scout-enemy', '#6b4a8a', '#c4a0e0', 'circle');
  makeSheet(scene, 'sheet-melee-enemy', '#6b4a8a', '#c4a0e0', 'diamond');
  makeSheet(scene, 'sheet-ranged-enemy', '#6b4a8a', '#c4a0e0', 'triangle');
}

function makeSheet(
  scene: Phaser.Scene,
  key: string,
  fill: string,
  accent: string,
  shape: 'circle' | 'diamond' | 'triangle',
): void {
  const fw = 40;
  const fh = 40;
  const frames = 4;
  const canvas = document.createElement('canvas');
  canvas.width = fw * frames;
  canvas.height = fh;
  const ctx = canvas.getContext('2d')!;
  for (let i = 0; i < frames; i++) {
    const x = i * fw;
    const bob = (i % 2) * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x + 20, 28 + bob, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x + 20, 18 - bob, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(x + 20, 4 - bob);
      ctx.lineTo(x + 34, 20);
      ctx.lineTo(x + 20, 32);
      ctx.lineTo(x + 6, 20);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(x + 20, 4 - bob);
      ctx.lineTo(x + 34, 30);
      ctx.lineTo(x + 6, 30);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + 20, 14 - bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
  // Phaser 4 addSpriteSheet wants HTMLImageElement | Texture — use canvas texture + frames.
  scene.textures.addCanvas(key, canvas);
  const tex = scene.textures.get(key);
  for (let i = 0; i < frames; i++) {
    if (!tex.has(String(i))) {
      tex.add(i, 0, i * fw, 0, fw, fh);
    }
  }
}

export function generatePropTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });

  const keep = (key: string, fill: number, accent: number) => {
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(36, 64, 50, 14);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(12, 18, 48, 40, 4);
    g.fillStyle(accent, 1);
    g.fillRect(28, 8, 16, 14);
    g.fillStyle(0xfff4c2, 1);
    g.fillCircle(36, 12, 5);
    g.generateTexture(key, 72, 72);
  };
  keep('keep-player', 0x3d7ea6, 0xf0c75e);
  keep('keep-enemy', 0x6b4a8a, 0xc4a0e0);

  const barracks = (key: string, fill: number, accent: number) => {
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(28, 48, 40, 12);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(8, 14, 40, 34, 3);
    g.fillStyle(accent, 1);
    g.fillRect(14, 20, 10, 22);
    g.fillRect(32, 20, 10, 22);
    g.generateTexture(key, 56, 56);
  };
  barracks('barracks-player', 0x3d7ea6, 0xf0c75e);
  barracks('barracks-enemy', 0x6b4a8a, 0xc4a0e0);

  g.clear();
  g.fillStyle(0x8ec8ff, 0.25);
  g.fillCircle(32, 32, 30);
  g.fillStyle(0xcfe9ff, 1);
  g.fillCircle(32, 34, 14);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(32, 28, 8);
  g.lineStyle(3, 0x6aa8e8, 1);
  g.strokeCircle(32, 32, 18);
  g.generateTexture('wardstone', 64, 64);

  g.clear();
  g.fillStyle(0x3a6b2e, 1);
  g.fillCircle(16, 18, 10);
  g.fillStyle(0xc23b5a, 1);
  g.fillCircle(12, 14, 4);
  g.fillCircle(20, 16, 4);
  g.fillCircle(16, 20, 3);
  g.generateTexture('forage', 32, 32);

  g.clear();
  g.lineStyle(3, 0xf0c75e, 1);
  g.strokeCircle(20, 20, 16);
  g.generateTexture('select-ring', 40, 40);

  g.destroy();
}
