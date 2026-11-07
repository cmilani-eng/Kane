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
import { stockDepositTipLine } from './stockDepositTip';
import {
  formatSupplyLine,
  supplyTone,
  type SupplyTone,
} from './supplyTone';

const ROOT_ID = 'kane-stock';

const cleanups = new WeakMap<HTMLElement, () => void>();

/** Tailwind text classes for the DOM stock strip (match Phaser SUPPLY_TONE_COLOR). */
export const STOCK_SUPPLY_CLASS: Record<SupplyTone, string> = {
  ok: 'text-kane-ink',
  near: 'text-kane-gold',
  full: 'text-kane-pink',
};

export function stockSupplyClass(
  current: number,
  cap: number,
): string {
  return STOCK_SUPPLY_CLASS[supplyTone(current, cap)];
}

function flash(slot: Element | null): void {
  if (!(slot instanceof HTMLElement)) return;
  slot.classList.remove('kane-slot-flash');
  void slot.offsetWidth;
  slot.classList.add('kane-slot-flash');
}

function incomeRateText(n: number): string {
  return n > 0 ? t('hud.incomeRate', { n }) : '';
}

function paint(root: HTMLElement, stock: MatchStock): void {
  const gold = root.querySelector('[data-slot="gold"] [data-value]');
  const crystals = root.querySelector('[data-slot="crystals"] [data-value]');
  const supply = root.querySelector('[data-slot="supply"] [data-value]');
  const goldRate = root.querySelector('[data-slot="gold"] [data-rate]');
  const crystalRate = root.querySelector('[data-slot="crystals"] [data-rate]');
  if (gold) gold.textContent = t('hud.gold', { n: stock.gold });
  if (crystals) crystals.textContent = t('hud.crystals', { n: stock.crystals });
  if (goldRate) goldRate.textContent = incomeRateText(stock.goldPerMin);
  if (crystalRate) {
    crystalRate.textContent = incomeRateText(stock.crystalsPerMin);
  }
  if (supply) {
    supply.textContent = formatSupplyLine(stock.supply, stock.supplyCap);
  }
  const depositTip = root.querySelector('[data-deposit-tip]');
  if (depositTip) depositTip.textContent = stockDepositTipLine();
  const supplySlot = root.querySelector('[data-slot="supply"]');
  if (supplySlot instanceof HTMLElement) {
    for (const cls of Object.values(STOCK_SUPPLY_CLASS)) {
      supplySlot.classList.remove(cls);
    }
    supplySlot.classList.add(stockSupplyClass(stock.supply, stock.supplyCap));
  }
}

export function mountStockStrip(): void {
  unmountStockStrip();
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.setAttribute('aria-live', 'polite');
  root.className = [
    'pointer-events-none fixed z-30 flex items-center gap-3',
    'rounded-sm border border-kane-slate bg-kane-night/90',
    'px-3 font-sans text-sm font-semibold text-kane-cream',
  ].join(' ');
  root.innerHTML = `
    <div data-slot="gold" class="flex items-center gap-1.5">
      <span class="size-3 shrink-0 rounded-full bg-kane-gold" aria-hidden="true"></span>
      <span data-value></span>
      <span data-rate class="text-xs font-medium text-kane-quiet"></span>
    </div>
    <div data-slot="crystals" class="flex items-center gap-1.5">
      <span class="size-3 shrink-0 rounded-full bg-kane-ice" aria-hidden="true"></span>
      <span data-value></span>
      <span data-rate class="text-xs font-medium text-kane-quiet"></span>
    </div>
    <div data-slot="supply" class="flex items-center gap-1.5 text-kane-ink">
      <span class="size-3 shrink-0 rounded-full bg-kane-fog" aria-hidden="true"></span>
      <span data-value></span>
    </div>
    <span data-deposit-tip class="text-xs font-medium text-kane-quiet"></span>
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
  const stacked = narrow && height >= 500;
  const pad = narrow ? 8 : 12;
  const resY = pad + (narrow ? 50 : 60);
  root.style.left = `${pad}px`;
  root.style.top = `${resY}px`;
  root.style.height = stacked ? '76px' : '36px';
  root.classList.toggle('flex-col', stacked);
  root.classList.toggle('items-start', stacked);
  root.classList.toggle('justify-center', !stacked);
  root.classList.toggle('gap-1', stacked);
}

export function unmountStockStrip(): void {
  const root = document.getElementById(ROOT_ID);
  if (!root) return;
  cleanups.get(root)?.();
  cleanups.delete(root);
  root.remove();
}
