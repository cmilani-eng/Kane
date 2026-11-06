/**
 * EN / PT / ES chips. The native short codes stay fixed so the control
 * is recognizable in every language. Selecting one persists and notifies.
 */
import Phaser from 'phaser';
import { getLocale, LOCALE_CHOICES, setLocale, t } from '../../i18n';
import { playSfx } from '../audio/sfx';

export function addLocalePicker(opts: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  depth: number;
  scrollFactor?: number;
}): Phaser.GameObjects.GameObject[] {
  const { scene, x, y, depth, scrollFactor = 0 } = opts;
  const objects: Phaser.GameObjects.GameObject[] = [];
  const current = getLocale();

  const label = scene.add
    .text(x, y - 28, t('menu.language'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#b8c9d9',
    })
    .setOrigin(0.5)
    .setScrollFactor(scrollFactor)
    .setDepth(depth);
  objects.push(label);

  const gap = 76;
  for (const [index, choice] of LOCALE_CHOICES.entries()) {
    const selected = choice.id === current;
    const chip = scene.add
      .text(x + (index - 1) * gap, y, choice.short, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: selected ? '#1a1408' : '#fff8e8',
        backgroundColor: selected ? '#f0c75e' : '#2a4050',
        padding: { x: 16, y: 14 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(scrollFactor)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    chip.on('pointerup', () => {
      if (getLocale() === choice.id) return;
      playSfx('ui');
      setLocale(choice.id);
    });
    objects.push(chip);
  }

  return objects;
}
