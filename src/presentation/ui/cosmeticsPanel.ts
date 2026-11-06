/**
 * Cosmetics browse + equip UI — skins only, local stub, not a shop.
 */
import Phaser from 'phaser';
import {
  listAllSkins,
  type CosmeticSkinDef,
} from '../../data/cosmeticsCatalog';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import {
  equipSkin,
  getEquippedSkinId,
  loadCosmeticsLoadout,
} from '../../database/cosmeticsLoadout';
import { playSfx } from '../audio/sfx';

const SPECIES_ORDER: SpeciesId[] = ['brutes', 'nobles', 'weirdos'];

export function showCosmeticsPanel(
  scene: Phaser.Scene,
  onClose: () => void,
): void {
  const { width, height } = scene.scale;
  let species: SpeciesId = 'nobles';
  let page = 0;

  const overlay = scene.add
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.82)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(480, width - 24);
  const panelH = Math.min(420, height - 36);
  const panel = scene.add
    .rectangle(width / 2, height / 2, panelW, panelH, 0x152238, 0.98)
    .setStrokeStyle(2, 0xf0c75e, 0.9)
    .setDepth(301);

  const title = scene.add
    .text(width / 2, height / 2 - panelH / 2 + 26, 'Cosmetics  ·  skins only', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '20px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(
      width / 2,
      height / 2 - panelH / 2 + 50,
      'Browse & equip locally · no stats · not purchasable yet',
      {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#9eb4c8',
      },
    )
    .setOrigin(0.5)
    .setDepth(302);

  const body = scene.add
    .text(width / 2, height / 2 - 20, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#d7e6f2',
      align: 'center',
      wordWrap: { width: panelW - 48 },
      lineSpacing: 5,
    })
    .setOrigin(0.5)
    .setDepth(302);

  const swatch = scene.add
    .circle(width / 2, height / 2 - panelH / 2 + 110, 22, 0xf0c75e, 1)
    .setStrokeStyle(2, 0xfff8e8, 0.9)
    .setDepth(302);

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    title,
    subtitle,
    body,
    swatch,
  ];
  const dynamicBtns: Phaser.GameObjects.GameObject[] = [];

  const clearDynamic = (): void => {
    for (const n of dynamicBtns) n.destroy();
    dynamicBtns.length = 0;
  };

  const skinsFor = (): CosmeticSkinDef[] =>
    listAllSkins().filter(
      (s) => s.speciesId === species || s.id === 'skin_default',
    );

  const refresh = (): void => {
    clearDynamic();
    const skins = skinsFor();
    if (page >= skins.length) page = 0;
    const skin = skins[page]!;
    const equipped = getEquippedSkinId(species) === skin.id;
    swatch.setFillStyle(skin.accent, 1);
    body.setText(
      [
        `${SPECIES[species].name}`,
        '',
        skin.name,
        skin.blurb,
        '',
        equipped ? 'Equipped' : 'Tap Equip to wear (local only)',
        `unlock=${skin.unlock} · purchasable=${skin.purchasable}`,
        '',
        formatMiniLoadout(),
      ].join('\n'),
    );

    const rowY = height / 2 + panelH / 2 - 92;
    mkBtn(width / 2 - 130, rowY, '◀', '#3a4555', () => {
      page = (page - 1 + skins.length) % skins.length;
      refresh();
    });
    mkBtn(width / 2, rowY, equipped ? 'Equipped' : 'Equip', '#2a4a38', () => {
      equipSkin(species, skin.id);
      playSfx('ui');
      refresh();
    });
    mkBtn(width / 2 + 130, rowY, '▶', '#3a4555', () => {
      page = (page + 1) % skins.length;
      refresh();
    });

    const tabY = height / 2 + panelH / 2 - 48;
    SPECIES_ORDER.forEach((id, i) => {
      const x = width / 2 + (i - 1) * 110;
      mkBtn(
        x,
        tabY,
        SPECIES[id].name.replace(/^The /, ''),
        species === id ? '#3d5a40' : '#2a3344',
        () => {
          species = id;
          page = 0;
          playSfx('ui');
          refresh();
        },
      );
    });
  };

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
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: bg,
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(303)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', fn);
    dynamicBtns.push(btn);
    nodes.push(btn);
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

  const destroy = (): void => {
    clearDynamic();
    for (const n of nodes) {
      if (n.active) n.destroy();
    }
  };

  refresh();
}

function formatMiniLoadout(): string {
  const l = loadCosmeticsLoadout();
  return `Loadout · B:${short(l.equipped.brutes)} N:${short(l.equipped.nobles)} W:${short(l.equipped.weirdos)}`;
}

function short(id: string): string {
  return id.replace(/^skin_/, '').slice(0, 10);
}
