/**
 * Regression test for "I cannot type A in Echo Glade". It runs Phaser's real keyboard classes:
 * the bug was in how they behave together, so a hand-written stand-in would prove nothing.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import { releaseKeyCapturesBetweenScenes } from './keyCaptures';

// Phaser's package entry needs a browser, but these source files also run in Node. They are
// loaded by file path because the package does not export them by name.
const require = createRequire(import.meta.url);
const phaserFile = (path: string) =>
  require(resolve(import.meta.dirname, '../../../node_modules/phaser/src', path));

const EventEmitter = phaserFile('events/EventEmitter.js');
const KeyboardManager = phaserFile('input/keyboard/KeyboardManager.js');
const KeyboardPlugin = phaserFile('input/keyboard/KeyboardPlugin.js');
const KeyCodes: Record<string, number> = phaserFile('input/keyboard/keys/KeyCodes.js');

type Keys = Phaser.Input.Keyboard.KeyboardPlugin;

const codes = (...names: string[]): number[] => names.map((name) => KeyCodes[name]!);

/** What BlobEvolutionScene.setupInput() registers. */
function blobEvolutionKeys(keys: Keys): void {
  keys.createCursorKeys();
  for (const code of codes('W', 'A', 'S', 'D')) keys.addKey(code);
}

/** What the Kane battlefield registers: RtsCamera, then the held modifier keys. */
function kaneBattlefieldKeys(keys: Keys): void {
  keys.createCursorKeys();
  keys.addKeys({ up: KeyCodes.W!, down: KeyCodes.S!, left: KeyCodes.A!, right: KeyCodes.D! });
  for (const code of codes('OPEN_BRACKET', 'CLOSED_BRACKET', 'SHIFT', 'CTRL', 'ALT')) keys.addKey(code);
}

const BLOB_TYPING_KEYS = codes('W', 'A', 'S', 'D', 'SPACE', 'LEFT', 'RIGHT', 'UP', 'DOWN');
const KANE_TYPING_KEYS = [...BLOB_TYPING_KEYS, ...codes('OPEN_BRACKET', 'CLOSED_BRACKET')];

/** One Phaser game: a single keyboard manager shared by every scene, with the fix installed. */
function bootGame() {
  const page = new EventTarget();
  const gameEvents = new EventEmitter();
  const input = {
    events: new EventEmitter(),
    game: { events: gameEvents },
    config: { inputKeyboard: true, inputKeyboardCapture: [], inputKeyboardEventTarget: page },
    keyboard: null as unknown,
  };
  const manager = new KeyboardManager(input);
  input.keyboard = manager;
  input.events.emit('boot');

  const scenes: { sys: { events: typeof gameEvents } }[] = [];

  function addScene() {
    const events = new EventEmitter();
    const pluginEvents = new EventEmitter();
    const sys = { events, settings: { input: {} }, canInput: () => true };
    const keys = new KeyboardPlugin({
      systems: { game: { events: gameEvents } },
      scene: { sys },
      manager: input,
      pluginEvents,
    }) as Keys;
    pluginEvents.emit('boot');
    scenes.push({ sys });
    return {
      /** As Phaser does on each start: the input plugin starts, then create() adds the keys. */
      start(register: (keys: Keys) => void = () => {}): Keys {
        pluginEvents.emit('start');
        events.once('shutdown', () => pluginEvents.emit('shutdown'));
        register(keys);
        return keys;
      },
      stop: (): void => {
        events.emit('shutdown');
      },
    };
  }

  const blob = addScene();
  const kane = addScene();
  const sats = addScene();

  releaseKeyCapturesBetweenScenes({
    events: gameEvents,
    scene: { scenes },
    input: { keyboard: manager },
  } as unknown as Phaser.Game);
  gameEvents.emit('ready');

  /** True when Phaser cancels the key press, so a focused text box never gets the character. */
  function isBlocked(keyCode: number): boolean {
    const modifiers = { altKey: false, ctrlKey: false, shiftKey: false, metaKey: false };
    const press = Object.assign(new Event('keydown', { cancelable: true }), { keyCode, ...modifiers });
    page.dispatchEvent(press);
    return press.defaultPrevented;
  }

  return { blob, kane, sats, blocked: (keyCodes: number[]) => keyCodes.filter(isBlocked) };
}

describe('Phaser key captures', () => {
  it('lets the player type again after leaving Blob Evolution', () => {
    const game = bootGame();
    game.blob.start(blobEvolutionKeys);
    game.blob.stop();
    game.sats.start();

    expect(game.blocked(BLOB_TYPING_KEYS)).toEqual([]);
  });

  it('lets the player type again after leaving a Kane battle', () => {
    const game = bootGame();
    game.kane.start(kaneBattlefieldKeys);
    game.kane.stop();
    game.sats.start();

    expect(game.blocked(KANE_TYPING_KEYS)).toEqual([]);
  });

  it('still keeps the keys from the browser while the game using them is running', () => {
    const game = bootGame();
    const keys = game.blob.start(blobEvolutionKeys);

    expect(game.blocked(BLOB_TYPING_KEYS)).toEqual(BLOB_TYPING_KEYS);
    expect(keys.addKey(KeyCodes.A!).isDown).toBe(true);
  });

  it('takes the keys again each time that game is reopened', () => {
    const game = bootGame();
    game.kane.start(kaneBattlefieldKeys);
    game.kane.stop();
    game.kane.start(kaneBattlefieldKeys);

    expect(game.blocked(KANE_TYPING_KEYS)).toEqual(KANE_TYPING_KEYS);
  });

  it('is switched on for the real game', () => {
    const main = readFileSync(resolve(import.meta.dirname, '../../main.ts'), 'utf8');
    expect(main).toMatch(/^releaseKeyCapturesBetweenScenes\(game\);$/m);
  });
});
