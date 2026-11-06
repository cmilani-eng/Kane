/**
 * Classic RTS bottom selection / command panel — DOM overlay.
 * Mobile-web first; navy/gold/cream HUD aligned with battlefield chrome.
 * Reads gameplay state only — no new combat systems.
 */
import { getBuildingType } from '../../data/buildings';
import { SPECIES } from '../../data/speciesStub';
import { getUnitType, type UnitTypeId } from '../../data/units';
import type {
  BattlefieldBuilding,
  BattlefieldUnit,
  BattlefieldWorld,
} from '../../gameplay/battlefield/battlefieldWorld';
import { canAfford } from '../../gameplay/battlefield/battlefieldBuildings';
import { walletOf } from '../../gameplay/battlefield/battlefieldEconomy';

const PANEL_ID = 'kane-selection-panel';
const STYLE_ID = 'kane-selection-panel-style';

export type SelectionPanelHandlers = {
  stop: () => void;
  attackMove: () => void;
  train: (typeId: UnitTypeId) => void;
};

export type SelectionPanelView =
  | { kind: 'hidden' }
  | {
      kind: 'units';
      count: number;
      title: string;
      flavor: string;
      hp: number;
      maxHp: number;
      dmg: number | null;
      range: number | null;
      tags: string[];
      attackMoveArmed: boolean;
    }
  | {
      kind: 'building';
      title: string;
      flavor: string;
      hp: number;
      maxHp: number;
      trains: {
        typeId: UnitTypeId;
        name: string;
        costGold: number;
        costCrystals: number;
        affordable: boolean;
      }[];
      queue: UnitTypeId[];
      progressPct: number;
      headName: string | null;
    };

let handlers: SelectionPanelHandlers | null = null;
/** Structure signature (layout / buttons) — excludes per-frame HP / queue %. */
let lastStructureSig = '';
let lastVisible = false;

export function ensureSelectionPanel(): HTMLElement {
  let root = document.getElementById(PANEL_ID);
  if (root) return root;

  root = document.createElement('div');
  root.id = PANEL_ID;
  root.setAttribute('aria-live', 'polite');
  root.innerHTML = `
    <div class="kane-sel-inner">
      <div class="kane-sel-main">
        <div class="kane-sel-portrait" data-role="portrait" aria-hidden="true"></div>
        <div class="kane-sel-info">
          <div class="kane-sel-title" data-role="title"></div>
          <div class="kane-sel-flavor" data-role="flavor"></div>
          <div class="kane-sel-hp">
            <div class="kane-sel-hp-track"><div class="kane-sel-hp-fill" data-role="hp-fill"></div></div>
            <span class="kane-sel-hp-text" data-role="hp-text"></span>
          </div>
          <div class="kane-sel-stats" data-role="stats"></div>
        </div>
      </div>
      <div class="kane-sel-actions" data-role="actions"></div>
      <div class="kane-sel-queue" data-role="queue" hidden>
        <div class="kane-sel-queue-bar">
          <div class="kane-sel-queue-fill" data-role="queue-fill"></div>
        </div>
        <div class="kane-sel-queue-icons" data-role="queue-icons"></div>
        <div class="kane-sel-queue-label" data-role="queue-label"></div>
      </div>
    </div>
  `;
  document.body.appendChild(root);
  injectStyles();

  root.addEventListener('pointerdown', (ev) => {
    // Keep taps on the panel from hitting the Phaser canvas underneath.
    ev.stopPropagation();
  });
  root.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    const btn = t.closest('button[data-act]');
    if (!(btn instanceof HTMLElement) || !handlers) return;
    ev.preventDefault();
    ev.stopPropagation();
    const act = btn.dataset.act;
    if (act === 'stop') handlers.stop();
    else if (act === 'attackMove') handlers.attackMove();
    else if (act === 'train' && btn.dataset.typeId) {
      handlers.train(btn.dataset.typeId as UnitTypeId);
    }
  });

  return root;
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #kane-selection-panel {
      display: none;
      position: fixed;
      left: 8px;
      right: 8px;
      bottom: calc(8px + env(safe-area-inset-bottom, 0px));
      z-index: 25;
      pointer-events: none;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #kane-selection-panel.is-visible {
      display: block;
    }
    #kane-selection-panel .kane-sel-inner {
      pointer-events: auto;
      max-width: 560px;
      margin: 0 auto;
      padding: 10px 12px 12px;
      border: 1.5px solid #f0c75e;
      border-radius: 6px;
      background: linear-gradient(180deg, rgba(22,34,54,0.96), rgba(12,20,36,0.96));
      box-shadow: 0 8px 24px rgba(0,0,0,0.45);
      color: #f5e6c8;
    }
    #kane-selection-panel .kane-sel-main {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    #kane-selection-panel .kane-sel-portrait {
      flex: 0 0 48px;
      width: 48px;
      height: 48px;
      border-radius: 4px;
      border: 1.5px solid #c9a84c;
      background: #1a2838;
      position: relative;
      overflow: hidden;
    }
    #kane-selection-panel .kane-sel-portrait::after {
      content: '';
      position: absolute;
      inset: 8px;
      border-radius: 3px;
      background: var(--kane-sel-accent, #f0c75e);
      opacity: 0.85;
    }
    #kane-selection-panel .kane-sel-portrait.is-building::after {
      border-radius: 2px;
      inset: 10px 8px 8px;
      clip-path: polygon(15% 100%, 15% 40%, 50% 12%, 85% 40%, 85% 100%);
    }
    #kane-selection-panel .kane-sel-portrait.is-mixed::after {
      inset: 10px;
      border-radius: 50%;
      background: repeating-linear-gradient(
        45deg,
        #f0c75e,
        #f0c75e 4px,
        #3d7ea6 4px,
        #3d7ea6 8px
      );
    }
    #kane-selection-panel .kane-sel-info {
      flex: 1 1 auto;
      min-width: 0;
    }
    #kane-selection-panel .kane-sel-title {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 15px;
      font-weight: 700;
      color: #fff8e8;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #kane-selection-panel .kane-sel-flavor {
      margin-top: 2px;
      font-size: 11px;
      color: #9eb4c8;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #kane-selection-panel .kane-sel-hp {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    #kane-selection-panel .kane-sel-hp-track {
      flex: 1 1 auto;
      height: 10px;
      border-radius: 3px;
      background: #0a121c;
      border: 1px solid #3a4555;
      overflow: hidden;
    }
    #kane-selection-panel .kane-sel-hp-fill {
      height: 100%;
      width: 0%;
      border-radius: 2px;
      background: linear-gradient(90deg, #3d7ea6, #6ecfbf);
      transition: width 80ms linear;
    }
    #kane-selection-panel .kane-sel-hp-fill.is-low {
      background: linear-gradient(90deg, #8a3030, #e87a7a);
    }
    #kane-selection-panel .kane-sel-hp-text {
      flex: 0 0 auto;
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: #d7e6f2;
      min-width: 4.5em;
      text-align: right;
    }
    #kane-selection-panel .kane-sel-stats {
      margin-top: 4px;
      font-size: 12px;
      color: #c8d8e8;
      letter-spacing: 0.02em;
    }
    #kane-selection-panel .kane-sel-stats span {
      margin-right: 10px;
      white-space: nowrap;
    }
    #kane-selection-panel .kane-sel-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    #kane-selection-panel .kane-sel-actions:empty {
      display: none;
    }
    #kane-selection-panel button {
      pointer-events: auto;
      min-height: 44px;
      min-width: 72px;
      padding: 8px 10px;
      border: 1.5px solid #f0c75e;
      border-radius: 4px;
      background: #2a4050;
      color: #fff8e8;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.15;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
    }
    #kane-selection-panel button:active:not(:disabled) {
      background: #3a5565;
    }
    #kane-selection-panel button.is-armed {
      background: #8a3030;
      border-color: #ffb8b8;
      color: #ffe0e0;
    }
    #kane-selection-panel button.is-train {
      background: #3d7ea6;
      flex: 1 1 90px;
      max-width: 160px;
    }
    #kane-selection-panel button.is-train small {
      display: block;
      font-weight: 500;
      opacity: 0.9;
      font-size: 10px;
      margin-top: 2px;
    }
    #kane-selection-panel button:disabled {
      opacity: 0.45;
      cursor: default;
    }
    #kane-selection-panel .kane-sel-queue {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #3a4555;
    }
    #kane-selection-panel .kane-sel-queue-bar {
      height: 8px;
      border-radius: 3px;
      background: #0a121c;
      border: 1px solid #3a4555;
      overflow: hidden;
    }
    #kane-selection-panel .kane-sel-queue-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #3d7ea6, #f0c75e);
      transition: width 60ms linear;
    }
    #kane-selection-panel .kane-sel-queue-icons {
      display: flex;
      gap: 6px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    #kane-selection-panel .kane-sel-qicon {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1.5px solid #7ec8ff;
      background: #1a2838;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      color: #f5e6c8;
      position: relative;
    }
    #kane-selection-panel .kane-sel-qicon.is-active {
      border-color: #fff8e8;
      box-shadow: 0 0 0 1px rgba(240,199,94,0.5);
    }
    #kane-selection-panel .kane-sel-queue-label {
      margin-top: 4px;
      font-size: 11px;
      color: #9eb4c8;
    }
    @media (max-width: 719px) {
      #kane-selection-panel {
        left: 6px;
        right: 6px;
        bottom: calc(6px + env(safe-area-inset-bottom, 0px));
      }
      #kane-selection-panel .kane-sel-inner {
        padding: 8px 10px 10px;
      }
      #kane-selection-panel .kane-sel-title {
        font-size: 14px;
      }
      #kane-selection-panel button {
        min-height: 42px;
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);
}

export function mountSelectionPanel(next: SelectionPanelHandlers): void {
  handlers = next;
  ensureSelectionPanel();
}

export function unmountSelectionPanel(): void {
  handlers = null;
  lastStructureSig = '';
  lastVisible = false;
  const root = document.getElementById(PANEL_ID);
  if (!root) return;
  root.classList.remove('is-visible');
}

/** Approximate panel height for Phaser HUD / minimap insets. */
export function selectionPanelInsetPx(visible: boolean): number {
  if (!visible) return 0;
  const narrow =
    typeof window !== 'undefined' ? window.innerWidth < 720 : false;
  return narrow ? 148 : 136;
}

export function buildSelectionView(
  world: BattlefieldWorld,
  selectedBuilding: BattlefieldBuilding | null,
  units: BattlefieldUnit[],
  attackMoveArmed: boolean,
): SelectionPanelView {
  if (selectedBuilding && selectedBuilding.hp > 0) {
    const b = selectedBuilding;
    const bdef = getBuildingType(b.typeId);
    const species = SPECIES[bdef.speciesId];
    const wallet = walletOf(world, 'player');
    const trains = bdef.trains.map((typeId) => {
      const u = getUnitType(typeId);
      const cost = { gold: u.costGold, magic_crystals: u.costCrystals };
      return {
        typeId,
        name: u.name,
        costGold: u.costGold,
        costCrystals: u.costCrystals,
        affordable: canAfford(wallet, cost) && b.complete,
      };
    });
    const head = b.trainQueue[0] ? getUnitType(b.trainQueue[0]) : null;
    const progressPct =
      head && head.trainMs > 0
        ? Math.min(1, Math.max(0, b.trainProgressMs / head.trainMs))
        : 0;
    return {
      kind: 'building',
      title: b.name,
      flavor: `${species.name} · ${species.uniqueMechanic}`,
      hp: b.hp,
      maxHp: b.maxHp,
      trains,
      queue: [...b.trainQueue],
      progressPct,
      headName: head?.name ?? null,
    };
  }

  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) return { kind: 'hidden' };

  if (alive.length === 1) {
    const u = alive[0]!;
    const species = SPECIES[u.speciesId];
    const tags: string[] = [];
    if (u.canGather) tags.push('Worker');
    if (u.inFormation) tags.push(u.formationLocked ? 'Formation·lock' : 'Formation');
    if (u.mutated) tags.push(u.mutationLocked ? 'Mutated·lock' : 'Mutated');
    if (u.enraged) tags.push(u.rageLocked ? 'Rage·lock' : 'Rage');
    // Cargo is live-updated via flavor so button DOM is not rebuilt each tick.
    const cargo =
      u.carrying > 0 ? ` · cargo ${u.carrying} ${u.carryingResource ?? ''}` : '';
    return {
      kind: 'units',
      count: 1,
      title: u.name,
      flavor: `${species.name} · ${species.motto}${cargo}`,
      hp: u.hp,
      maxHp: u.maxHp,
      dmg: u.dmg,
      range: u.range,
      tags,
      attackMoveArmed,
    };
  }

  const types = new Set(alive.map((u) => u.typeId));
  const mixed = types.size > 1;
  const title = mixed
    ? `Mixed ×${alive.length}`
    : `${alive[0]!.name} ×${alive.length}`;
  const speciesIds = new Set(alive.map((u) => u.speciesId));
  const flavor =
    speciesIds.size === 1
      ? `${SPECIES[alive[0]!.speciesId].name} · ${alive.length} selected`
      : `${alive.length} selected · Mixed species`;
  const hp = alive.reduce((s, u) => s + u.hp, 0);
  const maxHp = alive.reduce((s, u) => s + u.maxHp, 0);
  let dmg: number | null = null;
  let range: number | null = null;
  if (!mixed) {
    dmg = alive[0]!.dmg;
    range = alive[0]!.range;
  }
  const tags: string[] = [];
  const formed = alive.filter((u) => u.inFormation).length;
  const mutated = alive.filter((u) => u.mutated).length;
  const enraged = alive.filter((u) => u.enraged).length;
  if (formed) tags.push(`Form ${formed}`);
  if (mutated) tags.push(`Mut ${mutated}`);
  if (enraged) tags.push(`Rage ${enraged}`);

  return {
    kind: 'units',
    count: alive.length,
    title,
    flavor,
    hp,
    maxHp,
    dmg,
    range,
    tags,
    attackMoveArmed,
  };
}

function structureSignature(view: SelectionPanelView): string {
  if (view.kind === 'hidden') return 'h';
  if (view.kind === 'units') {
    return [
      'u',
      view.count,
      view.title,
      view.dmg ?? '-',
      view.range ?? '-',
      view.tags.join(','),
      view.attackMoveArmed ? 1 : 0,
    ].join('|');
  }
  return [
    'b',
    view.title,
    view.trains.map((t) => `${t.typeId}:${t.affordable ? 1 : 0}`).join(','),
    view.queue.join(','),
    view.headName ?? '',
  ].join('|');
}

export function renderSelectionPanel(view: SelectionPanelView): boolean {
  const root = ensureSelectionPanel();
  const structSig = structureSignature(view);

  if (view.kind === 'hidden') {
    if (!lastVisible) return false;
    lastVisible = false;
    lastStructureSig = 'h';
    root.classList.remove('is-visible');
    return false;
  }

  const structuralChange = lastStructureSig !== structSig;
  lastStructureSig = structSig;
  lastVisible = true;
  root.classList.add('is-visible');

  const portrait = root.querySelector('[data-role="portrait"]') as HTMLElement;
  const titleEl = root.querySelector('[data-role="title"]') as HTMLElement;
  const flavorEl = root.querySelector('[data-role="flavor"]') as HTMLElement;
  const hpFill = root.querySelector('[data-role="hp-fill"]') as HTMLElement;
  const hpText = root.querySelector('[data-role="hp-text"]') as HTMLElement;
  const stats = root.querySelector('[data-role="stats"]') as HTMLElement;
  const actions = root.querySelector('[data-role="actions"]') as HTMLElement;
  const queue = root.querySelector('[data-role="queue"]') as HTMLElement;
  const queueFill = root.querySelector('[data-role="queue-fill"]') as HTMLElement;
  const queueIcons = root.querySelector(
    '[data-role="queue-icons"]',
  ) as HTMLElement;
  const queueLabel = root.querySelector(
    '[data-role="queue-label"]',
  ) as HTMLElement;

  const hpPct =
    view.maxHp > 0 ? Math.min(1, Math.max(0, view.hp / view.maxHp)) : 0;
  hpFill.style.width = `${(hpPct * 100).toFixed(1)}%`;
  hpFill.classList.toggle('is-low', hpPct < 0.35);
  hpText.textContent = `${Math.ceil(view.hp)}/${Math.ceil(view.maxHp)}`;
  titleEl.textContent = view.title;
  flavorEl.textContent = view.flavor;

  if (view.kind === 'units') {
    portrait.classList.toggle('is-building', false);
    portrait.classList.toggle('is-mixed', view.count > 1 && view.dmg == null);
    portrait.style.setProperty('--kane-sel-accent', '#f0c75e');
    if (structuralChange) {
      const bits: string[] = [];
      if (view.dmg != null) bits.push(`<span>ATK ${view.dmg}</span>`);
      if (view.range != null) bits.push(`<span>RNG ${view.range}</span>`);
      for (const t of view.tags) bits.push(`<span>${escapeHtml(t)}</span>`);
      stats.innerHTML = bits.join('');
      actions.innerHTML = `
        <button type="button" data-act="stop">Stop</button>
        <button type="button" data-act="attackMove" class="${view.attackMoveArmed ? 'is-armed' : ''}">${view.attackMoveArmed ? 'Atk · Armed' : 'Atk-move'}</button>
      `;
    } else {
      const am = actions.querySelector(
        '[data-act="attackMove"]',
      ) as HTMLButtonElement | null;
      if (am) {
        am.classList.toggle('is-armed', view.attackMoveArmed);
        am.textContent = view.attackMoveArmed ? 'Atk · Armed' : 'Atk-move';
      }
    }
    queue.hidden = true;
  } else {
    portrait.classList.add('is-building');
    portrait.classList.remove('is-mixed');
    portrait.style.setProperty('--kane-sel-accent', '#3d7ea6');
    if (structuralChange) {
      stats.innerHTML = view.trains.length
        ? '<span>Production</span>'
        : '<span>No production</span>';
      actions.innerHTML = view.trains
        .map((t) => {
          const cost =
            t.costCrystals > 0
              ? `${t.costGold}g / ${t.costCrystals}c`
              : `${t.costGold}g`;
          return `<button type="button" class="is-train" data-act="train" data-type-id="${t.typeId}" ${t.affordable ? '' : 'disabled'}>${escapeHtml(t.name)}<small>${cost}</small></button>`;
        })
        .join('');
    } else {
      for (const t of view.trains) {
        const btn = actions.querySelector(
          `button[data-type-id="${t.typeId}"]`,
        ) as HTMLButtonElement | null;
        if (btn) btn.disabled = !t.affordable;
      }
    }

    if (view.queue.length === 0) {
      queue.hidden = true;
    } else {
      queue.hidden = false;
      queueFill.style.width = `${(view.progressPct * 100).toFixed(1)}%`;
      if (structuralChange) {
        const shown = view.queue.slice(0, 6);
        const overflow = view.queue.length - shown.length;
        queueIcons.innerHTML =
          shown
            .map((id, i) => {
              const u = getUnitType(id);
              const label = u.name.slice(0, 2).toUpperCase();
              return `<div class="kane-sel-qicon${i === 0 ? ' is-active' : ''}" title="${escapeHtml(u.name)}">${label}</div>`;
            })
            .join('') +
          (overflow > 0
            ? `<div class="kane-sel-qicon" title="+${overflow}">+${overflow}</div>`
            : '');
      }
      const pct = Math.floor(view.progressPct * 100);
      queueLabel.textContent = view.headName
        ? `Training ${view.headName} · ${pct}% · queue ${view.queue.length}`
        : `Queue ${view.queue.length}`;
    }
  }

  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
