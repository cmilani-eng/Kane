/**
 * Cosmetics browse + equip UI — skins only, local stub, not a shop.
 * Visual language matches Friend lobby + Stats (navy / gold / cream).
 */
import Phaser from 'phaser';
import { BRAND } from '../../config/brand';
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
    .rectangle(width / 2, height / 2, width, height, 0x0a1220, 0.84)
    .setDepth(300)
    .setInteractive();

  const panelW = Math.min(460, width - 28);
  const panelH = Math.min(420, height - 28);
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
    .text(cx, top + 26, BRAND.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '13px',
      color: '#f0c75e',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const title = scene.add
    .text(cx, top + 52, 'Cosmetics', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(cx, top + 80, 'Skins only · never pay-to-win', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9eb4c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const swatch = scene.add
    .circle(cx, top + 128, 24, 0xf0c75e, 1)
    .setStrokeStyle(2, 0xfff8e8, 0.9)
    .setDepth(302);

  const body = scene.add
    .text(cx, top + 168, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#d7e6f2',
      align: 'center',
      wordWrap: { width: panelW - 48 },
      lineSpacing: 5,
    })
    .setOrigin(0.5, 0)
    .setDepth(302);

  const loadoutNote = scene.add
    .text(cx, bottom - 22, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#6a7f94',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const nodes: Phaser.GameObjects.GameObject[] = [
    overlay,
    panel,
    accent,
    brand,
    title,
    subtitle,
    body,
    swatch,
    loadoutNote,
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
        SPECIES[species].name,
        '',
        skin.name,
        skin.blurb,
        '',
        equipped ? 'Equipped on this species' : 'Tap Equip to wear (local)',
        skin.id === 'skin_default' ? 'Always available' : 'Free unlock · not for sale',
      ].join('\n'),
    );

    loadoutNote.setText(formatMiniLoadout());

    const rowY = bottom - 92;
    mkBtn(cx - 130, rowY, '◀', '#3a4555', () => {
      page = (page - 1 + skins.length) % skins.length;
      refresh();
    });
    mkBtn(
      cx,
      rowY,
      equipped ? 'Equipped' : 'Equip',
      equipped ? '#2a4a38' : '#3a5530',
      () => {
        if (equipped) return;
        equipSkin(species, skin.id);
        playSfx('ui');
        refresh();
      },
    );
    mkBtn(cx + 130, rowY, '▶', '#3a4555', () => {
      page = (page + 1) % skins.length;
      refresh();
    });

    const tabY = bottom - 48;
    SPECIES_ORDER.forEach((id, i) => {
      const x = cx + (i - 1) * 110;
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
    clearDynamic();
    for (const n of nodes) {
      if (n.active) n.destroy();
    }
  };

  refresh();
}

function formatMiniLoadout(): string {
  const l = loadCosmeticsLoadout();
  return `Loadout · B ${short(l.equipped.brutes)} · N ${short(l.equipped.nobles)} · W ${short(l.equipped.weirdos)}`;
}

function short(id: string): string {
  return id.replace(/^skin_/, '').slice(0, 10);
}
