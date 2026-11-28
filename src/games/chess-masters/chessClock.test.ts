import { describe, expect, it } from 'vitest';
import { TIME_CONTROLS, createClock, flaggedColor, formatClock, pressClock, stopClock, tickClock, timeControl } from './chessClock';

describe('blitz clock', () => {
  it('reads each time control', () => {
    expect(timeControl('3+2')).toEqual({ baseMs: 180_000, incrementMs: 2000 });
    for (const id of TIME_CONTROLS) expect(timeControl(id).baseMs).toBeGreaterThan(0);
  });

  it('runs nobody until White has moved', () => {
    const clock = createClock('3+2');
    expect(tickClock(clock, 5000).remaining).toEqual([180_000, 180_000]);
    const started = pressClock(clock, 0);
    expect(started.running).toBe(1);
    expect(started.remaining).toEqual([180_000, 180_000]);
    expect(tickClock(started, 5000).remaining).toEqual([180_000, 175_000]);
  });

  it('adds the increment to whoever has just moved', () => {
    let clock = pressClock(createClock('3+2'), 0);
    clock = pressClock(tickClock(clock, 5000), 1);
    expect(clock.remaining).toEqual([180_000, 177_000]);
    clock = pressClock(tickClock(clock, 1000), 0);
    expect(clock.remaining).toEqual([181_000, 177_000]);
  });

  it('flags at zero and gives a flagged side nothing back', () => {
    const running = pressClock(createClock('1+0'), 0);
    const out = tickClock(running, 61_000);
    expect(out.remaining[1]).toBe(0);
    expect(flaggedColor(out)).toBe(1);
    expect(flaggedColor(running)).toBeNull();
    expect(pressClock(out, 1).remaining[1]).toBe(0);
  });

  it('stops', () => {
    const stopped = stopClock(pressClock(createClock('5+0'), 0));
    expect(tickClock(stopped, 9000)).toEqual(stopped);
  });

  it('shows minutes and seconds, then tenths near the end', () => {
    expect(formatClock(180_000)).toBe('3:00');
    expect(formatClock(179_001)).toBe('3:00');
    expect(formatClock(61_000)).toBe('1:01');
    expect(formatClock(9_950)).toBe('0:09.9');
    expect(formatClock(400)).toBe('0:00.4');
    expect(formatClock(-5)).toBe('0:00.0');
  });
});
