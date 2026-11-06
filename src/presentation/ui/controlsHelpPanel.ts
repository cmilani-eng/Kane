/**
 * In-match controls / hotkey cheat sheet.
 * Opens from HUD Help chip or ? / / keys. Mobile-scroll friendly DOM overlay.
 */
import type { SpeciesId } from '../../data/speciesStub';
import { t } from '../../i18n';
import { playSfx } from '../audio/sfx';

const ROOT_ID = 'kane-controls-help';

export type ControlsHelpHandle = {
  isOpen: () => boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  destroy: () => void;
};

const ROW =
  'flex justify-between gap-3 border-b border-kane-slate/55 py-[7px] text-[13px] leading-[1.35] last:border-b-0';
const SECTION = 'mt-3 mb-1 text-[11px] font-bold tracking-[0.06em] text-kane-gold uppercase';
const ROOT_CLASS = [
  'fixed inset-0 z-60 box-border flex items-center justify-center bg-kane-scrim px-3 font-sans',
  'pt-[max(12px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]',
].join(' ');
const CARD_CLASS = [
  'relative box-border flex max-h-[min(560px,92vh)] w-[min(440px,100%)] flex-col overflow-hidden',
  'rounded border-2 border-kane-gold/85 bg-kane-card text-kane-ink',
  "before:pointer-events-none before:absolute before:inset-x-0.5 before:top-0.5 before:h-1 before:bg-kane-gold/90 before:content-['']",
].join(' ');

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function row(action: string, keys: string): string {
  return `<div class="${ROW}"><span class="flex-auto text-kane-ink">${esc(action)}</span><span class="max-w-[48%] flex-none text-right font-semibold text-kane-cream tabular-nums">${esc(keys)}</span></div>`;
}

function section(label: string): string {
  return `<div class="${SECTION}">${esc(label)}</div>`;
}

/** Species-only stance keys (Formation / Mutation / Rage). */
export function speciesHelpRows(speciesId: SpeciesId | null | undefined): string {
  if (speciesId === 'nobles') return row(t('help.formation'), 'F');
  if (speciesId === 'weirdos') return row(t('help.mutation'), 'M');
  if (speciesId === 'brutes') return row(t('help.rage'), 'R');
  return '';
}

/** Cheat-sheet copy for the open locale. Key caps stay literal. */
export function controlsHelpCopy(
  speciesId: SpeciesId | null | undefined = null,
): {
  title: string;
  sub: string;
  gotIt: string;
  closeHint: string;
  close: string;
  body: string;
} {
  const speciesRow = speciesHelpRows(speciesId);
  const body = `
    ${section(t('help.touch'))}
    ${row(t('help.select'), t('help.selectKeys'))}
    ${row(t('help.move'), t('help.moveKeys'))}
    ${row(t('help.attackMove'), t('help.attackMoveTouch'))}
    ${row(t('help.stop'), t('help.stopTouch'))}
    ${row(t('help.train'), t('help.trainTouch'))}
    ${row(t('help.camera'), t('help.cameraKeys'))}
    ${row(t('help.ping'), t('help.pingKeys'))}
    ${section(t('help.keyboard'))}
    ${row(t('help.attackMove'), 'A')}
    ${row(t('help.stop'), 'S')}
    ${row(t('help.army'), 'Ctrl+A')}
    ${row(t('help.groups'), t('help.groupsKeys'))}
    ${row(t('help.cycle'), t('help.cycleKeys'))}
    ${row(t('help.slots'), t('help.slotsKeys'))}
    ${row(t('help.place'), t('help.placeKeys'))}
    ${row(t('help.base'), 'Home')}
    ${row(t('help.pause'), t('help.pauseKeys'))}
    ${row(t('help.sheet'), t('help.sheetKeys'))}
    ${section(t('help.hero'))}
    ${row(t('help.recruit'), t('help.recruitKeys'))}
    ${row(t('help.abilities'), 'Q / W / E')}
    ${speciesRow}
  `;
  return {
    title: t('help.title'),
    sub: t('help.sub'),
    gotIt: t('tutorial.gotIt'),
    closeHint: t('help.closeHint'),
    close: t('help.close'),
    body,
  };
}

export function createControlsHelpPanel(opts: {
  onOpen?: () => void;
  onClose?: () => void;
  /** Current player species — filters Formation / Mutation / Rage rows. */
  getSpeciesId?: () => SpeciesId | null | undefined;
}): ControlsHelpHandle {
  let open = false;

  const destroyRoot = (): void => {
    document.getElementById(ROOT_ID)?.remove();
  };

  const hide = (): void => {
    if (!open) return;
    open = false;
    destroyRoot();
    opts.onClose?.();
  };

  const show = (): void => {
    if (open) return;
    open = true;
    destroyRoot();
    playSfx('ui');
    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = ROOT_CLASS;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'kane-help-title');
    const copy = controlsHelpCopy(opts.getSpeciesId?.() ?? null);
    root.innerHTML = `
      <div class="${CARD_CLASS}">
        <button type="button" class="kane-help-x absolute top-2.5 right-2.5 min-h-9 min-w-10 cursor-pointer touch-manipulation rounded-xs bg-kane-iron text-base text-kane-fog" aria-label="${esc(copy.close)}">✕</button>
        <div class="flex-none px-[18px] pt-[18px] pb-2.5 text-center">
          <div class="font-kane-serif text-[13px] font-bold tracking-[0.04em] text-kane-gold">KANE</div>
          <div class="mt-1 font-kane-serif text-2xl text-kane-cream" id="kane-help-title">${esc(copy.title)}</div>
          <p class="mt-1.5 text-[13px] text-kane-muted">${esc(copy.sub)}</p>
        </div>
        <div class="flex-auto overflow-y-auto overscroll-contain px-[18px] pt-1 pb-2 [-webkit-overflow-scrolling:touch]">${copy.body}</div>
        <div class="flex flex-none flex-col items-center gap-2 px-[18px] pt-2.5 pb-3.5">
          <button type="button" class="kane-help-close min-h-12 min-w-[120px] cursor-pointer touch-manipulation rounded-xs bg-kane-steel px-[18px] py-2.5 text-sm font-semibold text-kane-parchment">${esc(copy.gotIt)}</button>
          <div class="text-center text-[11px] text-kane-quiet">${esc(copy.closeHint)}</div>
        </div>
      </div>
    `;
    document.body.appendChild(root);

    const close = (): void => {
      playSfx('ui');
      hide();
    };
    root.querySelector('.kane-help-close')?.addEventListener('click', close);
    root.querySelector('.kane-help-x')?.addEventListener('click', close);
    root.addEventListener('click', (ev) => {
      if (ev.target === root) close();
    });
    root.addEventListener('pointerdown', (ev) => ev.stopPropagation());

    opts.onOpen?.();
  };

  return {
    isOpen: () => open,
    show,
    hide,
    toggle: () => {
      if (open) hide();
      else show();
    },
    destroy: () => {
      hide();
    },
  };
}
