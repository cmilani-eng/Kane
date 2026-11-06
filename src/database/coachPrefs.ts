/**
 * Whether the player has finished or skipped the in-match coach.
 * A fresh device shows the tips. The menu can turn them back on.
 */
const KEY = 'kane.coachSeen.v1';

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function isCoachSeen(): boolean {
  if (!canStore()) return false;
  try {
    const raw = localStorage.getItem(KEY);
    return raw === '1' || raw === 'true';
  } catch {
    return false;
  }
}

export function setCoachSeen(seen: boolean): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, seen ? '1' : '0');
  } catch {
    // ignore quota / private mode
  }
}
