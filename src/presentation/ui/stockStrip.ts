/**
 * Tailwind stock strip. Phaser publishes deposits through matchUiStore;
 * this DOM bar is the inventory the player reads.
 */
import { subscribeLocale, t } from '../../i18n';
import {
  getMatchStock,
  subscribeMatchStock,
  type MatchStock,
} from './matchUiStore';

const ROOT_ID = 'kane-stock';

const cleanups = new WeakMap<HTMLElement, () => void>();

function flash(slot: Element | null): void {
  if (!(slot instanceof HTMLElement)) return;
  slot.classList.remove('kane-slot-flash');
  void slot.offsetWidth;
  slot.classList.add('kane-slot-flash');
}

function paint(root: HTMLElement, stock: MatchStock): void {
  const gold = root.querySelector('[data-slot="gold"] [data-value]');
  const crystals = root.querySelector('[data-slot="crystals"] [data-value]');
  const supply = root.querySelector('[data-slot="supply"] [data-value]');
  if (gold) gold.textContent = t('hud.gold', { n: stock.gold });
  if (crystals) crystals.textContent = t('hud.crystals', { n: stock.crystals });
  if (supply) {
    supply.textContent = t('pause.supply', {
      current: stock.supply,
      cap: stock.supplyCap,
    });
  }
  const supplySlot = root.querySelector('[data-slot="supply"]');
  if (supplySlot) {
    const full = stock.supplyCap > 0 && stock.supply >= stock.supplyCap;
    const high =
      !full &&
      stock.supplyCap > 0 &&
      stock.supply >= Math.floor(stock.supplyCap * 0.85);
    supplySlot.classList.toggle('text-[#e87aa8]', full);
    supplySlot.classList.toggle('text-[#f0c75e]', high);
    supplySlot.classList.toggle('text-[#d7e6f2]', !full && !high);
  }
}

export function mountStockStrip(): void {
  unmountStockStrip();
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('aria-live', 'polite');
  root.className = [
    'pointer-events-none fixed z-30 flex items-center gap-3',
    'rounded-sm border border-[#3a4555] bg-[#0f1a2e]/90',
    'px-3 font-sans text-sm font-semibold text-[#f5e6c8]',
  ].join(' ');
  root.innerHTML = `
    <div data-slot="gold" class="flex items-center gap-1.5">
      <span class="size-3 shrink-0 rounded-full bg-[#f0c75e]" aria-hidden="true"></span>
      <span data-value></span>
    </div>
    <div data-slot="crystals" class="flex items-center gap-1.5">
      <span class="size-3 shrink-0 rounded-full bg-[#7ec8ff]" aria-hidden="true"></span>
      <span data-value></span>
    </div>
    <div data-slot="supply" class="flex items-center gap-1.5 text-[#d7e6f2]">
      <span class="size-3 shrink-0 rounded-full bg-[#b8c9d9]" aria-hidden="true"></span>
      <span data-value></span>
    </div>
  `;
  document.body.appendChild(root);

  let seenGold = getMatchStock().goldPickups;
  let seenCrystals = getMatchStock().crystalPickups;
  const unsubStock = subscribeMatchStock((stock) => {
    paint(root, stock);
    if (stock.goldPickups !== seenGold) {
      flash(root.querySelector('[data-slot="gold"]'));
    }
    if (stock.crystalPickups !== seenCrystals) {
      flash(root.querySelector('[data-slot="crystals"]'));
    }
    seenGold = stock.goldPickups;
    seenCrystals = stock.crystalPickups;
  });
  const unsubLocale = subscribeLocale(() => paint(root, getMatchStock()));
  cleanups.set(root, () => {
    unsubStock();
    unsubLocale();
  });
}

/** Sit in the same band the Phaser resource panel used to occupy. */
export function layoutStockStrip(width: number, height: number): void {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  const narrow = width < 720;
  const pad = narrow ? 8 : 12;
  const resY = pad + (narrow || height < 500 ? 50 : 60);
  root.style.left = `${pad}px`;
  root.style.top = `${resY}px`;
  root.style.height = narrow ? '76px' : '36px';
  root.classList.toggle('flex-col', narrow);
  root.classList.toggle('items-start', narrow);
  root.classList.toggle('justify-center', !narrow);
  root.classList.toggle('gap-1', narrow);
}

export function unmountStockStrip(): void {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  cleanups.get(root)?.();
  cleanups.delete(root);
  root.remove();
}
