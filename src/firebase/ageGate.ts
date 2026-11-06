/**
 * 13+ age gate for future online features — localStorage only.
 * Does not block local SP vs AI.
 */
import { flags } from '../config/flags';
import type { AgeGateState } from './types';

const KEY = 'kane.ageGate.v1';

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function loadAgeGate(): AgeGateState {
  if (!canStore()) return { ok: false, confirmedAtMs: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ok: false, confirmedAtMs: null };
    const parsed = JSON.parse(raw) as Partial<AgeGateState>;
    return {
      ok: !!parsed.ok,
      confirmedAtMs:
        typeof parsed.confirmedAtMs === 'number' ? parsed.confirmedAtMs : null,
    };
  } catch {
    return { ok: false, confirmedAtMs: null };
  }
}

export function confirmAgeGate(): AgeGateState {
  const state: AgeGateState = { ok: true, confirmedAtMs: Date.now() };
  if (canStore()) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // private mode — keep in-memory only for this session
    }
  }
  return state;
}

export function clearAgeGate(): AgeGateState {
  const state: AgeGateState = { ok: false, confirmedAtMs: null };
  if (canStore()) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
  return state;
}

/** Online path may proceed only after 13+ confirm. SP ignores this. */
export function canUseOnlineFeatures(
  gate: AgeGateState = loadAgeGate(),
): boolean {
  return gate.ok && flags.ageGateMinYears >= 13;
}

export function ageGateLabel(gate: AgeGateState = loadAgeGate()): string {
  return gate.ok
    ? `Age ${flags.ageGateMinYears}+ confirmed`
    : `Age ${flags.ageGateMinYears}+ gate pending (online only)`;
}
