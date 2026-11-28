/**
 * Skate Rush 3 — pure gameplay rules (no Phaser, no canvas).
 * Ported from the original standalone page. The original advanced one step per animation
 * frame, so every speed and gravity value below is "per 60 Hz step". The scene runs fixed
 * 1/60 s steps, so the game plays the same on 60, 120 and 144 Hz screens.
 *
 * Two things the original got wrong are fixed on purpose:
 *  - a Shield "absorbs one hit", but the hazard stayed where it was and killed the skater on
 *    the next step; the absorbed hazard is now destroyed;
 *  - the Magnet Deck only changed the board's colour; it now pulls coins like the power-up.
 *
 * And it is deliberately harder than the original:
 *  - two jumps per airtime, one fewer than the original;
 *  - low ceilings, which one jump passes under and any second jump hits;
 *  - enemies that rush, charge, pounce, hop, dive and throw instead of only scrolling past;
 *  - spawn gaps that tighten as the score rises.
 * Extreme also sends timing courses (skateCourses.ts): set pieces that need well-timed presses.
 * Four difficulty levels (skateLevels.ts) set the speed and how hard the enemies are; on the
 * upper two every enemy is a boss that throws bombs.
 * The `skateFairness*.test.ts` files play every pattern and many whole runs on every level to
 * prove each has a way through.
 *
 * Called by: src/games/skate-rush/SkateRushScene.ts, skateArt.ts, skateCourseArt.ts, skateStore.ts
 * Tested by: src/games/skate-rush/skateRules.test.ts, skateLevels.test.ts, skateEasy.test.ts,
 * skateCourses.test.ts
 */
import { COURSES, COURSE_IDS, NOTICE_STEPS, type CourseId } from './skateCourses';
import { BOSS_SCALE, LEVELS, type LevelId, type Rush } from './skateLevels';

export type Random = () => number;

export const VIEW_W = 960;
export const VIEW_H = 480;
export const GROUND = 380;
/** One simulation step, in seconds. */
export const TICK = 1 / 60;

/** Where the skater stands. A hazard's "distance ahead" is measured from here. */
export const SKATER_X = 155;
/** How far ahead a hazard is when its front first touches the skater's. */
const CONTACT_AHEAD = 43;

export const MAX_JUMPS = 2;
const GRAVITY = 0.66;
const JUMP_VY = -13.2;
const AIR_DECK_JUMP_VY = -16;
const DOUBLE_JUMP_VY = -16.5;

export const TURBO_BONUS = 2;
const SPEED_DECK_BONUS = 0.5;

/**
 * Underside of a low ceiling, in canvas pixels from the top. The hitbox of the highest single
 * jump (the Air Deck) stops at y 144; every second jump taken in the air carries it past y 120.
 */
export const CEILING_Y = 134;
/** How far a ceiling's hitbox reaches above the screen, so that nobody can fly over it. */
const CEILING_REACH = 1000;
/** Spikes are drawn as teeth this wide, so a bed of them is a whole number of teeth. */
const SPIKE_TOOTH = 25;
/**
 * A ceiling starts this many steps of travel before the hazard under it, and carries on this
 * many after it. Much shorter, and a well-timed second jump could slip in or out around it.
 */
export const CEILING_LEAD_STEPS = 14;
export const CEILING_TRAIL_STEPS = 24;

/** The score by which the gaps between spawns have tightened as far as they go. */
export const GAP_HARD_SCORE = 900;

/** A monster's one leap as its rush starts: how high, and over how many pixels. It lands well short. */
export const POUNCE = { lift: 50, length: 220 } as const;
/** How many pixels of travel one bounce of a hopper covers. How high it goes depends on the level. */
export const HOP_LENGTH = { animal: 170, robot: 240 } as const;
/**
 * Flyers cruise high, then lock on to the skater's height (kept between `minY` and `maxY`) and
 * dive to it. How far ahead depends on the level. They never re-aim, so jumping early baits them
 * high and staying down brings them low.
 */
export const SWOOP = { minY: 285, maxY: 354, bob: 8 } as const;
/**
 * A boss throws a bomb from `reach` pixels in front of itself; it starts `lift` high, is down
 * after `fall` pixels, and rolls on ahead of its thrower.
 */
export const BOSS_THROW = { reach: 20, lift: 50, fall: 200 } as const;
/** From where a bomb's own bottom is to its middle, for dropping one from a flyer. */
const BOMB_MIDDLE = 14;

export interface World {
  readonly id: 'city' | 'desert' | 'jungle' | 'space';
  readonly emoji: string;
  readonly sky: readonly [string, string];
  readonly ground: string;
  readonly stripe: string;
  readonly build: string;
}

export const WORLDS: readonly World[] = [
  { id: 'city', emoji: '🌆', sky: ['#111d43', '#65769e'], ground: '#29394f', stripe: '#facc15', build: '#26385e' },
  { id: 'desert', emoji: '🏜️', sky: ['#592d42', '#e9a45d'], ground: '#9a603d', stripe: '#ffe08a', build: '#9a6846' },
  { id: 'jungle', emoji: '🌴', sky: ['#092d35', '#55a878'], ground: '#24553e', stripe: '#b5e48c', build: '#174a3d' },
  { id: 'space', emoji: '🚀', sky: ['#080c28', '#34366f'], ground: '#29234f', stripe: '#72e5ff', build: '#24214c' },
];
/** The world changes every this many points. */
export const WORLD_SCORE = 180;

export const SKATER_IDS = ['cyan', 'pink', 'lime', 'gold'] as const;
export type SkaterId = (typeof SKATER_IDS)[number];
/** Names are people's names, so they are not translated. */
export const SKATERS: Record<SkaterId, { name: string; color: string }> = {
  cyan: { name: 'Kai', color: '#22d3ee' },
  pink: { name: 'Nova', color: '#fb7185' },
  lime: { name: 'Rex', color: '#a3e635' },
  gold: { name: 'Milo', color: '#fbbf24' },
};

export const BOARD_IDS = ['basic', 'speed', 'jump', 'magnet'] as const;
export type BoardId = (typeof BOARD_IDS)[number];
export const BOARD_PRICES: Record<BoardId, number> = { basic: 0, speed: 80, jump: 80, magnet: 120 };

/** Hazards that make a spawn on their own. */
const SOLO_HAZARDS = [
  'spikes',
  'crate',
  'pit',
  'swing',
  'laser',
  'fire',
  'drone',
  'chaser',
  'roller',
  'bird',
  'robot',
  'alien',
  'monster',
  'animal',
  'boss',
] as const;
/** Low ceilings: each looks different, all follow the same rule. */
export const CEILING_TYPES = ['bridge', 'lasernet', 'maces'] as const;
export type CeilingType = (typeof CEILING_TYPES)[number];

export const HAZARD_TYPES = [...SOLO_HAZARDS, 'bomb', ...CEILING_TYPES] as const;
export type HazardType = (typeof HAZARD_TYPES)[number];
export type ItemType = HazardType | 'coin' | 'power';
export type PowerKind = 'shield' | 'magnet' | 'turbo';
const POWER_KINDS: readonly PowerKind[] = ['shield', 'magnet', 'turbo'];

/** What each low ceiling hangs over. */
export const UNDER = {
  'under-bridge': { ground: 'spikes', ceiling: 'bridge' },
  'under-lasernet': { ground: 'crate', ceiling: 'lasernet' },
  'under-maces': { ground: 'pit', ceiling: 'maces' },
} as const;
export type UnderPattern = keyof typeof UNDER;

/** What can spawn: every solo hazard, "double" (spikes followed by a bird) and the low ceilings. */
export const PATTERNS = [...SOLO_HAZARDS, 'double', 'under-bridge', 'under-lasernet', 'under-maces'] as const;
export type Pattern = (typeof PATTERNS)[number];
/** A pattern, or on a level that has them, a whole timing course. */
export type Spawnable = Pattern | CourseId;

const FLYERS: readonly ItemType[] = ['drone', 'bird', 'alien'];

/** The hazards that are alive. The rest are obstacles, and obstacles are never bosses. */
export const ENEMY_TYPES = [
  'chaser',
  'roller',
  'monster',
  'animal',
  'robot',
  'bird',
  'drone',
  'alien',
  'boss',
] as const satisfies readonly HazardType[];

export const isFlyer = (type: ItemType): boolean => FLYERS.includes(type);
export const isEnemy = (type: ItemType): boolean => (ENEMY_TYPES as readonly ItemType[]).includes(type);
export const isCeiling = (type: ItemType): type is CeilingType => (CEILING_TYPES as readonly ItemType[]).includes(type);
const isUnder = (pattern: Pattern): pattern is UnderPattern => pattern in UNDER;
const isCourse = (what: Spawnable): what is CourseId => what in COURSES;
const isRusherType = (type: ItemType): type is 'roller' | 'chaser' | 'monster' =>
  type === 'roller' || type === 'chaser' || type === 'monster';
const isHopperType = (type: ItemType): type is 'animal' | 'robot' => type === 'animal' || type === 'robot';

export interface Item {
  type: ItemType;
  x: number;
  y: number;
  w: number;
  h: number;
  phase: number;
  power?: PowerKind;
  /** Collected, or a hazard a shield destroyed; swept away at the end of the step. */
  got?: boolean;
  /** How many times faster than the scroll this moves while rushing. */
  rush?: number;
  /** Rushing starts once this close (pixels ahead of the skater). Without one it always rushes. */
  trigger?: number;
  /** A flyer's cruising height before it dives. */
  base?: number;
  /** The height a flyer has locked on to, and the height it dived from. */
  target?: number;
  diveFrom?: number;
  /** How high a hopper bounces on this level. */
  hop?: number;
  /** A boss version of an enemy: crowned, and `BOSS_SCALE` times the size. */
  crowned?: boolean;
  /** The distances ahead at which a boss has still to throw a bomb, furthest first. */
  throws?: readonly number[];
  /** How far ahead a bomb was when it left the boss. */
  thrownAt?: number;
  /** How high a bomb was when it left a flying boss. */
  drop?: number;
  /** The timing course this is a piece of, and how many pixels behind the course's front it is. */
  course?: CourseId;
  into?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  col: string;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  jumps: number;
  rot: number;
  boost: number;
}

export interface Run {
  board: BoardId;
  level: LevelId;
  over: boolean;
  frame: number;
  score: number;
  speed: number;
  /** Steps until the next spawn. */
  spawn: number;
  items: Item[];
  particles: Particle[];
  runCoins: number;
  shield: boolean;
  magnet: number;
  turbo: number;
  flip: number;
  worldIndex: number;
  player: Player;
}

export type RunEvent = 'coin' | 'power' | 'shield-hit' | 'wipeout';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What a spawn needs before the next one can follow. */
export interface Spawned {
  /** Pixels the pattern reaches past the room an ordinary hazard takes. */
  tail: number;
  /** Extra steps to leave afterwards. */
  rest: number;
  /** Pixels further on than usual that its coins and power-up go, to leave a course clear. */
  past?: number;
}

const rand = (random: Random, a: number, b: number): number => a + random() * (b - a);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function createRun(board: BoardId, level: LevelId = 'easy'): Run {
  return {
    board,
    level,
    over: false,
    frame: 0,
    score: 0,
    speed: LEVELS[level].speed.start + (board === 'speed' ? 0.7 : 0),
    spawn: 60,
    items: [],
    particles: [],
    runCoins: 0,
    shield: false,
    magnet: 0,
    turbo: 0,
    flip: 0,
    worldIndex: 0,
    player: { x: SKATER_X, y: GROUND - 58, w: 54, h: 58, vy: 0, jumps: 0, rot: 0, boost: 0 },
  };
}

/** The world speed at this point of the run, before any Turbo. */
export function cruiseSpeed(run: Pick<Run, 'frame' | 'board' | 'level'>): number {
  const { start, top } = LEVELS[run.level].speed;
  return Math.min(top, start + run.frame / 1900) + (run.board === 'speed' ? SPEED_DECK_BONUS : 0);
}

export function burst(run: Run, x: number, y: number, col: string, n: number, random: Random): void {
  for (let i = 0; i < n; i++) {
    run.particles.push({ x, y, vx: rand(random, -3, 3), vy: rand(random, -4, 1), life: rand(random, 13, 27), col });
  }
}

/** Two jumps per airtime: a jump, then one more in the air that flips and bursts forward. */
export function jump(run: Run, random: Random): boolean {
  const p = run.player;
  if (run.over || p.jumps >= MAX_JUMPS) return false;
  const first = p.jumps++ === 0;
  p.rot = 0;
  if (first) {
    p.vy = run.board === 'jump' ? AIR_DECK_JUMP_VY : JUMP_VY;
    burst(run, p.x + 25, p.y + 48, '#67e8f9', 9, random);
  } else {
    p.vy = DOUBLE_JUMP_VY;
    run.flip = 1;
    run.turbo = Math.max(run.turbo, 100);
    p.boost = 100;
    burst(run, p.x + 25, p.y + 30, '#c4b5fd', 20, random);
  }
  return true;
}

/** How far in front of the skater a hazard is. */
export const aheadOf = (o: Item): number => o.x - SKATER_X;

/** Whether an enemy or bomb is currently outrunning the scroll. */
export function isRushing(o: Item): boolean {
  return o.rush !== undefined && aheadOf(o) <= (o.trigger ?? Infinity);
}

/**
 * A hazard that outruns the scroll once `trigger` pixels ahead. It starts further back by just
 * what it will gain before reaching the skater, so it gets there when a plain hazard would have
 * and never closes up on the one in front: the spacing stays fair while the arrival gets harder
 * to read.
 */
function rusher(run: Run, o: Item, { bonus, trigger }: Rush): Item {
  const rush = 1 + bonus / cruiseSpeed(run);
  return { ...o, x: o.x + (trigger - CONTACT_AHEAD) * (1 - 1 / rush), rush, trigger };
}

const bombRush = (run: Run): number => 1 + LEVELS[run.level].bombBonus / cruiseSpeed(run);

/**
 * How much further back a boss has to start, in pixels of scroll, for the bomb it throws `at`
 * pixels ahead to reach the skater when the plain hazard would have.
 */
function bombLead(run: Run, thrower: Item, at: number): number {
  const { trigger = 0, rush = 1 } = thrower;
  // What the scroll covers before the throw: less if the thrower is already rushing by then.
  const beforeThrow = at >= trigger ? at : trigger - (trigger - at) / rush;
  return beforeThrow - CONTACT_AHEAD - (at - BOSS_THROW.reach - CONTACT_AHEAD) / bombRush(run);
}

/** A hazard put on the track, and the extra pixels of scroll before it reaches the skater itself. */
interface Placed {
  item: Item;
  delay: number;
}

/**
 * Ready a freshly made hazard. An enemy that rushes starts further back (see `rusher`). A boss,
 * which on the upper levels is every enemy, starts further back again: its first bomb arrives
 * when the plain hazard would have, so spawns keep their spacing, and it follows its bombs in.
 */
function place(run: Run, plain: Item): Placed {
  const level = LEVELS[run.level];
  const moving = isRusherType(plain.type) ? rusher(run, plain, level.rushers[plain.type]) : plain;
  const crowned = level.crowned && isEnemy(plain.type) && plain.type !== 'boss';
  if (plain.type !== 'boss' && !crowned) return { item: moving, delay: 0 };
  const lead = bombLead(run, moving, level.throwAt[0]);
  return {
    item: { ...moving, x: plain.x + lead, throws: level.throwAt, ...(crowned && { crowned }) },
    delay: lead - (moving.x - plain.x),
  };
}

function soloHazard(run: Run, type: (typeof SOLO_HAZARDS)[number], random: Random): Item {
  const o: Item = { type, x: VIEW_W + 20, y: rand(random, 260, 320), w: 50, h: 0, phase: rand(random, 0, 7) };
  if (type === 'pit') o.w = rand(random, 110, 165);
  if (type === 'spikes') o.w = rand(random, 48, 78);
  if (type === 'laser') o.w = rand(random, 65, 100);
  if (type === 'boss') o.w = 75;
  if (type === 'animal') o.y = GROUND - 30;
  if (isHopperType(type)) o.hop = LEVELS[run.level].hops[type];
  if (isFlyer(type)) {
    o.y = rand(random, 150, 200);
    o.base = o.y;
  }
  return o;
}

/** A hazard on the ground under a low ceiling: it takes a jump, and only one. */
function lowCeiling(run: Run, pattern: UnderPattern, random: Random): [Item, Item] {
  const { ground, ceiling } = UNDER[pattern];
  // Sized for the fastest it can arrive, so it is still long enough if Turbo starts on the way.
  const fastest = cruiseSpeed(run) + TURBO_BONUS;
  const lead = Math.ceil(CEILING_LEAD_STEPS * fastest);
  const trail = Math.ceil(CEILING_TRAIL_STEPS * fastest);
  const w = ground === 'spikes' ? rand(random, 48, 70) : ground === 'pit' ? rand(random, 110, 140) : 50;
  return [
    { type: ceiling, x: VIEW_W + 20, y: 0, w: lead + w + trail, h: CEILING_Y, phase: 0 },
    { type: ground, x: VIEW_W + 20 + lead, y: 0, w, h: 0, phase: 0 },
  ];
}

/** Lay a course out at the cruising speed of the moment, so that it keeps its rhythm. */
function spawnCourse(run: Run, id: CourseId): Spawned {
  const speed = cruiseSpeed(run);
  const back = NOTICE_STEPS * speed;
  let end = 0;
  for (const { type, at, long } of COURSES[id]) {
    const w = type === 'spikes' ? Math.round((long * speed) / SPIKE_TOOTH) * SPIKE_TOOTH : long * speed;
    const h = isCeiling(type) ? CEILING_Y : 0;
    const into = at * speed;
    run.items.push({ type, x: VIEW_W + 20 + back + into, y: 0, w, h, phase: 0, course: id, into });
    end = Math.max(end, back + into + w);
  }
  return { tail: end - 50, rest: LEVELS[run.level].rest, past: end };
}

/** A timing course still to be got through: which, how far off, and which items are its pieces. */
export interface CourseAhead {
  id: CourseId;
  /** Steps until its front reaches the skater: below zero once the skater is in it. */
  steps: number;
  has: (o: Item) => boolean;
}

/** The nearest timing course with a piece the skater has not yet passed: the one on the map. */
export function courseAhead(run: Run): CourseAhead | undefined {
  const frontOf = (o: Item): number => o.x - (o.into ?? 0);
  let nearest: Item | undefined;
  for (const o of run.items) {
    if (o.course === undefined || o.x + o.w < SKATER_X + 9) continue;
    if (!nearest || frontOf(o) < frontOf(nearest)) nearest = o;
  }
  if (nearest?.course === undefined) return undefined;
  const front = frontOf(nearest);
  return {
    id: nearest.course,
    steps: (front - SKATER_X - CONTACT_AHEAD) / run.speed,
    // Pieces of one course scroll together, so they agree on where its front is.
    has: (o) => o.course !== undefined && Math.abs(frontOf(o) - front) < 1,
  };
}

export function spawnPattern(run: Run, pattern: Spawnable, random: Random): Spawned {
  if (isCourse(pattern)) return spawnCourse(run, pattern);
  if (isUnder(pattern)) {
    const [ceiling, ground] = lowCeiling(run, pattern, random);
    run.items.push(ceiling, ground);
    return { tail: ceiling.w - 50, rest: 0 };
  }
  if (pattern === 'double') {
    run.items.push({ type: 'spikes', x: VIEW_W + 20, y: 0, w: 58, h: 0, phase: 0 });
    const y = rand(random, 150, 200);
    const bird = place(run, { type: 'bird', x: VIEW_W + 210, y, base: y, w: 50, h: 0, phase: rand(random, 0, 7) });
    run.items.push(bird.item);
    return { tail: 190 + bird.delay, rest: LEVELS[run.level].rest };
  }
  const plain = soloHazard(run, pattern, random);
  const { item, delay } = place(run, plain);
  run.items.push(item);
  return { tail: Math.max(0, plain.w - 50) + delay, rest: item.throws ? LEVELS[run.level].rest : 0 };
}

const pick = <T>(from: readonly T[], random: Random): T => from[Math.floor(random() * from.length)];

export function spawnItem(run: Run, random: Random): Spawned {
  const { courses } = LEVELS[run.level];
  // Only a level with courses rolls for one, so the others get the spawns they always did.
  if (courses > 0 && random() < courses) return spawnPattern(run, pick(COURSE_IDS, random), random);
  return spawnPattern(run, pick(PATTERNS, random), random);
}

/** Steps from one spawn to the next, before the room the pattern itself needs. */
export function spawnGap(score: number, random: Random, level: LevelId = 'easy'): number {
  const { gapEasy, gapHard } = LEVELS[level];
  const t = Math.min(1, score / GAP_HARD_SCORE);
  return rand(random, gapEasy[0] + (gapHard[0] - gapEasy[0]) * t, gapEasy[1] + (gapHard[1] - gapEasy[1]) * t);
}

export function spawnCoins(run: Run, x: number): void {
  for (let i = 0; i < 5; i++) {
    run.items.push({
      type: 'coin',
      x: x + i * 32,
      y: GROUND - 105 - Math.sin((i / 4) * Math.PI) * 35,
      w: 20,
      h: 20,
      phase: 0,
    });
  }
}

export function spawnPower(run: Run, x: number, random: Random): void {
  const power = POWER_KINDS[Math.floor(random() * POWER_KINDS.length)];
  run.items.push({ type: 'power', power, x, y: GROUND - 125, w: 28, h: 28, phase: 0 });
}

export function collide(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** How far off the ground a hopping or pouncing enemy, or a thrown bomb, is right now. */
export function liftOf(o: Item): number {
  if (isHopperType(o.type)) {
    const height = o.hop ?? LEVELS.easy.hops[o.type];
    return height * Math.abs(Math.sin((o.x / HOP_LENGTH[o.type]) * Math.PI + o.phase));
  }
  if (o.type === 'monster' && o.trigger !== undefined) {
    const t = (o.trigger - aheadOf(o)) / POUNCE.length;
    return t > 0 && t < 1 ? POUNCE.lift * Math.sin(t * Math.PI) : 0;
  }
  if (o.type === 'bomb' && o.thrownAt !== undefined) {
    const t = (o.thrownAt - aheadOf(o)) / BOSS_THROW.fall;
    return (o.drop ?? BOSS_THROW.lift) * Math.max(0, 1 - t * t);
  }
  return 0;
}

/** The part of a hazard that hurts. Pits are handled separately (see `fallsInPit`). */
export function hazardBox(o: Item, frame: number): Box {
  const box = ordinaryBox(o, frame);
  if (!o.crowned) return box;
  // Bigger about its middle: upwards from the floor under it, or all round for a flyer.
  const middle = box.x + box.w / 2;
  const anchor = isFlyer(o.type) ? o.y : GROUND - liftOf(o);
  return {
    x: middle - (box.w * BOSS_SCALE) / 2,
    y: anchor + (box.y - anchor) * BOSS_SCALE,
    w: box.w * BOSS_SCALE,
    h: box.h * BOSS_SCALE,
  };
}

function ordinaryBox(o: Item, frame: number): Box {
  const g = GROUND;
  const floor = g - liftOf(o);
  switch (o.type) {
    case 'spikes':
      return { x: o.x + 4, y: g - 34, w: o.w - 8, h: 34 };
    case 'crate':
      return { x: o.x + 3, y: g - 47, w: o.w - 6, h: 47 };
    case 'swing': {
      const sx = o.x + 25 + Math.sin(frame * 0.07 + o.phase) * 28;
      const sy = g - 130 + Math.cos(frame * 0.07 + o.phase) * 10;
      return { x: sx - 18, y: sy - 18, w: 36, h: 36 };
    }
    case 'laser':
      return { x: o.x, y: g - 78, w: o.w, h: 9 };
    case 'fire':
      return { x: o.x, y: g - 38 + Math.sin(frame * 0.2) * 4, w: o.w, h: 38 };
    case 'drone':
    case 'bird':
    case 'alien':
      return { x: o.x + 3, y: o.y - 16, w: 45, h: 32 };
    case 'bridge':
    case 'lasernet':
    case 'maces':
      return { x: o.x, y: -CEILING_REACH, w: o.w, h: CEILING_REACH + CEILING_Y };
    case 'bomb':
      return { x: o.x + 3, y: floor - 26, w: 22, h: 24 };
    case 'roller':
      return { x: o.x + 4, y: floor - 39, w: 42, h: 36 };
    case 'animal':
      return { x: o.x + 3, y: floor - 42, w: 45, h: 40 };
    case 'boss':
      return { x: o.x + 3, y: g - 75, w: 70, h: 75 };
    default:
      // chaser, robot, monster
      return { x: o.x + 3, y: floor - 48, w: 48, h: 44 };
  }
}

/** A pit only catches a skater who is on the ground over it. */
export function fallsInPit(box: Box, player: Player, pit: Item): boolean {
  return box.x + box.w > pit.x + 8 && box.x < pit.x + pit.w - 8 && player.y + player.h >= GROUND - 2;
}

/** A flyer bobs at its cruising height, then dives to the height it locked on to. */
function fly(run: Run, o: Item): void {
  const ahead = aheadOf(o);
  const { trigger, end } = LEVELS[run.level].swoop;
  if (o.target === undefined) {
    if (ahead > trigger) {
      o.base ??= o.y;
      o.y = o.base + Math.sin(run.frame * 0.1 + o.phase) * SWOOP.bob;
      return;
    }
    o.target = clamp(run.player.y + run.player.h / 2, SWOOP.minY, SWOOP.maxY);
    o.diveFrom = o.y;
  }
  const t = clamp((trigger - ahead) / (trigger - end), 0, 1);
  const from = o.diveFrom ?? o.target;
  o.y = from + (o.target - from) * t * t * (3 - 2 * t);
}

function thrownBomb(run: Run, boss: Item): Item {
  const x = boss.x - BOSS_THROW.reach;
  const bomb: Item = { type: 'bomb', x, y: 0, w: 28, h: 0, phase: 0, rush: bombRush(run), thrownAt: x - SKATER_X };
  return isFlyer(boss.type) ? { ...bomb, drop: GROUND - boss.y - BOMB_MIDDLE } : bomb;
}

function moveItems(run: Run): void {
  const p = run.player;
  const pulling = run.magnet > 0 || run.board === 'magnet';
  const thrown: Item[] = [];
  for (const o of run.items) {
    o.x -= run.speed * (isRushing(o) ? (o.rush ?? 1) : 1);
    if (isFlyer(o.type)) fly(run, o);
    const [nextThrow, ...later] = o.throws ?? [];
    if (nextThrow !== undefined && aheadOf(o) <= nextThrow) {
      o.throws = later;
      thrown.push(thrownBomb(run, o));
    }
    if (o.type === 'coin' && pulling && Math.abs(o.x - p.x) < 220) {
      o.x -= Math.sign(o.x - p.x) * 2;
      o.y += (p.y + 15 - o.y) * 0.035;
    }
  }
  run.items.push(...thrown);
}

/**
 * Advance the run by one 60 Hz step. Returns what happened, for sound.
 * `random` decides what spawns. Sparks may draw from their own source, so that a test can keep
 * the spawns the same however the skater plays.
 */
export function stepRun(run: Run, random: Random, sparks: Random = random): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.over) return events;
  const p = run.player;

  run.frame++;
  run.score += 0.12;
  run.speed = cruiseSpeed(run) + (run.turbo > 0 ? TURBO_BONUS : 0);
  run.worldIndex = Math.floor(run.score / WORLD_SCORE) % WORLDS.length;

  p.vy += GRAVITY;
  p.y += p.vy;
  if (p.y >= GROUND - p.h) {
    p.y = GROUND - p.h;
    p.vy = 0;
    p.jumps = 0;
    p.rot = 0;
  }
  if (p.vy < 0) p.rot -= 0.055;
  else p.rot += 0.035;
  if (run.flip > 0) {
    p.rot += 0.28;
    run.flip *= 0.91;
    if (run.flip < 0.08) run.flip = 0;
  }
  if (run.turbo > 0) run.turbo--;
  if (run.magnet > 0) run.magnet--;
  if (p.boost > 0) p.boost--;

  run.spawn--;
  if (run.spawn <= 0) {
    const { tail, rest, past = 0 } = spawnItem(run, random);
    if (random() < 0.72) spawnCoins(run, VIEW_W + 100 + past);
    if (random() < 0.22) spawnPower(run, VIEW_W + 360 + past, random);
    run.spawn = spawnGap(run.score, random, run.level) + tail / cruiseSpeed(run) + rest;
  }

  moveItems(run);

  const box: Box = { x: p.x + 9, y: p.y + 8, w: p.w - 17, h: p.h - 10 };
  for (const o of run.items) {
    if (o.got) continue;
    if (o.type === 'coin' || o.type === 'power') {
      if (!collide(box, o)) continue;
      if (o.type === 'coin') {
        run.runCoins++;
        burst(run, o.x, o.y, '#fde047', 5, sparks);
        events.push('coin');
      } else {
        if (o.power === 'shield') run.shield = true;
        if (o.power === 'magnet') run.magnet = 600;
        if (o.power === 'turbo') run.turbo = 240;
        burst(run, o.x, o.y, '#86efac', 15, sparks);
        events.push('power');
      }
      o.got = true;
      continue;
    }
    const hit = o.type === 'pit' ? fallsInPit(box, p, o) : collide(box, hazardBox(o, run.frame));
    if (!hit) continue;
    if (run.shield) {
      run.shield = false;
      o.got = true;
      burst(run, p.x + 25, p.y + 20, '#7dd3fc', 24, sparks);
      events.push('shield-hit');
      break;
    }
    run.over = true;
    events.push('wipeout');
    return events;
  }

  run.items = run.items.filter((o) => !o.got && o.x + (o.w || 30) > -90);
  for (const q of run.particles) {
    q.x += q.vx;
    q.y += q.vy;
    q.vy += 0.12;
    q.life--;
  }
  run.particles = run.particles.filter((q) => q.life > 0);
  return events;
}
