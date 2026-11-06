/**
 * Presentation — lightweight SFX placeholders (Web Audio beeps).
 * No asset files / no secrets. Mute-safe; fails quietly if AudioContext blocked.
 * Ambient BGM shares mute via `audioContext`.
 */
import {
  getAudioContext,
  getMasterVolume,
  isSfxMuted,
  setMasterVolume,
  setSfxMuted,
} from './audioContext';

export {
  getAudioContext,
  getMasterVolume,
  isSfxMuted,
  setMasterVolume,
  setSfxMuted,
};

export type SfxKey =
  | 'select'
  | 'gather'
  | 'deposit'
  | 'build'
  | 'train'
  | 'attack'
  | 'alert'
  | 'hero'
  | 'ability'
  | 'ui'
  | 'victory'
  | 'defeat';

type Tone = { freq: number; dur: number; type?: OscillatorType; gain?: number };

const TONES: Record<SfxKey, Tone[]> = {
  select: [{ freq: 520, dur: 0.05, type: 'square', gain: 0.04 }],
  gather: [
    { freq: 340, dur: 0.06, type: 'triangle', gain: 0.05 },
    { freq: 420, dur: 0.05, type: 'triangle', gain: 0.04 },
  ],
  deposit: [
    { freq: 480, dur: 0.05, type: 'sine', gain: 0.045 },
    { freq: 620, dur: 0.07, type: 'triangle', gain: 0.04 },
  ],
  build: [{ freq: 180, dur: 0.12, type: 'sawtooth', gain: 0.035 }],
  train: [{ freq: 260, dur: 0.08, type: 'square', gain: 0.04 }],
  attack: [{ freq: 140, dur: 0.07, type: 'sawtooth', gain: 0.05 }],
  // Soft under-attack cue — brief, not spammy (rate-limited by combat pulse).
  alert: [
    { freq: 380, dur: 0.05, type: 'square', gain: 0.035 },
    { freq: 260, dur: 0.08, type: 'triangle', gain: 0.04 },
  ],
  hero: [
    { freq: 440, dur: 0.08, type: 'triangle', gain: 0.05 },
    { freq: 660, dur: 0.1, type: 'triangle', gain: 0.045 },
  ],
  ability: [
    { freq: 500, dur: 0.06, type: 'sine', gain: 0.05 },
    { freq: 750, dur: 0.09, type: 'sine', gain: 0.04 },
  ],
  ui: [{ freq: 600, dur: 0.04, type: 'square', gain: 0.03 }],
  // Short stub tones — end screen uses playEndFanfare for full stingers.
  victory: [
    { freq: 523, dur: 0.1, type: 'triangle', gain: 0.05 },
    { freq: 659, dur: 0.1, type: 'triangle', gain: 0.05 },
    { freq: 784, dur: 0.16, type: 'triangle', gain: 0.05 },
  ],
  defeat: [{ freq: 220, dur: 0.2, type: 'sawtooth', gain: 0.04 }],
};

/** Longer mute-aware win/lose fanfares for the end overlay. */
const FANFARE: Record<'victory' | 'defeat', Tone[]> = {
  victory: [
    { freq: 392, dur: 0.12, type: 'triangle', gain: 0.045 },
    { freq: 523, dur: 0.12, type: 'triangle', gain: 0.05 },
    { freq: 659, dur: 0.12, type: 'triangle', gain: 0.05 },
    { freq: 784, dur: 0.18, type: 'triangle', gain: 0.055 },
    { freq: 659, dur: 0.1, type: 'sine', gain: 0.04 },
    { freq: 784, dur: 0.1, type: 'sine', gain: 0.045 },
    { freq: 1047, dur: 0.28, type: 'triangle', gain: 0.06 },
  ],
  defeat: [
    { freq: 330, dur: 0.16, type: 'sawtooth', gain: 0.045 },
    { freq: 277, dur: 0.18, type: 'sawtooth', gain: 0.04 },
    { freq: 220, dur: 0.22, type: 'triangle', gain: 0.04 },
    { freq: 165, dur: 0.36, type: 'sine', gain: 0.05 },
  ],
};

let lastPlayMs = 0;

/** Soft rate-limit so spam clicks don’t stack oscillators. */
export function playSfx(key: SfxKey): void {
  if (isSfxMuted()) return;
  const now = performance.now();
  if (now - lastPlayMs < 40) return;
  lastPlayMs = now;
  playToneSequence(TONES[key]);
}

/**
 * End-screen victory / defeat fanfare.
 * Mute-aware; not rate-limited so combat spam cannot steal the stinger.
 */
export function playEndFanfare(win: boolean): void {
  if (isSfxMuted()) return;
  playToneSequence(FANFARE[win ? 'victory' : 'defeat']);
}

function playToneSequence(tones: Tone[]): void {
  const ac = getAudioContext();
  if (!ac) return;
  const vol = getMasterVolume();
  if (vol <= 0) return;
  let t0 = ac.currentTime;
  for (const tone of tones) {
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = tone.type ?? 'sine';
      osc.frequency.value = tone.freq;
      const g = (tone.gain ?? 0.04) * vol;
      gain.gain.setValueAtTime(g, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + tone.dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + tone.dur + 0.02);
      t0 += tone.dur * 0.85;
    } catch {
      // ignore — placeholder audio must never break gameplay
    }
  }
}
