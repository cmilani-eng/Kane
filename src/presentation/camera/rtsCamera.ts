/**
 * RTS camera controls — Phaser 4 Cameras + FixedKeyControl.
 * Docs: https://docs.phaser.io/api-documentation/class/cameras-controls-fixedkeycontrol
 */
import Phaser from 'phaser';
import { MAP } from '../../config/balance';

export class RtsCamera {
  private readonly cam: Phaser.Cameras.Scene2D.Camera;
  private keyControl: Phaser.Cameras.Controls.FixedKeyControl | null = null;
  private edgePan = { l: false, r: false, u: false, d: false };
  private readonly edgeSpeed = 0.55;

  constructor(scene: Phaser.Scene) {
    this.cam = scene.cameras.main;
    this.cam.setBounds(0, 0, MAP.width, MAP.height);
    this.cam.setZoom(0.85);
    this.cam.centerOn(220, MAP.height - 220);

    const kb = scene.input.keyboard;
    if (kb) {
      const cursors = kb.createCursorKeys();
      const wasd = kb.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      }) as {
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
      };
      this.keyControl = new Phaser.Cameras.Controls.FixedKeyControl({
        camera: this.cam,
        left: wasd.left,
        right: wasd.right,
        up: wasd.up,
        down: wasd.down,
        // Q/E reserved for hero abilities on Battlefield — zoom via mouse wheel / [ ]
        zoomIn: kb.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET),
        zoomOut: kb.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET),
        zoomSpeed: 0.02,
        minZoom: 0.45,
        maxZoom: 1.6,
        speed: 0.55,
      });
      // Also bind arrow keys by OR-ing into FixedKeyControl isn't native —
      // duplicate poll in update for arrows.
      void cursors;
      this.arrowKeys = cursors;
    }

    scene.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
      this.cam.setZoom(Phaser.Math.Clamp(this.cam.zoom - dy * 0.001, 0.45, 1.6));
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const m = 24;
      this.edgePan.l = pointer.x < m;
      this.edgePan.r = pointer.x > scene.scale.width - m;
      this.edgePan.u = pointer.y < m;
      this.edgePan.d = pointer.y > scene.scale.height - m;
    });
  }

  private arrowKeys: Phaser.Types.Input.Keyboard.CursorKeys | null = null;

  panByScreenDelta(dx: number, dy: number): void {
    this.cam.setScroll(
      this.cam.scrollX - dx / this.cam.zoom,
      this.cam.scrollY - dy / this.cam.zoom,
    );
  }

  setZoom(z: number): void {
    this.cam.setZoom(Phaser.Math.Clamp(z, 0.45, 1.6));
  }

  get zoom(): number {
    return this.cam.zoom;
  }

  get scroll(): { x: number; y: number } {
    return { x: this.cam.scrollX, y: this.cam.scrollY };
  }

  setScroll(x: number, y: number): void {
    this.cam.setScroll(x, y);
  }

  /** Center the view on a world point (used by minimap click-to-pan). */
  centerOn(worldX: number, worldY: number): void {
    this.cam.centerOn(worldX, worldY);
  }

  /**
   * Soft nudge toward a world point — under-attack attention, not a hard snap.
   * Caps travel so mid-fight spam stays touch-friendly.
   */
  softNudgeToward(worldX: number, worldY: number, strength = 0.22): void {
    const mid = this.cam.midPoint;
    const dx = worldX - mid.x;
    const dy = worldY - mid.y;
    const max = 110;
    const nx = Phaser.Math.Clamp(dx * strength, -max, max);
    const ny = Phaser.Math.Clamp(dy * strength, -max, max);
    this.cam.setScroll(this.cam.scrollX + nx, this.cam.scrollY + ny);
  }

  worldPoint(screenX: number, screenY: number): { x: number; y: number } {
    return this.cam.getWorldPoint(screenX, screenY);
  }

  /** Pause edge/WASD pan while boxing so selection stays accurate. */
  suppressPan = false;

  update(delta: number): void {
    if (!this.suppressPan) {
      this.keyControl?.update(delta);
      if (this.arrowKeys) {
        const s = this.edgeSpeed * delta;
        if (this.arrowKeys.left.isDown) this.cam.scrollX -= s;
        if (this.arrowKeys.right.isDown) this.cam.scrollX += s;
        if (this.arrowKeys.up.isDown) this.cam.scrollY -= s;
        if (this.arrowKeys.down.isDown) this.cam.scrollY += s;
      }
      const s = this.edgeSpeed * delta;
      if (this.edgePan.l) this.cam.scrollX -= s;
      if (this.edgePan.r) this.cam.scrollX += s;
      if (this.edgePan.u) this.cam.scrollY -= s;
      if (this.edgePan.d) this.cam.scrollY += s;
    }
  }
}
