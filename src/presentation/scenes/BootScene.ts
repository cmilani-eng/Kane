import Phaser from 'phaser';
import { canEnterGame, loadAgeGate } from '../../firebase/ageGate';
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

    const gate = loadAgeGate();
    // First-run or under-13 → AgeGate; 13+ confirmed → Menu (SP unlocked).
    this.scene.start(canEnterGame(gate) ? 'Menu' : 'AgeGate');
  }
}
