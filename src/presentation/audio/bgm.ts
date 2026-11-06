/**
 * Ambient BGM stub — procedural Web Audio pad (no asset files).
 * Shares mute with SFX via `audioContext` / HUD Sound toggle.
 */
import {
  getAudioContext,
  isSfxMuted,
  onMuteChange,
} from './audioContext';

const BGM_GAIN = 0.016;

let started = false;
let master: GainNode | null = null;
const nodes: AudioNode[] = [];
const oscillators: OscillatorNode[] = [];
let unsubscribeMute: (() => void) | null = null;

/** Apply current mute to the ambient bus (gain 0 when muted). */
export function syncAmbientBgmMute(): void {
  if (!master) return;
  const ac = getAudioContext();
  if (!ac) return;
  const target = isSfxMuted() ? 0 : BGM_GAIN;
  try {
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(target, ac.currentTime, 0.05);
  } catch {
    master.gain.value = target;
  }
}

/**
 * Start (or resume) a soft looping ambient pad.
 * Safe to call often; no-ops if AudioContext blocked. Respects mute.
 * Call after a user gesture (menu click / match start) for autoplay policy.
 */
export function ensureAmbientBgm(): void {
  if (started && master) {
    syncAmbientBgmMute();
    return;
  }
  const ac = getAudioContext();
  if (!ac) return;

  try {
    master = ac.createGain();
    master.gain.value = isSfxMuted() ? 0 : BGM_GAIN;
    master.connect(ac.destination);

    // Low drone + fifth + soft high shimmer — calm skirmish bed
    const partials: Array<{ freq: number; type: OscillatorType; gain: number }> =
      [
        { freq: 73.4, type: 'sine', gain: 0.55 }, // D2
        { freq: 110, type: 'sine', gain: 0.35 }, // A2
        { freq: 146.8, type: 'triangle', gain: 0.18 }, // D3
        { freq: 220, type: 'sine', gain: 0.08 }, // A3 shimmer
      ];

    for (const p of partials) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = p.type;
      osc.frequency.value = p.freq;
      g.gain.value = p.gain;

      const lfo = ac.createOscillator();
      const lfoGain = ac.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07 + p.freq * 0.00015;
      lfoGain.gain.value = p.gain * 0.25;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();
      oscillators.push(lfo);
      nodes.push(lfoGain);

      osc.connect(g);
      g.connect(master);
      osc.start();
      oscillators.push(osc);
      nodes.push(g);
    }

    if (!unsubscribeMute) {
      unsubscribeMute = onMuteChange(syncAmbientBgmMute);
    }
    started = true;
    syncAmbientBgmMute();
  } catch {
    stopAmbientBgm();
  }
}

/** Tear down ambient graph (tests / hot reload). */
export function stopAmbientBgm(): void {
  for (const osc of oscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // ignore
    }
  }
  for (const n of nodes) {
    try {
      n.disconnect();
    } catch {
      // ignore
    }
  }
  if (master) {
    try {
      master.disconnect();
    } catch {
      // ignore
    }
  }
  oscillators.length = 0;
  nodes.length = 0;
  master = null;
  started = false;
}

export function isAmbientBgmRunning(): boolean {
  return started;
}
