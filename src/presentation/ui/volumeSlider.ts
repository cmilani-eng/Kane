/**
 * Master volume slider — mute-aware (stored level applies when unmuted).
 * Procedural Phaser controls; drag + tap on track.
 */
import Phaser from 'phaser';
import { t } from '../../i18n';
import {
  getMasterVolume,
  isSfxMuted,
  setMasterVolume,
} from '../audio/sfx';
import { syncAmbientBgmMute } from '../audio/bgm';

export interface VolumeSliderOpts {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  depth?: number;
  scrollFactor?: number;
}

export interface VolumeSliderHandle {
  objects: Phaser.GameObjects.GameObject[];
  /** Refresh label / fill from current volume (e.g. after mute toggle). */
  refresh: () => void;
  destroy: () => void;
}

export function createVolumeSlider(opts: VolumeSliderOpts): VolumeSliderHandle {
  const {
    scene,
    x,
    y,
    width,
    depth = 222,
    scrollFactor = 0,
  } = opts;
  const trackH = 10;
  const knobR = 12;
  const objects: Phaser.GameObjects.GameObject[] = [];

  const label = scene.add
    .text(x, y - 22, volumeLabel(), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#b8c9d9',
    })
    .setOrigin(0.5)
    .setScrollFactor(scrollFactor)
    .setDepth(depth);
  objects.push(label);

  const track = scene.add
    .rectangle(x, y, width, trackH, 0x1a2838, 1)
    .setStrokeStyle(1, 0x3a4555)
    .setScrollFactor(scrollFactor)
    .setDepth(depth)
    // An explicit hit area keeps the track hit-testable even when its width is 0 mid-layout.
    .setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, 0, width, trackH),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
  objects.push(track);

  const fill = scene.add
    .rectangle(x - width / 2, y, 1, trackH - 2, 0xf0c75e, 0.9)
    .setOrigin(0, 0.5)
    .setScrollFactor(scrollFactor)
    .setDepth(depth + 1);
  objects.push(fill);

  const knob = scene.add
    .circle(x, y, knobR, 0xf5e6c8, 1)
    .setStrokeStyle(2, 0xf0c75e)
    .setScrollFactor(scrollFactor)
    .setDepth(depth + 2)
    .setInteractive({ useHandCursor: true, draggable: true });
  objects.push(knob);

  const applyVisual = (): void => {
    const v = getMasterVolume();
    const muted = isSfxMuted();
    const kx = x - width / 2 + v * width;
    fill.width = Math.max(2, v * width);
    fill.setFillStyle(muted ? 0x6a7f94 : 0xf0c75e, muted ? 0.45 : 0.9);
    knob.setPosition(kx, y);
    knob.setFillStyle(muted ? 0xb8c9d9 : 0xf5e6c8, 1);
    knob.setStrokeStyle(2, muted ? 0x6a7f94 : 0xf0c75e);
    label.setColor(muted ? '#7a8fa3' : '#b8c9d9');
    label.setText(volumeLabel());
  };
  applyVisual();

  const setFromPointerX = (px: number): void => {
    const left = x - width / 2;
    const t = (px - left) / width;
    setMasterVolume(t);
    syncAmbientBgmMute();
    applyVisual();
  };

  // Use screen X — scrollFactor-0 HUD / dual-camera safe.
  track.on('pointerdown', (p: Phaser.Input.Pointer) => {
    setFromPointerX(p.x);
  });

  scene.input.setDraggable(knob);
  knob.on('drag', (p: Phaser.Input.Pointer) => {
    setFromPointerX(p.x);
  });

  return {
    objects,
    refresh: applyVisual,
    destroy: () => {
      for (const o of objects) o.destroy();
      objects.length = 0;
    },
  };
}

function volumeLabel(): string {
  const pct = Math.round(getMasterVolume() * 100);
  if (isSfxMuted()) return t('volume.labelMuted', { pct });
  return t('volume.label', { pct });
}
