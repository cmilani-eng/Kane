/**
 * Procedural tileset + unit/building placeholder textures (Phaser 4).
 * Richer faction-colored placeholders until production sheets land.
 */
import Phaser from 'phaser';

export const TILE = {
  grass: 1,
  dirt: 2,
  path: 3,
  moss: 4,
  crystal: 5,
} as const;

/** Horizontal tileset sheet → key `tileset-kane`. */
export function generateTilesetTexture(scene: Phaser.Scene): void {
  const size = 40;
  const n = 6;
  const canvas = document.createElement('canvas');
  canvas.width = size * n;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const speckled = (
    index: number,
    base: string,
    mid: string,
    hi: string,
    density: number,
  ) => {
    const x0 = index * size;
    ctx.fillStyle = base;
    ctx.fillRect(x0, 0, size, size);
    for (let i = 0; i < density; i++) {
      const px = x0 + 3 + ((i * 17) % 34);
      const py = 3 + ((i * 13) % 34);
      ctx.fillStyle = i % 3 === 0 ? hi : mid;
      ctx.fillRect(px, py, 2 + (i % 2), 2);
    }
    // Soft edge vignette
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x0, 0, size, 3);
    ctx.fillRect(x0, size - 3, size, 3);
  };

  speckled(0, '#1a2a20', '#1a2a20', '#1a2a20', 0);
  speckled(1, '#2a4a38', '#355447', '#4a6a55', 18);
  speckled(2, '#5a4a32', '#6b573c', '#7a6848', 14);
  speckled(3, '#4a4030', '#5c4e38', '#6a5a42', 10);
  speckled(4, '#3a5544', '#4a6a55', '#5a7a66', 16);
  // Crystal flecks for Weirdos-flavored ground
  speckled(5, '#2a3a48', '#3a4a5a', '#6ecfbf', 12);
  ctx.fillStyle = '#e87aa8';
  ctx.beginPath();
  ctx.arc(5 * size + 28, 12, 3, 0, Math.PI * 2);
  ctx.fill();

  if (scene.textures.exists('tileset-kane')) scene.textures.remove('tileset-kane');
  scene.textures.addCanvas('tileset-kane', canvas);
}

/** Legacy GameScene sheets + richer battlefield silhouettes. */
export function generateUnitSpriteSheets(scene: Phaser.Scene): void {
  makeSheet(scene, 'sheet-scout', '#3d7ea6', '#f0c75e', 'circle');
  makeSheet(scene, 'sheet-melee', '#3d7ea6', '#f0c75e', 'diamond');
  makeSheet(scene, 'sheet-ranged', '#3d7ea6', '#f0c75e', 'triangle');
  makeSheet(scene, 'sheet-scout-enemy', '#6b4a8a', '#c4a0e0', 'circle');
  makeSheet(scene, 'sheet-melee-enemy', '#6b4a8a', '#c4a0e0', 'diamond');
  makeSheet(scene, 'sheet-ranged-enemy', '#6b4a8a', '#c4a0e0', 'triangle');

  // Species silhouette sheets for battlefield placeholders
  makeSheet(scene, 'sil-brutes', '#4a7a3a', '#d4782e', 'circle');
  makeSheet(scene, 'sil-nobles', '#3d7ea6', '#f0c75e', 'diamond');
  makeSheet(scene, 'sil-weirdos', '#7a4aa8', '#6ecfbf', 'triangle');
  makeSheet(scene, 'sil-hero', '#f0c75e', '#fff8e8', 'star');
}

function makeSheet(
  scene: Phaser.Scene,
  key: string,
  fill: string,
  accent: string,
  shape: 'circle' | 'diamond' | 'triangle' | 'star',
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
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x + 20, 30 + bob, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fill;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x + 20, 17 - bob, 13, 0, Math.PI * 2);
      ctx.fill();
    } else if (shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(x + 20, 3 - bob);
      ctx.lineTo(x + 35, 19);
      ctx.lineTo(x + 20, 33);
      ctx.lineTo(x + 5, 19);
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(x + 20, 3 - bob);
      ctx.lineTo(x + 35, 31);
      ctx.lineTo(x + 5, 31);
      ctx.closePath();
      ctx.fill();
    } else {
      // star-ish: circle + spikes
      ctx.beginPath();
      ctx.arc(x + 20, 17 - bob, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = accent;
      for (let s = 0; s < 5; s++) {
        const a = (s / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(
          x + 20 + Math.cos(a) * 12,
          17 - bob + Math.sin(a) * 12,
          3,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + 16, 13 - bob, 3, 0, Math.PI * 2);
    ctx.arc(x + 24, 13 - bob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a1220';
    ctx.beginPath();
    ctx.arc(x + 16, 13 - bob, 1.4, 0, Math.PI * 2);
    ctx.arc(x + 24, 13 - bob, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (scene.textures.exists(key)) scene.textures.remove(key);
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

  const hall = (
    key: string,
    fill: number,
    accent: number,
    roof: 'keep' | 'junk' | 'core',
  ) => {
    g.clear();
    g.fillStyle(0x000000, 0.32);
    g.fillEllipse(40, 70, 58, 16);
    g.fillStyle(fill, 1);
    g.fillRoundedRect(10, 24, 60, 42, 5);
    g.fillStyle(accent, 1);
    if (roof === 'keep') {
      g.fillRect(28, 8, 24, 20);
      g.fillTriangle(28, 8, 52, 8, 40, 0);
    } else if (roof === 'junk') {
      g.fillTriangle(12, 28, 40, 6, 68, 28);
      g.fillStyle(0xd4782e, 1);
      g.fillCircle(52, 18, 6);
    } else {
      g.fillCircle(40, 18, 16);
      g.lineStyle(3, accent, 1);
      g.strokeCircle(40, 18, 20);
      g.fillStyle(0xe87aa8, 0.85);
      g.fillCircle(40, 18, 7);
    }
    g.fillStyle(0xfff4c2, 1);
    g.fillCircle(26, 42, 4);
    g.fillCircle(54, 42, 4);
    g.generateTexture(key, 80, 80);
  };
  hall('hall-brutes', 0x4a7a3a, 0xd4782e, 'junk');
  hall('hall-nobles', 0x3d7ea6, 0xf0c75e, 'keep');
  hall('hall-weirdos', 0x7a4aa8, 0x6ecfbf, 'core');
  hall('keep-player', 0x3d7ea6, 0xf0c75e, 'keep');
  hall('keep-enemy', 0x6b4a8a, 0xc4a0e0, 'keep');

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

  // Resource nodes — gold mound vs crystal shards (match in-world silhouettes)
  g.clear();
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(24, 40, 30, 10);
  g.fillStyle(0xd4782e, 0.35);
  g.fillEllipse(24, 30, 26, 14);
  g.fillStyle(0xb8862e, 1);
  g.fillCircle(14, 30, 9);
  g.fillCircle(34, 31, 8);
  g.fillStyle(0xf0c75e, 1);
  g.fillCircle(18, 22, 10);
  g.fillCircle(30, 24, 9);
  g.fillStyle(0xffe6a0, 1);
  g.fillCircle(23, 14, 7);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(20, 11, 2);
  g.generateTexture('node-gold', 48, 48);

  g.clear();
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(24, 42, 26, 9);
  g.fillStyle(0x4a9ad4, 1);
  g.fillTriangle(8, 38, 18, 10, 22, 36);
  g.fillStyle(0x6ab8e8, 1);
  g.fillTriangle(40, 36, 30, 12, 22, 34);
  g.fillStyle(0x7ec8ff, 1);
  g.fillTriangle(24, 4, 36, 40, 12, 40);
  g.fillStyle(0xcfe9ff, 1);
  g.fillTriangle(23, 12, 30, 32, 17, 32);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(24, 6, 27, 16, 21, 16);
  g.generateTexture('node-crystal', 48, 48);

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
