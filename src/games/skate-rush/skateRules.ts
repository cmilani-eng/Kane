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
 * Called by: src/games/skate-rush/SkateRushScene.ts, skateArt.ts, skateStore.ts
 * Tested by: src/games/skate-rush/skateRules.test.ts
 */

export type Random = () => number;

export const VIEW_W = 960;
export const VIEW_H = 480;
export const GROUND = 380;
/** One simulation step, in seconds. */
export const TICK = 1 / 60;

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

export const HAZARD_TYPES = [
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
export type HazardType = (typeof HAZARD_TYPES)[number];
export type ItemType = HazardType | 'coin' | 'power';
export type PowerKind = 'shield' | 'magnet' | 'turbo';
const POWER_KINDS: readonly PowerKind[] = ['shield', 'magnet', 'turbo'];

/** What can spawn: every hazard, plus "double" (spikes followed by a bird). */
const SPAWN_TABLE = [...HAZARD_TYPES, 'double'] as const;
const FLYERS: readonly ItemType[] = ['drone', 'bird', 'alien'];

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

const rand = (random: Random, a: number, b: number): number => a + random() * (b - a);

export function createRun(board: BoardId): Run {
  return {
    board,
    over: false,
    frame: 0,
    score: 0,
    speed: 6 + (board === 'speed' ? 0.7 : 0),
    spawn: 60,
    items: [],
    particles: [],
    runCoins: 0,
    shield: false,
    magnet: 0,
    turbo: 0,
    flip: 0,
    worldIndex: 0,
    player: { x: 155, y: GROUND - 58, w: 54, h: 58, vy: 0, jumps: 0, rot: 0, boost: 0 },
  };
}

export function burst(run: Run, x: number, y: number, col: string, n: number, random: Random): void {
  for (let i = 0; i < n; i++) {
    run.particles.push({ x, y, vx: rand(random, -3, 3), vy: rand(random, -4, 1), life: rand(random, 13, 27), col });
  }
}

/** Up to three jumps per airtime: the second flips and boosts, the third gives a last lift. */
export function jump(run: Run, random: Random): boolean {
  const p = run.player;
  if (run.over || p.jumps >= 3) return false;
  const n = p.jumps++;
  p.vy = n === 0 ? (run.board === 'jump' ? -16 : -13.2) : n === 1 ? -16.5 : -17.5;
  p.rot = 0;
  if (n === 1) {
    run.flip = 1;
    run.turbo = Math.max(run.turbo, 100);
    p.boost = 100;
    burst(run, p.x + 25, p.y + 30, '#c4b5fd', 20, random);
  } else if (n === 2) {
    p.boost = 50;
    burst(run, p.x + 25, p.y + 30, '#fbbf24', 14, random);
  } else {
    burst(run, p.x + 25, p.y + 48, '#67e8f9', 9, random);
  }
  return true;
}

export function spawnItem(run: Run, random: Random): void {
  const t = SPAWN_TABLE[Math.floor(random() * SPAWN_TABLE.length)];
  if (t === 'double') {
    run.items.push({ type: 'spikes', x: VIEW_W + 20, y: 0, w: 58, h: 0, phase: 0 });
    run.items.push({ type: 'bird', x: VIEW_W + 210, y: rand(random, 270, 315), w: 50, h: 0, phase: rand(random, 0, 7) });
    return;
  }
  const o: Item = { type: t, x: VIEW_W + 20, y: rand(random, 260, 320), w: 50, h: 0, phase: rand(random, 0, 7) };
  if (t === 'pit') o.w = rand(random, 110, 165);
  if (t === 'spikes') o.w = rand(random, 48, 78);
  if (t === 'laser') o.w = rand(random, 65, 100);
  if (t === 'boss') o.w = 75;
  if (t === 'animal') o.y = GROUND - 30;
  run.items.push(o);
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

/** The part of a hazard that hurts. Pits are handled separately (see `fallsInPit`). */
export function hazardBox(o: Item, frame: number): Box {
  const g = GROUND;
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
    case 'roller':
      return { x: o.x + 4, y: g - 39, w: 42, h: 36 };
    case 'animal':
      return { x: o.x + 3, y: g - 42, w: 45, h: 40 };
    case 'boss':
      return { x: o.x + 3, y: g - 75, w: 70, h: 75 };
    default:
      // chaser, robot, monster
      return { x: o.x + 3, y: g - 48, w: 48, h: 44 };
  }
}

/** A pit only catches a skater who is on the ground over it. */
export function fallsInPit(box: Box, player: Player, pit: Item): boolean {
  return box.x + box.w > pit.x + 8 && box.x < pit.x + pit.w - 8 && player.y + player.h >= GROUND - 2;
}

/** Advance the run by one 60 Hz step. Returns what happened, for sound. */
export function stepRun(run: Run, random: Random): RunEvent[] {
  const events: RunEvent[] = [];
  if (run.over) return events;
  const p = run.player;

  run.frame++;
  run.score += 0.12;
  run.speed =
    Math.min(12.5, 6 + run.frame / 1900) + (run.turbo > 0 ? 2 : 0) + (run.board === 'speed' ? 0.5 : 0);
  run.worldIndex = Math.floor(run.score / WORLD_SCORE) % WORLDS.length;

  p.vy += 0.66;
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
    spawnItem(run, random);
    if (random() < 0.72) spawnCoins(run, VIEW_W + 100);
    if (random() < 0.22) spawnPower(run, VIEW_W + 360, random);
    run.spawn = Math.max(53, rand(random, 90, 135) - (run.speed - 6) * 5);
  }

  const pulling = run.magnet > 0 || run.board === 'magnet';
  for (const o of run.items) {
    o.x -= run.speed;
    if (FLYERS.includes(o.type)) o.y += Math.sin(run.frame * 0.1 + o.phase) * 1.7;
    if (o.type === 'coin' && pulling && Math.abs(o.x - p.x) < 220) {
      o.x -= Math.sign(o.x - p.x) * 2;
      o.y += (p.y + 15 - o.y) * 0.035;
    }
  }

  const box: Box = { x: p.x + 9, y: p.y + 8, w: p.w - 17, h: p.h - 10 };
  for (const o of run.items) {
    if (o.got) continue;
    if (o.type === 'coin' || o.type === 'power') {
      if (!collide(box, o)) continue;
      if (o.type === 'coin') {
        run.runCoins++;
        burst(run, o.x, o.y, '#fde047', 5, random);
        events.push('coin');
      } else {
        if (o.power === 'shield') run.shield = true;
        if (o.power === 'magnet') run.magnet = 600;
        if (o.power === 'turbo') run.turbo = 240;
        burst(run, o.x, o.y, '#86efac', 15, random);
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
      burst(run, p.x + 25, p.y + 20, '#7dd3fc', 24, random);
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
