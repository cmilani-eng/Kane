/**
 * In-match controls / hotkey cheat sheet.
 * Opens from HUD Help chip or ? / / keys. Mobile-scroll friendly DOM overlay.
 */
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
      min-height: 44px; min-width: 120px;
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

function row(action: string, keys: string): string {
  return `<div class="kane-help-row"><span class="kane-help-action">${action}</span><span class="kane-help-keys">${keys}</span></div>`;
}

function bodyHtml(): string {
  return `
    <div class="kane-help-section">Touch</div>
    ${row('Select / box-select', 'Tap · drag')}
    ${row('Move / gather', 'Tap ground or node')}
    ${row('Attack-move', 'Atk chip · then tap')}
    ${row('Stop', 'Stop chip')}
    ${row('Train / produce', 'Bottom panel buttons')}
    ${row('Camera', 'Two-finger pan · Base chip')}
    ${row('Attention mark', 'Hold minimap')}
    <div class="kane-help-section">Keyboard</div>
    ${row('Attack-move', 'A')}
    ${row('Stop', 'S')}
    ${row('Select army', 'Ctrl+A')}
    ${row('Control groups', 'Ctrl/Alt+# save · # recall')}
    ${row('Train slot 1–3', '1 / 2 / 3 (building)')}
    ${row('Place building', 'B · Esc cancel')}
    ${row('Recenter base', 'Home')}
    ${row('Pause', 'Esc · Pause')}
    ${row('This help', 'H · ? · Help chip')}
    <div class="kane-help-section">Hero &amp; species</div>
    ${row('Recruit hero', 'Ability pad (tap)')}
    ${row('Abilities', 'Q / W / E')}
    ${row('Formations / Mutation / Rage', 'F · M · R')}
  `;
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
    root.innerHTML = `
      <div class="kane-help-card">
        <button type="button" class="kane-help-x" aria-label="Close">✕</button>
        <div class="kane-help-head">
          <div class="kane-help-brand">KANE</div>
          <div class="kane-help-title" id="kane-help-title">Controls</div>
          <p class="kane-help-sub">Touch + keyboard cheat sheet</p>
        </div>
        <div class="kane-help-body">${bodyHtml()}</div>
        <div class="kane-help-foot">
          <button type="button" class="kane-help-close">Got it</button>
          <div class="kane-help-quiet">Press ? again or Esc to close</div>
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
