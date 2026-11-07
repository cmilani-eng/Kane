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
import { getLobbyStub } from '../../networking/lobbySingleton';
import type { LobbyStatus } from '../../networking/lobbyStub';
import { playSfx } from '../audio/sfx';
import { lobbyLastDifficultyTipLine } from './lobbyLastDifficultyTip';
import { lobbyLastDurationTipLine } from './lobbyLastDurationTip';
import { lobbyLastFactionTipLine } from './lobbyLastFactionTip';
import { lobbyLastMapTipLine } from './lobbyLastMapTip';
import { lobbyLastMapSizeTipLine } from './lobbyLastMapSizeTip';
import { lobbyBestDurationTipLine } from './lobbyBestDurationTip';
import { lobbyAvgDurationTipLine } from './lobbyAvgDurationTip';
import { lobbyBestMapTipLine } from './lobbyBestMapTip';
import { lobbyLastOutcomeTipLine } from './lobbyLastOutcomeTip';
import { lobbyFavoriteFactionTipLine } from './lobbyFavoriteFactionTip';
import { lobbyGamesPlayedTipLine } from './lobbyGamesPlayedTip';
import { lobbyLossesTipLine } from './lobbyLossesTip';
import { lobbyWinsTipLine } from './lobbyWinsTip';
import { lobbySpeciesPlaysTipLine } from './lobbySpeciesPlaysTip';
import { lobbyWinRateTipLine } from './lobbyWinRateTip';
import { lobbyBestWinStreakTipLine } from './lobbyBestWinStreakTip';
import { lobbyWinStreakTipLine } from './lobbyWinStreakTip';

export function lobbyStatusLine(status: LobbyStatus, code: string | null): string {
  switch (status) {
    case 'idle':
      return t('lobby.idle');
    case 'hosting':
      return t('lobby.hosting');
    case 'joining':
      return t('lobby.joining', { code: code ?? '' });
    case 'blocked':
      return t('lobby.codeShort');
  }
}

/** Selected skirmish map tip — label · blurb from match prefs. */
export function lobbyMapTipLine(): string {
  const map = mapCopy(loadMatchPrefs().mapId);
  return t('lobby.mapTip', { label: map.label, blurb: map.blurb });
}

/** Selected faction motto tip — name · blurb from match prefs. */
export function lobbyFactionTipLine(): string {
  const s = speciesCopy(loadMatchPrefs().species);
  return t('lobby.factionTip', { name: s.name, blurb: s.motto });
}

/** Selected difficulty tip — label · blurb from match prefs. */
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
  const lobby = getLobbyStub();

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
    lobbyLastOutcomeTipLine(),
    lobbyWinStreakTipLine(),
    lobbyBestWinStreakTipLine(),
    lobbyGamesPlayedTipLine(),
    lobbyWinsTipLine(),
    lobbyLossesTipLine(),
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

  const quietNote = scene.add
    .text(cx, short ? bottom - 64 : bottom - 22, t('lobby.quiet'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#6a7f94',
      align: 'center',
      wordWrap: { width: panelW - 40 },
    })
    .setOrigin(0.5)
    .setDepth(302);

  const refresh = (): void => {
    const st = lobby.peek();
    codeText.setText(st.code ?? '————');
    codeText.setColor(
      st.status === 'hosting'
        ? '#f0c75e'
        : st.status === 'joining'
          ? '#7ec8ff'
          : '#6a7f94',
    );
    statusText.setText(lobbyStatusLine(st.status, st.code));
  };
  refresh();

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

  const rowY = short ? bottom - 32 : bottom - 78;
  quietNote.setPosition(cx, rowY - 36);
  const createBtn = mkBtn(t('lobby.create'), '#2a4a38', () => {
    lobby.hostLocal();
  });
  const joinBtn = mkBtn(t('lobby.join'), '#2a3a50', () => {
    const raw =
      typeof window !== 'undefined'
        ? window.prompt(t('lobby.prompt'), 'KANE01')
        : null;
    if (raw == null) return;
    lobby.joinLocal(raw);
  });
  const leaveBtn = mkBtn(t('lobby.leave'), '#3a4555', () => {
    lobby.leave();
  });
  const gap = 12;
  const place = (buttons: Phaser.GameObjects.Text[], y: number): void => {
    const total = buttons.reduce((sum, b) => sum + b.width, 0) + gap * (buttons.length - 1);
    let x = cx - total / 2;
    for (const b of buttons) {
      b.setPosition(x + b.width / 2, y);
      x += b.width + gap;
    }
  };
  if (short) {
    const row = [createBtn, joinBtn, leaveBtn];
    const total = row.reduce((sum, b) => sum + b.width, 0) + gap * 2;
    if (total <= panelW - 24) place(row, rowY);
    else {
      createBtn.setPosition(cx, rowY - 44);
      joinBtn.setPosition(cx, rowY);
      leaveBtn.setPosition(cx, rowY + 44);
    }
  } else {
    const pair = createBtn.width + joinBtn.width + gap;
    if (pair <= panelW - 32) {
      place([createBtn, joinBtn], rowY);
      leaveBtn.setPosition(cx, rowY + 46);
    } else {
      createBtn.setPosition(cx, rowY - 46);
      joinBtn.setPosition(cx, rowY);
      leaveBtn.setPosition(cx, rowY + 46);
    }
  }

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
    for (const n of nodes) n.destroy();
  };
}
