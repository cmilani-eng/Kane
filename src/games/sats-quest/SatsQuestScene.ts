/**
 * SatsQuestScene — a thin Phaser wrapper. The stage art draws the storybook world, the
 * controller runs the quest, and this scene only forwards time and resizes and cleans up.
 *
 * Called by: src/main.ts (scene list) and src/games/registry.ts (sceneKey 'SatsQuest').
 */
import Phaser from 'phaser';
import { isReduceMotion } from '../../database/motionPrefs';
import { SatsStage } from './satsArt';
import { SatsQuestController } from './satsController';

export class SatsQuestScene extends Phaser.Scene {
  private stage: SatsStage | null = null;
  private controller: SatsQuestController | null = null;

  constructor() {
    super('SatsQuest');
  }

  create(): void {
    document.title = 'SATs Quest · Kane games';
    this.stage = new SatsStage(this, isReduceMotion());
    this.controller = new SatsQuestController(this.stage, () => this.scene.start('GamePicker'));
    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.controller.start();
  }

  update(_time: number, delta: number): void {
    this.controller?.tick(delta);
  }

  private onResize(): void {
    this.stage?.layout();
  }

  private onShutdown(): void {
    this.scale.off('resize', this.onResize, this);
    this.controller?.destroy();
    this.stage?.destroy();
    this.controller = null;
    this.stage = null;
    document.title = 'KANE · Game picker';
  }
}
