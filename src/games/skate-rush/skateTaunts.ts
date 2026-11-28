/**
 * Skate Rush 3 — Extreme's heckling: a put-down at the top of the screen, a new one every few
 * seconds, and a last one after the crash. Only Extreme does it. They run down the skater's
 * chances and nothing else about whoever is playing.
 *
 * Called by: src/games/skate-rush/SkateRushScene.ts
 * Tested by: src/games/skate-rush/skateTaunts.test.ts
 */
import type { MessageKey } from '../../i18n';
import type { Run } from './skateRules';

export const TAUNT_KEYS = [
  'skate.taunt.noChance',
  'skate.taunt.giveUp',
  'skate.taunt.luck',
  'skate.taunt.crashComing',
  'skate.taunt.notGoodEnough',
  'skate.taunt.easyMode',
  'skate.taunt.birds',
  'skate.taunt.yourBest',
  'skate.taunt.doomed',
  'skate.taunt.runningOut',
  'skate.taunt.tooBad',
  'skate.taunt.quit',
] as const satisfies readonly MessageKey[];

export const CRASH_TAUNT_KEY: MessageKey = 'skate.taunt.crashed';

/** How long each one stays up: 4 seconds of 60 Hz steps. */
export const TAUNT_STEPS = 240;

/**
 * What to say at this moment of a run, if anything. They come round in order, starting from the
 * one numbered `first`, so each run can open with a different one and none comes twice in a row.
 */
export function tauntFor(run: Pick<Run, 'level' | 'frame' | 'over'>, first: number): MessageKey | undefined {
  if (run.level !== 'extreme') return undefined;
  if (run.over) return CRASH_TAUNT_KEY;
  return TAUNT_KEYS[(first + Math.floor(run.frame / TAUNT_STEPS)) % TAUNT_KEYS.length];
}
