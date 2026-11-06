/**
 * Player Account / Dashboard — profile, real stats (or empty), recent matches, prefs.
 * Never fabricates numbers. Distinct from admin Stats (#/admin).
 */
import Phaser from 'phaser';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { loadMatchPrefs } from '../../database/matchPrefs';
import { loadCosmeticsLoadout } from '../../database/cosmeticsLoadout';
import {
  getCurrentAuthUser,
  isCloudAccount,
  signOutAccount,
  subscribeAuth,
} from '../../firebase/auth';
import { listRecentMatches } from '../../firebase/firestore/matches';
import { getStatsOverview } from '../../firebase/firestore/stats';
import { getUserProfile } from '../../firebase/firestore/users';
import { emptyStatsOverview, type StatsOverviewDoc } from '../../firebase/types';
import { AI_DIFFICULTIES } from '../../gameplay/battlefield/aiDifficulty';
import { playSfx } from '../audio/sfx';
import { showAuthPanel } from './authPanel';

function formatOverview(stats: StatsOverviewDoc): string {
  const lines = [
    `Games started: ${stats.gamesStarted}`,
    `Wins: ${stats.wins}   ·   Losses: ${stats.losses}`,
    '',
    'By species:',
  ];
  for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
    const r = stats.bySpecies[id];
    lines.push(`  ${SPECIES[id].name}: ${r.started} started · ${r.wins}W / ${r.losses}L`);
  }
  return lines.join('\n');
}

function formatMatches(
  rows: Awaited<ReturnType<typeof listRecentMatches>>,
): string {
  if (rows.length === 0) return 'Recent matches: (none yet)';
  const lines = [`Recent matches (last ${rows.length}):`];
  for (const s of rows) {
    const mins = Math.max(0, Math.round(s.durationMs / 60000));
    const secs = Math.max(0, Math.round((s.durationMs % 60000) / 1000));
    lines.push(
      `  ${s.won ? 'W' : 'L'} ${s.species}/${s.difficulty} ${mins}m${secs}s · u ${s.playerUnitsLeft}/${s.enemyUnitsLeft}`,
    );
  }
  return lines.join('\n');
}

export function showDashboardPanel(
  scene: Phaser.Scene,
  onClose: () => void,
): void {
  const user = getCurrentAuthUser();
  if (!isCloudAccount(user)) {
    showAuthPanel({
      mode: 'login',
      onAuthed: () => {
        showDashboardPanel(scene, onClose);
      },
      onClose,
    });
    return;
  }

  const { width, height } = scene.scale;
  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.82)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(480, width - 28);
  const panelH = Math.min(460, height - 36);
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x152238, 0.98)
    .setStrokeStyle(2, 0xf0c75e, 0.9)
    .setDepth(301);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 26, 'Account  ·  Dashboard', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const body = scene.add
    .text(
      width / 2 - panelW / 2 + 22,
      height / 2 - panelH / 2 + 52,
      'Loading…',
      {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '12px',
        color: '#d7e6f2',
        lineSpacing: 3,
        wordWrap: { width: panelW - 40 },
      },
    )
    .setDepth(302);

  const nodes: Phaser.GameObjects.GameObject[] = [overlay, panel, title, body];
  let unsub: (() => void) | null = null;

  const destroy = (): void => {
    unsub?.();
    for (const n of nodes) n.destroy();
  };

  const closeBtn = scene.add
    .text(width / 2 + panelW / 2 - 20, height / 2 - panelH / 2 + 14, '✕', {
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

  const logoutBtn = scene.add
    .text(width / 2 - 100, height / 2 + panelH / 2 - 36, 'Log out', {
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
      void signOutAccount().then(() => {
        destroy();
        onClose();
      });
    });
  nodes.push(logoutBtn);

  const refreshBtn = scene.add
    .text(width / 2 + 100, height / 2 + panelH / 2 - 36, 'Refresh', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#fff8e8',
      backgroundColor: '#2a4a38',
      padding: { x: 12, y: 8 },
    })
    .setOrigin(0.5)
    .setDepth(303)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', () => {
      playSfx('ui');
      void loadBody();
    });
  nodes.push(refreshBtn);

  const loadBody = async (): Promise<void> => {
    const u = getCurrentAuthUser();
    if (!isCloudAccount(u) || !u) {
      body.setText('Signed out.');
      return;
    }
    body.setText('Loading profile…');
    try {
      const [profile, stats, matches] = await Promise.all([
        getUserProfile(u.uid),
        getStatsOverview(u.uid),
        listRecentMatches(u.uid, 8),
      ]);
      const prefs = profile?.prefs ?? loadMatchPrefs();
      const cos = profile?.cosmetics?.equipped ?? loadCosmeticsLoadout().equipped;
      const overview = stats ?? emptyStatsOverview();
      const emptyHint =
        overview.gamesStarted === 0 && overview.wins === 0 && overview.losses === 0
          ? '\n(No cloud matches yet — play a skirmish while signed in.)'
          : '';
      const lines = [
        `Commander: ${profile?.displayName ?? u.displayName}`,
        `Email: ${u.email ?? '—'}`,
        '',
        `Prefs: ${SPECIES[prefs.species].name} · ${AI_DIFFICULTIES[prefs.difficulty].label}`,
        `Skins: B ${cos.brutes.replace(/^skin_/, '')} · N ${cos.nobles.replace(/^skin_/, '')} · W ${cos.weirdos.replace(/^skin_/, '')}`,
        '',
        formatOverview(overview) + emptyHint,
        '',
        formatMatches(matches),
      ];
      body.setText(lines.join('\n'));
    } catch (err) {
      console.warn('[KANE] dashboard load failed', err);
      body.setText(
        [
          `Commander: ${u.displayName}`,
          `Email: ${u.email ?? '—'}`,
          '',
          'Could not load cloud stats (rules not deployed, offline, or config missing).',
          'Guest/local play still works. Empty states — no fabricated numbers.',
          '',
          formatOverview(emptyStatsOverview()),
          '',
          formatMatches([]),
        ].join('\n'),
      );
    }
  };

  unsub = subscribeAuth((u) => {
    if (!isCloudAccount(u)) {
      destroy();
      onClose();
    }
  });

  void loadBody();
}
