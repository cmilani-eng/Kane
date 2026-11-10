/**
 * Presentation — unit sprite-sheet animation registration (Phaser 4).
 * Animation keys are prefixed to avoid collisions in single-engine build.
 */
import Phaser from 'phaser';

export const ANIM = {
  scoutWalk: 'anim-scout-walk',
  meleeWalk: 'anim-melee-walk',
  rangedWalk: 'anim-ranged-walk',
} as const;

export function registerUnitAnims(scene: Phaser.Scene, prefix = ''): void {
  const mk = (key: string, sheet: string) => {
    const fullKey = `${prefix}${key}`;
    const fullSheet = `${prefix}${sheet}`;
    if (scene.anims.exists(fullKey)) return;
    scene.anims.create({
      key: fullKey,
      frames: scene.anims.generateFrameNumbers(fullSheet, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  };
  mk(ANIM.scoutWalk, 'sheet-scout');
  mk(ANIM.meleeWalk, 'sheet-melee');
  mk(ANIM.rangedWalk, 'sheet-ranged');
}