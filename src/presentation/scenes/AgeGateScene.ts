/**
 * First-run 13+ age gate — blocks under-13; unlocks Menu after confirm.
 * Ads stay off; no Firebase SDK.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { flags } from '../../config/flags';
import {
  blockUnder13,
  canEnterGame,
  confirmAgeGate,
  loadAgeGate,
} from '../../firebase/ageGate';
import { playSfx } from '../audio/sfx';
import { hideDomHud } from '../ui/domHud';

export class AgeGateScene extends Phaser.Scene {
  constructor() {
    super('AgeGate');
  }

  create(): void {
    hideDomHud();
    const gate = loadAgeGate();
    if (canEnterGame(gate)) {
      this.scene.start('Menu');
      return;
    }
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
      this.scale.off('resize', this.onResize, this),
    );
    this.build(gate.status === 'blocked');
  }

  private onResize(): void {
    this.children.removeAll(true);
    this.build(loadAgeGate().status === 'blocked');
  }

  private build(blocked: boolean): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1220, 1);

    this.add
      .text(width / 2, height * 0.18, BRAND.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: Math.min(42, width * 0.12) + 'px',
        color: '#f5e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.26, BRAND.tagline, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (blocked) {
      this.buildBlocked(width, height);
    } else {
      this.buildPrompt(width, height);
    }

    this.add
      .text(
        width / 2,
        height * 0.92,
        `Ads ${flags.adsEnabled ? 'on' : 'off'}  ·  Local-only age check  ·  Account optional`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          color: '#6a7f94',
        },
      )
      .setOrigin(0.5);
  }

  private buildPrompt(width: number, height: number): void {
    const min = flags.ageGateMinYears;
    this.add
      .text(width / 2, height * 0.4, `Are you ${min} or older?`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '24px',
        color: '#fff8e8',
        align: 'center',
        wordWrap: { width: Math.min(420, width - 40) },
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.5,
        `Kane is positioned for players ${min}+.\nConfirm once — we store this choice on this device only.`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#b8c9d9',
          align: 'center',
          wordWrap: { width: Math.min(400, width - 48) },
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    const yes = this.add
      .text(width / 2, height * 0.64, `I am ${min} or older`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '18px',
        color: '#fff8e8',
        backgroundColor: '#2a3a28',
        padding: { x: 22, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    yes.on('pointerup', () => {
      playSfx('ui');
      confirmAgeGate();
      this.scene.start('Menu');
    });

    const no = this.add
      .text(width / 2, height * 0.76, `I am under ${min}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#d7e6f2',
        backgroundColor: '#3a2430',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    no.on('pointerup', () => {
      playSfx('ui');
      blockUnder13();
      this.children.removeAll(true);
      this.build(true);
    });
  }

  private buildBlocked(width: number, height: number): void {
    const min = flags.ageGateMinYears;
    this.add
      .text(width / 2, height * 0.42, 'Thanks for checking', {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '22px',
        color: '#f5e6c8',
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.52,
        `Kane isn’t available for players under ${min}.\nCome back when you’re older — this device stays blocked.`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          color: '#b8c9d9',
          align: 'center',
          wordWrap: { width: Math.min(400, width - 48) },
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.68, 'Play is locked on this device', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#e87aa8',
      })
      .setOrigin(0.5);
  }
}
