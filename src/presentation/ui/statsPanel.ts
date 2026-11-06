/**
 * In-menu / #/admin Stats panel — counters + match summaries (localStorage).
 */
import Phaser from 'phaser';
import {
  formatStatsSummary,
  loadLocalStats,
  resetLocalStats,
} from '../../database/localStats';
import {
  formatMatchSummaries,
  loadMatchSummaries,
  resetMatchSummaries,
} from '../../database/matchSummary';
import { playSfx } from '../audio/sfx';

function adminBodyText(): string {
  return [
    formatStatsSummary(loadLocalStats()),
    '',
    formatMatchSummaries(loadMatchSummaries(), 6),
  ].join('\n');
}

export function showStatsPanel(scene: Phaser.Scene, onClose: () => void): void {
  const { width, height } = scene.scale;
  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.82)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(460, width - 32);
  const panelH = Math.min(440, height - 40);
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x152238, 0.98)
    .setStrokeStyle(2, 0xf0c75e, 0.9)
    .setDepth(301);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 28, 'Local Stats  ·  Admin stub', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const body = scene.add
    .text(
      width / 2 - panelW / 2 + 24,
      height / 2 - panelH / 2 + 56,
      adminBodyText(),
      {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '12px',
        color: '#d7e6f2',
        lineSpacing: 3,
        wordWrap: { width: panelW - 40 },
      },
    )
    .setDepth(302);

  const refreshBody = (): void => {
    body.setText(adminBodyText());
  };

  const closeBtn = scene.add
    .text(width / 2 + panelW / 2 - 20, height / 2 - panelH / 2 + 16, '✕', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#b8c9d9',
      backgroundColor: '#3a4555',
      padding: { x: 10, y: 4 },
    })
    .setOrigin(1, 0)
    .setDepth(303)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      playSfx('ui');
      destroy();
      onClose();
    });

  const resetBtn = scene.add
    .text(width / 2, height / 2 + panelH / 2 - 36, 'Reset local stats', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#fff8e8',
      backgroundColor: '#5a3a3a',
      padding: { x: 14, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(303)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      playSfx('ui');
      resetLocalStats();
      resetMatchSummaries();
      refreshBody();
    });

  const destroy = (): void => {
    overlay.destroy();
    panel.destroy();
    title.destroy();
    body.destroy();
    closeBtn.destroy();
    resetBtn.destroy();
    if (typeof location !== 'undefined' && location.hash.toLowerCase().includes('admin')) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  };
}
