/**
 * Kid-friendly coach mark banner for Battlefield tutorial tips.
 */
import Phaser from 'phaser';
import {
  advanceTutorial,
  dismissTutorial,
  tutorialStepLabel,
  tutorialTip,
  type TutorialState,
} from '../../gameplay/battlefield/battlefieldTutorial';

export class TutorialCoach {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly nextBtn: Phaser.GameObjects.Text;
  private readonly skipBtn: Phaser.GameObjects.Text;
  private readonly scene: Phaser.Scene;
  private readonly state: TutorialState;

  constructor(scene: Phaser.Scene, state: TutorialState) {
    this.scene = scene;
    this.state = state;
    const w = Math.min(520, scene.scale.width - 24);

    this.panel = scene.add
      .rectangle(0, 0, w, 88, 0x122033, 0.92)
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
      .text(0, 0, 'Next', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#0f1a2e',
        backgroundColor: '#f0c75e',
        padding: { x: 12, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(122)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => advanceTutorial(this.state));

    this.skipBtn = scene.add
      .text(0, 0, 'Got it', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#b8c9d9',
        backgroundColor: '#3a4555',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(122)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => dismissTutorial(this.state));

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
    const w = Math.min(narrow ? sw - 20 : 520, sw - 24);
    const h = narrow ? 100 : 88;
    const x = sw / 2;
    const y = narrow ? sh * 0.28 : 210;

    this.panel.setSize(w, h).setPosition(x, y);
    this.label.setPosition(x - w / 2 + 14, y - h / 2 + 10);
    this.body
      .setPosition(x - w / 2 + 14, y - h / 2 + 28)
      .setStyle({ wordWrap: { width: w - 28 }, fontSize: narrow ? '13px' : '14px' });
    this.nextBtn.setPosition(x + w / 2 - 70, y + h / 2 - 28);
    this.skipBtn.setPosition(x + w / 2 - 150, y + h / 2 - 28);
  }

  refresh(): void {
    const show = this.state.visible && this.state.step !== 'done';
    for (const o of this.objects()) {
      if ('setVisible' in o) (o as Phaser.GameObjects.GameObject & { setVisible: (v: boolean) => void }).setVisible(show);
    }
    if (!show) return;
    this.label.setText(tutorialStepLabel(this.state));
    this.body.setText(tutorialTip(this.state));
    this.nextBtn.setText(this.state.step === 'heroes' ? 'Finish' : 'Next');
  }
}
