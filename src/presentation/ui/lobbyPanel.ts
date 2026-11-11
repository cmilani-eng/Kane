/**
 * Friend lobby create/join code UI — local stub only.
 * No RTDB / live MP sync. SP vs AI path stays on Menu species cards.
 * Shows selected faction motto + skirmish map flavor from match prefs.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { loadMatchPrefs } from '../../database/matchPrefs';
import { loadMatchSummaries } from '../../database/matchSummary';
import {
  difficultyCopy,
  mapCopy,
  speciesCopy,
  speciesName,
  t,
} from '../../i18n';
import type { MessageKey } from '../../i18n/messages';
import { getLobbySession } from '../../networking/lobbySingleton';
import { getCurrentAuthUser } from '../../firebase/auth';
import type { SpeciesId } from '../../data/speciesStub';
import type { AiDifficultyId } from '../../gameplay/battlefield/aiDifficulty';
import { joinAsGuest, startAsHost, type PvpLaunch } from '../../networking/matchStart';
import type { SessionStatus } from '../../networking/lobbySession';
import { playSfx } from '../audio/sfx';
import { lobbyLastDifficultyTipLine } from './lobbyLastDifficultyTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyAvgApmTipLine } from './lobbyAvgApmTip';
import { lobbyBestApmTipLine } from './lobbyBestApmTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyRecordTipLine } from './lobbyRecordTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyLossStreakTipLine } from './lobbyLossStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';

/** `reason` is a translation key from the session, shown instead of the status when set. */
export function lobbyStatusLine(status: SessionStatus, code: string | null, reason?: string): string {
  if (reason) return t(reason as MessageKey);
  switch (status) {
    case 'idle':
      return t('lobby.idle');
    case 'hosting':
      return t('lobby.hosting');
    case 'hosted':
      return t('lobby.hostedGuest');
    case 'joining':
      return t('lobby.joining', { code: code ?? '' });
    case 'joined':
      return t('lobby.joinedHost');
    case 'blocked':
      return t('lobby.unavailable');
  }
}

const BTN_GAP = 12;
const ROW_GAP = 8;
const BOTTOM_PAD = 12;
const NOTE_GAP = 6;

const rowWidth = (widths: readonly number[]): number =>
  widths.reduce((sum, w) => sum + w, 0) + BTN_GAP * (widths.length - 1);

export interface LobbyButtonLayout {
  /** Centres of Create, Join and Leave, in that order. */
  readonly buttons: readonly { readonly x: number; readonly y: number }[];
  /** Centre y of the quiet note, just above the top button row. */
  readonly noteY: number;
}

/**
 * Places Create / Join / Leave from their measured widths, bottom-up so every row stays
 * inside the panel: one row when all three fit, else Create + Join over Leave, else one per
 * row. The quiet note goes above the top row, so no button covers it.
 */
export function lobbyButtonLayout(
  cx: number,
  bottom: number,
  maxRowW: number,
  widths: readonly [number, number, number],
  btnH: number,
  noteH: number,
): LobbyButtonLayout {
  const rows =
    rowWidth(widths) <= maxRowW
      ? [[0, 1, 2]]
      : rowWidth(widths.slice(0, 2)) <= maxRowW
        ? [[0, 1], [2]]
        : [[0], [1], [2]];
  const lastY = bottom - BOTTOM_PAD - btnH / 2;
  const topY = lastY - (rows.length - 1) * (btnH + ROW_GAP);
  const buttons: { x: number; y: number }[] = [];
  rows.forEach((row, i) => {
    const y = topY + i * (btnH + ROW_GAP);
    let x = cx - rowWidth(row.map((b) => widths[b])) / 2;
    for (const b of row) {
      buttons[b] = { x: x + widths[b] / 2, y };
      x += widths[b] + BTN_GAP;
    }
  });
  return { buttons, noteY: topY - btnH / 2 - NOTE_GAP - noteH / 2 };
}

/**
 * Selected skirmish map tip — {label} · {blurb} (U+00B7) from match prefs.
 * Blurb may itself contain middots. Same en copy shape as menu map tip,
 * distinct key/surface (`lobby.mapTip` vs `menu.mapTip`). Distinct from
 * Last map · / Best map · / Map · w×h / Map · name / difficulty · blurb /
 * species motto / setup line.
 */
export function lobbyMapTipLine(): string {
  const map = mapCopy(loadMatchPrefs().mapId);
  return t('lobby.mapTip', { label: map.label, blurb: map.blurb });
}

/**
 * Selected faction motto tip — {name} · {blurb} (U+00B7) from match prefs.
 * Same en copy as pause species motto tip, distinct key/surface
 * (`lobby.factionTip` vs `pause.speciesMotto`). Distinct from Last · /
 * Favorite · / Map · / Objective · / Difficulty · / setup line.
 */
export function lobbyFactionTipLine(): string {
  const s = speciesCopy(loadMatchPrefs().species);
  return t('lobby.factionTip', { name: s.name, blurb: s.motto });
}

/**
 * Selected difficulty tip — {label} · {blurb} (U+00B7) from match prefs.
 * Blurb may itself contain middots. Same en copy as pause difficulty tip,
 * distinct key/surface (`lobby.difficultyTip` vs `pause.difficultyTip`).
 * Distinct from Last difficulty · / end Difficulty · (double-spaced) /
 * setup line / Objective · / Map · / species motto.
 */
export function lobbyDifficultyTipLine(): string {
  const d = difficultyCopy(loadMatchPrefs().difficulty);
  return t('lobby.difficultyTip', { label: d.label, blurb: d.blurb });
}

/** Species · map · difficulty — same shape as pause.setup for rematch context. */
export function lobbySetupLine(): string {
  const prefs = loadMatchPrefs();
  return t('pause.setup', {
    species: speciesName(prefs.species),
    map: mapCopy(prefs.mapId).label,
    difficulty: difficultyCopy(prefs.difficulty).label,
  });
}

/**
 * Estimated match length from recent local summaries (rounded minutes).
 * Falls back to a quiet default when no history yet.
 */
export function lobbyMatchLengthTipLine(limit = 8): string {
  const recent = loadMatchSummaries().summaries.slice(0, limit);
  if (recent.length === 0) return t('lobby.matchLengthDefault');
  const avgMs =
    recent.reduce((sum, s) => sum + Math.max(0, s.durationMs), 0) /
    recent.length;
  const mins = Math.max(1, Math.round(avgMs / 60_000));
  return t('lobby.matchLengthAvg', { n: mins });
}

export function showLobbyPanel(scene: Phaser.Scene, onClose: () => void): void {
  const { width, height } = scene.scale;
  const lobby = getLobbySession();

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.84)
    .setDepth(300)
    .setInteractive();

  const short = height < 500;
  const panelW = short ? Math.min(720, width - 24) : Math.min(440, width - 28);
  const panelH = short ? height - 16 : Math.min(380, height - 36);
  const cx = width / 2;
  const cy = height / 2;
  const top = cy - panelH / 2;
  const bottom = cy + panelH / 2;

  const panel = scene.add
    .rectangle(cx, cy, panelW, panelH, 0x122033, 0.98)
    .setStrokeStyle(2, 0xf0c75e, 0.85)
    .setDepth(301);

  const accent = scene.add
    .rectangle(cx, top + 3, panelW - 4, 4, 0xf0c75e, 0.9)
    .setDepth(302);

  const brand = scene.add
    .text(cx, top + 28, BRAND.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '13px',
      color: '#f0c75e',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const title = scene.add
    .text(cx, top + 54, t('lobby.title'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(cx, top + 84, t('lobby.subtitle'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9eb4c8',
      align: 'center',
      wordWrap: { width: panelW - 40 },
    })
    .setOrigin(0.5)
    .setDepth(302);

  const tipStack = [
    lobbySetupLine(),
    lobbyFactionTipLine(),
    lobbyLastFactionTipLine(),
    lobbyFavoriteFactionTipLine(),
    lobbySpeciesPlaysTipLine(),
    lobbyDifficultyTipLine(),
    lobbyLastDifficultyTipLine(),
    lobbyMapTipLine(),
    lobbyLastMapTipLine(),
    lobbyBestMapTipLine(),
    lobbyLastMapSizeTipLine(),
    lobbyLastDurationTipLine(),
    lobbyBestDurationTipLine(),
    lobbyAvgDurationTipLine(),
    lobbyAvgApmTipLine(),
    lobbyBestApmTipLine(),
    lobbyLastOutcomeTipLine(),
    lobbyWinStreakTipLine(),
    lobbyBestWinStreakTipLine(),
    lobbyLossStreakTipLine(),
    lobbyGamesPlayedTipLine(),
    lobbyWinsTipLine(),
    lobbyLossesTipLine(),
    lobbyRecordTipLine(),
    lobbyWinRateTipLine(),
    lobbyMatchLengthTipLine(),
  ]
    .filter(Boolean)
    .join('\n');
  const mapTip = scene.add
    .text(cx, top + 106, tipStack, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#a8c8c0',
      align: 'center',
      wordWrap: { width: panelW - 40 },
      lineSpacing: 4,
    })
    .setOrigin(0.5)
    .setDepth(302);

  const codeText = scene.add
    .text(cx, short ? top + 148 : cy - 22, '————', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: short ? '28px' : '40px',
      color: '#f0c75e',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const statusText = scene.add
    .text(cx, short ? top + 184 : cy + 24, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#d7e6f2',
      align: 'center',
      wordWrap: { width: panelW - 48 },
      lineSpacing: 5,
    })
    .setOrigin(0.5, 0)
    .setDepth(302);

  // Placed above the buttons once they are measured.
  const quietNote = scene.add
    .text(cx, 0, t('lobby.quiet'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#6a7f94',
      align: 'center',
      wordWrap: { width: panelW - 40 },
    })
    .setOrigin(0.5)
    .setDepth(302);
  /** The note is only a hint: hide it when a long status line would run into it. */
  const fitQuietNote = (): void => {
    quietNote.setVisible(
      statusText.y + statusText.height + 2 <= quietNote.y - quietNote.height / 2,
    );
  };

  /** The Create button turns into Start match once a friend is seated. */
  let startBtn: Phaser.GameObjects.Text | null = null;
  let stopGuestWatch: (() => void) | null = null;
  /** Starts the match as host: writes the setup, then opens the battle scene. */
  const beginHostMatch = async (code: string, guestUid: string): Promise<void> => {
    const uid = getCurrentAuthUser()?.uid;
    if (!uid) return;
    const launch = await startAsHost(code, uid, guestUid);
    if (launch) launchMatch(launch);
  };
  /** Waits as guest for the host's setup, then opens the battle scene. */
  const beginGuestMatch = (code: string, hostUid: string): void => {
    const uid = getCurrentAuthUser()?.uid;
    if (!uid) return;
    stopGuestWatch?.();
    stopGuestWatch = joinAsGuest(code, hostUid, uid, (launch) => {
      stopGuestWatch?.();
      stopGuestWatch = null;
      launchMatch(launch);
    });
  };
  /** Hands the match to the battle scene. The lobby stays open; this player only stops following it. */
  const launchMatch = (launch: PvpLaunch): void => {
    unsubscribe();
    lobby.release();
    destroy();
    const species = (launch.role === 'host' ? launch.hostSpecies : launch.guestSpecies) as SpeciesId;
    scene.scene.start('Battlefield', {
      species,
      difficulty: launch.difficulty as AiDifficultyId,
      mapId: launch.mapId,
      pvp: {
        code: launch.code,
        role: launch.role,
        uid: launch.uid,
        peerUid: launch.peerUid,
        seed: launch.seed,
        hostSpecies: launch.hostSpecies as SpeciesId,
        guestSpecies: launch.guestSpecies as SpeciesId,
      },
    });
  };

  const refresh = (): void => {
    const st = lobby.peek();
    codeText.setText(st.code ?? '————');
    codeText.setColor(
      st.status === 'hosting' || st.status === 'hosted'
        ? '#f0c75e'
        : st.status === 'joining' || st.status === 'joined'
          ? '#7ec8ff'
          : '#6a7f94',
    );
    statusText.setText(lobbyStatusLine(st.status, st.code, st.reason));
    fitQuietNote();
    startBtn?.setText(st.status === 'hosted' ? t('pvp.start') : t('lobby.create'));
  };
  refresh();
  const unsubscribe = lobby.subscribe(refresh);

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    accent,
    brand,
    title,
    subtitle,
    mapTip,
    codeText,
    statusText,
    quietNote,
  ];

  const mkBtn = (
    label: string,
    bg: string,
    fn: () => void,
  ): Phaser.GameObjects.Text => {
    const btn = scene.add
      .text(0, 0, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: bg,
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(303)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        playSfx('ui');
        fn();
        refresh();
      });
    nodes.push(btn);
    return btn;
  };

  const createBtn = mkBtn(t('lobby.create'), '#2a4a38', () => {
    const st = lobby.peek();
    if (st.status === 'hosted' && st.code && st.peerUid) {
      void beginHostMatch(st.code, st.peerUid);
      return;
    }
    void lobby.host();
  });
  startBtn = createBtn;
  const joinBtn = mkBtn(t('lobby.join'), '#2a3a50', () => {
    const raw =
      typeof window !== 'undefined'
        ? window.prompt(t('lobby.prompt'), 'KANE01')
        : null;
    if (raw == null) return;
    void lobby.join(raw).then(() => {
      const st = lobby.peek();
      if (st.status === 'joined' && st.code && st.peerUid) beginGuestMatch(st.code, st.peerUid);
    });
  });
  const leaveBtn = mkBtn(t('lobby.leave'), '#3a4555', () => {
    void lobby.leave();
  });
  const layout = lobbyButtonLayout(
    cx,
    bottom,
    panelW - 32,
    [createBtn.width, joinBtn.width, leaveBtn.width],
    createBtn.height,
    quietNote.height,
  );
  [createBtn, joinBtn, leaveBtn].forEach((b, i) => b.setPosition(layout.buttons[i].x, layout.buttons[i].y));
  quietNote.setY(layout.noteY);
  fitQuietNote();

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

  const destroy = (): void => {
    unsubscribe();
    stopGuestWatch?.();
    for (const n of nodes) n.destroy();
  };
}
