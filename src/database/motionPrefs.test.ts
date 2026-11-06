import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isReduceMotion, setReduceMotion } from './motionPrefs';

const KEY = 'kane.reduceMotion.v1';

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    },
  });
  // Reset module state via API (defaults off).
  setReduceMotion(false);
  store.clear();
});

afterEach(() => {
  setReduceMotion(false);
  store.clear();
});

describe('motionPrefs', () => {
  it('defaults to reduce-motion off', () => {
    expect(isReduceMotion()).toBe(false);
  });

  it('persists reduce-motion preference', () => {
    setReduceMotion(true);
    expect(isReduceMotion()).toBe(true);
    expect(store.get(KEY)).toBe('1');

    setReduceMotion(false);
    expect(isReduceMotion()).toBe(false);
    expect(store.get(KEY)).toBe('0');
  });
});
