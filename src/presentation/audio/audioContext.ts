/**
 * Shared Web Audio context + mute flag for SFX and ambient BGM.
 */
let ctx: AudioContext | null = null;
let muted = false;
const muteListeners = new Set<() => void>();

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
