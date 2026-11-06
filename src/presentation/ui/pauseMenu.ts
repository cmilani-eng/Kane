/**
 * In-match pause overlay — resume, mute, volume, quit to menu.
 * Also shows a frozen match-clock + supply snapshot.
 * ScrollFactor 0; ignore on the zoomed world camera.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { subscribeLocale, t } from '../../i18n';
import { isSfxMuted, playSfx, setSfxMuted } from '../audio/sfx';
import { formatMatchClock } from './battlefieldHud';
import { addLocalePicker } from './localePicker';
import { createVolumeSlider, type VolumeSliderHandle } from './volumeSlider';

export interface PauseMenuSnapshot {
  elapsedMs: number;
  supplyCurrent: number;
  supplyCap: number;
}

export interface PauseMenuOpts {
  scene: Phaser.Scene;
  onResume: () => void;
  onQuit: () => void;
  ignoreOnMain: (objs: Phaser.GameObjects.GameObject[]) => void;
}

export class PauseMenu {
  private readonly scene: Phaser.Scene;
  private readonly onResume: () => void;
  private readonly onQuit: () => void;
  private readonly ignoreOnMain: (objs: Phaser.GameObjects.GameObject[]) => void;
  private root: Phaser.GameObjects.GameObject[] = [];
  private muteLabel: Phaser.GameObjects.Text | null = null;
  private volume: VolumeSliderHandle | null = null;
  private localeUnsub: (() => void) | null = null;
  private open = false;
  private snapshot: PauseMenuSnapshot = {
    elapsedMs: 0,
    supplyCurrent: 0,
    supplyCap: 36,
  };

  constructor(opts: PauseMenuOpts) {
    this.scene = opts.scene;
    this.onResume = opts.onResume;
    this.onQuit = opts.onQuit;
    this.ignoreOnMain = opts.ignoreOnMain;
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(snapshot?: PauseMenuSnapshot): void {
    if (snapshot) this.snapshot = snapshot;
    if (this.open) return;
    this.open = true;
    this.build();
    this.scene.scale.on('resize', this.onResize, this);
    this.localeUnsub = subscribeLocale(() => {
      this.scene.time.delayedCall(0, () => {
        if (this.open) this.onResize();
      });
    });
  }

  hide(): void {
    if (!this.open) return;
    this.open = false;
    this.localeUnsub?.();
    this.localeUnsub = null;
    this.scene.scale.off('resize', this.onResize, this);
    this.volume?.destroy();
    this.volume = null;
    for (const o of this.root) o.destroy();
    this.root = [];
    this.muteLabel = null;
  }

  private onResize = (): void => {
    if (!this.open) return;
    this.volume?.destroy();
    this.volume = null;
    for (const o of this.root) o.destroy();
    this.root = [];
    this.muteLabel = null;
    this.build();
  };

  private build(): void {
    const { width, height } = this.scene.scale;
    const panelW = Math.min(360, width - 40);
    const panelH = Math.min(520, height * 0.84);
    const cx = width / 2;
    const cy = height * 0.48;

    const dim = this.scene.add
      .rectangle(cx, height / 2, width, height, 0x060a12, 0.72)
      .setScrollFactor(0)
      .setDepth(220)
      .setInteractive();
    this.root.push(dim);

    const panel = this.scene.add
      .rectangle(cx, cy, panelW, panelH, 0x121c28, 0.96)
      .setStrokeStyle(2, 0xf0c75e, 0.85)
      .setScrollFactor(0)
      .setDepth(221);
    this.root.push(panel);

    const title = this.scene.add
      .text(cx, cy - panelH * 0.44, t('pause.paused'), {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(32, width * 0.08) + 'px',
        color: '#f5e6c8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    const brand = this.scene.add
      .text(cx, cy - panelH * 0.36, BRAND.name, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#9eb4c8',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);

    const clock = formatMatchClock(this.snapshot.elapsedMs);
    const supply = t('pause.supply', {
      current: this.snapshot.supplyCurrent,
      cap: this.snapshot.supplyCap,
    });
    const nearCap =
      this.snapshot.supplyCurrent >=
      Math.floor(this.snapshot.supplyCap * 0.85);
    const atCap =
      this.snapshot.supplyCurrent >= this.snapshot.supplyCap;
    const snap = this.scene.add
      .text(cx, cy - panelH * 0.27, `${t('pause.match', { clock })}\n${supply}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: atCap ? '#e87aa8' : nearCap ? '#f0c75e' : '#d7e6f2',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222);
    this.root.push(title, brand, snap);

    const btnY0 = cy - panelH * 0.14;
    const gap = Math.min(44, panelH * 0.11);
    this.root.push(
      this.makeBtn(cx, btnY0, t('pause.resume'), () => {
        this.hide();
        this.onResume();
      }),
    );
    this.muteLabel = this.makeBtn(cx, btnY0 + gap, this.muteText(), () => {
      setSfxMuted(!isSfxMuted());
      this.muteLabel?.setText(this.muteText());
      this.volume?.refresh();
      if (!isSfxMuted()) playSfx('ui');
    });
    this.root.push(this.muteLabel);

    this.volume = createVolumeSlider({
      scene: this.scene,
      x: cx,
      y: btnY0 + gap * 2 + 8,
      width: Math.min(260, panelW - 48),
      depth: 222,
      scrollFactor: 0,
    });
    this.root.push(...this.volume.objects);

    this.root.push(
      this.makeBtn(
        cx,
        btnY0 + gap * 3 + 16,
        t('pause.quit'),
        () => {
          playSfx('ui');
          this.hide();
          this.onQuit();
        },
        true,
      ),
    );

    this.root.push(
      ...addLocalePicker({
        scene: this.scene,
        x: cx,
        y: cy + panelH * 0.38,
        depth: 222,
        scrollFactor: 0,
      }),
    );

    this.ignoreOnMain(this.root);
  }

  private muteText(): string {
    return isSfxMuted() ? t('pause.soundOff') : t('pause.soundOn');
  }

  private makeBtn(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    danger = false,
  ): Phaser.GameObjects.Text {
    const btn = this.scene.add
      .text(x, y, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#fff8e8',
        backgroundColor: danger ? '#5a3030' : '#2a4050',
        padding: { x: 28, y: 14 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(222)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerover', () =>
      btn.setStyle({ backgroundColor: danger ? '#7a4040' : '#3a5565' }),
    );
    btn.on('pointerout', () =>
      btn.setStyle({ backgroundColor: danger ? '#5a3030' : '#2a4050' }),
    );
    btn.on('pointerup', onClick);
    return btn;
  }
}
