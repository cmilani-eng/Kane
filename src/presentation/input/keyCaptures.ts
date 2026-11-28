/**
 * Stops one game's keys from staying locked after the player leaves it.
 *
 * Phaser keeps ONE list of "captured" keys for the whole game and calls preventDefault on each
 * of them, even while the player types in a text box. addKey(), addKeys() and createCursorKeys()
 * add to that list, but a scene shutting down removes only its Key objects, never the captures.
 * So after Blob Evolution or a Kane battle, nobody could type a, w, s, d or a space anywhere
 * (SATs Quest answers, the sign-in boxes) until the page was reloaded.
 *
 * The fix empties the list whenever a scene shuts down; a game that needs keys adds them again in
 * create(). This relies on one scene running at a time (every change here uses scene.start). If
 * two ever run together, the one left still receives its keys, but the browser reacts to them too.
 *
 * Called by: src/main.ts
 */
import type Phaser from 'phaser';

export function releaseKeyCapturesBetweenScenes(game: Phaser.Game): void {
  // The scenes exist only once the game is ready. The event names are written out so that this
  // module needs no runtime import of Phaser, which cannot load without a browser.
  game.events.once('ready', () => {
    for (const scene of game.scene.scenes) {
      scene.sys.events.on('shutdown', () => game.input.keyboard?.clearCaptures());
    }
  });
}
