/**
 * Presentation — unit sprite-sheet animation registration (Phaser 4).
 */
import Phaser from 'phaser';

export const ANIM = {
  scoutWalk: 'anim-scout-walk',
  meleeWalk: 'anim-melee-walk',
  rangedWalk: 'anim-ranged-walk',
} as const;

export function registerUnitAnims(scene: Phaser.Scene): void {
  const mk = (key: string, sheet: string) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(sheet, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
  };
  mk(ANIM.scoutWalk, 'sheet-scout');
  mk(ANIM.meleeWalk, 'sheet-melee');
  mk(ANIM.rangedWalk, 'sheet-ranged');
}
