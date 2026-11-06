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
import type { SpeciesId } from '../../data/speciesStub';
import {
  equipSkin,
  getEquippedSkinId,
  loadCosmeticsLoadout,
} from '../../database/cosmeticsLoadout';
import { speciesName, t, type MessageKey } from '../../i18n';
import { playSfx } from '../audio/sfx';

const SPECIES_ORDER: SpeciesId[] = ['brutes', 'nobles', 'weirdos'];

const SKIN_COPY: Record<string, { name: MessageKey; blurb: MessageKey }> = {
  skin_default: { name: 'cos.default.name', blurb: 'cos.default.blurb' },
  skin_brutes_scrap: { name: 'cos.scrap.name', blurb: 'cos.scrap.blurb' },
  skin_brutes_ember: { name: 'cos.ember.name', blurb: 'cos.ember.blurb' },
  skin_nobles_gilded: { name: 'cos.gilded.name', blurb: 'cos.gilded.blurb' },
  skin_nobles_midnight: { name: 'cos.midnight.name', blurb: 'cos.midnight.blurb' },
  skin_weirdos_prism: { name: 'cos.prism.name', blurb: 'cos.prism.blurb' },
  skin_weirdos_void: { name: 'cos.void.name', blurb: 'cos.void.blurb' },
};

export function cosmeticsSkinCopy(id: string): { name: string; blurb: string } {
  const keys = SKIN_COPY[id];
  if (!keys) return { name: id, blurb: '' };
  return { name: t(keys.name), blurb: t(keys.blurb) };
}

function speciesTab(id: SpeciesId): string {
  return speciesName(id).replace(/^(The |Os |Los )/, '');
}

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

  const short = height < 500;
  const panelW = short ? Math.min(760, width - 24) : Math.min(460, width - 28);
  const panelH = short ? height - 16 : Math.min(420, height - 28);
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
    .text(cx, top + 52, t('menu.cosmetics'), {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#f5e6c8',
    })
    .setOrigin(0.5)
    .setDepth(302);

  const subtitle = scene.add
    .text(cx, top + 80, t('auth.skins'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#9eb4c8',
      align: 'center',
      wordWrap: { width: panelW - 40 },
    })
    .setOrigin(0.5)
    .setDepth(302);

  const swatch = scene.add
    .circle(cx, short ? top + 104 : top + 128, short ? 16 : 24, 0xf0c75e, 1)
    .setStrokeStyle(2, 0xfff8e8, 0.9)
    .setDepth(302);

  const body = scene.add
    .text(cx, short ? top + 132 : top + 168, '', {
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
    .text(cx, short ? bottom - 96 : bottom - 22, '', {
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

    const copy = cosmeticsSkinCopy(skin.id);
    body.setText(
      [
        speciesName(species),
        '',
        copy.name,
        copy.blurb,
        '',
        equipped ? t('cos.equippedOn') : t('cos.tapEquip'),
        skin.id === 'skin_default' ? t('cos.always') : t('cos.free'),
      ].join('\n'),
    );

    loadoutNote.setText(formatMiniLoadout());

    const rowY = short ? bottom - 64 : bottom - 92;
    mkBtn(cx - 130, rowY, '◀', '#3a4555', () => {
      page = (page - 1 + skins.length) % skins.length;
      refresh();
    });
    mkBtn(
      cx,
      rowY,
      equipped ? t('cos.equipped') : t('cos.equip'),
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

    const tabY = short ? bottom - 28 : bottom - 48;
    const tabs = SPECIES_ORDER.map((id) =>
      mkBtn(
        0,
        tabY,
        speciesTab(id),
        species === id ? '#3d5a40' : '#2a3344',
        () => {
          species = id;
          page = 0;
          playSfx('ui');
          refresh();
        },
      ),
    );
    const tabGap = 10;
    const tabTotal =
      tabs.reduce((sum, b) => sum + b.width, 0) + tabGap * (tabs.length - 1);
    let tabX = cx - tabTotal / 2;
    for (const b of tabs) {
      b.setPosition(tabX + b.width / 2, tabY);
      tabX += b.width + tabGap;
    }
  };

  const mkBtn = (
    x: number,
    y: number,
    label: string,
    bg: string,
    fn: () => void,
  ): Phaser.GameObjects.Text => {
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
    return btn;
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
  return t('cos.loadout', {
    brutes: short(l.equipped.brutes),
    nobles: short(l.equipped.nobles),
    weirdos: short(l.equipped.weirdos),
  });
}

function short(id: string): string {
  return id.replace(/^skin_/, '').slice(0, 10);
}
