/**
 * Shared Web Audio context + mute + master volume for SFX and ambient BGM.
 * Volume persists in localStorage; mute is session-scoped and still zeros output.
 */
const VOLUME_KEY = 'kane.masterVolume.v1';

let ctx: AudioContext | null = null;
let muted = false;
/** 0–1; applied when unmuted. */
let masterVolume = loadStoredVolume();
const muteListeners = new Set<() => void>();
const volumeListeners = new Set<() => void>();

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function loadStoredVolume(): number {
  if (!canStore()) return 1;
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw == null) return 1;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 1;
    return clamp01(n);
  } catch {
    return 1;
  }
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function persistVolume(v: number): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    // ignore
  }
}

/** Shared Web Audio context (resumes if suspended). */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isSfxMuted(): boolean {
  return muted;
}

export function setSfxMuted(value: boolean): void {
  muted = value;
  for (const fn of muteListeners) {
    try {
      fn();
    } catch {
      // ignore listener failures
    }
  }
}

/** BGM (and others) subscribe so mute toggles silence every bus. */
export function onMuteChange(fn: () => void): () => void {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

/** Stored master volume 0–1 (still applied only when unmuted). */
export function getMasterVolume(): number {
  return masterVolume;
}

export function setMasterVolume(value: number): void {
  const next = clamp01(value);
  if (next === masterVolume) {
    persistVolume(next);
    return;
  }
  masterVolume = next;
  persistVolume(next);
  for (const fn of volumeListeners) {
    try {
      fn();
    } catch {
      // ignore
    }
  }
}

export function onVolumeChange(fn: () => void): () => void {
  volumeListeners.add(fn);
  return () => volumeListeners.delete(fn);
}

/** Effective gain multiplier: 0 when muted, else master volume. */
export function effectiveMasterGain(): number {
  return muted ? 0 : masterVolume;
}
