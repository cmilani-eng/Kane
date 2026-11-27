/**
 * Skate Rush 3 — the four difficulty levels, as numbers. Easy is the game as it was before
 * there were levels; skateEasy.test.ts holds it there. As in skateRules.ts, speeds are pixels
 * per 60 Hz step and distances are pixels ahead of the skater.
 *
 * Called by: src/games/skate-rush/skateRules.ts, skateArt.ts, SkateRushScene.ts
 * Tested by: src/games/skate-rush/skateLevels.test.ts, skateFairness*.test.ts
 */

export const LEVEL_IDS = ['easy', 'medium', 'hard', 'extreme'] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

/** How much bigger a boss enemy is than the ordinary one. */
export const BOSS_SCALE = 1.2;

/** An enemy that outruns the scroll: its extra speed, and how close it is when it puts it on. */
export interface Rush {
  readonly bonus: number;
  readonly trigger: number;
}

export interface Level {
  /** The world speed at the start of a run, and the most it speeds up to. */
  readonly speed: { readonly start: number; readonly top: number };
  readonly rushers: Readonly<Record<'roller' | 'chaser' | 'monster', Rush>>;
  /** How high the hoppers bounce. */
  readonly hops: Readonly<Record<'animal' | 'robot', number>>;
  /** Where a flyer locks on to the skater's height and starts its dive, and where it levels out. */
  readonly swoop: { readonly trigger: number; readonly end: number };
  /** A thrown bomb's extra speed. */
  readonly bombBonus: number;
  /** Whether every enemy is a boss: crowned, bigger, and throwing bombs like the boss. */
  readonly crowned: boolean;
  /** A boss throws one bomb at each of these distances, furthest first. */
  readonly throwAt: readonly number[];
  /** Steps between spawns: a range that tightens, as the score rises, from the first to the second. */
  readonly gapEasy: readonly [number, number];
  readonly gapHard: readonly [number, number];
  /** Extra steps after a boss, or any pattern that may call for a second jump, to land again. */
  readonly rest: number;
}

const EASY: Level = {
  speed: { start: 6, top: 12.5 },
  rushers: {
    roller: { bonus: 1.5, trigger: 700 },
    chaser: { bonus: 4, trigger: 420 },
    monster: { bonus: 3, trigger: 400 },
  },
  hops: { animal: 34, robot: 24 },
  swoop: { trigger: 430, end: 220 },
  bombBonus: 5,
  crowned: false,
  throwAt: [640],
  gapEasy: [84, 128],
  gapHard: [62, 88],
  rest: 30,
};

/** A faster skater, and every enemy a notch up: quicker charges, higher hops, later dives. */
const MEDIUM: Level = {
  ...EASY,
  speed: { start: 7.5, top: 14 },
  rushers: {
    roller: { bonus: 2.5, trigger: 700 },
    chaser: { bonus: 5.5, trigger: 420 },
    monster: { bonus: 4.5, trigger: 400 },
  },
  hops: { animal: 40, robot: 30 },
  swoop: { trigger: 400, end: 210 },
  bombBonus: 6.5,
};

/**
 * Medium, at Medium's speed, with every enemy a boss. A boss follows its bombs in, which already
 * spaces spawns out, so it needs less rest after it.
 */
const HARD: Level = { ...MEDIUM, crowned: true, rest: 8 };

/** How many times stronger than Hard's an Extreme enemy is: its bombs, and its extra speed. */
const STRENGTH = 2;

const stronger = ({ bonus, trigger }: Rush): Rush => ({ bonus: bonus * STRENGTH, trigger });

/**
 * Much faster than Hard, with bosses twice as strong and hazards closer together. Tuned to the
 * edge of what can be done: the bot that plays only from what is on screen still gets through
 * reacting in 0.2 s, and never does in 0.25 s. Much faster or closer, and it fails even at 0.2 s.
 */
const EXTREME: Level = {
  ...HARD,
  speed: { start: 12, top: 18.5 },
  rushers: {
    roller: stronger(HARD.rushers.roller),
    chaser: stronger(HARD.rushers.chaser),
    monster: stronger(HARD.rushers.monster),
  },
  bombBonus: HARD.bombBonus * STRENGTH,
  throwAt: [660, 480],
  gapEasy: [64, 92],
  gapHard: [50, 66],
  rest: 16,
};

export const LEVELS: Readonly<Record<LevelId, Level>> = {
  easy: EASY,
  medium: MEDIUM,
  hard: HARD,
  extreme: EXTREME,
};
