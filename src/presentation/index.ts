/** Presentation Module — maps, animations, effects, UI, audio (+ camera/scenes/views). */
export { createSkirmishMap } from './maps/mapManager';
export { RtsCamera } from './camera/rtsCamera';
export { EntityPresenter } from './views/entityViews';
export { playSfx } from './audio/sfx';
export { registerUnitAnims, ANIM } from './animations/unitAnims';
export { spawnHitFlash, spawnCapturePulse } from './effects/effects';
