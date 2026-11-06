/**
 * Classic RTS bottom selection / command panel — DOM overlay.
 * Mobile-web first; navy/gold/cream HUD aligned with battlefield chrome.
 * Reads gameplay state only — no new combat systems.
 */
import {
  getBuildingType,
  placeableBuildings,
  type BuildingTypeId,
} from '../../data/buildings';
import {
  heroForSpecies,
  type HeroAbilitySlot,
} from '../../data/heroes';
import { RESOURCES } from '../../data/resources';
import { SPECIES_MATCHUP_TIP, type SpeciesId } from '../../data/speciesStub';
import { getLocale, speciesCopy, speciesName, t } from '../../i18n';
import { getUnitType, type UnitTypeId } from '../../data/units';
import type {
  BattlefieldBuilding,
  BattlefieldUnit,
  BattlefieldWorld,
  ResourceNode,
} from '../../gameplay/battlefield/battlefieldWorld';
import { canAfford } from '../../gameplay/battlefield/battlefieldBuildings';

function matchupLine(id: SpeciesId): string {
  const tip = SPECIES_MATCHUP_TIP[id];
  return t('sel.matchup', {
    strong: speciesName(tip.strongVs),
    weak: speciesName(tip.weakVs),
  });
}
import { walletOf } from '../../gameplay/battlefield/battlefieldEconomy';
import { RAGE } from '../../gameplay/battlefield/battlefieldRage';

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
  /** Arm building placement from Keep / main hall (existing place mode). */
  placeBuilding: (typeId: BuildingTypeId) => void;
  /** Toggle Nobles formation lock on selected formation-capable units (F). */
  toggleFormation: () => void;
  /** Toggle Brutes Rage lock on selected rage-capable units (R). */
  toggleRage: () => void;
  /** Toggle Weirdos Mutation lock / role on selected mutate-capable units (M). */
  toggleMutation: () => void;
};

/** Nobles formation / stance summary for the selection panel. */
export type SelectionFormationView = {
  eligible: number;
  formed: number;
  locked: number;
  /** All eligible units have formation lock on. */
  allLocked: boolean;
};

/** Brutes Rage summary — meter + lock for the selection panel. */
export type SelectionRageView = {
  eligible: number;
  enraged: number;
  locked: number;
  allLocked: boolean;
  /** 0–1 linger / lock fill (hottest eligible unit). */
  meter: number;
};

/** Weirdos Mutation / role summary for the selection panel. */
export type SelectionMutationView = {
  eligible: number;
  mutated: number;
  locked: number;
  allLocked: boolean;
};

export type SelectionPlaceOption = {
  typeId: BuildingTypeId;
  name: string;
  costGold: number;
  costCrystals: number;
  canPay: boolean;
  /** Complete Keep + canPay — button enabled. */
  affordable: boolean;
  /** Currently armed in place mode. */
  armed: boolean;
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
      /** Nobles formation-capable selection — stance lock control. */
      formation: SelectionFormationView | null;
      /** Brutes rage-capable selection — meter + lock. */
      rage: SelectionRageView | null;
      /** Weirdos mutate-capable selection — mutation role lock. */
      mutation: SelectionMutationView | null;
      /** Unit-specific control hint (e.g. Grabber / Weirdos hero). */
      controlHint: string | null;
      /** Live worker cargo line when carrying > 0. */
      carryLine: string | null;
      /** Tint carry line for magic crystals. */
      carryCrystal: boolean;
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
      /** Placeable buildings when Keep / main hall is selected. */
      places: SelectionPlaceOption[];
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
          <div class="kane-sel-carry" data-role="carry" hidden></div>
          <div class="kane-sel-stats" data-role="stats"></div>
          <div class="kane-sel-meter" data-role="meter" hidden>
            <div class="kane-sel-meter-track">
              <div class="kane-sel-meter-fill" data-role="meter-fill"></div>
            </div>
            <span class="kane-sel-meter-label" data-role="meter-label"></span>
          </div>
          <div class="kane-sel-control-hint" data-role="control-hint" hidden></div>
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
    } else if (act === 'train' && btn.dataset.typeId) {
      handlers.train(btn.dataset.typeId as UnitTypeId);
    } else if (act === 'place' && btn.dataset.typeId) {
      handlers.placeBuilding(btn.dataset.typeId as BuildingTypeId);
    } else if (act === 'castAbility' && btn.dataset.slot) {
      handlers.castAbility(btn.dataset.slot as HeroAbilitySlot);
    } else if (act === 'toggleFormation') {
      handlers.toggleFormation();
    } else if (act === 'toggleRage') {
      handlers.toggleRage();
    } else if (act === 'toggleMutation') {
      handlers.toggleMutation();
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
    #kane-selection-panel .kane-sel-carry {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #f0c75e;
      letter-spacing: 0.02em;
    }
    #kane-selection-panel .kane-sel-carry.is-crystal {
      color: #7ec8ff;
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
    #kane-selection-panel button.is-stance {
      background: #3a4a2a;
      border-color: #f0c75e;
      min-width: 96px;
      text-align: left;
    }
    #kane-selection-panel button.is-stance.is-armed {
      background: #5a7030;
      border-color: #f0c75e;
      color: #fff8e8;
    }
    #kane-selection-panel button.is-stance .kane-sel-stance-sub {
      display: block;
      margin-top: 2px;
      font-size: 10px;
      font-weight: 600;
      color: #c8d8a8;
      letter-spacing: 0.02em;
    }
    #kane-selection-panel button.is-rage {
      background: #5a3020;
      border-color: #e87a4a;
      min-width: 96px;
      text-align: left;
    }
    #kane-selection-panel button.is-rage.is-armed {
      background: #8a4020;
      border-color: #ffb070;
      color: #fff0e0;
    }
    #kane-selection-panel button.is-rage .kane-sel-stance-sub {
      color: #ffc8a0;
    }
    #kane-selection-panel button.is-mutation {
      background: #3a2a58;
      border-color: #6ecfbf;
      min-width: 96px;
      text-align: left;
    }
    #kane-selection-panel button.is-mutation.is-armed {
      background: #5a3a78;
      border-color: #e87aa8;
      color: #f8e8ff;
    }
    #kane-selection-panel button.is-mutation .kane-sel-stance-sub {
      color: #b8e8d8;
    }
    #kane-selection-panel .kane-sel-meter {
      margin-top: 6px;
    }
    #kane-selection-panel .kane-sel-meter-track {
      height: 8px;
      border-radius: 3px;
      background: #0a121c;
      border: 1px solid #5a3030;
      overflow: hidden;
    }
    #kane-selection-panel .kane-sel-meter-fill {
      height: 100%;
      width: 0%;
      border-radius: 2px;
      background: linear-gradient(90deg, #8a3030, #e87a4a);
      transition: width 80ms linear;
    }
    #kane-selection-panel .kane-sel-meter-fill.is-locked {
      background: linear-gradient(90deg, #a04020, #ffb070);
    }
    #kane-selection-panel .kane-sel-meter-label {
      display: block;
      margin-top: 3px;
      font-size: 11px;
      color: #e8b090;
      line-height: 1.25;
    }
    #kane-selection-panel .kane-sel-control-hint {
      margin-top: 6px;
      padding: 5px 8px;
      border-radius: 3px;
      border: 1px solid #5a4a78;
      background: rgba(40, 28, 64, 0.65);
      font-size: 11px;
      color: #c8b8e8;
      line-height: 1.3;
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
  /** Armed place-mode building type (from Keep panel / B key). */
  placeArmedType: BuildingTypeId | null = null,
): SelectionPanelView {
  if (selectedBuilding && selectedBuilding.hp > 0) {
    const b = selectedBuilding;
    const bdef = getBuildingType(b.typeId);
    const species = speciesCopy(bdef.speciesId);
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
    const places: SelectionPlaceOption[] =
      b.team === 'player' && bdef.isMainHall
        ? placeableBuildings(bdef.speciesId).map((typeId) => {
            const pdef = getBuildingType(typeId);
            const costGold = pdef.cost.gold ?? 0;
            const costCrystals = pdef.cost.magic_crystals ?? 0;
            const canPay = canAfford(wallet, pdef.cost);
            return {
              typeId,
              name: pdef.name,
              costGold,
              costCrystals,
              canPay,
              affordable: canPay && ready,
              armed: placeArmedType === typeId,
            };
          })
        : [];
    const head = b.trainQueue[0] ? getUnitType(b.trainQueue[0]) : null;
    const progressPct =
      head && head.trainMs > 0
        ? Math.min(1, Math.max(0, b.trainProgressMs / head.trainMs))
        : 0;
    return {
      kind: 'building',
      title: b.name,
      flavor: `${species.name} · ${species.mechanic} · ${matchupLine(bdef.speciesId)}`,
      hp: b.hp,
      maxHp: b.maxHp,
      ready,
      trains,
      places,
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
      flavor: t('sel.gather', { source: def.source }),
      remaining: selectedNode.remaining,
      maxAmount: selectedNode.maxAmount,
      resourceId: selectedNode.resourceId,
    };
  }

  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) return { kind: 'hidden' };

  if (alive.length === 1) {
    const u = alive[0]!;
    const species = speciesCopy(u.speciesId);
    const tags: string[] = [];
    if (u.canGather) tags.push(t('sel.worker'));
    if (getUnitType(u.typeId).isHero) tags.push(t('sel.hero'));
    if (u.inFormation) {
      tags.push(t(u.formationLocked ? 'sel.formationLock' : 'sel.formation'));
    }
    if (u.mutated) tags.push(t(u.mutationLocked ? 'sel.mutatedLock' : 'sel.mutated'));
    if (u.enraged) tags.push(t(u.rageLocked ? 'sel.rageLock' : 'sel.rage'));
    const carry = carryLineFor(alive);
    return {
      kind: 'units',
      count: 1,
      title: u.name,
      flavor: `${species.name} · ${matchupLine(u.speciesId)}`,
      hp: u.hp,
      maxHp: u.maxHp,
      dmg: u.dmg,
      range: u.range,
      tags,
      attackMoveArmed,
      abilities: heroAbilityViews(world, u),
      formation: formationViewFor(alive),
      rage: rageViewFor(alive),
      mutation: mutationViewFor(alive),
      controlHint: controlHintFor(alive),
      carryLine: carry.line,
      carryCrystal: carry.crystal,
    };
  }

  const types = new Set(alive.map((u) => u.typeId));
  const mixed = types.size > 1;
  const title = mixed
    ? t('sel.mixed', { n: alive.length })
    : `${alive[0]!.name} ×${alive.length}`;
  const speciesIds = new Set(alive.map((u) => u.speciesId));
  const flavor =
    speciesIds.size === 1
      ? `${speciesName(alive[0]!.speciesId)} · ${t('sel.selected', { n: alive.length })} · ${matchupLine(alive[0]!.speciesId)}`
      : t('sel.mixedSpecies', { n: alive.length });
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
  if (formed) tags.push(t('sel.formCount', { n: formed }));
  if (mutated) tags.push(t('sel.mutCount', { n: mutated }));
  if (enraged) tags.push(t('sel.rageCount', { n: enraged }));

  const carry = carryLineFor(alive);
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
    formation: formationViewFor(alive),
    rage: rageViewFor(alive),
    mutation: mutationViewFor(alive),
    controlHint: controlHintFor(alive),
    carryLine: carry.line,
    carryCrystal: carry.crystal,
  };
}

/** Visible cargo readout for selected workers (single or group). */
export function carryLineFor(
  units: BattlefieldUnit[],
): { line: string | null; crystal: boolean } {
  const carriers = units.filter(
    (u) => u.hp > 0 && u.carrying > 0 && u.carryingResource,
  );
  if (carriers.length === 0) return { line: null, crystal: false };
  const total = carriers.reduce((s, u) => s + u.carrying, 0);
  const resources = new Set(
    carriers.map((u) => u.carryingResource).filter(Boolean),
  );
  if (resources.size === 1) {
    const id = carriers[0]!.carryingResource!;
    return {
      line: t('sel.cargo', {
        n: Math.floor(total),
        resource: RESOURCES[id].label,
      }),
      crystal: id === 'magic_crystals',
    };
  }
  return {
    line: t('sel.cargoMixed', { n: Math.floor(total) }),
    crystal: false,
  };
}

function controlHintFor(units: BattlefieldUnit[]): string | null {
  const player = units.filter((u) => u.team === 'player' && u.hp > 0);
  if (player.length === 0) return null;
  const hasGrabber = player.some((u) => u.typeId === 'grabber');
  const hasWeirdHero = player.some(
    (u) => u.speciesId === 'weirdos' && !!getUnitType(u.typeId).isHero,
  );
  if (hasWeirdHero && hasGrabber) {
    return 'ZOGGLE · Q/W/E abilities · Grabber · M Mutation role · cluster for auto Mut';
  }
  if (hasWeirdHero) {
    return 'ZOGGLE · Q Brain Zap · W Portal Trick · E Chaos · M Mutation role';
  }
  if (hasGrabber) {
    return 'Grabber · tanky melee · M locks Mutation · cluster allies for auto Mut';
  }
  return null;
}

function formationViewFor(
  units: BattlefieldUnit[],
): SelectionFormationView | null {
  const eligible = units.filter((u) => {
    if (u.team !== 'player' || u.hp <= 0 || u.speciesId !== 'nobles') {
      return false;
    }
    return !!getUnitType(u.typeId).usesFormation;
  });
  if (eligible.length === 0) return null;
  const locked = eligible.filter((u) => u.formationLocked).length;
  const formed = eligible.filter((u) => u.inFormation).length;
  return {
    eligible: eligible.length,
    formed,
    locked,
    allLocked: locked === eligible.length,
  };
}

function rageViewFor(units: BattlefieldUnit[]): SelectionRageView | null {
  const eligible = units.filter((u) => {
    if (u.team !== 'player' || u.hp <= 0 || u.speciesId !== 'brutes') {
      return false;
    }
    return !!getUnitType(u.typeId).canRage;
  });
  if (eligible.length === 0) return null;
  const locked = eligible.filter((u) => u.rageLocked).length;
  const enraged = eligible.filter((u) => u.enraged).length;
  let meter = 0;
  for (const u of eligible) {
    const m = u.rageLocked
      ? 1
      : Math.min(1, Math.max(0, (u.rageCombatMs ?? 0) / RAGE.lingerMs));
    if (m > meter) meter = m;
  }
  return {
    eligible: eligible.length,
    enraged,
    locked,
    allLocked: locked === eligible.length,
    meter,
  };
}

function mutationViewFor(
  units: BattlefieldUnit[],
): SelectionMutationView | null {
  const eligible = units.filter((u) => {
    if (u.team !== 'player' || u.hp <= 0 || u.speciesId !== 'weirdos') {
      return false;
    }
    return !!getUnitType(u.typeId).canMutate;
  });
  if (eligible.length === 0) return null;
  const locked = eligible.filter((u) => u.mutationLocked).length;
  const mutated = eligible.filter((u) => u.mutated).length;
  return {
    eligible: eligible.length,
    mutated,
    locked,
    allLocked: locked === eligible.length,
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
  const locale = getLocale();
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
    const form = view.formation
      ? `f${view.formation.eligible}:${view.formation.formed}:${view.formation.locked}:${view.formation.allLocked ? 1 : 0}`
      : '';
    const rage = view.rage
      ? `r${view.rage.eligible}:${view.rage.enraged}:${view.rage.locked}:${view.rage.allLocked ? 1 : 0}:${Math.round(view.rage.meter * 20)}`
      : '';
    const mut = view.mutation
      ? `m${view.mutation.eligible}:${view.mutation.mutated}:${view.mutation.locked}:${view.mutation.allLocked ? 1 : 0}`
      : '';
    return [
      locale,
      'u',
      view.count,
      view.title,
      view.dmg ?? '-',
      view.range ?? '-',
      view.tags.join(','),
      view.attackMoveArmed ? 1 : 0,
      abs,
      form,
      rage,
      mut,
      view.controlHint ?? '',
    ].join('|');
  }
  if (view.kind === 'resource') {
    return [
      locale,
      'r',
      view.resourceId,
      view.title,
      Math.floor(view.remaining),
      Math.floor(view.maxAmount),
    ].join('|');
  }
  return [
    locale,
    'b',
    view.title,
    view.ready ? 1 : 0,
    view.hasRally ? 1 : 0,
    view.rallyArmed ? 1 : 0,
    view.trains
      .map((t) => `${t.typeId}:${t.canPay ? 1 : 0}:${t.affordable ? 1 : 0}`)
      .join(','),
    view.places
      .map(
        (p) =>
          `${p.typeId}:${p.canPay ? 1 : 0}:${p.affordable ? 1 : 0}:${p.armed ? 1 : 0}`,
      )
      .join(','),
    view.queue.join(','),
    view.headName ?? '',
  ].join('|');
}

function trainCostHtml(gold: number, crystals: number): string {
  const bits = [
    `<span class="kane-sel-cost-gold">${t('sel.goldCost', { n: gold })}</span>`,
  ];
  if (crystals > 0) {
    bits.push(
      `<span class="kane-sel-cost-crystal">${t('sel.crystalCost', { n: crystals })}</span>`,
    );
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
      ? t('sel.needShort', { n: a.costCrystals })
      : t('sel.ready');
  const title = !a.ready
    ? ` title="${escapeHtml(t('sel.cooldown', { n: a.cdSec }))}"`
    : !a.canPay
      ? ` title="${t('sel.needCrystals', { n: a.costCrystals })}"`
      : ` title="${escapeHtml(t('sel.cast', { name: a.name, hotkey: a.hotkey }))}"`;
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
        ? t('sel.needShort', { n: a.costCrystals })
        : t('sel.ready');
  }
  if (!a.ready) btn.title = t('sel.cooldown', { n: a.cdSec });
  else if (!a.canPay) btn.title = t('sel.needCrystals', { n: a.costCrystals });
  else btn.title = t('sel.cast', { name: a.name, hotkey: a.hotkey });
}

function trainButtonHtml(unit: {
  typeId: UnitTypeId;
  name: string;
  costGold: number;
  costCrystals: number;
  canPay: boolean;
  affordable: boolean;
}): string {
  const classes = ['is-train'];
  if (!unit.affordable) classes.push('is-unaffordable');
  const reason = !unit.affordable
    ? !unit.canPay
      ? ` title="${t('sel.needResources')}"`
      : ` title="${t('sel.underConstruction')}"`
    : '';
  return `<button type="button" class="${classes.join(' ')}" data-act="train" data-type-id="${unit.typeId}"${unit.affordable ? '' : ' disabled'}${reason}><span class="kane-sel-train-name">${escapeHtml(unit.name)}</span>${trainCostHtml(unit.costGold, unit.costCrystals)}</button>`;
}

function placeButtonHtml(p: SelectionPlaceOption): string {
  const classes = ['is-train', 'is-place'];
  if (!p.affordable) classes.push('is-unaffordable');
  if (p.armed) classes.push('is-armed');
  const reason = !p.affordable
    ? !p.canPay
      ? ` title="${t('sel.needResources')}"`
      : ` title="${t('sel.keepBuilding')}"`
    : p.armed
      ? ` title="${t('sel.placeArmedTitle')}"`
      : ` title="${escapeHtml(t('sel.placeTitle', { name: p.name }))}"`;
  const label = p.armed ? t('sel.placeArmed', { name: p.name }) : p.name;
  return `<button type="button" class="${classes.join(' ')}" data-act="place" data-type-id="${p.typeId}"${p.affordable ? '' : ' disabled'}${reason}><span class="kane-sel-train-name">${escapeHtml(label)}</span>${trainCostHtml(p.costGold, p.costCrystals)}</button>`;
}

function formationCopy(f: SelectionFormationView): {
  name: string;
  sub: string;
  title: string;
} {
  const locked = f.allLocked;
  const stance = t(locked ? 'sel.stanceLocked' : 'sel.stanceAuto');
  const status =
    f.eligible === 1
      ? t(f.formed ? 'sel.inFormation' : 'sel.notFormed')
      : t('sel.formedCount', { formed: f.formed, eligible: f.eligible });
  return {
    name: t(locked ? 'sel.formLockOn' : 'sel.formLock'),
    sub: `${stance} · ${status}`,
    title: t(locked ? 'sel.formUnlock' : 'sel.formLockTitle'),
  };
}

function formationButtonHtml(f: SelectionFormationView): string {
  const copy = formationCopy(f);
  const classes = ['is-stance'];
  if (f.allLocked) classes.push('is-armed');
  return `<button type="button" class="${classes.join(' ')}" data-act="toggleFormation" title="${escapeHtml(copy.title)}"><span class="kane-sel-train-name">${escapeHtml(copy.name)}</span><span class="kane-sel-stance-sub">${escapeHtml(copy.sub)}</span></button>`;
}

function applyFormationButtonState(
  btn: HTMLButtonElement,
  f: SelectionFormationView,
): void {
  const copy = formationCopy(f);
  btn.classList.toggle('is-armed', f.allLocked);
  const name = btn.querySelector('.kane-sel-train-name');
  const sub = btn.querySelector('.kane-sel-stance-sub');
  if (name) name.textContent = copy.name;
  if (sub) sub.textContent = copy.sub;
  btn.title = copy.title;
}

function rageCopy(r: SelectionRageView): {
  name: string;
  sub: string;
  title: string;
} {
  const locked = r.allLocked;
  const stance = t(locked ? 'sel.rageLocked' : 'sel.rageAuto');
  const status =
    r.eligible === 1
      ? t(r.enraged ? 'sel.enraged' : 'sel.calm')
      : t('sel.hotCount', { hot: r.enraged, eligible: r.eligible });
  return {
    name: t(locked ? 'sel.rageLockOn' : 'sel.rageLockBtn'),
    sub: `${stance} · ${status}`,
    title: t(locked ? 'sel.rageUnlock' : 'sel.rageLockTitle'),
  };
}

function rageButtonHtml(r: SelectionRageView): string {
  const copy = rageCopy(r);
  const classes = ['is-rage'];
  if (r.allLocked) classes.push('is-armed');
  return `<button type="button" class="${classes.join(' ')}" data-act="toggleRage" title="${escapeHtml(copy.title)}"><span class="kane-sel-train-name">${escapeHtml(copy.name)}</span><span class="kane-sel-stance-sub">${escapeHtml(copy.sub)}</span></button>`;
}

function applyRageButtonState(
  btn: HTMLButtonElement,
  r: SelectionRageView,
): void {
  const copy = rageCopy(r);
  btn.classList.toggle('is-armed', r.allLocked);
  const name = btn.querySelector('.kane-sel-train-name');
  const sub = btn.querySelector('.kane-sel-stance-sub');
  if (name) name.textContent = copy.name;
  if (sub) sub.textContent = copy.sub;
  btn.title = copy.title;
}

function applyRageMeter(
  meterRoot: HTMLElement,
  fill: HTMLElement,
  label: HTMLElement,
  r: SelectionRageView | null,
): void {
  if (!r) {
    meterRoot.hidden = true;
    return;
  }
  meterRoot.hidden = false;
  const pct = Math.round(r.meter * 100);
  fill.style.width = `${pct}%`;
  fill.classList.toggle('is-locked', r.allLocked);
  const mode = t(r.allLocked ? 'sel.modeLocked' : 'sel.modeLinger');
  label.textContent =
    r.eligible === 1
      ? t('sel.rageMeter', { pct, mode })
      : t('sel.rageMeterHot', {
          pct,
          mode,
          hot: r.enraged,
          eligible: r.eligible,
        });
}

function mutationCopy(m: SelectionMutationView): {
  name: string;
  sub: string;
  title: string;
} {
  const locked = m.allLocked;
  const role = t(locked ? 'sel.roleLocked' : 'sel.roleAuto');
  const status =
    m.eligible === 1
      ? t(m.mutated ? 'sel.mutated' : 'sel.stable')
      : t('sel.mutatedCount', { mutated: m.mutated, eligible: m.eligible });
  return {
    name: t(locked ? 'sel.mutLockOn' : 'sel.mutLock'),
    sub: `${role} · ${status}`,
    title: t(locked ? 'sel.mutUnlock' : 'sel.mutLockTitle'),
  };
}

function mutationButtonHtml(m: SelectionMutationView): string {
  const copy = mutationCopy(m);
  const classes = ['is-mutation'];
  if (m.allLocked) classes.push('is-armed');
  return `<button type="button" class="${classes.join(' ')}" data-act="toggleMutation" title="${escapeHtml(copy.title)}"><span class="kane-sel-train-name">${escapeHtml(copy.name)}</span><span class="kane-sel-stance-sub">${escapeHtml(copy.sub)}</span></button>`;
}

function applyMutationButtonState(
  btn: HTMLButtonElement,
  m: SelectionMutationView,
): void {
  const copy = mutationCopy(m);
  btn.classList.toggle('is-armed', m.allLocked);
  const name = btn.querySelector('.kane-sel-train-name');
  const sub = btn.querySelector('.kane-sel-stance-sub');
  if (name) name.textContent = copy.name;
  if (sub) sub.textContent = copy.sub;
  btn.title = copy.title;
}

function applyTrainAffordability(
  btn: HTMLButtonElement,
  unit: { canPay: boolean; affordable: boolean },
): void {
  btn.disabled = !unit.affordable;
  btn.classList.toggle('is-unaffordable', !unit.affordable);
  if (!unit.affordable) {
    btn.title = !unit.canPay
      ? t('sel.needResources')
      : t('sel.underConstruction');
  } else {
    btn.removeAttribute('title');
  }
}

function queueLabelText(
  view: Extract<SelectionPanelView, { kind: 'building' }>,
): string {
  if (!view.ready) {
    return view.places.length ? t('sel.trainBuildLocked') : t('sel.trainLocked');
  }
  if (view.queue.length === 0) {
    if (view.trains.length) {
      return view.places.length ? t('sel.idleTrainBuild') : t('sel.idleTrain');
    }
    return view.places.length ? t('sel.placeIdle') : t('sel.noProduction');
  }
  const pct = Math.floor(view.progressPct * 100);
  const waiting = view.queue.length - 1;
  const hint = t('sel.cancelHint');
  if (view.headName && waiting > 0) {
    return t('sel.trainingWait', {
      name: view.headName,
      pct,
      waiting,
      hint,
    });
  }
  if (view.headName) {
    return t('sel.training', { name: view.headName, pct, hint });
  }
  return t('sel.queue', { n: view.queue.length, hint });
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
  const carryEl = root.querySelector('[data-role="carry"]') as HTMLElement;
  const stats = root.querySelector('[data-role="stats"]') as HTMLElement;
  const meterRoot = root.querySelector('[data-role="meter"]') as HTMLElement;
  const meterFill = root.querySelector(
    '[data-role="meter-fill"]',
  ) as HTMLElement;
  const meterLabel = root.querySelector(
    '[data-role="meter-label"]',
  ) as HTMLElement;
  const controlHintEl = root.querySelector(
    '[data-role="control-hint"]',
  ) as HTMLElement;
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
    carryEl.hidden = true;
    carryEl.textContent = '';
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
    meterRoot.hidden = true;
    controlHintEl.hidden = true;
    if (structuralChange) {
      const label =
        view.resourceId === 'magic_crystals'
          ? t('sel.crystalsLeft')
          : t('sel.goldLeft');
      stats.innerHTML = `<span>${label}  ·  ${Math.floor(view.remaining)}</span>`;
      actions.innerHTML = '';
    } else {
      const label =
        view.resourceId === 'magic_crystals'
          ? t('sel.crystalsLeft')
          : t('sel.goldLeft');
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
      if (view.carryLine) {
        carryEl.hidden = false;
        carryEl.textContent = view.carryLine;
        carryEl.classList.toggle('is-crystal', view.carryCrystal);
      } else {
        carryEl.hidden = true;
        carryEl.textContent = '';
        carryEl.classList.remove('is-crystal');
      }
      portrait.classList.toggle('is-building', false);
      portrait.classList.toggle('is-mixed', view.count > 1 && view.dmg == null);
      portrait.style.setProperty('--kane-sel-accent', '#f0c75e');
      if (structuralChange) {
        const bits: string[] = [];
        if (view.dmg != null) bits.push(`<span>${t('sel.atk')} ${view.dmg}</span>`);
        if (view.range != null) bits.push(`<span>${t('sel.rng')} ${view.range}</span>`);
        for (const t of view.tags) bits.push(`<span>${escapeHtml(t)}</span>`);
        stats.innerHTML = bits.join('');
        const abilityHtml = view.abilities
          ? view.abilities.map(abilityButtonHtml).join('')
          : '';
        const formHtml = view.formation
          ? formationButtonHtml(view.formation)
          : '';
        const rageHtml = view.rage ? rageButtonHtml(view.rage) : '';
        const mutHtml = view.mutation
          ? mutationButtonHtml(view.mutation)
          : '';
        actions.innerHTML = `
        <button type="button" data-act="stop">${t('hud.stop')}</button>
        <button type="button" data-act="attackMove" class="${view.attackMoveArmed ? 'is-armed' : ''}">${view.attackMoveArmed ? t('sel.atkArmed') : t('sel.atkMove')}</button>
        ${formHtml}
        ${rageHtml}
        ${mutHtml}
        ${abilityHtml}
      `;
      } else {
        const am = actions.querySelector(
          '[data-act="attackMove"]',
        ) as HTMLButtonElement | null;
        if (am) {
          am.classList.toggle('is-armed', view.attackMoveArmed);
          am.textContent = view.attackMoveArmed
            ? t('sel.atkArmed')
            : t('sel.atkMove');
        }
        if (view.abilities) {
          for (const a of view.abilities) {
            const btn = actions.querySelector(
              `button[data-slot="${a.slot}"]`,
            ) as HTMLButtonElement | null;
            if (btn) applyAbilityButtonState(btn, a);
          }
        }
        if (view.formation) {
          const fb = actions.querySelector(
            '[data-act="toggleFormation"]',
          ) as HTMLButtonElement | null;
          if (fb) applyFormationButtonState(fb, view.formation);
        }
        if (view.rage) {
          const rb = actions.querySelector(
            '[data-act="toggleRage"]',
          ) as HTMLButtonElement | null;
          if (rb) applyRageButtonState(rb, view.rage);
        }
        if (view.mutation) {
          const mb = actions.querySelector(
            '[data-act="toggleMutation"]',
          ) as HTMLButtonElement | null;
          if (mb) applyMutationButtonState(mb, view.mutation);
        }
      }
      applyRageMeter(meterRoot, meterFill, meterLabel, view.rage);
      if (view.controlHint) {
        controlHintEl.hidden = false;
        controlHintEl.textContent = view.controlHint;
      } else {
        controlHintEl.hidden = true;
        controlHintEl.textContent = '';
      }
      queue.hidden = true;
    } else {
      carryEl.hidden = true;
      carryEl.textContent = '';
      meterRoot.hidden = true;
      controlHintEl.hidden = true;
      portrait.classList.add('is-building');
      portrait.classList.remove('is-mixed');
      portrait.style.setProperty('--kane-sel-accent', '#3d7ea6');
      if (structuralChange) {
        const bits: string[] = [];
        if (view.trains.length) bits.push(`<span>${t('sel.production')}</span>`);
        if (view.places.length) bits.push(`<span>${t('sel.build')}</span>`);
        if (bits.length === 0) bits.push(`<span>${t('sel.noProductionStat')}</span>`);
        stats.innerHTML = bits.join('');
        const rallyBtn = view.hasRally
          ? `<button type="button" class="is-rally${view.rallyArmed ? ' is-armed' : ''}" data-act="rally">${view.rallyArmed ? t('sel.rallyArmed') : t('sel.setRally')}</button>`
          : '';
        const cancelBtn =
          view.queue.length > 0
            ? `<button type="button" class="is-cancel" data-act="cancelQueue" title="${t('sel.cancelTitle')}">${t('sel.cancelLast')}</button>`
            : '';
        actions.innerHTML =
          rallyBtn +
          cancelBtn +
          view.trains.map(trainButtonHtml).join('') +
          view.places.map(placeButtonHtml).join('');
      } else {
        for (const t of view.trains) {
          const btn = actions.querySelector(
            `button[data-act="train"][data-type-id="${t.typeId}"]`,
          ) as HTMLButtonElement | null;
          if (btn) applyTrainAffordability(btn, t);
        }
        for (const p of view.places) {
          const btn = actions.querySelector(
            `button[data-act="place"][data-type-id="${p.typeId}"]`,
          ) as HTMLButtonElement | null;
          if (!btn) continue;
          applyTrainAffordability(btn, p);
          btn.classList.toggle('is-armed', p.armed);
          const nameEl = btn.querySelector('.kane-sel-train-name');
          if (nameEl) {
            nameEl.textContent = p.armed
              ? t('sel.placeArmed', { name: p.name })
              : p.name;
          }
          if (!p.affordable) {
            btn.title = !p.canPay
              ? t('sel.needResources')
              : t('sel.keepBuilding');
          } else {
            btn.title = p.armed
              ? t('sel.placeArmedTitle')
              : t('sel.placeTitle', { name: p.name });
          }
        }
        const rally = actions.querySelector(
          '[data-act="rally"]',
        ) as HTMLButtonElement | null;
        if (rally) {
          rally.classList.toggle('is-armed', view.rallyArmed);
          rally.textContent = view.rallyArmed
            ? t('sel.rallyArmed')
            : t('sel.setRally');
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
                  return `<button type="button" class="kane-sel-qicon${i === 0 ? ' is-active' : ''}" data-act="cancelQueue" data-queue-index="${i}" title="${t('sel.cancelOne', { name: escapeHtml(u.name) })}">${label}<span class="kane-sel-qnum">${i + 1}</span></button>`;
                })
                .join('') +
              (overflow > 0
                ? `<span class="kane-sel-qicon" title="${t('sel.overflow', { n: overflow })}" style="cursor:default">+${overflow}</span>`
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
