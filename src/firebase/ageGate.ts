/**
 * Age positioning helpers — product is framed 13+ / not COPPA child-directed.
 * In-game AgeGate boot confirmation was removed (product decision).
 * Firestore may still mirror `ageGateOk`; no UI blocks on this module.
 */
import { flags } from '../config/flags';
import type { AgeGateState } from './types';

const KEY = 'kane.ageGate.v2';
const LEGACY_KEY = 'kane.ageGate.v1';

/** Always-ok state — gate screen no longer runs. */
function okState(confirmedAtMs: number | null = null): AgeGateState {
  return { status: 'ok', ok: true, confirmedAtMs };
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/** Clear legacy gate keys so blocked/pending devices are not stuck. */
function clearLegacyKeys(): void {
  if (!canStore()) return;
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns an always-ok gate. Legacy localStorage answers are discarded so
 * a prior under-13 block cannot strand the player after the UI was removed.
 */
export function loadAgeGate(): AgeGateState {
  clearLegacyKeys();
  return okState();
}

/** @deprecated No in-game gate — kept for foundation re-exports / tests. */
export function confirmAgeGate(): AgeGateState {
  clearLegacyKeys();
  return okState(Date.now());
}

/** @deprecated No under-13 block screen — no-op that keeps play unlocked. */
export function blockUnder13(): AgeGateState {
  clearLegacyKeys();
  return okState(Date.now());
}

export function clearAgeGate(): AgeGateState {
  clearLegacyKeys();
  return okState();
}

export function isAgeGateResolved(
  _gate: AgeGateState = loadAgeGate(),
): boolean {
  return true;
}

/** Menu / battlefield always allowed — no boot confirmation. */
export function canEnterGame(_gate: AgeGateState = loadAgeGate()): boolean {
  return true;
}

/** Online lobby stubs no longer wait on an age confirm. */
export function canUseOnlineFeatures(
  _gate: AgeGateState = loadAgeGate(),
): boolean {
  return flags.ageGateMinYears >= 13;
}

/** Quiet console/docs label — not shown in player-facing chrome. */
export function ageGateLabel(_gate: AgeGateState = loadAgeGate()): string {
  return `${flags.ageGateMinYears}+ positioning (no in-game gate)`;
}
