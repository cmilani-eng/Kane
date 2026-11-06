/**
 * Reduce-motion preference — disables combat camera nudge when on.
 * Persists in localStorage across sessions.
 */
const KEY = 'kane.reduceMotion.v1';

let reduceMotion = loadStored();

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function loadStored(): boolean {
  if (!canStore()) return false;
  try {
    const raw = localStorage.getItem(KEY);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

function persist(value: boolean): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // ignore quota / private mode
  }
}

/** True when combat camera nudge (and similar motion) should stay off. */
export function isReduceMotion(): boolean {
  return reduceMotion;
}

export function setReduceMotion(value: boolean): void {
  if (value === reduceMotion) return;
  reduceMotion = value;
  persist(value);
}
