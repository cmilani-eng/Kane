/**
 * Game initialization — Phaser 4 boot config for KANE.
 * Docs: https://docs.phaser.io/
 */
import Phaser from 'phaser';
import { flags } from '../config/flags';
import { BRAND } from '../config/brand';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { MenuScene } from '../scenes/MenuScene';
import { createLocalSession } from '../networking/multiplayerStub';

export function createKaneGame(parent: HTMLElement): Phaser.Game {
  const session = createLocalSession();
  console.info(
    `[${BRAND.name}] Phaser ${Phaser.VERSION} · session=${session.mode} · adsEnabled=${flags.adsEnabled}`,
  );

  if (flags.adsEnabled) {
    console.warn(`[${BRAND.name}] adsEnabled=true but no ad SDK is bundled.`);
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent,
    title: BRAND.name,
    backgroundColor: '#0f1a2e',
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
    scene: [BootScene, MenuScene, GameScene],
  };

  return new Phaser.Game(config);
}
