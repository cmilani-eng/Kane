/**
 * Player Account / Dashboard — profile, real stats (or empty), recent matches, prefs.
 * Never fabricates numbers. Distinct from admin Stats (#/admin).
 * Works for email and Firebase anonymous guests (empty zeros until they play).
 * Visual language matches Friend lobby + Stats (navy / gold / cream).
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { loadMatchPrefs } from '../../database/matchPrefs';
import { loadCosmeticsLoadout } from '../../database/cosmeticsLoadout';
import {
  getCurrentAuthUser,
  isAnonymousGuest,
  isCloudAccount,
  signOutAccount,
  subscribeAuth,
} from '../../firebase/auth';
import { bootstrapCloudAccount } from '../../firebase/cloudProgression';
import { listRecentMatches } from '../../firebase/firestore/matches';
import { getStatsOverview } from '../../firebase/firestore/stats';
import { getUserProfile } from '../../firebase/firestore/users';
import { emptyStatsOverview, type StatsOverviewDoc } from '../../firebase/types';
import { AI_DIFFICULTIES } from '../../gameplay/battlefield/aiDifficulty';
import { playSfx } from '../audio/sfx';
import { showAuthPanel } from './authPanel';

function formatOverview(stats: StatsOverviewDoc): string {
  const lines = [
    `Games played   ${stats.gamesStarted}`,
    `Wins  ${stats.wins}     Losses  ${stats.losses}`,
    '',
    'By species',
  ];
  for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
    const r = stats.bySpecies[id];
    lines.push(
      `${SPECIES[id].name}  ·  ${r.started} played  ·  ${r.wins}W / ${r.losses}L`,
    );
  }
  return lines.join('\n');
}

function formatMatches(
  rows: Awaited<ReturnType<typeof listRecentMatches>>,
): string {
  if (rows.length === 0) {
    return 'Recent matches\nNo cloud matches yet — finish a skirmish while signed in.';
  }
  const lines = [`Recent matches  ·  last ${rows.length}`];
  for (const s of rows) {
    const mins = Math.max(0, Math.round(s.durationMs / 60000));
    const secs = Math.max(0, Math.round((s.durationMs % 60000) / 1000));
    const species = SPECIES[s.species]?.name ?? s.species;
    lines.push(
      `${s.won ? 'Win' : 'Loss'}  ·  ${species} / ${s.difficulty}  ·  ${mins}m ${secs}s`,
    );
  }
  return lines.join('\n');
}

function shortSkin(id: string): string {
  return id.replace(/^skin_/, '').slice(0, 12);
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
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.84)
    .setDepth(300)
    .setInteractive();

  const short = height < 500;
  const panelW = short ? Math.min(760, width - 24) : Math.min(460, width - 28);
  const panelH = short ? height - 16 : Math.min(460, height - 28);
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
    .text(cx, top + 52, 'Account', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(cx, top + 80, 'Your cloud profile on this device', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9eb4c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const bodyWrap = panelW - 48;

  const profileBody = scene.add
    .text(left, top + 108, 'Loading…', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#d7e6f2',
      lineSpacing: 5,
      wordWrap: { width: bodyWrap },
    })
    .setDepth(302);

  const statsBody = scene.add
    .text(left, top + 108, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#d7e6f2',
      lineSpacing: 5,
      wordWrap: { width: bodyWrap },
    })
    .setDepth(302);

  const matchesBody = scene.add
    .text(left, top + 108, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#b8c9d9',
      lineSpacing: 4,
      wordWrap: { width: bodyWrap },
    })
    .setDepth(302);

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    accent,
    brand,
    title,
    subtitle,
    profileBody,
    statsBody,
    matchesBody,
  ];
  let unsub: (() => void) | null = null;

  const destroy = (): void => {
    unsub?.();
    for (const n of nodes) n.destroy();
  };

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

  const guest = isAnonymousGuest(user);
  const btnY = short ? bottom - 36 : bottom - 52;

  const mkBtn = (
    x: number,
    label: string,
    bg: string,
    color: string,
    fn: () => void,
  ): void => {
    const btn = scene.add
      .text(x, btnY, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color,
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

  if (guest) {
    mkBtn(cx - 120, 'Create account', '#3a5530', '#f0c75e', () => {
      destroy();
      showAuthPanel({
        mode: 'signup',
        onAuthed: (u) => {
          void bootstrapCloudAccount(u).finally(() => {
            showDashboardPanel(scene, onClose);
          });
        },
        onClose: () => {
          showDashboardPanel(scene, onClose);
        },
      });
    });
    mkBtn(cx + 20, 'Log out', '#5a3a3a', '#fff8e8', () => {
      void signOutAccount().then(() => {
        destroy();
        onClose();
      });
    });
    mkBtn(cx + 130, 'Refresh', '#2a4a38', '#fff8e8', () => {
      void loadBody();
    });
  } else {
    mkBtn(cx - 80, 'Log out', '#5a3a3a', '#fff8e8', () => {
      void signOutAccount().then(() => {
        destroy();
        onClose();
      });
    });
    mkBtn(cx + 80, 'Refresh', '#2a4a38', '#fff8e8', () => {
      void loadBody();
    });
  }

  const quietNote = scene.add
    .text(
      cx,
      short ? bottom - 68 : bottom - 18,
      guest
        ? 'Guest · create an account to keep progress if you clear data'
        : 'Cloud profile · empty until you finish a signed-in skirmish',
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#6a7f94',
      },
    )
    .setOrigin(0.5)
    .setDepth(302);
  nodes.push(quietNote);

  const placeColumns = (): void => {
    if (!short) {
      statsBody.setY(profileBody.y + profileBody.height + 14);
      matchesBody.setY(statsBody.y + statsBody.height + 14);
      return;
    }
    const colW = Math.floor((panelW - 72) / 2);
    profileBody.setStyle({ wordWrap: { width: colW } });
    statsBody.setStyle({ wordWrap: { width: colW } });
    statsBody.setPosition(left + colW + 24, profileBody.y);
    const stackBottom = Math.max(
      profileBody.y + profileBody.height,
      statsBody.y + statsBody.height,
    );
    matchesBody.setPosition(left, stackBottom + 10);
    const room = btnY - 28 - matchesBody.y;
    if (room > 0 && matchesBody.height > room) {
      const maxLines = Math.max(1, Math.floor(room / 18));
      matchesBody.setText(
        matchesBody.text.split('\n').slice(0, maxLines).join('\n'),
      );
    }
  };

  const loadBody = async (): Promise<void> => {
    const u = getCurrentAuthUser();
    if (!isCloudAccount(u) || !u) {
      profileBody.setText('Signed out.');
      statsBody.setText('');
      matchesBody.setText('');
      return;
    }
    profileBody.setText('Loading profile…');
    statsBody.setText('');
    matchesBody.setText('');
    try {
      const [profile, stats, matches] = await Promise.all([
        getUserProfile(u.uid),
        getStatsOverview(u.uid),
        listRecentMatches(u.uid, 5),
      ]);
      const prefs = profile?.prefs ?? loadMatchPrefs();
      const cos =
        profile?.cosmetics?.equipped ?? loadCosmeticsLoadout().equipped;
      const overview = stats ?? emptyStatsOverview();
      const emptyHint =
        overview.gamesStarted === 0 &&
        overview.wins === 0 &&
        overview.losses === 0
          ? '\n(No cloud matches yet — play a skirmish while signed in.)'
          : '';
      const accountKind = u.isAnonymous
        ? 'Guest (anonymous)'
        : u.email ?? 'Signed in';
      const commander = profile?.displayName ?? u.displayName;

      profileBody.setText(
        [
          `Commander  ·  ${commander}`,
          accountKind,
          '',
          `Prefs  ·  ${SPECIES[prefs.species].name} / ${AI_DIFFICULTIES[prefs.difficulty].label}`,
          `Skins  ·  B ${shortSkin(cos.brutes)}  ·  N ${shortSkin(cos.nobles)}  ·  W ${shortSkin(cos.weirdos)}`,
        ].join('\n'),
      );
      statsBody.setText(formatOverview(overview) + emptyHint);
      matchesBody.setText(formatMatches(matches));
      placeColumns();
    } catch (err) {
      console.warn('[KANE] dashboard load failed', err);
      profileBody.setText(
        [
          `Commander  ·  ${u.displayName}`,
          u.isAnonymous ? 'Guest (anonymous)' : (u.email ?? 'Signed in'),
          '',
          'Could not load cloud stats.',
          'Local play still works — no fabricated numbers.',
        ].join('\n'),
      );
      statsBody.setText(formatOverview(emptyStatsOverview()));
      matchesBody.setText(formatMatches([]));
      placeColumns();
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
