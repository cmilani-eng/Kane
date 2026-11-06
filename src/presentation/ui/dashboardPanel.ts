/**
 * Player Account / Dashboard — profile, real stats (or empty), recent matches, prefs.
 * Never fabricates numbers. Distinct from admin Stats (#/admin).
 * Works for email and Firebase anonymous guests (empty zeros until they play).
 * Visual language matches Friend lobby + Stats (navy / gold / cream).
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import type { SpeciesId } from '../../data/speciesStub';
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
import {
  emptyStatsOverview,
  type StatsOverviewDoc,
  type UserMatchDoc,
} from '../../firebase/types';
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import {
  difficultyCopy,
  mapCopy,
  speciesCopy,
  speciesName,
  t,
} from '../../i18n';
import { playSfx } from '../audio/sfx';
import { showAuthPanel } from './authPanel';
import { formatMatchClock } from './matchClock';

const ENGLISH_NAME_FALLBACK = new Set(['Guest', 'Commander']);

type AccountMatch = Pick<
  UserMatchDoc,
  'won' | 'species' | 'difficulty' | 'durationMs'
>;

export function accountShownName(
  name: string | null | undefined,
  anonymous: boolean,
): string {
  const raw = name?.trim();
  if (raw && !ENGLISH_NAME_FALLBACK.has(raw)) return raw;
  return anonymous ? t('account.guestAnon') : t('auth.displayPlaceholder');
}

export function accountOverviewText(stats: StatsOverviewDoc): string {
  const lines = [
    t('stats.played', { n: stats.gamesStarted }),
    t('stats.record', { wins: stats.wins, losses: stats.losses }),
    '',
    t('stats.bySpecies'),
  ];
  for (const id of ['brutes', 'nobles', 'weirdos'] as SpeciesId[]) {
    const row = stats.bySpecies[id];
    lines.push(
      t('stats.speciesLine', {
        name: speciesName(id),
        played: row.started,
        wins: row.wins,
        losses: row.losses,
      }),
    );
  }
  return lines.join('\n');
}

export function accountMatchesText(rows: AccountMatch[]): string {
  if (rows.length === 0) return t('account.recentEmpty');
  const lines = [t('stats.recentHead', { n: rows.length })];
  for (const row of rows) {
    lines.push(
      t('stats.matchLine', {
        result: row.won ? t('stats.win') : t('stats.loss'),
        species: speciesName(row.species),
        difficulty: difficultyCopy(row.difficulty).label,
        clock: formatMatchClock(row.durationMs),
      }),
    );
  }
  return lines.join('\n');
}

export function accountProfileText(opts: {
  name: string | null | undefined;
  anonymous: boolean;
  email: string | null | undefined;
  species: SpeciesId;
  difficulty: AiDifficultyId;
  mapId: SkirmishMapId;
  skins: { brutes: string; nobles: string; weirdos: string };
}): string {
  const accountKind = opts.anonymous
    ? t('account.guestAnon')
    : opts.email?.trim() || t('account.signedIn');
  const map = mapCopy(opts.mapId);
  const faction = speciesCopy(opts.species);
  return [
    t('account.commander', {
      name: accountShownName(opts.name, opts.anonymous),
    }),
    accountKind,
    '',
    t('account.prefs', {
      species: speciesName(opts.species),
      difficulty: difficultyCopy(opts.difficulty).label,
      map: map.label,
    }),
    t('lobby.factionTip', { name: faction.name, blurb: faction.motto }),
    t('menu.mapTip', { label: map.label, blurb: map.blurb }),
    t('account.skins', {
      brutes: shortSkin(opts.skins.brutes),
      nobles: shortSkin(opts.skins.nobles),
      weirdos: shortSkin(opts.skins.weirdos),
    }),
  ].join('\n');
}

export function accountLoadErrorText(opts: {
  name: string | null | undefined;
  anonymous: boolean;
  email: string | null | undefined;
}): string {
  const accountKind = opts.anonymous
    ? t('account.guestAnon')
    : opts.email?.trim() || t('account.signedIn');
  return [
    t('account.commander', {
      name: accountShownName(opts.name, opts.anonymous),
    }),
    accountKind,
    '',
    t('account.loadFailed'),
    t('account.localStill'),
  ].join('\n');
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
  const panelH = short ? height - 16 : Math.min(520, height - 28);
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
    .text(cx, top + 52, t('menu.account'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(cx, top + 80, t('account.subtitle'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9eb4c8',
      align: 'center',
      wordWrap: { width: panelW - 40 },
    })
    .setOrigin(0.5)
    .setDepth(302);

  const bodyWrap = panelW - 48;

  const profileBody = scene.add
    .text(left, top + 108, t('account.loading'), {
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
  const quietNote = scene.add
    .text(
      cx,
      bottom - 8,
      guest ? t('account.guestNote') : t('account.cloudNote'),
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#6a7f94',
        align: 'center',
        wordWrap: { width: panelW - 40 },
      },
    )
    .setOrigin(0.5, 1)
    .setDepth(302);
  nodes.push(quietNote);

  const mkBtn = (
    label: string,
    bg: string,
    color: string,
    fn: () => void,
  ): Phaser.GameObjects.Text => {
    const btn = scene.add
      .text(0, 0, label, {
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
    return btn;
  };

  const row: Phaser.GameObjects.Text[] = [];
  if (guest) {
    row.push(
      mkBtn(t('auth.signup'), '#3a5530', '#f0c75e', () => {
        destroy();
        showAuthPanel({
          mode: 'signup',
          onAuthed: (signedUp) => {
            void bootstrapCloudAccount(signedUp).finally(() => {
              showDashboardPanel(scene, onClose);
            });
          },
          onClose: () => {
            showDashboardPanel(scene, onClose);
          },
        });
      }),
    );
  }
  row.push(
    mkBtn(t('account.logout'), '#5a3a3a', '#fff8e8', () => {
      void signOutAccount().then(() => {
        destroy();
        onClose();
      });
    }),
  );
  row.push(
    mkBtn(t('account.refresh'), '#2a4a38', '#fff8e8', () => {
      void loadBody();
    }),
  );

  const gap = 12;
  const btnY = quietNote.y - quietNote.height - 26;
  const rowWidth =
    row.reduce((sum, btn) => sum + btn.width, 0) + gap * (row.length - 1);
  if (rowWidth <= panelW - 24) {
    let x = cx - rowWidth / 2;
    for (const btn of row) {
      btn.setPosition(x + btn.width / 2, btnY);
      x += btn.width + gap;
    }
  } else {
    for (let i = row.length - 1; i >= 0; i -= 1) {
      row[i]!.setPosition(cx, btnY - (row.length - 1 - i) * 44);
    }
  }

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
    const current = getCurrentAuthUser();
    if (!isCloudAccount(current) || !current) {
      profileBody.setText(t('account.signedOut'));
      statsBody.setText('');
      matchesBody.setText('');
      return;
    }
    profileBody.setText(t('account.loadingProfile'));
    statsBody.setText('');
    matchesBody.setText('');
    try {
      const [profile, stats, matches] = await Promise.all([
        getUserProfile(current.uid),
        getStatsOverview(current.uid),
        listRecentMatches(current.uid, 5),
      ]);
      const prefs = profile?.prefs ?? loadMatchPrefs();
      const skins =
        profile?.cosmetics?.equipped ?? loadCosmeticsLoadout().equipped;
      const overview = stats ?? emptyStatsOverview();
      const emptyHint =
        overview.gamesStarted === 0 &&
        overview.wins === 0 &&
        overview.losses === 0
          ? `\n${t('account.emptyHint')}`
          : '';
      profileBody.setText(
        accountProfileText({
          name: profile?.displayName ?? current.displayName,
          anonymous: current.isAnonymous,
          email: current.email,
          species: prefs.species,
          difficulty: prefs.difficulty,
          // Cloud profile prefs omit map; local match prefs keep the skirmish map.
          mapId: loadMatchPrefs().mapId,
          skins,
        }),
      );
      statsBody.setText(accountOverviewText(overview) + emptyHint);
      matchesBody.setText(accountMatchesText(matches));
      placeColumns();
    } catch (err) {
      console.warn('[KANE] dashboard load failed', err);
      profileBody.setText(
        accountLoadErrorText({
          name: current.displayName,
          anonymous: current.isAnonymous,
          email: current.email,
        }),
      );
      statsBody.setText(accountOverviewText(emptyStatsOverview()));
      matchesBody.setText(accountMatchesText([]));
      placeColumns();
    }
  };

  unsub = subscribeAuth((next) => {
    if (!isCloudAccount(next)) {
      destroy();
      onClose();
    }
  });

  void loadBody();
}
