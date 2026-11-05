/** DOM command bar — reliable touch targets over the Phaser canvas. */

export type DomHudHandlers = {
  buildBarracks: () => void;
  trainMelee: () => void;
  trainRanged: () => void;
  trainScout: () => void;
  menu: () => void;
};

const BAR_ID = 'kane-dom-hud';

export function ensureDomHud(): HTMLElement {
  let bar = document.getElementById(BAR_ID);
  if (bar) return bar;

  bar = document.createElement('div');
  bar.id = BAR_ID;
  bar.innerHTML = `
    <div class="kane-hud-row">
      <button type="button" data-act="buildBarracks">Build Barracks</button>
      <button type="button" data-act="trainMelee">Train Blade</button>
      <button type="button" data-act="trainRanged">Train Archer</button>
    </div>
    <div class="kane-hud-row">
      <button type="button" data-act="trainScout">Train Scout</button>
      <button type="button" data-act="menu" class="kane-hud-menu">Menu</button>
    </div>
  `;
  document.body.appendChild(bar);

  if (!document.getElementById('kane-dom-hud-style')) {
    const style = document.createElement('style');
    style.id = 'kane-dom-hud-style';
    style.textContent = `
      #kane-dom-hud {
        display: none;
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 20;
        padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px));
        background: linear-gradient(to top, rgba(15,26,46,0.92), rgba(15,26,46,0.55) 70%, transparent);
        pointer-events: none;
        font-family: system-ui, sans-serif;
      }
      #kane-dom-hud.is-visible {
        display: block;
      }
      #kane-dom-hud .kane-hud-row {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 6px;
        pointer-events: none;
      }
      #kane-dom-hud button {
        pointer-events: auto;
        flex: 1 1 0;
        max-width: 120px;
        min-height: 48px;
        margin: 0;
        padding: 8px 6px;
        border: 2px solid #f0c75e;
        border-radius: 4px;
        background: #3d7ea6;
        color: #fff8e8;
        font-size: 12px;
        font-weight: 600;
        line-height: 1.2;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
      }
      #kane-dom-hud button:active {
        background: #5aa3c8;
      }
      #kane-dom-hud button.kane-hud-menu {
        background: #3a4555;
        max-width: 100px;
      }
    `;
    document.head.appendChild(style);
  }

  return bar;
}

export function showDomHud(handlers: DomHudHandlers): void {
  const bar = ensureDomHud();
  bar.classList.add('is-visible');
  bar.onclick = (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest('button[data-act]');
    if (!(btn instanceof HTMLElement)) return;
    ev.preventDefault();
    ev.stopPropagation();
    const act = btn.dataset.act as keyof DomHudHandlers | undefined;
    if (act && handlers[act]) handlers[act]();
  };
}

export function hideDomHud(): void {
  const bar = document.getElementById(BAR_ID);
  if (!bar) return;
  bar.classList.remove('is-visible');
  bar.onclick = null;
}
