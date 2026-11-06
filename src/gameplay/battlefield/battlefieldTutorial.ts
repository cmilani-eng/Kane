/**
 * In-match tutorial coach — short kid-friendly tips that advance with play.
 * Presentation-only prompts; never blocks gameplay.
 * Copy covers rematch, Idle chip, Army, pause, and Home.
 */
import type { SkirmishMapId } from '../../data/skirmishMaps';
import type { BattlefieldWorld } from './battlefieldWorld';
import { selectedCount } from './battlefieldWorld';
import { getBuildingType } from '../../data/buildings';
import { getUnitType } from '../../data/units';
import { t, type MessageKey } from '../../i18n';

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

function tipKey(step: Exclude<TutorialStepId, 'done' | 'map'>): MessageKey {
  switch (step) {
    case 'welcome':
      return 'tutorial.welcome';
    case 'select':
      return 'tutorial.select';
    case 'gather':
      return 'tutorial.gather';
    case 'build':
      return 'tutorial.build';
    case 'attack':
      return 'tutorial.attack';
    case 'hud':
      return 'tutorial.hud';
    case 'heroes':
      return 'tutorial.heroes';
  }
}

export function tutorialTip(
  state: TutorialState,
  mapId: SkirmishMapId = 'crossing',
): string {
  if (!state.visible || state.step === 'done') return '';
  if (state.step === 'map') {
    return mapId === 'ridge' ? t('tutorial.map.ridge') : t('tutorial.map.crossing');
  }
  return t(tipKey(state.step));
}

export function tutorialStepLabel(state: TutorialState): string {
  if (!state.visible || state.step === 'done') return '';
  const i = STEP_ORDER.indexOf(state.step);
  return i >= 0
    ? t('tutorial.step', { n: i + 1, total: STEP_ORDER.length })
    : '';
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
