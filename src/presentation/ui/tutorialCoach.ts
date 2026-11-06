/**
 * Kid-friendly coach mark banner for Battlefield tutorial tips.
 */
import Phaser from 'phaser';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import {
  advanceTutorial,
  dismissTutorial,
  tutorialStepLabel,
  tutorialTip,
  type TutorialState,
} from '../../gameplay/battlefield/battlefieldTutorial';
import { t } from '../../i18n';
import { playSfx } from '../audio/sfx';

export class TutorialCoach {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly nextBtn: Phaser.GameObjects.Text;
  private readonly skipBtn: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private readonly state: TutorialState;

  constructor(
    scene: Phaser.Scene,
    state: TutorialState,
    private readonly mapId: () => SkirmishMapId = () => 'crossing',
    private readonly difficulty: () => AiDifficultyId = () => 'normal',
  ) {
    this.scene = scene;
    this.state = state;
    const w = Math.min(560, scene.scale.width - 24);

    this.panel = scene.add
      .rectangle(0, 0, w, 108, 0x122033, 0.92)
      .setStrokeStyle(2, 0xf0c75e, 0.95)
      .setScrollFactor(0)
      .setDepth(120);

    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#f0c75e',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(121);

    this.body = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        wordWrap: { width: w - 28 },
      })
      .setScrollFactor(0)
      .setDepth(121);

    this.nextBtn = scene.add
      .text(0, 0, t('tutorial.next'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#0f1a2e',
        backgroundColor: '#f0c75e',
        padding: { x: 12, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(122)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        playSfx('ui');
        advanceTutorial(this.state, this.difficulty());
      });

    this.skipBtn = scene.add
      .text(0, 0, t('tutorial.gotIt'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#b8c9d9',
        backgroundColor: '#3a4555',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(122)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        playSfx('ui');
        dismissTutorial(this.state);
      });

    this.layout();
    scene.scale.on('resize', () => this.layout());
  }

  objects(): Phaser.GameObjects.GameObject[] {
    return [this.panel, this.label, this.body, this.nextBtn, this.skipBtn];
  }

  layout(): void {
    const sw = this.scene.scale.width;
    const sh = this.scene.scale.height;
    const narrow = sw < 720;
    const short = sh < 500;
    const w = Math.min(short ? 300 : narrow ? sw - 20 : 560, sw - 24);
    this.body.setStyle({
      wordWrap: { width: w - (short ? 24 : 36) },
      fontSize: narrow || short ? '12px' : '13px',
    });
    const h = short
      ? Math.min(110, Math.max(78, Math.ceil(this.body.height) + 56))
      : Math.max(narrow ? 120 : 108, Math.ceil(this.body.height) + 72);
    // Landscape phones tuck the coach under the top-right controls.
    const x = short ? sw - 16 - w / 2 : sw / 2;
    const top = short ? 128 : narrow ? sh * 0.3 - 60 : 166;
    const y = top + h / 2;

    this.panel.setSize(w, h).setPosition(x, y);
    this.label.setPosition(x - w / 2 + 14, y - h / 2 + (short ? 8 : 10));
    this.body.setPosition(x - w / 2 + 14, y - h / 2 + (short ? 24 : 28));
    this.nextBtn.setOrigin(0, 0);
    this.skipBtn.setOrigin(0, 0);
    const right = x + w / 2 - 14;
    const nextW = this.nextBtn.width;
    const btnY = y + h / 2 - (short ? 28 : 32);
    this.nextBtn.setPosition(right - nextW, btnY);
    this.skipBtn.setPosition(right - nextW - 8 - this.skipBtn.width, btnY);
  }

  refresh(): void {
    const show = this.state.visible && this.state.step !== 'done';
    for (const o of this.objects()) {
      if ('setVisible' in o) (o as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(show);
    }
    if (!show) return;
    this.label.setText(tutorialStepLabel(this.state, this.difficulty()));
    this.body.setText(tutorialTip(this.state, this.mapId()));
    this.nextBtn.setText(
      this.state.step === 'heroes' ? t('tutorial.finish') : t('tutorial.next'),
    );
    this.skipBtn.setText(t('tutorial.gotIt'));
    this.layout();
  }
}
