/**
 * Classic RTS bottom selection / command panel — DOM overlay.
 * Mobile-web first; navy/gold/cream HUD aligned with battlefield chrome.
 * Reads gameplay state only — no new combat systems.
 */
import { getBuildingType } from '../../data/buildings';
import {
  heroForSpecies,
  type HeroAbilitySlot,
} from '../../data/heroes';
import { RESOURCES } from '../../data/resources';
import { SPECIES } from '../../data/speciesStub';
import { getUnitType, type UnitTypeId } from '../../data/units';
import type {
  BattlefieldBuilding,
  BattlefieldUnit,
  BattlefieldWorld,
  ResourceNode,
} from '../../gameplay/battlefield/battlefieldWorld';
import { canAfford } from '../../gameplay/battlefield/battlefieldBuildings';
import { walletOf } from '../../gameplay/battlefield/battlefieldEconomy';

export type SelectionAbilityView = {
  slot: HeroAbilitySlot;
  name: string;
  hotkey: string;
  /** Remaining cooldown seconds (ceil); 0 = ready. */
  cdSec: number;
  ready: boolean;
  /** Crystal cost payable (or free). */
  canPay: boolean;
  costCrystals: number;
};

const PANEL_ID = 'kane-selection-panel';
const STYLE_ID = 'kane-selection-panel-style';

export type SelectionPanelHandlers = {
  stop: () => void;
  attackMove: () => void;
  train: (typeId: UnitTypeId) => void;
  /** Arm rally-set mode for the selected production building. */
  rally: () => void;
  /** Cancel a queue slot (omit index = last item). */
  cancelQueue: (index?: number) => void;
  /** Cast selected hero ability (Q/W/E). */
  castAbility: (slot: HeroAbilitySlot) => void;
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
      /** Present when a single player hero is selected. */
      abilities: SelectionAbilityView[] | null;
    }
  | {
      kind: 'building';
      title: string;
      flavor: string;
      hp: number;
      maxHp: number;
      /** Building finished construction (can start training). */
      ready: boolean;
      trains: {
        typeId: UnitTypeId;
        name: string;
        costGold: number;
        costCrystals: number;
        /** Wallet can cover gold + crystals. */
        canPay: boolean;
        /** Ready + canPay — button enabled. */
        affordable: boolean;
      }[];
      queue: UnitTypeId[];
      progressPct: number;
      headName: string | null;
      rallyArmed: boolean;
      hasRally: boolean;
    }
  | {
      kind: 'resource';
      title: string;
      flavor: string;
      remaining: number;
      maxAmount: number;
      resourceId: 'gold' | 'magic_crystals';
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
    else if (act === 'rally') handlers.rally();
    else if (act === 'cancelQueue') {
      const raw = btn.dataset.queueIndex;
      const idx =
        raw != null && raw !== '' ? Number.parseInt(raw, 10) : undefined;
      handlers.cancelQueue(
        Number.isFinite(idx as number) ? (idx as number) : undefined,
      );
    }     else if (act === 'train' && btn.dataset.typeId) {
      handlers.train(btn.dataset.typeId as UnitTypeId);
    } else if (act === 'castAbility' && btn.dataset.slot) {
      handlers.castAbility(btn.dataset.slot as HeroAbilitySlot);
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
    #kane-selection-panel button.is-rally {
      background: #3a5530;
    }
    #kane-selection-panel button.is-rally.is-armed {
      background: #5a7030;
      border-color: #f0c75e;
      color: #fff8e8;
    }
    #kane-selection-panel button.is-cancel {
      background: #5a3a3a;
      border-color: #e87a7a;
    }
    #kane-selection-panel button.is-train {
      background: #3d7ea6;
      flex: 1 1 100px;
      max-width: 180px;
      text-align: left;
    }
    #kane-selection-panel button.is-train .kane-sel-train-name {
      display: block;
      font-weight: 700;
      font-size: 12px;
      color: #fff8e8;
    }
    #kane-selection-panel button.is-train .kane-sel-cost {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 3px;
      font-weight: 600;
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
    }
    #kane-selection-panel button.is-train .kane-sel-cost-gold {
      color: #f0c75e;
    }
    #kane-selection-panel button.is-train .kane-sel-cost-crystal {
      color: #7ec8ff;
    }
    #kane-selection-panel button.is-train.is-unaffordable {
      opacity: 0.55;
      border-color: #6a7f94;
      background: #243040;
    }
    #kane-selection-panel button.is-train.is-unaffordable .kane-sel-cost-gold,
    #kane-selection-panel button.is-train.is-unaffordable .kane-sel-cost-crystal {
      color: #e87a7a;
    }
    #kane-selection-panel button.is-ability {
      background: #2a3548;
      flex: 1 1 96px;
      max-width: 160px;
      text-align: left;
      border-color: #7ec8ff;
    }
    #kane-selection-panel button.is-ability.is-ultimate {
      border-color: #f0c75e;
    }
    #kane-selection-panel button.is-ability .kane-sel-ability-name {
      display: block;
      font-weight: 700;
      font-size: 11px;
      color: #fff8e8;
    }
    #kane-selection-panel button.is-ability .kane-sel-ability-cd {
      display: block;
      margin-top: 2px;
      font-size: 10px;
      font-variant-numeric: tabular-nums;
      color: #6ecfbf;
      letter-spacing: 0.03em;
    }
    #kane-selection-panel button.is-ability.is-cooling .kane-sel-ability-cd {
      color: #f0c75e;
    }
    #kane-selection-panel button.is-ability.is-unaffordable {
      opacity: 0.55;
      border-color: #6a7f94;
    }
    #kane-selection-panel button.is-ability.is-unaffordable .kane-sel-ability-cd {
      color: #e87a7a;
    }
    #kane-selection-panel button:disabled {
      cursor: default;
    }
    #kane-selection-panel .kane-sel-queue {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #3a4555;
    }
    #kane-selection-panel .kane-sel-queue.is-idle .kane-sel-queue-bar {
      opacity: 0.35;
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
      min-height: 28px;
      align-items: center;
    }
    #kane-selection-panel .kane-sel-qicon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      padding: 0;
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
      cursor: pointer;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }
    #kane-selection-panel .kane-sel-qicon.is-active {
      border-color: #f0c75e;
      box-shadow: 0 0 0 1px rgba(240,199,94,0.55);
      color: #fff8e8;
    }
    #kane-selection-panel .kane-sel-qicon:active {
      border-color: #e87a7a;
      background: #3a2430;
    }
    #kane-selection-panel .kane-sel-qicon .kane-sel-qnum {
      position: absolute;
      top: -5px;
      right: -5px;
      min-width: 12px;
      height: 12px;
      padding: 0 2px;
      border-radius: 6px;
      background: #0a1220;
      border: 1px solid #f0c75e;
      color: #f0c75e;
      font-size: 8px;
      line-height: 11px;
      text-align: center;
    }
    #kane-selection-panel .kane-sel-queue-label {
      margin-top: 4px;
      font-size: 11px;
      color: #9eb4c8;
      line-height: 1.3;
    }
    #kane-selection-panel .kane-sel-queue-label strong {
      color: #f5e6c8;
      font-weight: 600;
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
  // Slightly taller: train cost rows + always-on queue strip for producers.
  // Hero ability row adds a second action line on narrow.
  return narrow ? 188 : 172;
}

export function buildSelectionView(
  world: BattlefieldWorld,
  selectedBuilding: BattlefieldBuilding | null,
  units: BattlefieldUnit[],
  attackMoveArmed: boolean,
  rallyArmed = false,
  selectedNode: ResourceNode | null = null,
): SelectionPanelView {
  if (selectedBuilding && selectedBuilding.hp > 0) {
    const b = selectedBuilding;
    const bdef = getBuildingType(b.typeId);
    const species = SPECIES[bdef.speciesId];
    const wallet = walletOf(world, 'player');
    const ready = b.complete;
    const trains = bdef.trains.map((typeId) => {
      const u = getUnitType(typeId);
      const cost = { gold: u.costGold, magic_crystals: u.costCrystals };
      const canPay = canAfford(wallet, cost);
      return {
        typeId,
        name: u.name,
        costGold: u.costGold,
        costCrystals: u.costCrystals,
        canPay,
        affordable: canPay && ready,
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
      ready,
      trains,
      queue: [...b.trainQueue],
      progressPct,
      headName: head?.name ?? null,
      rallyArmed,
      hasRally: trains.length > 0,
    };
  }

  if (selectedNode && selectedNode.remaining > 0) {
    const def = RESOURCES[selectedNode.resourceId];
    return {
      kind: 'resource',
      title: def.label,
      flavor: `${def.source} · send workers to gather`,
      remaining: selectedNode.remaining,
      maxAmount: selectedNode.maxAmount,
      resourceId: selectedNode.resourceId,
    };
  }

  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) return { kind: 'hidden' };

  if (alive.length === 1) {
    const u = alive[0]!;
    const species = SPECIES[u.speciesId];
    const tags: string[] = [];
    if (u.canGather) tags.push('Worker');
    if (getUnitType(u.typeId).isHero) tags.push('Hero');
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
      abilities: heroAbilityViews(world, u),
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
    abilities: null,
  };
}

function heroAbilityViews(
  world: BattlefieldWorld,
  u: BattlefieldUnit,
): SelectionAbilityView[] | null {
  if (u.team !== 'player' || !getUnitType(u.typeId).isHero) return null;
  const def = heroForSpecies(u.speciesId);
  if (!def) return null;
  const rt = world.heroRuntime;
  const wallet = walletOf(world, 'player');
  const slots: HeroAbilitySlot[] = ['ability1', 'ability2', 'ultimate'];
  return slots.map((slot) => {
    const ab = def.abilities[slot];
    const cdMs = rt && rt.unitId === u.id ? rt.cds[slot] : 0;
    const cdSec = cdMs > 0 ? Math.ceil(cdMs / 1000) : 0;
    const canPay =
      ab.costCrystals <= 0 || wallet.magic_crystals >= ab.costCrystals;
    return {
      slot,
      name: ab.name,
      hotkey: ab.hotkey,
      cdSec,
      ready: cdSec <= 0,
      canPay,
      costCrystals: ab.costCrystals,
    };
  });
}

function structureSignature(view: SelectionPanelView): string {
  if (view.kind === 'hidden') return 'h';
  if (view.kind === 'units') {
    const abs = view.abilities
      ? view.abilities
          .map(
            (a) =>
              `${a.slot}:${a.ready ? 1 : 0}:${a.cdSec}:${a.canPay ? 1 : 0}`,
          )
          .join(',')
      : '';
    return [
      'u',
      view.count,
      view.title,
      view.dmg ?? '-',
      view.range ?? '-',
      view.tags.join(','),
      view.attackMoveArmed ? 1 : 0,
      abs,
    ].join('|');
  }
  if (view.kind === 'resource') {
    return [
      'r',
      view.resourceId,
      view.title,
      Math.floor(view.remaining),
      Math.floor(view.maxAmount),
    ].join('|');
  }
  return [
    'b',
    view.title,
    view.ready ? 1 : 0,
    view.hasRally ? 1 : 0,
    view.rallyArmed ? 1 : 0,
    view.trains
      .map((t) => `${t.typeId}:${t.canPay ? 1 : 0}:${t.affordable ? 1 : 0}`)
      .join(','),
    view.queue.join(','),
    view.headName ?? '',
  ].join('|');
}

function trainCostHtml(gold: number, crystals: number): string {
  const bits = [
    `<span class="kane-sel-cost-gold">Gold ${gold}</span>`,
  ];
  if (crystals > 0) {
    bits.push(`<span class="kane-sel-cost-crystal">Crystal ${crystals}</span>`);
  }
  return `<span class="kane-sel-cost">${bits.join('')}</span>`;
}

function abilityButtonHtml(a: SelectionAbilityView): string {
  const classes = ['is-ability'];
  if (a.slot === 'ultimate') classes.push('is-ultimate');
  if (!a.ready) classes.push('is-cooling');
  if (!a.canPay) classes.push('is-unaffordable');
  const castable = a.ready && a.canPay;
  const cdLabel = !a.ready
    ? `${a.cdSec}s`
    : !a.canPay
      ? `Need ${a.costCrystals}c`
      : 'READY';
  const title = !a.ready
    ? ` title="Cooldown ${a.cdSec}s"`
    : !a.canPay
      ? ` title="Need ${a.costCrystals} crystals"`
      : ` title="Cast ${escapeHtml(a.name)} (${a.hotkey})"`;
  return `<button type="button" class="${classes.join(' ')}" data-act="castAbility" data-slot="${a.slot}"${castable ? '' : ' disabled'}${title}><span class="kane-sel-ability-name">${escapeHtml(a.hotkey)} · ${escapeHtml(a.name)}</span><span class="kane-sel-ability-cd">${cdLabel}</span></button>`;
}

function applyAbilityButtonState(
  btn: HTMLButtonElement,
  a: SelectionAbilityView,
): void {
  const castable = a.ready && a.canPay;
  btn.disabled = !castable;
  btn.classList.toggle('is-cooling', !a.ready);
  btn.classList.toggle('is-unaffordable', !a.canPay);
  const cd = btn.querySelector('.kane-sel-ability-cd');
  if (cd) {
    cd.textContent = !a.ready
      ? `${a.cdSec}s`
      : !a.canPay
        ? `Need ${a.costCrystals}c`
        : 'READY';
  }
  if (!a.ready) btn.title = `Cooldown ${a.cdSec}s`;
  else if (!a.canPay) btn.title = `Need ${a.costCrystals} crystals`;
  else btn.title = `Cast ${a.name} (${a.hotkey})`;
}

function trainButtonHtml(t: {
  typeId: UnitTypeId;
  name: string;
  costGold: number;
  costCrystals: number;
  canPay: boolean;
  affordable: boolean;
}): string {
  const classes = ['is-train'];
  if (!t.affordable) classes.push('is-unaffordable');
  const reason = !t.affordable
    ? !t.canPay
      ? ' title="Need more resources"'
      : ' title="Building still under construction"'
    : '';
  return `<button type="button" class="${classes.join(' ')}" data-act="train" data-type-id="${t.typeId}"${t.affordable ? '' : ' disabled'}${reason}><span class="kane-sel-train-name">${escapeHtml(t.name)}</span>${trainCostHtml(t.costGold, t.costCrystals)}</button>`;
}

function applyTrainAffordability(
  btn: HTMLButtonElement,
  t: { canPay: boolean; affordable: boolean },
): void {
  btn.disabled = !t.affordable;
  btn.classList.toggle('is-unaffordable', !t.affordable);
  if (!t.affordable) {
    btn.title = !t.canPay
      ? 'Need more resources'
      : 'Building still under construction';
  } else {
    btn.removeAttribute('title');
  }
}

function queueLabelText(
  view: Extract<SelectionPanelView, { kind: 'building' }>,
): string {
  if (!view.ready) return 'Under construction — train buttons unlock when finished';
  if (view.queue.length === 0) {
    return view.trains.length
      ? 'Idle — tap a unit to train (Gold / Crystal cost on each button)'
      : 'No production options';
  }
  const pct = Math.floor(view.progressPct * 100);
  const waiting = view.queue.length - 1;
  const cancelHint = ' · tap icon or Cancel last to refund';
  if (view.headName && waiting > 0) {
    return `Training ${view.headName} · ${pct}% · ${waiting} waiting${cancelHint}`;
  }
  if (view.headName) {
    return `Training ${view.headName} · ${pct}%${cancelHint}`;
  }
  return `Queue ${view.queue.length}${cancelHint}`;
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

  titleEl.textContent = view.title;
  flavorEl.textContent = view.flavor;

  if (view.kind === 'resource') {
    const remPct =
      view.maxAmount > 0
        ? Math.min(1, Math.max(0, view.remaining / view.maxAmount))
        : 0;
    hpFill.style.width = `${(remPct * 100).toFixed(1)}%`;
    hpFill.classList.toggle('is-low', remPct < 0.35);
    hpText.textContent = `${Math.floor(view.remaining)}/${Math.floor(view.maxAmount)}`;
    portrait.classList.toggle('is-building', false);
    portrait.classList.toggle('is-mixed', false);
    portrait.style.setProperty(
      '--kane-sel-accent',
      view.resourceId === 'magic_crystals' ? '#7ec8ff' : '#f0c75e',
    );
    if (structuralChange) {
      const label =
        view.resourceId === 'magic_crystals' ? 'Crystals left' : 'Gold left';
      stats.innerHTML = `<span>${label}  ·  ${Math.floor(view.remaining)}</span>`;
      actions.innerHTML = '';
    } else {
      const label =
        view.resourceId === 'magic_crystals' ? 'Crystals left' : 'Gold left';
      stats.innerHTML = `<span>${label}  ·  ${Math.floor(view.remaining)}</span>`;
    }
    queue.hidden = true;
  } else {
    const hpPct =
      view.maxHp > 0 ? Math.min(1, Math.max(0, view.hp / view.maxHp)) : 0;
    hpFill.style.width = `${(hpPct * 100).toFixed(1)}%`;
    hpFill.classList.toggle('is-low', hpPct < 0.35);
    hpText.textContent = `${Math.ceil(view.hp)}/${Math.ceil(view.maxHp)}`;

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
        const abilityHtml = view.abilities
          ? view.abilities.map(abilityButtonHtml).join('')
          : '';
        actions.innerHTML = `
        <button type="button" data-act="stop">Stop</button>
        <button type="button" data-act="attackMove" class="${view.attackMoveArmed ? 'is-armed' : ''}">${view.attackMoveArmed ? 'Atk · Armed' : 'Atk-move'}</button>
        ${abilityHtml}
      `;
      } else {
        const am = actions.querySelector(
          '[data-act="attackMove"]',
        ) as HTMLButtonElement | null;
        if (am) {
          am.classList.toggle('is-armed', view.attackMoveArmed);
          am.textContent = view.attackMoveArmed ? 'Atk · Armed' : 'Atk-move';
        }
        if (view.abilities) {
          for (const a of view.abilities) {
            const btn = actions.querySelector(
              `button[data-slot="${a.slot}"]`,
            ) as HTMLButtonElement | null;
            if (btn) applyAbilityButtonState(btn, a);
          }
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
        const rallyBtn = view.hasRally
          ? `<button type="button" class="is-rally${view.rallyArmed ? ' is-armed' : ''}" data-act="rally">${view.rallyArmed ? 'Rally · Tap map' : 'Set rally'}</button>`
          : '';
        const cancelBtn =
          view.queue.length > 0
            ? `<button type="button" class="is-cancel" data-act="cancelQueue" title="Cancel last queued unit (full refund)">Cancel last</button>`
            : '';
        actions.innerHTML =
          rallyBtn + cancelBtn + view.trains.map(trainButtonHtml).join('');
      } else {
        for (const t of view.trains) {
          const btn = actions.querySelector(
            `button[data-type-id="${t.typeId}"]`,
          ) as HTMLButtonElement | null;
          if (btn) applyTrainAffordability(btn, t);
        }
        const rally = actions.querySelector(
          '[data-act="rally"]',
        ) as HTMLButtonElement | null;
        if (rally) {
          rally.classList.toggle('is-armed', view.rallyArmed);
          rally.textContent = view.rallyArmed ? 'Rally · Tap map' : 'Set rally';
        }
      }

      if (view.trains.length === 0) {
        queue.hidden = true;
      } else {
        queue.hidden = false;
        const idle = view.queue.length === 0;
        queue.classList.toggle('is-idle', idle);
        queueFill.style.width = idle
          ? '0%'
          : `${(view.progressPct * 100).toFixed(1)}%`;
        if (structuralChange) {
          if (idle) {
            queueIcons.innerHTML = '';
          } else {
            const shown = view.queue.slice(0, 6);
            const overflow = view.queue.length - shown.length;
            queueIcons.innerHTML =
              shown
                .map((id, i) => {
                  const u = getUnitType(id);
                  const label = u.name.slice(0, 2).toUpperCase();
                  return `<button type="button" class="kane-sel-qicon${i === 0 ? ' is-active' : ''}" data-act="cancelQueue" data-queue-index="${i}" title="Cancel ${escapeHtml(u.name)} (refund)">${label}<span class="kane-sel-qnum">${i + 1}</span></button>`;
                })
                .join('') +
              (overflow > 0
                ? `<span class="kane-sel-qicon" title="+${overflow} more" style="cursor:default">+${overflow}</span>`
                : '');
          }
        }
        queueLabel.textContent = queueLabelText(view);
      }
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
