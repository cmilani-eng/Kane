/**
 * In-match tutorial coach — short kid-friendly tips that advance with play.
 * Presentation-only prompts; never blocks gameplay.
 */
import type { BattlefieldWorld } from './battlefieldWorld';
import { selectedCount } from './battlefieldWorld';
import { getBuildingType } from '../../data/buildings';
import { getUnitType } from '../../data/units';

export type TutorialStepId =
  | 'welcome'
  | 'select'
  | 'gather'
  | 'build'
  | 'attack'
  | 'heroes'
  | 'done';

export interface TutorialState {
  step: TutorialStepId;
  /** Hide coach after dismiss or finish. */
  visible: boolean;
  /** Soft timer so welcome shows briefly before select tip. */
  elapsedMs: number;
  seenSelect: boolean;
  seenGather: boolean;
  seenBuild: boolean;
  seenAttack: boolean;
  seenHero: boolean;
}

const TIPS: Record<Exclude<TutorialStepId, 'done'>, string> = {
  welcome: 'Hi commander! Let’s learn the basics — tap Next or just play!',
  select: 'Tap or drag a box to pick your friends. Yellow ring = selected!',
  gather:
    'Workers love shiny stuff! Select a worker, then right-click Gold or Crystals.',
  build: 'Press B to place a building, then tap the map. Homes make more units!',
  attack:
    'Select fighters, then right-click an enemy. Red line = “go get ‘em!”',
  heroes:
    'Press H to call your hero, then Q / W / E for big fancy moves. You’re a star!',
};

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

export function tutorialTip(t: TutorialState): string {
  if (!t.visible || t.step === 'done') return '';
  return TIPS[t.step];
}

export function tutorialStepLabel(t: TutorialState): string {
  if (!t.visible || t.step === 'done') return '';
  const order: TutorialStepId[] = [
    'welcome',
    'select',
    'gather',
    'build',
    'attack',
    'heroes',
  ];
  const i = order.indexOf(t.step);
  return i >= 0 ? `Tip ${i + 1}/${order.length}` : '';
}

export function dismissTutorial(t: TutorialState): void {
  t.visible = false;
  t.step = 'done';
}

export function advanceTutorial(t: TutorialState): void {
  if (!t.visible || t.step === 'done') return;
  const next: Record<Exclude<TutorialStepId, 'done'>, TutorialStepId> = {
    welcome: 'select',
    select: 'gather',
    gather: 'build',
    build: 'attack',
    attack: 'heroes',
    heroes: 'done',
  };
  t.step = next[t.step];
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

  // Auto-advance when the player does the thing (or welcome times out)
  if (t.step === 'welcome' && t.elapsedMs > 4500) {
    t.step = 'select';
    return;
  }
  if (t.step === 'select' && t.seenSelect) {
    t.step = 'gather';
    return;
  }
  if (t.step === 'gather' && t.seenGather) {
    t.step = 'build';
    return;
  }
  if (t.step === 'build' && t.seenBuild) {
    t.step = 'attack';
    return;
  }
  if (t.step === 'attack' && t.seenAttack) {
    t.step = 'heroes';
    return;
  }
  if (t.step === 'heroes' && t.seenHero) {
    t.step = 'done';
    t.visible = false;
  }
}
