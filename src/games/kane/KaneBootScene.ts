/**
 * Kane Boot Scene — generates the placeholder textures, then opens the Kane menu.
 * There is no splash: the game opens straight on the menu.
 * Asset keys are prefixed with 'kane_' to avoid collisions in the single-engine build.
 *
 * Called by: src/main.ts (registers in scene array as 'KaneBoot')
 * Replaces: src/presentation/scenes/BootScene.ts (for Kane-specific boot)
 * Reads: tilesetAssets functions with prefix parameter
 */
import Phaser from 'phaser';
import { registerUnitAnims } from '../../presentation/animations/unitAnims';
import { hideDomHud } from '../../presentation/ui/domHud';
import {
  generatePropTextures,
  generateTilesetTexture,
  generateUnitSpriteSheets,
} from '../../presentation/maps/tilesetAssets';

export class KaneBootScene extends Phaser.Scene {
  constructor() {
    super('KaneBoot');
  }

  create(): void {
    hideDomHud();

    // Order matters: generateUnitSpriteSheets must run before registerUnitAnims
    // because animations reference the generated sprite sheet keys.
    generateTilesetTexture(this, 'kane_');
    generateUnitSpriteSheets(this, 'kane_');
    generatePropTextures(this, 'kane_');
    registerUnitAnims(this, 'kane_');

    this.scene.start('KaneMenu');
  }
}
