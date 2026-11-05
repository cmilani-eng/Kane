import Phaser from 'phaser';
import { FACTION } from '../config/balance';

/** Procedural placeholder art — readable silhouettes at phone scale. */
export function generateTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 });

  // Ground tile
  g.fillStyle(0x2d4a3e, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x355447, 1);
  g.fillCircle(16, 20, 4);
  g.fillCircle(44, 40, 5);
  g.fillStyle(0x274036, 1);
  g.fillRect(8, 48, 20, 6);
  g.generateTexture('tile-grass', 64, 64);
  g.clear();

  // Path / dirt accent
  g.fillStyle(0x5a4a32, 1);
  g.fillRect(0, 0, 64, 64);
  g.fillStyle(0x6b573c, 1);
  g.fillCircle(20, 30, 8);
  g.generateTexture('tile-dirt', 64, 64);
  g.clear();

  makeUnit(g, 'unit-scout-player', FACTION.color, FACTION.colorAlt, 'circle');
  makeUnit(g, 'unit-melee-player', FACTION.color, FACTION.colorAlt, 'diamond');
  makeUnit(g, 'unit-ranged-player', FACTION.color, FACTION.colorAlt, 'triangle');
  makeUnit(g, 'unit-scout-enemy', FACTION.enemyColor, FACTION.enemyAlt, 'circle');
  makeUnit(g, 'unit-melee-enemy', FACTION.enemyColor, FACTION.enemyAlt, 'diamond');
  makeUnit(g, 'unit-ranged-enemy', FACTION.enemyColor, FACTION.enemyAlt, 'triangle');

  makeBuilding(g, 'keep-player', FACTION.color, FACTION.colorAlt, true);
  makeBuilding(g, 'keep-enemy', FACTION.enemyColor, FACTION.enemyAlt, true);
  makeBuilding(g, 'barracks-player', FACTION.color, FACTION.colorAlt, false);
  makeBuilding(g, 'barracks-enemy', FACTION.enemyColor, FACTION.enemyAlt, false);

  // Wardstone
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

  // Forage berries
  g.fillStyle(0x3a6b2e, 1);
  g.fillCircle(16, 18, 10);
  g.fillStyle(0xc23b5a, 1);
  g.fillCircle(12, 14, 4);
  g.fillCircle(20, 16, 4);
  g.fillCircle(16, 20, 3);
  g.generateTexture('forage', 32, 32);
  g.clear();

  // Selection ring
  g.lineStyle(3, 0xf0c75e, 1);
  g.strokeCircle(20, 20, 16);
  g.generateTexture('select-ring', 40, 40);
  g.clear();

  g.destroy();
}

function makeUnit(
  g: Phaser.GameObjects.Graphics,
  key: string,
  fill: number,
  accent: number,
  shape: 'circle' | 'diamond' | 'triangle',
): void {
  g.clear();
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(20, 28, 22, 10);
  g.fillStyle(fill, 1);
  if (shape === 'circle') {
    g.fillCircle(20, 18, 12);
  } else if (shape === 'diamond') {
    g.fillTriangle(20, 4, 34, 20, 20, 32);
    g.fillTriangle(20, 4, 6, 20, 20, 32);
  } else {
    g.fillTriangle(20, 4, 34, 30, 6, 30);
  }
  g.fillStyle(accent, 1);
  g.fillCircle(20, 14, 4);
  g.generateTexture(key, 40, 40);
}

function makeBuilding(
  g: Phaser.GameObjects.Graphics,
  key: string,
  fill: number,
  accent: number,
  isKeep: boolean,
): void {
  g.clear();
  const size = isKeep ? 72 : 56;
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(size / 2, size - 8, size * 0.7, 14);
  g.fillStyle(fill, 1);
  if (isKeep) {
    g.fillRoundedRect(12, 18, 48, 40, 4);
    g.fillStyle(accent, 1);
    g.fillRect(28, 8, 16, 14);
    g.fillStyle(0xfff4c2, 1);
    g.fillCircle(36, 12, 5);
  } else {
    g.fillRoundedRect(8, 14, 40, 34, 3);
    g.fillStyle(accent, 1);
    g.fillRect(14, 20, 10, 22);
    g.fillRect(32, 20, 10, 22);
  }
  g.generateTexture(key, size, size);
}
