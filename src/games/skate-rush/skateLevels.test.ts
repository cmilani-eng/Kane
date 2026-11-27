import { describe, expect, it } from 'vitest';
import { BOSS_SCALE, LEVELS, LEVEL_IDS, type LevelId } from './skateLevels';
import {
  BOSS_THROW,
  ENEMY_TYPES,
  GROUND,
  HAZARD_TYPES,
  PATTERNS,
  SKATER_X,
  createRun,
  cruiseSpeed,
  hazardBox,
  isEnemy,
  liftOf,
  spawnGap,
  spawnPattern,
  stepRun,
  type Item,
  type Pattern,
  type Run,
} from './skateRules';

const half = (): number => 0.5;

function quietRun(level: LevelId, frame = 0): Run {
  const run = createRun('basic', level);
  run.frame = frame;
  run.spawn = 1e9;
  return run;
}

/** The first and top speeds of a level, as frames. */
const SLOWEST = 0;
const FASTEST = 100000;

describe('the four levels', () => {
  it('are Easy, Medium, Hard and Extreme, in that order', () => {
    expect(LEVEL_IDS).toEqual(['easy', 'medium', 'hard', 'extreme']);
  });

  it('leave a run on Easy unless told otherwise', () => {
    expect(createRun('basic').level).toBe('easy');
  });

  it('keep Easy at the numbers the game already had', () => {
    expect(LEVELS.easy).toEqual({
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
    });
  });

  it('Medium: the skater is faster', () => {
    expect(LEVELS.medium.speed.start).toBeGreaterThan(LEVELS.easy.speed.start);
    expect(LEVELS.medium.speed.top).toBeGreaterThan(LEVELS.easy.speed.top);
  });

  it('Medium: every enemy is harder', () => {
    const { easy, medium } = LEVELS;
    for (const type of ['roller', 'chaser', 'monster'] as const) {
      expect(medium.rushers[type].bonus, type).toBeGreaterThan(easy.rushers[type].bonus);
    }
    for (const type of ['animal', 'robot'] as const) expect(medium.hops[type], type).toBeGreaterThan(easy.hops[type]);
    // A flyer that locks on later gives less time to see where it is going.
    expect(medium.swoop.trigger).toBeLessThan(easy.swoop.trigger);
    expect(medium.bombBonus).toBeGreaterThan(easy.bombBonus);
    expect(medium.crowned).toBe(false);
  });

  it('Hard: enemies are bosses, at the speed of Medium', () => {
    expect(LEVELS.hard.speed).toEqual(LEVELS.medium.speed);
    expect(LEVELS.hard.crowned).toBe(true);
    expect(LEVELS.hard.throwAt).toHaveLength(1);
    expect(BOSS_SCALE).toBeGreaterThan(1);
  });

  it('Extreme: a lot faster than Hard', () => {
    expect(LEVELS.extreme.speed.start).toBeGreaterThanOrEqual(LEVELS.hard.speed.start + 3);
    expect(LEVELS.extreme.speed.top).toBeGreaterThanOrEqual(LEVELS.hard.speed.top + 3);
  });

  it("Extreme: enemies are twice as strong as Hard's", () => {
    const { hard, extreme } = LEVELS;
    expect(extreme.crowned).toBe(true);
    expect(extreme.throwAt).toHaveLength(hard.throwAt.length * 2);
    expect(extreme.bombBonus).toBe(hard.bombBonus * 2);
    for (const type of ['roller', 'chaser', 'monster'] as const) {
      expect(extreme.rushers[type].bonus, type).toBe(hard.rushers[type].bonus * 2);
    }
  });

  it.each(LEVEL_IDS)('%s starts and tops out at its own speed', (level) => {
    expect(createRun('basic', level).speed).toBe(LEVELS[level].speed.start);
    expect(cruiseSpeed(quietRun(level, FASTEST))).toBe(LEVELS[level].speed.top);
  });

  it.each(LEVEL_IDS)('%s spaces its spawns from its own ranges', (level) => {
    // That these leave a way through is proved by playing them: see skateFairness.testkit.ts.
    expect(spawnGap(0, () => 0, level)).toBe(LEVELS[level].gapEasy[0]);
    expect(spawnGap(1e9, () => 1, level)).toBe(LEVELS[level].gapHard[1]);
  });
});

describe('who is a boss', () => {
  it('counts every enemy, and no obstacle', () => {
    expect([...ENEMY_TYPES].sort()).toEqual(
      ['alien', 'animal', 'bird', 'boss', 'chaser', 'drone', 'monster', 'robot', 'roller'].sort(),
    );
    for (const type of HAZARD_TYPES) expect(isEnemy(type), type).toBe((ENEMY_TYPES as readonly string[]).includes(type));
  });

  it.each(['easy', 'medium'] as const)('on %s only the boss throws, and nothing is crowned', (level) => {
    for (const pattern of PATTERNS) {
      const run = quietRun(level);
      spawnPattern(run, pattern, half);
      for (const o of run.items) {
        expect(o.crowned ?? false, `${pattern}: ${o.type}`).toBe(false);
        expect(o.throws !== undefined, `${pattern}: ${o.type}`).toBe(o.type === 'boss');
      }
    }
  });

  it.each(['hard', 'extreme'] as const)('on %s every enemy throws, and obstacles never do', (level) => {
    for (const pattern of PATTERNS) {
      const run = quietRun(level);
      spawnPattern(run, pattern, half);
      for (const o of run.items) {
        const label = `${pattern}: ${o.type}`;
        expect(o.throws ?? [], label).toEqual(isEnemy(o.type) ? LEVELS[level].throwAt : []);
        // The boss was a boss already: crowned and big without any help.
        expect(o.crowned ?? false, label).toBe(isEnemy(o.type) && o.type !== 'boss');
      }
    }
  });

  it.each(ENEMY_TYPES.filter((t) => t !== 'boss'))('a boss %s is bigger than the ordinary one', (type) => {
    const plain: Item = { type, x: 400, y: 300, w: 50, h: 0, phase: 0 };
    const small = hazardBox(plain, 0);
    const big = hazardBox({ ...plain, crowned: true }, 0);
    expect(big.w).toBeCloseTo(small.w * BOSS_SCALE);
    expect(big.h).toBeCloseTo(small.h * BOSS_SCALE);
    // Centred where it was.
    expect(big.x + big.w / 2).toBeCloseTo(small.x + small.w / 2, 0);
  });

  it('a hopper on a harder level really does hop higher', () => {
    const peak = (level: LevelId): number => {
      const run = quietRun(level);
      spawnPattern(run, 'animal', half);
      const [o] = run.items;
      let top = 0;
      for (let x = 0; x < 340; x += 2) top = Math.max(top, liftOf({ ...o, x }));
      return top;
    };
    expect(peak('easy')).toBeCloseTo(LEVELS.easy.hops.animal, 0);
    expect(peak('medium')).toBeCloseTo(LEVELS.medium.hops.animal, 0);
  });
});

describe("a boss's bombs", () => {
  /** When each thing first comes level with the front of the skater. A Shield keeps the run going. */
  function arrivals(level: LevelId, pattern: Pattern, frame: number): { type: string; step: number }[] {
    const run = quietRun(level, frame);
    spawnPattern(run, pattern, half);
    const seen = new Map<Item, number>();
    for (let step = 1; step < 400; step++) {
      run.shield = true;
      // A Shield would destroy what it absorbs, so hold the skater out of everything's way.
      run.player.y = -2000;
      run.player.vy = 0;
      stepRun(run, half);
      for (const o of run.items) {
        if (o.type !== 'coin' && !seen.has(o) && o.x <= SKATER_X + 43) seen.set(o, step);
      }
    }
    return [...seen].map(([o, step]) => ({ type: o.type, step })).sort((a, b) => a.step - b.step);
  }

  const plainArrival = (level: LevelId, frame: number): number => arrivals(level, 'crate', frame)[0].step;

  const cases = (['hard', 'extreme'] as const).flatMap((level) =>
    ENEMY_TYPES.flatMap((type) => [SLOWEST, FASTEST].map((frame) => ({ level, type, frame }))),
  );

  it.each(cases)('$level $type (from step $frame): the bombs come first, then the boss', ({ level, type, frame }) => {
    const order = arrivals(level, type, frame);
    const bombs = LEVELS[level].throwAt.length;
    expect(order.map((a) => a.type)).toEqual([...Array<string>(bombs).fill('bomb'), type]);
    // The first bomb gets there when a plain hazard would, so spawns keep their spacing.
    expect(Math.abs(order[0].step - plainArrival(level, frame))).toBeLessThanOrEqual(2);
  });

  it.each(LEVEL_IDS)('on %s a boss throws each bomb exactly once', (level) => {
    const run = quietRun(level);
    spawnPattern(run, 'boss', half);
    const [boss] = run.items;
    const thrown = new Set<Item>();
    for (let step = 0; step < 300; step++) {
      run.player.y = -2000;
      run.player.vy = 0;
      stepRun(run, half);
      for (const o of run.items) if (o.type === 'bomb') thrown.add(o);
    }
    expect(boss.throws).toEqual([]);
    expect(thrown.size).toBe(LEVELS[level].throwAt.length);
  });

  it("drops a flying boss's bomb from where it is flying, not from hand height", () => {
    const run = quietRun('hard');
    spawnPattern(run, 'bird', half);
    const [bird] = run.items;
    while (!run.items.some((o) => o.type === 'bomb')) stepRun(run, half);
    const bomb = run.items.find((o) => o.type === 'bomb') as Item;
    expect(liftOf(bomb)).toBeGreaterThan(GROUND - bird.y - 60);
    expect(liftOf(bomb)).toBeGreaterThan(BOSS_THROW.lift);
  });

  it('never moves so far in one step that it could pass through the skater', () => {
    for (const level of LEVEL_IDS) {
      for (const pattern of PATTERNS) {
        const run = quietRun(level, FASTEST);
        run.board = 'speed';
        run.turbo = 100000;
        spawnPattern(run, pattern, half);
        const before = new Map<Item, number>();
        for (let step = 0; step < 200; step++) {
          run.player.y = -2000;
          run.player.vy = 0;
          for (const o of run.items) before.set(o, o.x);
          stepRun(run, half);
          for (const o of run.items) {
            const was = before.get(o);
            if (was === undefined || o.type === 'coin' || o.type === 'power') continue;
            // The skater's hitbox is 37 wide; a hazard moving less than both widths cannot skip it.
            expect(was - o.x, `${level} ${o.type}`).toBeLessThan(37 + hazardBox(o, run.frame).w);
          }
        }
      }
    }
  });
});
