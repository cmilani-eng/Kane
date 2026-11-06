/**
 * In-menu / #/admin Stats panel — gated by admin allowlist stub.
 * Local-dev default is open; allowlist mode shows a clear deny path.
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
import {
  adminDenyReason,
  canAccessAdmin,
  formatAdminAllowlist,
  getAdminAccessMode,
  localAdminCandidateId,
} from '../../database/adminAllowlist';
import {
  formatModerationLog,
  recordModerationEvent,
  resetModerationLog,
} from '../../database/moderationStub';
import { playSfx } from '../audio/sfx';

function adminBodyText(): string {
  return [
    formatStatsSummary(loadLocalStats()),
    '',
    formatMatchSummaries(loadMatchSummaries(), 6),
    '',
    formatAdminAllowlist(),
    '',
    formatModerationLog(),
  ].join('\n');
}

function clearAdminHash(): void {
  if (
    typeof location !== 'undefined' &&
    location.hash.toLowerCase().includes('admin')
  ) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

/** Clear deny UI when #/admin is locked. */
function showAdminDenied(scene: Phaser.Scene, onClose: () => void): void {
  const { width, height } = scene.scale;
  const you = localAdminCandidateId();
  const reason =
    adminDenyReason(you) ??
    `Denied — ${you} cannot open #/admin (mode=${getAdminAccessMode()}).`;

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.82)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(420, width - 32);
  const panelH = Math.min(280, height - 48);
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x2a1520, 0.98)
    .setStrokeStyle(2, 0xe87aa8, 0.95)
    .setDepth(301);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 36, 'Admin access denied', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const body = scene.add
    .text(width / 2, height / 2 - 8, reason, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#e8c0d0',
      align: 'center',
      wordWrap: { width: panelW - 40 },
      lineSpacing: 4,
    })
    .setOrigin(0.5)
    .setDepth(302);

  const closeBtn = scene.add
    .text(width / 2, height / 2 + panelH / 2 - 40, 'Back to menu', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color: '#fff8e8',
      backgroundColor: '#3a2430',
      padding: { x: 16, y: 10 },
    })
    .setOrigin(0.5)
    .setDepth(303)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      playSfx('ui');
      destroy();
      onClose();
    });

  const destroy = (): void => {
    overlay.destroy();
    panel.destroy();
    title.destroy();
    body.destroy();
    closeBtn.destroy();
    clearAdminHash();
  };
}

export function showStatsPanel(scene: Phaser.Scene, onClose: () => void): void {
  if (!canAccessAdmin()) {
    console.warn('[KANE]', adminDenyReason());
    showAdminDenied(scene, onClose);
    return;
  }

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

  const nodes: Phaser.GameObjects.GameObject[] = [overlay, panel, title, body];

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
  nodes.push(closeBtn);

  const resetBtn = scene.add
    .text(width / 2 - 100, height / 2 + panelH / 2 - 36, 'Reset stats', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#fff8e8',
      backgroundColor: '#5a3a3a',
      padding: { x: 12, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(303)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      playSfx('ui');
      if (!canAccessAdmin()) {
        console.warn('[KANE]', adminDenyReason());
        destroy();
        showAdminDenied(scene, onClose);
        return;
      }
      resetLocalStats();
      resetMatchSummaries();
      resetModerationLog();
      refreshBody();
    });
  nodes.push(resetBtn);

  const noteBtn = scene.add
    .text(width / 2 + 100, height / 2 + panelH / 2 - 36, 'Stub report', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#fff8e8',
      backgroundColor: '#3a4555',
      padding: { x: 12, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(303)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      playSfx('ui');
      recordModerationEvent('report', 'peer-stub', 'Phase 7 moderation stub');
      refreshBody();
    });
  nodes.push(noteBtn);

  const destroy = (): void => {
    for (const n of nodes) n.destroy();
    clearAdminHash();
  };
}
