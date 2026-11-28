/**
 * What a player has to be able to tell from the picture: which enemies are bosses, and how many
 * bombs each has still to throw. Drawn on a stand-in canvas that notes what it is asked to do.
 */
import { describe, expect, it } from 'vitest';
import { drawFrame } from './skateArt';
import { COURSE_IDS } from './skateCourses';
import { LEVEL_IDS, type LevelId } from './skateLevels';
import { ENEMY_TYPES, createRun, spawnPattern, stepRun, type Run, type Spawnable } from './skateRules';

interface Drawn {
  crowns: number;
  /** Each bomb is the only thing drawn as a circle of radius 13 that is not a warning "!". */
  bombs: number;
}

function draw(run: Run): Drawn {
  const drawn: Drawn = { crowns: 0, bombs: 0 };
  let fill = '';
  const record: Record<string, unknown> = {
    fillText: (text: string) => {
      if (text === '👑') drawn.crowns++;
    },
    arc: (_x: number, _y: number, radius: number) => {
      if (radius === 13 && fill === '#111827') drawn.bombs++;
    },
    createLinearGradient: () => ({ addColorStop: () => undefined }),
  };
  const canvas = new Proxy(record, {
    get: (target, key: string) => target[key] ?? (() => undefined),
    set: (_target, key: string, value) => {
      if (key === 'fillStyle') fill = String(value);
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  drawFrame(canvas, run, 'cyan');
  return drawn;
}

function withOnly(level: LevelId, pattern: Spawnable): Run {
  const run = createRun('basic', level);
  run.spawn = 1e9;
  spawnPattern(run, pattern, () => 0.5);
  return run;
}

/** Where the map's dot is drawn, if a course map is in the picture at all. */
function mapDot(run: Run): { maps: number; x: number; y: number } {
  const seen = { maps: 0, x: Number.NaN, y: Number.NaN };
  const record: Record<string, unknown> = {
    fillText: (text: string) => {
      if (text === '⏱') seen.maps++;
    },
    // The dot is the only circle of radius 6.
    arc: (x: number, y: number, radius: number) => {
      if (radius === 6) Object.assign(seen, { x, y });
    },
    createLinearGradient: () => ({ addColorStop: () => undefined }),
  };
  const canvas = new Proxy(record, {
    get: (target, key: string) => target[key] ?? (() => undefined),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  drawFrame(canvas, run, 'cyan');
  return seen;
}

describe('the map of a timing course', () => {
  it.each(COURSE_IDS)('%s is mapped as soon as it is sent, before any of it is on screen', (id) => {
    expect(mapDot(withOnly('extreme', id)).maps).toBe(1);
  });

  it('is not drawn when no course is coming', () => {
    for (const level of LEVEL_IDS) expect(mapDot(withOnly(level, 'spikes')).maps, level).toBe(0);
  });

  it('has a dot that waits, then moves along the course, and rises when the skater jumps', () => {
    const run = withOnly('extreme', 'tunnel');
    const waiting = mapDot(run);
    for (const o of run.items) o.x -= 200;
    expect(mapDot(run).x).toBe(waiting.x);
    // Now the skater is well into it.
    for (const o of run.items) o.x -= 1500;
    const inside = mapDot(run);
    expect(inside.x).toBeGreaterThan(waiting.x + 100);
    run.player.y -= 100;
    expect(mapDot(run).y).toBeLessThan(inside.y);
  });
});

describe('bosses in the picture', () => {
  it.each(ENEMY_TYPES)('%s wears a crown and holds its bombs on Hard and Extreme', (type) => {
    expect(draw(withOnly('hard', type))).toEqual({ crowns: 1, bombs: 1 });
    expect(draw(withOnly('extreme', type))).toEqual({ crowns: 1, bombs: 2 });
  });

  it.each(['easy', 'medium'] as const)('on %s only the boss does', (level) => {
    for (const type of ENEMY_TYPES) {
      const expected = type === 'boss' ? { crowns: 1, bombs: 1 } : { crowns: 0, bombs: 0 };
      expect(draw(withOnly(level, type)), type).toEqual(expected);
    }
  });

  it.each(LEVEL_IDS)('on %s no obstacle is ever crowned', (level) => {
    for (const pattern of ['spikes', 'crate', 'pit', 'swing', 'laser', 'fire', 'under-bridge'] as const) {
      expect(draw(withOnly(level, pattern)), pattern).toEqual({ crowns: 0, bombs: 0 });
    }
  });

  it('shows each bomb leave the hand: held and thrown together always add up', () => {
    const run = withOnly('extreme', 'chaser');
    for (let step = 0; step < 60; step++) {
      // Out of the way: only the picture is being checked.
      run.player.y = -2000;
      run.player.vy = 0;
      stepRun(run, () => 0.5);
      expect(draw(run).bombs, `step ${step}`).toBe(2);
    }
    // By now both have been thrown, so both are being drawn on the track.
    expect(run.items.filter((o) => o.type === 'bomb')).toHaveLength(2);
  });
});
