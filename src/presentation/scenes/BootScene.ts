/**
 * Boot — generate placeholders, then Menu. There is no splash: the game opens on the menu.
 */
import Phaser from 'phaser';
import { registerUnitAnims } from '../animations/unitAnims';
import { hideDomHud } from '../ui/domHud';
import {
  generatePropTextures,
  generateTilesetTexture,
  generateUnitSpriteSheets,
} from '../maps/tilesetAssets';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    hideDomHud();

    generateTilesetTexture(this);
    generateUnitSpriteSheets(this);
    generatePropTextures(this);
    registerUnitAnims(this);

    this.scene.start('Menu');
  }
}
