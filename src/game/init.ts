/**
 * KANE GAME CLIENT bootstrap — Phaser 4 + TypeScript.
 * Wires presentation scenes; gameplay stays import-only from scenes.
 */
import Phaser from 'phaser';
import { flags } from '../config/flags';
import { BRAND } from '../config/brand';
import { BootScene } from '../presentation/scenes/BootScene';
import { BattlefieldScene } from '../presentation/scenes/BattlefieldScene';
import { MenuScene } from '../presentation/scenes/MenuScene';
import { createOfflineConnection } from '../networking/connectionStub';
import { createMatchServerStub } from '../server/matchServerStub';
import { createDatabaseStub } from '../database/persistenceStub';

export function createKaneGame(parent: HTMLElement): Phaser.Game {
  const connection = createOfflineConnection();
  const server = createMatchServerStub();
  const db = createDatabaseStub();
  console.info(
    `[${BRAND.name}] Phaser ${Phaser.VERSION} · milestone=combat · net=${connection.status} · server=${server.enabled} · db=${db.enabled} · ads=${flags.adsEnabled}`,
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
    // Milestone 1: Menu → Battlefield (select/move). Full skirmish scene deferred.
    scene: [BootScene, MenuScene, BattlefieldScene],
  };

  const game = new Phaser.Game(config);
  // Dev/test hook — not a public API.
  (globalThis as unknown as { __KANE_GAME?: Phaser.Game }).__KANE_GAME = game;
  return game;
}
