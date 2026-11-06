/**
 * In-match controls / hotkey cheat sheet.
 * Opens from HUD Help chip or ? / / keys. Mobile-scroll friendly DOM overlay.
 */
import { t } from '../../i18n';
import { playSfx } from '../audio/sfx';

const ROOT_ID = 'kane-controls-help';
const STYLE_ID = 'kane-controls-help-style';

export type ControlsHelpHandle = {
  isOpen: () => boolean;
  show: () => void;
  hide: () => void;
  toggle: () => void;
  destroy: () => void;
};

function ensureStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ROOT_ID} {
      position: fixed; inset: 0; z-index: 60;
      display: flex; align-items: center; justify-content: center;
      background: rgba(10, 18, 32, 0.84);
      font-family: system-ui, -apple-system, sans-serif;
      padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
      box-sizing: border-box;
    }
    #${ROOT_ID} .kane-help-card {
      width: min(440px, 100%);
      max-height: min(560px, 92vh);
      display: flex; flex-direction: column;
      background: #122033;
      border: 2px solid rgba(240, 199, 94, 0.85);
      border-radius: 4px;
      color: #d7e6f2;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }
    #${ROOT_ID} .kane-help-card::before {
      content: '';
      position: absolute; left: 2px; right: 2px; top: 2px;
      height: 4px; background: rgba(240, 199, 94, 0.9);
      pointer-events: none;
    }
    #${ROOT_ID} .kane-help-head {
      padding: 18px 18px 10px;
      text-align: center;
      flex: 0 0 auto;
    }
    #${ROOT_ID} .kane-help-brand {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 13px; font-weight: bold; color: #f0c75e;
      letter-spacing: 0.04em;
    }
    #${ROOT_ID} .kane-help-title {
      margin: 4px 0 0;
      font-family: Georgia, "Times New Roman", serif;
      font-size: 24px; font-weight: normal; color: #f5e6c8;
    }
    #${ROOT_ID} .kane-help-sub {
      margin: 6px 0 0; font-size: 13px; color: #9eb4c8;
    }
    #${ROOT_ID} .kane-help-body {
      flex: 1 1 auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding: 4px 18px 8px;
      overscroll-behavior: contain;
    }
    #${ROOT_ID} .kane-help-section {
      margin: 12px 0 4px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #f0c75e;
    }
    #${ROOT_ID} .kane-help-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 0;
      border-bottom: 1px solid rgba(58, 69, 85, 0.55);
      font-size: 13px;
      line-height: 1.35;
    }
    #${ROOT_ID} .kane-help-row:last-child { border-bottom: none; }
    #${ROOT_ID} .kane-help-action { color: #d7e6f2; flex: 1 1 auto; }
    #${ROOT_ID} .kane-help-keys {
      flex: 0 0 auto;
      color: #f5e6c8;
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      text-align: right;
      max-width: 48%;
    }
    #${ROOT_ID} .kane-help-foot {
      flex: 0 0 auto;
      padding: 10px 18px 14px;
      display: flex; flex-direction: column; gap: 8px; align-items: center;
    }
    #${ROOT_ID} .kane-help-quiet {
      font-size: 11px; color: #6a7f94; text-align: center;
    }
    #${ROOT_ID} button.kane-help-close {
      min-height: 48px; min-width: 120px;
      padding: 10px 18px;
      border: none; border-radius: 2px;
      background: #2a3a50; color: #fff8e8;
      font-size: 14px; font-weight: 600;
      cursor: pointer;
      touch-action: manipulation;
    }
    #${ROOT_ID} .kane-help-x {
      position: absolute; top: 10px; right: 10px;
      min-width: 40px; min-height: 36px;
      border: none; border-radius: 2px;
      background: #2a3545; color: #b8c9d9;
      font-size: 16px; cursor: pointer;
      touch-action: manipulation;
    }
  `;
  document.head.appendChild(style);
}

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function row(action: string, keys: string): string {
  return `<div class="kane-help-row"><span class="kane-help-action">${esc(action)}</span><span class="kane-help-keys">${esc(keys)}</span></div>`;
}

function section(label: string): string {
  return `<div class="kane-help-section">${esc(label)}</div>`;
}

/** Cheat-sheet copy for the open locale. Key caps stay literal. */
export function controlsHelpCopy(): {
  title: string;
  sub: string;
  gotIt: string;
  closeHint: string;
  close: string;
  body: string;
} {
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
    ${row(t('help.slots'), t('help.slotsKeys'))}
    ${row(t('help.place'), t('help.placeKeys'))}
    ${row(t('help.base'), 'Home')}
    ${row(t('help.pause'), t('help.pauseKeys'))}
    ${row(t('help.sheet'), t('help.sheetKeys'))}
    ${section(t('help.hero'))}
    ${row(t('help.recruit'), t('help.recruitKeys'))}
    ${row(t('help.abilities'), 'Q / W / E')}
    ${row(t('help.speciesActs'), 'F · M · R')}
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
}): ControlsHelpHandle {
  ensureStyle();
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
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'kane-help-title');
    const copy = controlsHelpCopy();
    root.innerHTML = `
      <div class="kane-help-card">
        <button type="button" class="kane-help-x" aria-label="${esc(copy.close)}">✕</button>
        <div class="kane-help-head">
          <div class="kane-help-brand">KANE</div>
          <div class="kane-help-title" id="kane-help-title">${esc(copy.title)}</div>
          <p class="kane-help-sub">${esc(copy.sub)}</p>
        </div>
        <div class="kane-help-body">${copy.body}</div>
        <div class="kane-help-foot">
          <button type="button" class="kane-help-close">${esc(copy.gotIt)}</button>
          <div class="kane-help-quiet">${esc(copy.closeHint)}</div>
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
