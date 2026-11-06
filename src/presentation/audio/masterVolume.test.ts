import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getMasterVolume,
  isSfxMuted,
  setMasterVolume,
  setSfxMuted,
} from './audioContext';

const KEY = 'kane.masterVolume.v1';

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
  setSfxMuted(false);
  setMasterVolume(1);
  store.clear();
});

describe('master volume + mute', () => {
  it('persists master volume and keeps mute session-scoped', () => {
    setMasterVolume(0.4);
    expect(getMasterVolume()).toBeCloseTo(0.4);
    expect(store.get(KEY)).toBe('0.4');

    setSfxMuted(true);
    expect(isSfxMuted()).toBe(true);
    // Stored level is unchanged while muted.
    expect(getMasterVolume()).toBeCloseTo(0.4);

    setSfxMuted(false);
    expect(isSfxMuted()).toBe(false);
    expect(getMasterVolume()).toBeCloseTo(0.4);
  });

  it('clamps volume to 0–1', () => {
    setMasterVolume(-1);
    expect(getMasterVolume()).toBe(0);
    setMasterVolume(2);
    expect(getMasterVolume()).toBe(1);
  });
});
