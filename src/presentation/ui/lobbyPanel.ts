/**
 * Friend lobby create/join code UI — local stub only.
 * No RTDB / live MP sync. SP vs AI path stays on Menu species cards.
 */
import Phaser from 'phaser';
import { flags } from '../../config/flags';
import { ageGateLabel, loadAgeGate } from '../../firebase/ageGate';
import { getFirebaseFoundation } from '../../firebase/foundation';
import { getLobbyStub } from '../../networking/lobbySingleton';
import { playSfx } from '../audio/sfx';

export function showLobbyPanel(scene: Phaser.Scene, onClose: () => void): void {
  const { width, height } = scene.scale;
  const lobby = getLobbyStub();
  const firebase = getFirebaseFoundation();

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.82)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(460, width - 32);
  const panelH = Math.min(400, height - 40);
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x152238, 0.98)
    .setStrokeStyle(2, 0x7ec8ff, 0.9)
    .setDepth(301);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 26, 'Friend lobby', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '22px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(
      width / 2,
      height / 2 - panelH / 2 + 52,
      'Create or join a code · local stub · no live sync yet',
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#9eb4c8',
      },
    )
    .setOrigin(0.5)
    .setDepth(302);

  const codeText = scene.add
    .text(width / 2, height / 2 - 36, '————', {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '36px',
      color: '#7ec8ff',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const statusText = scene.add
    .text(width / 2, height / 2 + 8, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#d7e6f2',
      align: 'center',
      wordWrap: { width: panelW - 48 },
      lineSpacing: 4,
    })
    .setOrigin(0.5, 0)
    .setDepth(302);

  const refresh = (): void => {
    const st = lobby.peek();
    const user = firebase.auth.currentUser();
    codeText.setText(st.code ?? '————');
    codeText.setColor(
      st.status === 'hosting'
        ? '#f0c75e'
        : st.status === 'joining'
          ? '#7ec8ff'
          : '#6a7f94',
    );
    const lines = [
      `Status: ${st.status}`,
      st.reason ? st.reason : 'SP vs AI is unchanged — use species cards on the menu.',
      '',
      ageGateLabel(loadAgeGate()),
      `Ads ${flags.adsEnabled ? 'on' : 'off'}  ·  Auth ${user ? 'local anon' : 'none'}  ·  Emu ${firebase.useEmulators ? 'on' : 'off'}`,
    ];
    statusText.setText(lines.join('\n'));
  };
  refresh();

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    title,
    subtitle,
    codeText,
    statusText,
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
        padding: { x: 14, y: 9 },
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

  const rowY = height / 2 + panelH / 2 - 88;
  mkBtn(width / 2 - 100, rowY, 'Create code', '#2a4a38', () => {
    lobby.hostLocal();
  });
  mkBtn(width / 2 + 100, rowY, 'Join code…', '#2a3a50', () => {
    const raw =
      typeof window !== 'undefined'
        ? window.prompt('Enter friend lobby code', 'KANE01')
        : null;
    if (raw == null) return;
    lobby.joinLocal(raw);
  });
  mkBtn(width / 2, rowY + 44, 'Leave lobby', '#3a4555', () => {
    lobby.leave();
  });

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

  const destroy = (): void => {
    for (const n of nodes) n.destroy();
  };
}
