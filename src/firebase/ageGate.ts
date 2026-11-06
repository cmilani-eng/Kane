/**
 * 13+ age gate — first-run boot confirm, localStorage only.
 * Under-13 is blocked from Menu / SP. Ads stay off (see flags).
 */
import { flags } from '../config/flags';
import type { AgeGateState, AgeGateStatus } from './types';

const KEY = 'kane.ageGate.v2';
/** In-memory fallback when localStorage is unavailable. */
let memory: AgeGateState | null = null;

function pending(): AgeGateState {
  return { status: 'pending', ok: false, confirmedAtMs: null };
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function normalize(raw: Partial<AgeGateState> & { ok?: boolean }): AgeGateState {
  let status: AgeGateStatus = 'pending';
  if (raw.status === 'ok' || raw.status === 'blocked' || raw.status === 'pending') {
    status = raw.status;
  } else if (raw.ok === true) {
    // Migrate v1 `{ ok: true }` shapes.
    status = 'ok';
  }
  return {
    status,
    ok: status === 'ok',
    confirmedAtMs:
      typeof raw.confirmedAtMs === 'number' ? raw.confirmedAtMs : null,
  };
}

function persist(state: AgeGateState): AgeGateState {
  memory = state;
  if (canStore()) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // private mode — memory only
    }
  }
  return state;
}

export function loadAgeGate(): AgeGateState {
  if (memory) return memory;
  if (!canStore()) return pending();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      // One-shot migrate from v1 key if present.
      const v1 = localStorage.getItem('kane.ageGate.v1');
      if (v1) {
        const migrated = normalize(JSON.parse(v1) as Partial<AgeGateState>);
        return persist(migrated);
      }
      return pending();
    }
    const state = normalize(JSON.parse(raw) as Partial<AgeGateState>);
    memory = state;
    return state;
  } catch {
    return pending();
  }
}

/** Player confirms they are 13+ — unlocks Menu / SP. */
export function confirmAgeGate(): AgeGateState {
  return persist({
    status: 'ok',
    ok: true,
    confirmedAtMs: Date.now(),
  });
}

/** Player indicates under-13 — stay on blocked screen. */
export function blockUnder13(): AgeGateState {
  return persist({
    status: 'blocked',
    ok: false,
    confirmedAtMs: Date.now(),
  });
}

export function clearAgeGate(): AgeGateState {
  memory = null;
  if (canStore()) {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem('kane.ageGate.v1');
    } catch {
      // ignore
    }
  }
  return pending();
}

/** True once the player has answered (ok or blocked). */
export function isAgeGateResolved(
  gate: AgeGateState = loadAgeGate(),
): boolean {
  return gate.status === 'ok' || gate.status === 'blocked';
}

/** Menu / battlefield allowed only after 13+ confirm. */
export function canEnterGame(gate: AgeGateState = loadAgeGate()): boolean {
  return gate.status === 'ok';
}

/** Online lobby stubs also require 13+. */
export function canUseOnlineFeatures(
  gate: AgeGateState = loadAgeGate(),
): boolean {
  return gate.status === 'ok' && flags.ageGateMinYears >= 13;
}

export function ageGateLabel(gate: AgeGateState = loadAgeGate()): string {
  if (gate.status === 'ok') {
    return `Age ${flags.ageGateMinYears}+ confirmed`;
  }
  if (gate.status === 'blocked') {
    return `Under ${flags.ageGateMinYears} — play blocked`;
  }
  return `Age ${flags.ageGateMinYears}+ gate pending`;
}
