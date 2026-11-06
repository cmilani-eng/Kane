import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isCoachSeen, setCoachSeen } from './coachPrefs';

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
});

afterEach(() => {
  store.clear();
});

describe('coach seen preference', () => {
  it('shows tips until the player finishes or turns them off', () => {
    expect(isCoachSeen()).toBe(false);
    setCoachSeen(true);
    expect(isCoachSeen()).toBe(true);
    setCoachSeen(false);
    expect(isCoachSeen()).toBe(false);
  });
});
