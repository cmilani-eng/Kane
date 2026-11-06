/** Presentation Module — maps, animations, effects, UI, audio (+ camera/scenes/views). */
export { createSkirmishMap } from './maps/mapManager';
export { RtsCamera } from './camera/rtsCamera';
export { EntityPresenter } from './views/entityViews';
export {
  playSfx,
  playEndFanfare,
  setSfxMuted,
  isSfxMuted,
  getMasterVolume,
  setMasterVolume,
} from './audio/sfx';
export type { SfxKey } from './audio/sfx';
export {
  ensureAmbientBgm,
  stopAmbientBgm,
  syncAmbientBgmMute,
  isAmbientBgmRunning,
} from './audio/bgm';
export { registerUnitAnims, ANIM } from './animations/unitAnims';
export { spawnHitFlash, spawnCapturePulse } from './effects/effects';
