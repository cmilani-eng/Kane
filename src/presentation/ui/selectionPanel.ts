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
import { unitArmorClass } from '../../data/unitArmorClass';
import { getUnitType, type UnitTypeId } from '../../data/units';
import { buildingArmorClassLabel } from './buildingArmorClass';
import { buildingBuildCostLabel } from './buildingBuildCost';
import { buildingBuildTimeLabel } from './buildingBuildTime';
import { buildingHpMaxLabel } from './buildingHpMax';
import {
  sharedUnitAttackCooldownLabel,
  unitAttackCooldownLabel,
} from './unitAttackCooldown';
import { attackRangeLabel } from './unitAttackRange';
import { sharedUnitDpsLabel, unitDpsLabel } from './unitDps';
import {
  sharedUnitMoveSpeedLabel,
  unitMoveSpeedLabel,
} from './unitMoveSpeed';
import { sharedUnitHpMaxLabel, unitHpMaxLabel } from './unitHpMax';
import {
  sharedUnitSupplyCostLabel,
  unitSupplyCostLabel,
} from './unitSupplyCost';
import {
  sharedUnitRoleLabel,
  unitRoleLabel,
} from './unitRole';
import {
  sharedUnitNameTipLabel,
  unitNameTipLabel,
} from './unitNameTip';
import {
  sharedUnitSpeciesTipLabel,
  unitSpeciesTipLabel,
} from './unitSpeciesTip';
import {
  sharedUnitTrainCrystalLabel,
  unitTrainCrystalLabel,
} from './unitTrainCrystal';
import {
  sharedUnitTrainDurationLabel,
  unitTrainDurationLabel,
} from './unitTrainDuration';
import {
  sharedUnitTrainGoldLabel,
  unitTrainGoldLabel,
} from './unitTrainGold';
import { sharedUnitVisionLabel, unitVisionLabel } from './unitVision';
import type {
  BattlefieldBuilding,
  BattlefieldUnit,
  BattlefieldWorld,
  ResourceNode,
} from '../../gameplay/battlefield/battlefieldWorld';
import { canAfford } from '../../gameplay/battlefield/battlefieldBuildings';
import { buildingHasCustomRally } from '../../gameplay/battlefield/battlefieldRally';
import { rallyDistanceTiles } from '../../gameplay/battlefield/rallyDistance';

function matchupLine(id: SpeciesId): string {
  const tip = SPECIES_MATCHUP_TIP[id];
  return t('sel.matchup', {
    strong: speciesName(tip.strongVs),
    weak: speciesName(tip.weakVs),
  });
}

/** Localized armor / role class for a unit type (HUD label only). */
export function armorClassLabel(typeId: UnitTypeId): string {
  const role = unitArmorClass(typeId);
  return t('sel.armorClass', { role: t(`sel.armor.${role}`) });
}

/** Set-rally / armed button copy with tile distance (panel echo of world flag). */
export function rallyButtonLabel(armed: boolean, tiles: number): string {
  const base = armed ? t('sel.rallyArmed') : t('sel.setRally');
  return `${base} · ${t('hud.rallyDist', { n: tiles })}`;
}

function sharedArmorClassLabel(
  units: BattlefieldUnit[],
): string | null {
  if (units.length === 0) return null;
  const first = unitArmorClass(units[0]!.typeId);
  for (let i = 1; i < units.length; i++) {
    if (unitArmorClass(units[i]!.typeId) !== first) return null;
  }
  return armorClassLabel(units[0]!.typeId);
}
import {
  GATHER,
  walletOf,
} from '../../gameplay/battlefield/battlefieldEconomy';
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

export type SelectionPanelHandlers = {
  stop: () => void;
  attackMove: () => void;
  train: (typeId: UnitTypeId) => void;
  /** Arm rally-set mode for the selected production building. */
  rally: () => void;
  /** Reset rally to the default near-building point. */
  clearRally: () => void;
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
      kind: 'empty';
      title: string;
      flavor: string;
    }
  | {
      kind: 'units';
      count: number;
      title: string;
      flavor: string;
      hp: number;
      maxHp: number;
      dmg: number | null;
      range: number | null;
      /** GDD role / armor class label when selection shares one class. */
      armorClass: string | null;
      /** Catalog DPS tip when selection shares one unit type. */
      dpsTip: string | null;
      /** Catalog move-speed tip when selection shares one unit type. */
      speedTip: string | null;
      /** Catalog vision-radius tip when selection shares one unit type. */
      visionTip: string | null;
      /** Catalog max-HP tip when selection shares one unit type. */
      hpMaxTip: string | null;
      /** Catalog attack-cooldown tip when selection shares one unit type. */
      atkCdTip: string | null;
      /** Catalog supply-cost tip when selection shares one unit type. */
      supplyTip: string | null;
      /** Catalog train gold-cost tip when selection shares one unit type. */
      trainGoldTip: string | null;
      /** Catalog train crystal-cost tip when selection shares one unit type. */
      trainCrystalTip: string | null;
      /** Catalog full train-duration tip when selection shares one unit type. */
      trainDurationTip: string | null;
      /** Coarse duty role tip (worker / combat / hero), distinct from armor class. */
      roleTip: string | null;
      /** Species name tip when selection shares one species. */
      speciesTip: string | null;
      /** Catalog unit name tip when selection shares one unit type. */
      nameTip: string | null;
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
      /** True when haul is at capacity (deposit hint). */
      carryFull: boolean;
    }
  | {
      kind: 'building';
      title: string;
      flavor: string;
      hp: number;
      maxHp: number;
      /** Catalog max-HP tip for the selected building type. */
      hpMaxTip: string | null;
      /** Armor · Structure tip for the selected building type. */
      armorClass: string | null;
      /** Catalog build gold/crystal cost tip (omitted when free). */
      buildCostTip: string | null;
      /** Catalog full build-time tip (omitted when buildMs is 0). */
      buildTimeTip: string | null;
      /** Building finished construction (can start training). */
      ready: boolean;
      /** 0–1 construction progress while incomplete. */
      buildPct: number;
      /** Whole seconds left on construction (ceil); 0 when ready. */
      buildRemainSec: number;
      trains: {
        typeId: UnitTypeId;
        name: string;
        costGold: number;
        costCrystals: number;
        /** Full train duration in whole seconds (ceil of trainMs). */
        trainSec: number;
        /** Wallet can cover gold + crystals. */
        canPay: boolean;
        /** Ready + canPay — button enabled. */
        affordable: boolean;
      }[];
      /** Placeable buildings when Keep / main hall is selected. */
      places: SelectionPlaceOption[];
      queue: UnitTypeId[];
      progressPct: number;
      /** Whole seconds left on the head train slot (ceil). */
      remainSec: number;
      /** Head remain + full trainSec for each waiting slot (ceil). */
      totalSec: number;
      headName: string | null;
      rallyArmed: boolean;
      hasRally: boolean;
      /** Rally differs from the default march point. */
      hasCustomRally: boolean;
      /** Tile distance from producer to current rally (panel echo). */
      rallyDistTiles: number;
    }
  | {
      kind: 'resource';
      title: string;
      flavor: string;
      remaining: number;
      maxAmount: number;
      resourceId: 'gold' | 'magic_crystals';
      /** Gather amount-per-trip tip (and active count when workers are on this node). */
      gatherTip: string;
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
    else if (act === 'clearRally') handlers.clearRally();
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

export function mountSelectionPanel(next: SelectionPanelHandlers): void {
  handlers = next;
  ensureSelectionPanel();
}

/** Build refund toast copy including Gold / Crystal amounts. */
export function formatQueueCancelFlash(opts: {
  unitName?: string;
  gold: number;
  crystals: number;
}): string {
  const parts: string[] = [];
  if (opts.gold > 0) parts.push(t('sel.goldCost', { n: opts.gold }));
  if (opts.crystals > 0) parts.push(t('sel.crystalCost', { n: opts.crystals }));
  if (parts.length === 0) {
    return opts.unitName
      ? t('sel.cancelFlashNamed', { name: opts.unitName })
      : t('sel.cancelFlash');
  }
  const resources = parts.join(' · ');
  return opts.unitName
    ? t('sel.cancelFlashNamedRes', { name: opts.unitName, resources })
    : t('sel.cancelFlashRes', { resources });
}

export type StanceHotkeyKind = 'formation' | 'rage' | 'mutation';

const STANCE_HOTKEY_ACT: Record<StanceHotkeyKind, string> = {
  formation: 'toggleFormation',
  rage: 'toggleRage',
  mutation: 'toggleMutation',
};

/** Brief gold flash on the stance button when F / R / M is pressed. */
export function flashStanceHotkey(kind: StanceHotkeyKind): void {
  const root = document.getElementById(PANEL_ID);
  if (!root) return;
  const btn = root.querySelector(
    `[data-act="${STANCE_HOTKEY_ACT[kind]}"]`,
  ) as HTMLElement | null;
  if (!btn) return;
  btn.classList.remove('is-hotkey-echo');
  void btn.offsetWidth;
  btn.classList.add('is-hotkey-echo');
  window.setTimeout(() => btn.classList.remove('is-hotkey-echo'), 320);
}

/** Brief queue-row flash + refund copy after a successful cancel. */
export function flashQueueCancel(opts: {
  unitName?: string;
  gold: number;
  crystals: number;
}): void {
  const root = document.getElementById(PANEL_ID);
  if (!root) return;
  const queue = root.querySelector('[data-role="queue"]') as HTMLElement | null;
  const label = root.querySelector(
    '[data-role="queue-label"]',
  ) as HTMLElement | null;
  if (!queue || queue.hidden) return;
  queue.classList.remove('is-cancel-flash');
  // Force reflow so rapid cancels retrigger the animation.
  void queue.offsetWidth;
  queue.classList.add('is-cancel-flash');
  if (label) {
    label.classList.add('is-flash');
    label.textContent = formatQueueCancelFlash(opts);
  }
  window.setTimeout(() => {
    queue.classList.remove('is-cancel-flash');
    label?.classList.remove('is-flash');
  }, 420);
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
export function selectionPanelInsetPx(
  visible: boolean,
  empty = false,
): number {
  if (!visible) return 0;
  const narrow =
    typeof window !== 'undefined' ? window.innerWidth < 720 : false;
  const short =
    typeof window !== 'undefined' ? window.innerHeight < 500 : false;
  // Compact empty tip — less HUD lift than a full selection card.
  if (empty) {
    if (short) return 72;
    return narrow ? 96 : 88;
  }
  // iPhone 17 landscape is only ~402px tall, so the panel stays shorter.
  if (short) return 120;
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
        trainSec: trainFullSec(u.trainMs),
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
    const remainSec =
      head && head.trainMs > 0
        ? trainRemainSec(head.trainMs, b.trainProgressMs)
        : 0;
    const totalSec = trainQueueTotalSec(b.trainQueue, remainSec);
    const buildPct = ready
      ? 1
      : Math.min(1, Math.max(0, b.buildProgress));
    const buildRemain = ready
      ? 0
      : buildRemainSec(b.buildMs, b.buildProgress);
    const flavorBase = `${species.name} · ${species.mechanic} · ${matchupLine(bdef.speciesId)}`;
    return {
      kind: 'building',
      title: b.name,
      flavor: ready
        ? flavorBase
        : `${flavorBase} · ${t('sel.buildingPct', {
            pct: Math.floor(buildPct * 100),
            sec: buildRemain,
          })}`,
      hp: b.hp,
      maxHp: b.maxHp,
      hpMaxTip: buildingHpMaxLabel(b.typeId),
      armorClass: buildingArmorClassLabel(b.typeId),
      buildCostTip: buildingBuildCostLabel(b.typeId),
      buildTimeTip: buildingBuildTimeLabel(b.typeId),
      ready,
      buildPct,
      buildRemainSec: buildRemain,
      trains,
      places,
      queue: [...b.trainQueue],
      progressPct,
      remainSec,
      totalSec,
      headName: head?.name ?? null,
      rallyArmed,
      hasRally: trains.length > 0,
      hasCustomRally:
        trains.length > 0 && buildingHasCustomRally(b),
      rallyDistTiles:
        trains.length > 0 ? rallyDistanceTiles(b) : 0,
    };
  }

  if (selectedNode && selectedNode.remaining > 0) {
    const def = RESOURCES[selectedNode.resourceId];
    const gathering = world.units.filter(
      (u) =>
        u.team === 'player' &&
        u.hp > 0 &&
        u.canGather &&
        u.gatherNodeId === selectedNode.id,
    ).length;
    const perTrip = GATHER.amountPerTrip;
    const gatherTip =
      gathering > 0
        ? t('sel.gatherTipActive', { count: gathering, n: perTrip })
        : t('sel.gatherTip', { n: perTrip });
    return {
      kind: 'resource',
      title: def.label,
      flavor: t('sel.gather', { source: def.source }),
      remaining: selectedNode.remaining,
      maxAmount: selectedNode.maxAmount,
      resourceId: selectedNode.resourceId,
      gatherTip,
    };
  }

  const alive = units.filter((u) => u.hp > 0);
  if (alive.length === 0) {
    return {
      kind: 'empty',
      title: t('sel.emptyTitle'),
      flavor: t('sel.emptyTip'),
    };
  }

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
      armorClass: armorClassLabel(u.typeId),
      dpsTip: unitDpsLabel(u.typeId),
      speedTip: unitMoveSpeedLabel(u.typeId),
      visionTip: unitVisionLabel(u.typeId),
      hpMaxTip: unitHpMaxLabel(u.typeId),
      atkCdTip: unitAttackCooldownLabel(u.typeId),
      supplyTip: unitSupplyCostLabel(u.typeId),
      trainGoldTip: unitTrainGoldLabel(u.typeId),
      trainCrystalTip: unitTrainCrystalLabel(u.typeId),
      trainDurationTip: unitTrainDurationLabel(u.typeId),
      roleTip: unitRoleLabel(u.typeId),
      speciesTip: unitSpeciesTipLabel(u.speciesId),
      nameTip: unitNameTipLabel(u.typeId),
      tags,
      attackMoveArmed,
      abilities: heroAbilityViews(world, u),
      formation: formationViewFor(alive),
      rage: rageViewFor(alive),
      mutation: mutationViewFor(alive),
      controlHint: controlHintFor(world, alive),
      carryLine: carry.line,
      carryCrystal: carry.crystal,
      carryFull: carry.full,
    };
  }

  const types = new Set(alive.map((u) => u.typeId));
  const mixed = types.size > 1;
  const typeCounts = typeCountLine(alive, 3);
  const title = mixed
    ? typeCounts
    : `${alive[0]!.name} ×${alive.length}`;
  const speciesIds = new Set(alive.map((u) => u.speciesId));
  const flavor = mixed
    ? speciesIds.size === 1
      ? `${speciesName(alive[0]!.speciesId)} · ${t('sel.selected', { n: alive.length })} · ${matchupLine(alive[0]!.speciesId)}`
      : `${t('sel.mixedSpecies', { n: alive.length })} · ${typeCounts}`
    : speciesIds.size === 1
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
    armorClass: sharedArmorClassLabel(alive),
    dpsTip: sharedUnitDpsLabel(alive.map((u) => u.typeId)),
    speedTip: sharedUnitMoveSpeedLabel(alive.map((u) => u.typeId)),
    visionTip: sharedUnitVisionLabel(alive.map((u) => u.typeId)),
    hpMaxTip: sharedUnitHpMaxLabel(alive.map((u) => u.typeId)),
    atkCdTip: sharedUnitAttackCooldownLabel(alive.map((u) => u.typeId)),
    supplyTip: sharedUnitSupplyCostLabel(alive.map((u) => u.typeId)),
    trainGoldTip: sharedUnitTrainGoldLabel(alive.map((u) => u.typeId)),
    trainCrystalTip: sharedUnitTrainCrystalLabel(alive.map((u) => u.typeId)),
    trainDurationTip: sharedUnitTrainDurationLabel(alive.map((u) => u.typeId)),
    roleTip: sharedUnitRoleLabel(alive.map((u) => u.typeId)),
    speciesTip: sharedUnitSpeciesTipLabel(alive.map((u) => u.speciesId)),
    nameTip: sharedUnitNameTipLabel(alive.map((u) => u.typeId)),
    tags,
    attackMoveArmed,
    abilities: null,
    formation: formationViewFor(alive),
    rage: rageViewFor(alive),
    mutation: mutationViewFor(alive),
    controlHint: controlHintFor(world, alive),
    carryLine: carry.line,
    carryCrystal: carry.crystal,
    carryFull: carry.full,
  };
}

/** Compact “Name ×n · …” breakdown for multi-select. */
export function typeCountLine(
  units: BattlefieldUnit[],
  maxTypes = 4,
): string {
  const counts = new Map<string, { name: string; n: number }>();
  for (const u of units) {
    if (u.hp <= 0) continue;
    const cur = counts.get(u.typeId);
    if (cur) cur.n += 1;
    else counts.set(u.typeId, { name: u.name, n: 1 });
  }
  const parts = [...counts.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  if (parts.length === 0) return t('sel.mixed', { n: 0 });
  const shown = parts.slice(0, maxTypes);
  const overflow = parts.length - shown.length;
  let line = shown
    .map((p) => t('sel.typeCount', { name: p.name, n: p.n }))
    .join(' · ');
  if (overflow > 0) {
    line += ` · ${t('sel.typeOverflow', { n: overflow })}`;
  }
  return line;
}

/** Visible cargo readout for selected workers (single or group). */
export function carryLineFor(
  units: BattlefieldUnit[],
): { line: string | null; crystal: boolean; full: boolean } {
  const carriers = units.filter(
    (u) => u.hp > 0 && u.carrying > 0 && u.carryingResource,
  );
  if (carriers.length === 0) {
    return { line: null, crystal: false, full: false };
  }
  const total = carriers.reduce((s, u) => s + u.carrying, 0);
  const cap = carriers.reduce((s, u) => s + (u.carryCapacity || 0), 0);
  const n = Math.floor(total);
  const capN = Math.max(n, Math.floor(cap));
  const full = capN > 0 && n >= capN;
  const resources = new Set(
    carriers.map((u) => u.carryingResource).filter(Boolean),
  );
  if (resources.size === 1) {
    const id = carriers[0]!.carryingResource!;
    return {
      line: t(full ? 'sel.cargoFull' : 'sel.cargo', {
        n,
        cap: capN,
        resource: RESOURCES[id].label,
      }),
      crystal: id === 'magic_crystals',
      full,
    };
  }
  return {
    line: t(full ? 'sel.cargoMixedFull' : 'sel.cargoMixed', {
      n,
      cap: capN,
    }),
    crystal: false,
    full,
  };
}

/** Quiet F-hotkey tip with formed/eligible count for Nobles. */
function formationCountTip(f: SelectionFormationView): string {
  const count =
    f.eligible === 1
      ? t(f.formed ? 'sel.inFormation' : 'sel.notFormed')
      : t('sel.formedCount', { formed: f.formed, eligible: f.eligible });
  return `${t('sel.formationTip')} · ${count}`;
}

/** Append live remaining cooldown when the hero ability is recharging. */
function abilityNameWithCd(name: string, cdSec: number): string {
  return cdSec > 0 ? `${name} (${t('hud.heroCd', { sec: cdSec })})` : name;
}

function controlHintFor(
  world: BattlefieldWorld,
  units: BattlefieldUnit[],
): string | null {
  const player = units.filter((u) => u.team === 'player' && u.hp > 0);
  if (player.length === 0) return null;
  const hasGrabber = player.some((u) => u.typeId === 'grabber');
  const formation = formationViewFor(units);
  const hero = player.find((u) => !!getUnitType(u.typeId).isHero);
  if (hero) {
    const def = heroForSpecies(hero.speciesId);
    if (def) {
      const q = def.abilities.ability1;
      const w = def.abilities.ability2;
      const e = def.abilities.ultimate;
      const cds = heroAbilityViews(world, hero);
      const qCd = cds?.find((a) => a.slot === 'ability1')?.cdSec ?? 0;
      const wCd = cds?.find((a) => a.slot === 'ability2')?.cdSec ?? 0;
      const eCd = cds?.find((a) => a.slot === 'ultimate')?.cdSec ?? 0;
      let tip = t('sel.heroHotkeys', {
        q: q.hotkey,
        qName: abilityNameWithCd(q.name, qCd),
        w: w.hotkey,
        wName: abilityNameWithCd(w.name, wCd),
        e: e.hotkey,
        eName: abilityNameWithCd(e.name, eCd),
      });
      if (hero.speciesId === 'weirdos' && hasGrabber) {
        tip = `${tip} · ${t('sel.grabberMutTip')}`;
      } else if (hero.speciesId === 'weirdos') {
        tip = `${tip} · ${t('sel.mutationTip')}`;
      } else if (hero.speciesId === 'nobles') {
        tip = formation
          ? `${tip} · ${formationCountTip(formation)}`
          : `${tip} · ${t('sel.formationTip')}`;
      } else if (hero.speciesId === 'brutes') {
        tip = `${tip} · ${t('sel.rageTip')}`;
      }
      return tip;
    }
  }
  if (hasGrabber) {
    return t('sel.grabberTip');
  }
  if (formation) {
    return formationCountTip(formation);
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
  if (view.kind === 'empty') return `e|${locale}|${view.title}|${view.flavor}`;
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
      view.armorClass ?? '',
      view.dpsTip ?? '',
      view.speedTip ?? '',
      view.visionTip ?? '',
      view.hpMaxTip ?? '',
      view.atkCdTip ?? '',
      view.supplyTip ?? '',
      view.trainGoldTip ?? '',
      view.trainCrystalTip ?? '',
      view.trainDurationTip ?? '',
      view.roleTip ?? '',
      view.speciesTip ?? '',
      view.nameTip ?? '',
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
      view.gatherTip,
    ].join('|');
  }
  return [
    locale,
    'b',
    view.title,
    view.ready ? 1 : 0,
    view.hasRally ? 1 : 0,
    view.hasCustomRally ? 1 : 0,
    view.rallyArmed ? 1 : 0,
    view.rallyDistTiles,
    view.hpMaxTip ?? '',
    view.armorClass ?? '',
    view.buildCostTip ?? '',
    view.buildTimeTip ?? '',
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
    view.remainSec,
    view.totalSec,
    view.headName ?? '',
  ].join('|');
}

function trainCostHtml(
  gold: number,
  crystals: number,
  trainSec = 0,
): string {
  const bits = [
    `<span class="kane-sel-cost-gold">${t('sel.goldCost', { n: gold })}</span>`,
  ];
  if (crystals > 0) {
    bits.push(
      `<span class="kane-sel-cost-crystal">${t('sel.crystalCost', { n: crystals })}</span>`,
    );
  }
  if (trainSec > 0) {
    bits.push(
      `<span class="kane-sel-cost-sec">${escapeHtml(t('sel.trainSec', { sec: trainSec }))}</span>`,
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
    ? t('sel.cooldown', { n: a.cdSec })
    : !a.canPay
      ? t('sel.needShort', { n: a.costCrystals })
      : t('sel.ready');
  const title = !a.ready
    ? ` title="${escapeHtml(t('sel.cooldown', { n: a.cdSec }))}"`
    : !a.canPay
      ? ` title="${t('sel.needCrystals', { n: a.costCrystals })}"`
      : ` title="${escapeHtml(t('sel.cast', { name: a.name, hotkey: a.hotkey }))}"`;
  return `<button type="button" class="${classes.join(' ')}" data-act="castAbility" data-slot="${a.slot}"${castable ? '' : ' disabled'}${title}><span class="kane-sel-ability-name">${escapeHtml(a.hotkey)} · ${escapeHtml(a.name)}</span><span class="kane-sel-ability-cd">${escapeHtml(cdLabel)}</span></button>`;
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
      ? t('sel.cooldown', { n: a.cdSec })
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
  trainSec: number;
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
  return `<button type="button" class="${classes.join(' ')}" data-act="train" data-type-id="${unit.typeId}"${unit.affordable ? '' : ' disabled'}${reason}><span class="kane-sel-train-name">${escapeHtml(unit.name)}</span>${trainCostHtml(unit.costGold, unit.costCrystals, unit.trainSec)}</button>`;
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

/** Whole seconds for a full train from trainMs. */
export function trainFullSec(trainMs: number): number {
  if (trainMs <= 0) return 0;
  return Math.max(0, Math.ceil(trainMs / 1000));
}

/** Whole seconds left on the active train slot (ceil, never negative). */
export function trainRemainSec(
  trainMs: number,
  trainProgressMs: number,
): number {
  if (trainMs <= 0) return 0;
  return Math.max(0, Math.ceil((trainMs - trainProgressMs) / 1000));
}

/** Head remain + full duration for each waiting queue slot. */
export function trainQueueTotalSec(
  queue: readonly UnitTypeId[],
  remainSec: number,
): number {
  if (queue.length === 0) return 0;
  let total = Math.max(0, remainSec);
  for (let i = 1; i < queue.length; i++) {
    total += trainFullSec(getUnitType(queue[i]!).trainMs);
  }
  return total;
}

/** Whole seconds left on construction from buildMs × remaining progress. */
export function buildRemainSec(
  buildMs: number,
  buildProgress: number,
): number {
  if (buildMs <= 0) return 0;
  const p = Math.min(1, Math.max(0, buildProgress));
  return Math.max(0, Math.ceil((buildMs * (1 - p)) / 1000));
}

function queueLabelText(
  view: Extract<SelectionPanelView, { kind: 'building' }>,
): string {
  if (!view.ready) {
    return t('sel.buildingPct', {
      pct: Math.floor(view.buildPct * 100),
      sec: view.buildRemainSec,
    });
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
  const sec = view.remainSec;
  if (view.headName && waiting > 0) {
    return t('sel.trainingWait', {
      name: view.headName,
      pct,
      sec,
      waiting,
      total: view.totalSec,
      hint,
    });
  }
  if (view.headName) {
    return t('sel.training', { name: view.headName, pct, sec, hint });
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
    root.classList.remove('is-visible', 'is-empty');
    return false;
  }

  const structuralChange = lastStructureSig !== structSig;
  lastStructureSig = structSig;
  lastVisible = true;
  root.classList.add('is-visible');
  root.classList.toggle('is-empty', view.kind === 'empty');

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

  if (view.kind === 'empty') {
    carryEl.hidden = true;
    carryEl.textContent = '';
    hpFill.style.width = '0%';
    hpFill.classList.remove('is-low', 'is-building');
    hpText.classList.remove('is-low');
    hpText.textContent = '';
    portrait.classList.remove('is-building', 'is-mixed');
    meterRoot.hidden = true;
    controlHintEl.hidden = true;
    controlHintEl.textContent = '';
    if (structuralChange) {
      stats.innerHTML = '';
      actions.innerHTML = '';
    }
    queue.hidden = true;
    return true;
  }

  if (view.kind === 'resource') {
    carryEl.hidden = true;
    carryEl.textContent = '';
    const remPct =
      view.maxAmount > 0
        ? Math.min(1, Math.max(0, view.remaining / view.maxAmount))
        : 0;
    hpFill.style.width = `${(remPct * 100).toFixed(1)}%`;
    hpFill.classList.toggle('is-low', remPct < 0.35);
    hpFill.classList.remove('is-building');
    hpText.classList.toggle('is-low', remPct < 0.35);
    hpText.textContent = `${Math.floor(view.remaining)}/${Math.floor(view.maxAmount)}`;
    portrait.classList.toggle('is-building', false);
    portrait.classList.toggle('is-mixed', false);
    portrait.style.setProperty(
      '--kane-sel-accent',
      view.resourceId === 'magic_crystals' ? '#7ec8ff' : '#f0c75e',
    );
    meterRoot.hidden = true;
    controlHintEl.hidden = false;
    controlHintEl.textContent = view.gatherTip;
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
    const lowHp =
      hpPct < 0.35 && !(view.kind === 'building' && !view.ready);
    hpFill.classList.toggle('is-low', lowHp);
    hpFill.classList.toggle(
      'is-building',
      view.kind === 'building' && !view.ready,
    );
    hpText.classList.toggle('is-low', lowHp);
    hpText.textContent = `${Math.ceil(view.hp)}/${Math.ceil(view.maxHp)}`;

    if (view.kind === 'units') {
      if (view.carryLine) {
        carryEl.hidden = false;
        carryEl.textContent = view.carryLine;
        carryEl.classList.toggle('is-crystal', view.carryCrystal);
        carryEl.classList.toggle('is-full', view.carryFull);
      } else {
        carryEl.hidden = true;
        carryEl.textContent = '';
        carryEl.classList.remove('is-crystal', 'is-full');
      }
      portrait.classList.toggle('is-building', false);
      portrait.classList.toggle('is-mixed', view.count > 1 && view.dmg == null);
      portrait.style.setProperty('--kane-sel-accent', '#f0c75e');
      if (structuralChange) {
        const bits: string[] = [];
        if (view.dmg != null) bits.push(`<span>${t('sel.atk')} ${view.dmg}</span>`);
        if (view.range != null) {
          const rangeTip = attackRangeLabel(view.range);
          bits.push(
            `<span>${escapeHtml(rangeTip ?? `${t('sel.rng')} ${view.range}`)}</span>`,
          );
        }
        if (view.dpsTip) {
          bits.push(`<span>${escapeHtml(view.dpsTip)}</span>`);
        }
        if (view.speedTip) {
          bits.push(`<span>${escapeHtml(view.speedTip)}</span>`);
        }
        if (view.visionTip) {
          bits.push(`<span>${escapeHtml(view.visionTip)}</span>`);
        }
        if (view.hpMaxTip) {
          bits.push(`<span>${escapeHtml(view.hpMaxTip)}</span>`);
        }
        if (view.atkCdTip) {
          bits.push(`<span>${escapeHtml(view.atkCdTip)}</span>`);
        }
        if (view.supplyTip) {
          bits.push(`<span>${escapeHtml(view.supplyTip)}</span>`);
        }
        if (view.trainGoldTip) {
          bits.push(`<span>${escapeHtml(view.trainGoldTip)}</span>`);
        }
        if (view.trainCrystalTip) {
          bits.push(`<span>${escapeHtml(view.trainCrystalTip)}</span>`);
        }
        if (view.trainDurationTip) {
          bits.push(`<span>${escapeHtml(view.trainDurationTip)}</span>`);
        }
        if (view.roleTip) {
          bits.push(`<span>${escapeHtml(view.roleTip)}</span>`);
        }
        if (view.speciesTip) {
          bits.push(`<span>${escapeHtml(view.speciesTip)}</span>`);
        }
        if (view.nameTip) {
          bits.push(`<span>${escapeHtml(view.nameTip)}</span>`);
        }
        if (view.armorClass) {
          bits.push(`<span>${escapeHtml(view.armorClass)}</span>`);
        }
        for (const tag of view.tags) bits.push(`<span>${escapeHtml(tag)}</span>`);
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
        if (view.hpMaxTip) {
          bits.push(`<span>${escapeHtml(view.hpMaxTip)}</span>`);
        }
        if (view.armorClass) {
          bits.push(`<span>${escapeHtml(view.armorClass)}</span>`);
        }
        if (view.buildCostTip) {
          bits.push(`<span>${escapeHtml(view.buildCostTip)}</span>`);
        }
        if (view.buildTimeTip) {
          bits.push(`<span>${escapeHtml(view.buildTimeTip)}</span>`);
        }
        if (view.trains.length) bits.push(`<span>${t('sel.production')}</span>`);
        if (view.places.length) bits.push(`<span>${t('sel.build')}</span>`);
        if (bits.length === 0) bits.push(`<span>${t('sel.noProductionStat')}</span>`);
        stats.innerHTML = bits.join('');
        const rallyBtn = view.hasRally
          ? `<button type="button" class="is-rally${view.rallyArmed ? ' is-armed' : ''}" data-act="rally">${rallyButtonLabel(view.rallyArmed, view.rallyDistTiles)}</button>`
          : '';
        const clearRallyBtn =
          view.hasRally && view.hasCustomRally
            ? `<button type="button" class="is-rally-clear" data-act="clearRally" title="${t('sel.clearRallyTitle')}">${t('sel.clearRally')}</button>`
            : '';
        const cancelBtn =
          view.queue.length > 0
            ? `<button type="button" class="is-cancel" data-act="cancelQueue" title="${t('sel.cancelTitle')}">${t('sel.cancelLast')}</button>`
            : '';
        actions.innerHTML =
          rallyBtn +
          clearRallyBtn +
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
          rally.textContent = rallyButtonLabel(
            view.rallyArmed,
            view.rallyDistTiles,
          );
        }
      }

      if (!view.ready) {
        // Incomplete — HP bar already shows hp/max; queue bar shows build %.
        queue.hidden = false;
        queue.classList.add('is-idle');
        queueFill.style.width = `${(view.buildPct * 100).toFixed(1)}%`;
        if (structuralChange) queueIcons.innerHTML = '';
        queueLabel.textContent = queueLabelText(view);
        if (structuralChange) {
          const tips = [
            view.hpMaxTip
              ? `<span>${escapeHtml(view.hpMaxTip)}</span>`
              : '',
            view.armorClass
              ? `<span>${escapeHtml(view.armorClass)}</span>`
              : '',
            view.buildCostTip
              ? `<span>${escapeHtml(view.buildCostTip)}</span>`
              : '',
            view.buildTimeTip
              ? `<span>${escapeHtml(view.buildTimeTip)}</span>`
              : '',
          ].join('');
          stats.innerHTML = `<span>${t('sel.hpStat', {
            hp: Math.ceil(view.hp),
            max: Math.ceil(view.maxHp),
          })}</span><span>${t('sel.buildingPct', {
            pct: Math.floor(view.buildPct * 100),
            sec: view.buildRemainSec,
          })}</span>${tips}`;
        } else {
          const spans = stats.querySelectorAll('span');
          if (spans[0]) {
            spans[0].textContent = t('sel.hpStat', {
              hp: Math.ceil(view.hp),
              max: Math.ceil(view.maxHp),
            });
          }
          if (spans[1]) {
            spans[1].textContent = t('sel.buildingPct', {
              pct: Math.floor(view.buildPct * 100),
              sec: view.buildRemainSec,
            });
          }
          let tipIdx = 2;
          if (spans[tipIdx] && view.hpMaxTip) {
            spans[tipIdx].textContent = view.hpMaxTip;
            tipIdx += 1;
          }
          if (spans[tipIdx] && view.armorClass) {
            spans[tipIdx].textContent = view.armorClass;
            tipIdx += 1;
          }
          if (spans[tipIdx] && view.buildCostTip) {
            spans[tipIdx].textContent = view.buildCostTip;
            tipIdx += 1;
          }
          if (spans[tipIdx] && view.buildTimeTip) {
            spans[tipIdx].textContent = view.buildTimeTip;
          }
        }
      } else if (view.trains.length === 0) {
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
