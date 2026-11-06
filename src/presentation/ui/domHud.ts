/** DOM command bar — reliable touch targets over the Phaser canvas. */
import { subscribeLocale, t, type MessageKey } from '../../i18n';

export type DomHudHandlers = {
  buildBarracks: () => void;
  trainMelee: () => void;
  trainRanged: () => void;
  trainScout: () => void;
  menu: () => void;
};

const BAR_ID = 'kane-dom-hud';

const HUD_LABELS: Record<keyof DomHudHandlers, MessageKey> = {
  buildBarracks: 'hud.buildBarracks',
  trainMelee: 'hud.trainBlade',
  trainRanged: 'hud.trainArcher',
  trainScout: 'hud.trainScout',
  menu: 'hud.menu',
};

let localeWatch: (() => void) | null = null;

function applyDomHudLabels(bar: HTMLElement): void {
  for (const act of Object.keys(HUD_LABELS) as (keyof DomHudHandlers)[]) {
    const btn = bar.querySelector(`button[data-act="${act}"]`);
    if (btn) btn.textContent = t(HUD_LABELS[act]);
  }
}

function watchDomHudLocale(bar: HTMLElement): void {
  applyDomHudLabels(bar);
  if (localeWatch) return;
  localeWatch = subscribeLocale(() => {
    const live = document.getElementById(BAR_ID);
    if (live) applyDomHudLabels(live);
  });
}

export function ensureDomHud(): HTMLElement {
  let bar = document.getElementById(BAR_ID);
  if (bar) return bar;

  bar = document.createElement('div');
  bar.id = BAR_ID;
  bar.className = [
    'pointer-events-none fixed inset-x-0 bottom-0 z-20 hidden [&.is-visible]:block',
    'px-2 pt-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] font-sans',
    'bg-linear-to-t from-kane-night/92 via-kane-night/55 via-70% to-transparent',
  ].join(' ');
  const row = 'pointer-events-none mt-1.5 flex justify-center gap-1.5';
  const button = [
    'pointer-events-auto m-0 min-h-12 flex-1 basis-0 cursor-pointer touch-manipulation',
    'rounded border-2 border-kane-gold px-1.5 py-2 text-xs leading-[1.2] font-semibold',
    'text-kane-parchment [-webkit-tap-highlight-color:transparent]',
  ].join(' ');
  const action = `${button} max-w-[120px] bg-kane-sky active:bg-kane-sky-light`;
  const menu = `${button} max-w-[100px] bg-kane-slate`;
  bar.innerHTML = `
    <div class="${row}">
      <button type="button" class="${action}" data-act="buildBarracks">Build Barracks</button>
      <button type="button" class="${action}" data-act="trainMelee">Train Blade</button>
      <button type="button" class="${action}" data-act="trainRanged">Train Archer</button>
    </div>
    <div class="${row}">
      <button type="button" class="${action}" data-act="trainScout">Train Scout</button>
      <button type="button" class="${menu}" data-act="menu">Menu</button>
    </div>
  `;
  document.body.appendChild(bar);

  watchDomHudLocale(bar);
  return bar;
}

export function showDomHud(handlers: DomHudHandlers): void {
  const bar = ensureDomHud();
  bar.classList.add('is-visible');
  bar.onclick = (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest('button[data-act]');
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
