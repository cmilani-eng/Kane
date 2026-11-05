import Phaser from 'phaser';
import { registerUnitAnims } from '../animations/unitAnims';
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
    generateTilesetTexture(this);
    generateUnitSpriteSheets(this);
    generatePropTextures(this);
    registerUnitAnims(this);
    this.scene.start('Menu');
  }
}
