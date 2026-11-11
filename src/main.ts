/**
 * KANE ENGINE bootstrap — Phaser 4 + TypeScript.
 * Single entry point for all games. GamePickerScene is the first scene.
 * Games are lazily loaded via GAME_REGISTRY dynamic imports.
 */
import './styles.css';
import Phaser from 'phaser';
import { BRAND } from './config/brand';
import { applyDocumentLanguage } from './i18n';
import { KaneBootScene } from './games/kane/KaneBootScene';
import { KaneMenuScene } from './games/kane/KaneMenuScene';
import { KaneBattlefieldScene } from './games/kane/KaneBattlefieldScene';
import { BlobEvolutionScene } from './games/blob-evolution/BlobEvolutionScene';
import { GamePickerScene } from './presentation/scenes/GamePickerScene';

const parent = document.getElementById('app');
if (!parent) {
  throw new Error('#app root missing');
}

document.title = 'KANE · Game picker';
applyDocumentLanguage();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent,
  title: BRAND.name,
  backgroundColor: 'transparent', // transparent — Three.js canvas shows through for BlobEvolution
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    activePointers: 3,
    keyboard: true,
    mouse: true,
  },
  // GamePicker (hub) first → Kane scenes eagerly registered for direct scene.start() transitions
  scene: [GamePickerScene, KaneBootScene, KaneMenuScene, KaneBattlefieldScene, BlobEvolutionScene],
};

const game = new Phaser.Game(config);

// Ensure Phaser canvas renders on top of Three.js canvas (used by BlobEvolution)
const phaserCanvas = game.canvas as HTMLCanvasElement;
phaserCanvas.style.position = 'absolute';
phaserCanvas.style.zIndex = '1';
phaserCanvas.style.top = '0';
phaserCanvas.style.left = '0';

// Dev/test hook — not a public API.
(globalThis as unknown as { __KANE_GAME?: Phaser.Game }).__KANE_GAME = game;

console.info(`[${BRAND.name}] Phaser ${Phaser.VERSION} · single-engine · GamePicker first`);