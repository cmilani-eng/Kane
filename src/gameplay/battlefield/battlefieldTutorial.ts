/**
 * In-match tutorial coach — short kid-friendly tips that advance with play.
 * Presentation-only prompts; never blocks gameplay.
 * Copy covers rematch, Idle chip, Army, pause, and Home.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import { t } from '../../i18n';
import type { BattlefieldWorld } from './battlefieldWorld';
import { selectedCount } from './battlefieldWorld';
import { getBuildingType } from '../../data/buildings';
import { getUnitType } from '../../data/units';

export type TutorialStepId =
  | 'welcome'
  | 'map'
  | 'select'
  | 'gather'
  | 'build'
  | 'attack'
  | 'hud'
  | 'heroes'
  | 'done';

export interface TutorialState {
  step: TutorialStepId;
  /** Hide coach after dismiss or finish. */
  visible: boolean;
  /** Soft timer so welcome / hud tips show briefly. */
  elapsedMs: number;
  seenSelect: boolean;
  seenGather: boolean;
  seenBuild: boolean;
  seenAttack: boolean;
  seenHero: boolean;
}

const TIPS: Record<Exclude<TutorialStepId, 'done' | 'map'>, string> = {
  welcome:
    'Hi commander! Tap Next or just play. Esc / Pause freezes the fight — Rematch waits after victory or defeat.',
  select:
    'Tap or box-select your units (yellow ring). Need the whole army? Tap Army or press Ctrl+A.',
  gather:
    'Workers love shiny stuff! Right-click Gold or Crystals. Idle N · tap grabs idle workers — tap again to cycle.',
  build:
    'Press B (or the build flow) to place a building, then tap the map. Halls and huts train more friends!',
  attack:
    'Select fighters, then right-click an enemy — or arm A · Atk for attack-move. Stop clears orders.',
  hud:
    'Handy HUD: Pause / Esc, Home · Base recenters your keep, Army selects combat, Idle / Idle army cycle standers.',
  heroes:
    'Press H for your hero, then Q / W / E for big moves. When the match ends, Rematch keeps species, difficulty, and map!',
};

const STEP_ORDER: Exclude<TutorialStepId, 'done'>[] = [
  'welcome',
  'map',
  'select',
  'gather',
  'build',
  'attack',
  'hud',
  'heroes',
];

export function createTutorialState(): TutorialState {
  return {
    step: 'welcome',
    visible: true,
    elapsedMs: 0,
    seenSelect: false,
    seenGather: false,
    seenBuild: false,
    seenAttack: false,
    seenHero: false,
  };
}

export function tutorialTip(
  state: TutorialState,
  mapId: SkirmishMapId = 'crossing',
): string {
  if (!state.visible || state.step === 'done') return '';
  if (state.step === 'map') {
    return mapId === 'ridge' ? t('tutorial.map.ridge') : t('tutorial.map.crossing');
  }
  return TIPS[state.step];
}

export function tutorialStepLabel(t: TutorialState): string {
  if (!t.visible || t.step === 'done') return '';
  const i = STEP_ORDER.indexOf(t.step);
  return i >= 0 ? `Tip ${i + 1}/${STEP_ORDER.length}` : '';
}

export function dismissTutorial(t: TutorialState): void {
  t.visible = false;
  t.step = 'done';
}

export function advanceTutorial(t: TutorialState): void {
  if (!t.visible || t.step === 'done') return;
  const next: Record<Exclude<TutorialStepId, 'done'>, TutorialStepId> = {
    welcome: 'map',
    map: 'select',
    select: 'gather',
    gather: 'build',
    build: 'attack',
    attack: 'hud',
    hud: 'heroes',
    heroes: 'done',
  };
  t.step = next[t.step];
  t.elapsedMs = 0;
  if (t.step === 'done') t.visible = false;
}

/** Observe world actions and auto-advance tips. */
export function tickTutorial(
  world: BattlefieldWorld,
  t: TutorialState,
  dtMs: number,
): void {
  if (!t.visible || t.step === 'done') return;
  t.elapsedMs += dtMs;

  if (selectedCount(world) > 0) t.seenSelect = true;
  if (
    world.units.some(
      (u) => u.team === 'player' && (u.gatherNodeId != null || u.carrying > 0),
    )
  ) {
    t.seenGather = true;
  }
  if (
    world.buildings.some(
      (b) =>
        b.team === 'player' &&
        !getBuildingType(b.typeId).isMainHall &&
        (b.complete || b.buildProgress > 0),
    )
  ) {
    t.seenBuild = true;
  }
  if (
    world.units.some(
      (u) => u.team === 'player' && u.attackTargetId != null,
    )
  ) {
    t.seenAttack = true;
  }
  if (
    world.heroRuntime != null ||
    world.units.some(
      (u) => u.team === 'player' && getUnitType(u.typeId).isHero,
    )
  ) {
    t.seenHero = true;
  }

  // Auto-advance when the player does the thing (or timed tips expire)
  if (t.step === 'welcome' && t.elapsedMs > 4500) {
    t.step = 'map';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'map' && t.elapsedMs > 5500) {
    t.step = 'select';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'select' && t.seenSelect) {
    t.step = 'gather';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'gather' && t.seenGather) {
    t.step = 'build';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'build' && t.seenBuild) {
    t.step = 'attack';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'attack' && t.seenAttack) {
    t.step = 'hud';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'hud' && t.elapsedMs > 5500) {
    t.step = 'heroes';
    t.elapsedMs = 0;
    return;
  }
  if (t.step === 'heroes' && t.seenHero) {
    t.step = 'done';
    t.visible = false;
  }
}
