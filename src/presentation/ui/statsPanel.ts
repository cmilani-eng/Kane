/**
 * Menu Stats panel — player record by default.
 * Admin tools (allowlist / reset / rebuild / moderation) only when opened
 * via `#/admin` and the allowlist stub permits access.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import type { SpeciesId } from '../../data/speciesStub';
import { difficultyCopy, speciesName, t } from '../../i18n';
import {
  loadLocalStats,
  resetLocalStats,
  type LocalStats,
} from '../../database/localStats';
import {
  loadMatchSummaries,
  resetMatchSummaries,
  type MatchSummaryStore,
} from '../../database/matchSummary';
import {
  formatDailyRollup,
  loadDailyRollup,
  resetDailyRollup,
} from '../../database/dailyStatsRollup';
import {
  adminDenyReason,
  canAccessAdmin,
  formatAdminAllowlist,
  localAdminCandidateId,
} from '../../database/adminAllowlist';
import { formatMatchClock } from './matchClock';
import {
  formatModerationLog,
  recordModerationEvent,
  resetModerationLog,
} from '../../database/moderationStub';
import { rollupDailyMatchStatsFunctionStub } from '../../server/dailyRollupFunctionStub';
import { playSfx } from '../audio/sfx';

export interface StatsPanelOptions {
  /** Show admin tools (reset / rollup / moderation). Menu Stats stays player-only. */
  adminTools?: boolean;
}

function clearAdminHash(): void {
  if (
    typeof location !== 'undefined' &&
    location.hash.toLowerCase().includes('admin')
  ) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function playerRecordText(stats: LocalStats): string {
  const lines = [
    t('stats.played', { n: stats.gamesStarted }),
    t('stats.record', { wins: stats.wins, losses: stats.losses }),
    '',
    t('stats.bySpecies'),
  ];
  for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
    const r = stats.bySpecies[id];
    lines.push(
      t('stats.speciesLine', {
        name: speciesName(id),
        played: r.started,
        wins: r.wins,
        losses: r.losses,
      }),
    );
  }
  return lines.join('\n');
}

function recentMatchesText(store: MatchSummaryStore, limit = 4): string {
  if (store.summaries.length === 0) {
    return t('stats.recentEmpty');
  }
  const lines = [
    t('stats.recentHead', { n: Math.min(limit, store.summaries.length) }),
  ];
  for (const s of store.summaries.slice(0, limit)) {
    lines.push(
      t('stats.matchLine', {
        result: s.won ? t('stats.win') : t('stats.loss'),
        species: speciesName(s.species),
        difficulty: difficultyCopy(s.difficulty).label,
        clock: formatMatchClock(s.durationMs),
      }),
    );
  }
  return lines.join('\n');
}

/** Clear deny UI when #/admin is locked. */
function showAdminDenied(scene: Phaser.Scene, onClose: () => void): void {
  const { width, height } = scene.scale;
  const you = localAdminCandidateId();
  const reason = t('stats.deniedBody', { id: you });

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.84)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(420, width - 32);
  const panelH = Math.min(260, height - 48);
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x2a1520, 0.98)
    .setStrokeStyle(2, 0xe87aa8, 0.95)
    .setDepth(301);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 36, t('stats.deniedTitle'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const body = scene.add
    .text(width / 2, height / 2 - 4, reason, {
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
    .text(width / 2, height / 2 + panelH / 2 - 40, t('stats.back'), {
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

export function showStatsPanel(
  scene: Phaser.Scene,
  onClose: () => void,
  options: StatsPanelOptions = {},
): void {
  const wantAdmin = options.adminTools === true;
  if (wantAdmin && !canAccessAdmin()) {
    console.warn('[KANE]', adminDenyReason());
    showAdminDenied(scene, onClose);
    return;
  }

  const { width, height } = scene.scale;
  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.84)
    .setDepth(300)
    .setInteractive();

  const short = height < 500;
  const panelW = short ? Math.min(760, width - 24) : Math.min(460, width - 28);
  const panelH = short
    ? height - 16
    : Math.min(wantAdmin ? 500 : 420, height - 28);
  const cx = width / 2;
  const cy = height / 2;
  const top = cy - panelH / 2;
  const bottom = cy + panelH / 2;
  const left = cx - panelW / 2 + 24;

  const panel = scene.add
    .rectangle(cx, cy, panelW, panelH, 0x122033, 0.98)
    .setStrokeStyle(2, 0xf0c75e, 0.85)
    .setDepth(301);

  const accent = scene.add
    .rectangle(cx, top + 3, panelW - 4, 4, 0xf0c75e, 0.9)
    .setDepth(302);

  const brand = scene.add
    .text(cx, top + 26, BRAND.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '13px',
      color: '#f0c75e',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const title = scene.add
    .text(cx, top + 52, wantAdmin ? 'Admin' : t('menu.stats'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(
      cx,
      top + 80,
      wantAdmin
        ? 'Local tools for soft-launch checks'
        : t('stats.subtitle'),
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#9eb4c8',
      },
    )
    .setOrigin(0.5)
    .setDepth(302);

  // Reserve footer for buttons so moderation/body never overlaps controls.
  const footerH = wantAdmin ? 96 : 56;
  const bodyBottom = bottom - footerH;
  const bodyWrap = panelW - 48;

  const playerBody = scene.add
    .text(left, top + 108, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#d7e6f2',
      lineSpacing: 5,
      wordWrap: { width: bodyWrap },
    })
    .setDepth(302);

  const recentBody = scene.add
    .text(left, top + 108, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#b8c9d9',
      lineSpacing: 4,
      wordWrap: { width: bodyWrap },
    })
    .setDepth(302);

  const adminBody = wantAdmin
    ? scene.add
        .text(left, top + 108, '', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#9eb4c8',
          lineSpacing: 3,
          wordWrap: { width: bodyWrap },
        })
        .setDepth(302)
    : null;

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    accent,
    brand,
    title,
    subtitle,
    playerBody,
    recentBody,
  ];
  if (adminBody) nodes.push(adminBody);

  const layoutBodies = (): void => {
    const stats = loadLocalStats();
    const matches = loadMatchSummaries();
    playerBody.setText(playerRecordText(stats));
    recentBody.setText(recentMatchesText(matches, wantAdmin ? 3 : 4));
    recentBody.setY(playerBody.y + playerBody.height + 16);
    const recentRoom = bodyBottom - 4 - recentBody.y;
    if (recentBody.height > recentRoom) {
      const maxLines = Math.max(1, Math.floor(recentRoom / 18));
      recentBody.setText(
        recentBody.text.split('\n').slice(0, maxLines).join('\n'),
      );
    }

    if (adminBody) {
      const adminText = [
        '— Admin tools —',
        formatDailyRollup(loadDailyRollup(), 3),
        '',
        formatAdminAllowlist(),
        '',
        formatModerationLog(undefined, 3),
      ].join('\n');
      // Keep admin block above the reserved footer so buttons never overlap.
      const adminY = recentBody.y + recentBody.height + 14;
      const maxLines = Math.max(
        4,
        Math.floor(Math.max(40, bodyBottom - adminY - 8) / 16),
      );
      const clipped = adminText.split('\n').slice(0, maxLines).join('\n');
      adminBody.setText(clipped);
      adminBody.setY(adminY);
    }
  };
  layoutBodies();

  const closeBtn = scene.add
    .text(cx + panelW / 2 - 18, top + 14, '✕', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#b8c9d9',
      backgroundColor: '#2a3545',
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

  if (wantAdmin) {
    const btnY = bottom - 58;
    const mkAdminBtn = (
      x: number,
      label: string,
      bg: string,
      fn: () => void,
    ): void => {
      const btn = scene.add
        .text(x, btnY, label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          color: '#fff8e8',
          backgroundColor: bg,
          padding: { x: 12, y: 9 },
        })
        .setOrigin(0.5)
        .setDepth(303)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          playSfx('ui');
          fn();
        });
      nodes.push(btn);
    };

    mkAdminBtn(cx - 130, 'Reset', '#5a3a3a', () => {
      if (!canAccessAdmin()) {
        console.warn('[KANE]', adminDenyReason());
        destroy();
        showAdminDenied(scene, onClose);
        return;
      }
      resetLocalStats();
      resetMatchSummaries();
      resetDailyRollup();
      resetModerationLog();
      layoutBodies();
    });
    mkAdminBtn(cx, 'Rebuild rollup', '#2a4a38', () => {
      void rollupDailyMatchStatsFunctionStub().then(() => layoutBodies());
    });
    mkAdminBtn(cx + 130, 'Stub report', '#3a4555', () => {
      recordModerationEvent('report', 'peer-stub', 'Phase 7 moderation stub');
      layoutBodies();
    });

    const footerHint = scene.add
      .text(cx, bottom - 22, 'Admin tools stay local until cloud Functions land', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#6a7f94',
      })
      .setOrigin(0.5)
      .setDepth(302);
    nodes.push(footerHint);
  } else {
    const done = scene.add
      .text(cx, bottom - 28, t('stats.done'), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#2a3a50',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(303)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        playSfx('ui');
        destroy();
        onClose();
      });
    nodes.push(done);
  }

  const destroy = (): void => {
    for (const n of nodes) n.destroy();
    if (wantAdmin) clearAdminHash();
  };
}
