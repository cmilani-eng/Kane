/**
 * Friend lobby create/join code UI — local stub only.
 * No RTDB / live MP sync. SP vs AI path stays on Menu species cards.
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
import { t } from '../../i18n';
import { getLobbyStub } from '../../networking/lobbySingleton';
import { playSfx } from '../audio/sfx';

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
    })
    .setOrigin(0.5)
    .setDepth(302);

  const codeText = scene.add
    .text(cx, short ? top + 128 : cy - 28, '————', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: short ? '28px' : '40px',
      color: '#f0c75e',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const statusText = scene.add
    .text(cx, short ? top + 164 : cy + 18, '', {
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
    if (st.status === 'idle') {
      statusText.setText(t('lobby.idle'));
    } else if (st.status === 'hosting') {
      statusText.setText(t('lobby.hosting'));
    } else if (st.status === 'joining') {
      statusText.setText(t('lobby.joining', { code: st.code ?? '' }));
    } else {
      statusText.setText(st.reason ?? t('lobby.unavailable'));
    }
  };
  refresh();

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    accent,
    brand,
    title,
    subtitle,
    codeText,
    statusText,
    quietNote,
  ];

  const mkBtn = (
    x: number,
    y: number,
    label: string,
    bg: string,
    fn: () => void,
  ): void => {
    const btn = scene.add
      .text(x, y, label, {
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
  };

  const rowY = short ? bottom - 32 : bottom - 78;
  mkBtn(cx - (short ? 180 : 110), rowY, t('lobby.create'), '#2a4a38', () => {
    lobby.hostLocal();
  });
  mkBtn(cx + (short ? 0 : 110), rowY, t('lobby.join'), '#2a3a50', () => {
    const raw =
      typeof window !== 'undefined'
        ? window.prompt(t('lobby.prompt'), 'KANE01')
        : null;
    if (raw == null) return;
    lobby.joinLocal(raw);
  });
  mkBtn(short ? cx + 180 : cx, short ? rowY : rowY + 42, t('lobby.leave'), '#3a4555', () => {
    lobby.leave();
  });

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
