/**
 * Cosmetics as a picker-style card in DOM and Tailwind: pick a species, browse its skins,
 * and equip one. It reads and writes the same local loadout as the Phaser panel.
 */
import { listAllSkins, type CosmeticSkinDef } from '../../data/cosmeticsCatalog';
import type { SpeciesId } from '../../data/speciesStub';
import { equipSkin, getEquippedSkinId } from '../../database/cosmeticsLoadout';
import { speciesName, t } from '../../i18n';
import { playSfx } from '../audio/sfx';
import { cosmeticsSkinCopy } from './cosmeticsPanel';
import {
  PICKER_BODY_CLASSES,
  PICKER_CARD_CLASSES,
  PICKER_TAG_CLASSES,
  PICKER_TITLE_CLASSES,
} from './pickerCard';

const OVERLAY_CLASSES =
  'fixed inset-0 z-[80] flex items-center justify-center bg-[rgb(10_18_32/0.84)] p-4';
const SPECIES_ORDER: SpeciesId[] = ['brutes', 'nobles', 'weirdos'];
const BUTTON =
  'inline-flex min-h-12 items-center justify-center rounded-[14px] px-5 py-[11px] text-[14px] font-black uppercase shadow-[0_5px_0_rgba(0,0,0,0.45)] hover:brightness-110 active:translate-y-0.5 cursor-pointer disabled:cursor-default disabled:opacity-60';
const PRIMARY = `${BUTTON} bg-[#9dff6a] text-[#06121f] shadow-[0_5px_0_#4a9a2c]`;
const SECONDARY = `${BUTTON} bg-[#2a3a50] text-[#f5f8ff]`;
const TAB_ON = `${BUTTON} bg-[#3d5a40] text-[#f5f8ff]`;
const TAB_OFF = `${BUTTON} bg-[#2a3344] text-[#c9d6e6]`;
const MUTED = 'mt-2 text-[13px] leading-normal text-[#8fa7c2]';

/** Opens the Cosmetics card. `onClose` runs once, however the card closes. */
export function showCosmeticsCard(onClose: () => void): void {
  let species: SpeciesId = 'nobles';
  let page = 0;

  const overlay = document.createElement('div');
  overlay.className = OVERLAY_CLASSES;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', t('menu.cosmetics'));

  const card = document.createElement('div');
  card.className = `${PICKER_CARD_CLASSES} relative max-h-[calc(100dvh-32px)] overflow-y-auto`;

  const close = document.createElement('button');
  close.type = 'button';
  close.className =
    'absolute top-4 right-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-[18px] text-[#f5f8ff] hover:bg-white/20';
  close.setAttribute('aria-label', t('lobby.close'));
  close.textContent = '×';

  const tag = document.createElement('span');
  tag.className = `${PICKER_TAG_CLASSES} block w-fit mx-auto`;
  tag.textContent = t('menu.cosmetics');

  const heading = document.createElement('h2');
  heading.className = `${PICKER_TITLE_CLASSES} text-center`;
  heading.textContent = t('menu.cosmetics');

  const note = document.createElement('p');
  note.className = `${MUTED} text-center`;
  note.textContent = t('auth.skins');

  const tabs = document.createElement('div');
  tabs.className = 'mt-5 flex flex-wrap justify-center gap-2';

  const swatch = document.createElement('div');
  swatch.className = 'mx-auto mt-6 size-24 rounded-full border-2 border-white/80';

  const name = document.createElement('p');
  name.className = 'mt-4 text-[18px] font-bold text-[#f5f8ff]';

  const blurb = document.createElement('p');
  blurb.className = PICKER_BODY_CLASSES;

  const status = document.createElement('p');
  status.className = MUTED;

  const row = document.createElement('div');
  row.className = 'mt-6 flex flex-wrap items-center justify-center gap-3';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = SECONDARY;
  prev.textContent = '◀';

  const equip = document.createElement('button');
  equip.type = 'button';
  equip.className = PRIMARY;

  const next = document.createElement('button');
  next.type = 'button';
  next.className = SECONDARY;
  next.textContent = '▶';

  row.append(prev, equip, next);
  card.append(close, tag, heading, note, tabs, swatch, name, blurb, status, row);
  overlay.append(card);

  const skinsFor = (): CosmeticSkinDef[] =>
    listAllSkins().filter((s) => s.speciesId === species || s.id === 'skin_default');

  const refresh = (): void => {
    const skins = skinsFor();
    if (page >= skins.length) page = 0;
    const skin = skins[page]!;
    const equipped = getEquippedSkinId(species) === skin.id;

    tabs.replaceChildren(
      ...SPECIES_ORDER.map((id) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = species === id ? TAB_ON : TAB_OFF;
        tab.textContent = speciesName(id);
        tab.addEventListener('click', () => {
          playSfx('ui');
          species = id;
          page = 0;
          refresh();
        });
        return tab;
      }),
    );

    swatch.style.background = `#${skin.accent.toString(16).padStart(6, '0')}`;
    const copy = cosmeticsSkinCopy(skin.id);
    name.textContent = `${speciesName(species)} · ${copy.name}`;
    blurb.textContent = copy.blurb;
    status.textContent = [
      equipped ? t('cos.equippedOn') : t('cos.tapEquip'),
      skin.id === 'skin_default' ? t('cos.always') : t('cos.free'),
    ].join(' · ');
    equip.textContent = equipped ? t('cos.equipped') : t('cos.equip');
    equip.disabled = equipped;
  };

  prev.addEventListener('click', () => {
    playSfx('ui');
    const count = skinsFor().length;
    page = (page - 1 + count) % count;
    refresh();
  });
  next.addEventListener('click', () => {
    playSfx('ui');
    const count = skinsFor().length;
    page = (page + 1) % count;
    refresh();
  });
  equip.addEventListener('click', () => {
    const skin = skinsFor()[page]!;
    if (getEquippedSkinId(species) === skin.id) return;
    equipSkin(species, skin.id);
    playSfx('ui');
    refresh();
  });

  let finished = false;
  const destroy = (): void => {
    if (finished) return;
    finished = true;
    window.removeEventListener('keydown', onKey);
    overlay.remove();
    onClose();
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') destroy();
  };

  close.addEventListener('click', destroy);
  window.addEventListener('keydown', onKey);
  refresh();
  document.body.append(overlay);
  equip.focus();
}
