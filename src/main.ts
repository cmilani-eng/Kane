import Phaser from 'phaser';
import { flags } from './config/flags';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

// Kane targets Phaser 4 (https://phaser.io/phaser4). Package: `phaser@^4`.
console.info(`[Kane] Phaser ${Phaser.VERSION}`);

// Soft-launch posture: never load an ad network while adsEnabled is false.
if (flags.adsEnabled) {
  console.warn('[Kane] adsEnabled=true but no ad SDK is bundled in this slice.');
}

const parent = document.getElementById('app');
if (!parent) {
  throw new Error('#app root missing');
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#0f1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, MenuScene, GameScene],
};

new Phaser.Game(config);

console.info(
  `[Kane] vertical slice ready · adsEnabled=${flags.adsEnabled} · ages ${flags.ageGateMinYears}+`,
);
