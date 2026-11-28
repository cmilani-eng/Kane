/**
 * Chess Masters — the Blitz clock. Pure: the scene tells it how much time has passed.
 * As on most online boards, nobody's time runs until White has made the first move.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts, chessStore.ts
 * Tested by: src/games/chess-masters/chessClock.test.ts
 */
import { WHITE, otherColor, type Color } from './chessCore';

export const TIME_CONTROLS = ['1+0', '3+2', '5+0', '10+0'] as const;
export type TimeControlId = (typeof TIME_CONTROLS)[number];

/** `3+2` is three minutes each, plus two seconds after every move. */
export function timeControl(id: TimeControlId): { baseMs: number; incrementMs: number } {
  const [minutes = 0, seconds = 0] = id.split('+').map(Number);
  return { baseMs: minutes * 60_000, incrementMs: seconds * 1000 };
}

export interface Clock {
  remaining: [number, number];
  increment: number;
  /** Whose time is running, or null before the first move and after the end. */
  running: Color | null;
}

export function createClock(id: TimeControlId): Clock {
  const { baseMs, incrementMs } = timeControl(id);
  return { remaining: [baseMs, baseMs], increment: incrementMs, running: null };
}

export function tickClock(clock: Clock, elapsedMs: number): Clock {
  if (clock.running === null || !(elapsedMs > 0)) return clock;
  const remaining: Clock['remaining'] = [clock.remaining[0], clock.remaining[1]];
  remaining[clock.running] = Math.max(0, remaining[clock.running] - elapsedMs);
  return { ...clock, remaining };
}

/** `mover` has finished a turn: they get the increment and the other side's time starts. */
export function pressClock(clock: Clock, mover: Color): Clock {
  const remaining: Clock['remaining'] = [clock.remaining[0], clock.remaining[1]];
  // White's very first move is made before the clock starts, so it earns no increment.
  const started = clock.running !== null || mover !== WHITE;
  if (started && remaining[mover] > 0) remaining[mover] += clock.increment;
  return { ...clock, remaining, running: otherColor(mover) };
}

export const stopClock = (clock: Clock): Clock => ({ ...clock, running: null });

export function flaggedColor(clock: Clock): Color | null {
  if (clock.remaining[0] <= 0) return 0;
  if (clock.remaining[1] <= 0) return 1;
  return null;
}

/** `4:59`, or `0:09.4` once there are under ten seconds left. */
export function formatClock(ms: number): string {
  const safe = Math.max(0, ms);
  if (safe < 10_000) {
    const tenths = Math.floor(safe / 100);
    return `0:0${Math.floor(tenths / 10)}.${tenths % 10}`;
  }
  const seconds = Math.ceil(safe / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
