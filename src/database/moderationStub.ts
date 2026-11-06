/**
 * Phase 7 moderation stubs — report / mute / kick placeholders.
 * No live network; localStorage only. SP vs AI untouched.
 */
import { canAccessAdmin, localAdminCandidateId } from './adminAllowlist';

const KEY = 'kane.moderation.v1';
const MAX = 40;

export type ModerationAction = 'report' | 'mute' | 'kick' | 'note';

export interface ModerationEvent {
  id: string;
  atMs: number;
  action: ModerationAction;
  targetId: string;
  reason: string;
  byAdminId: string;
}

export interface ModerationStore {
  version: 1;
  events: ModerationEvent[];
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function empty(): ModerationStore {
  return { version: 1, events: [] };
}

export function loadModerationLog(): ModerationStore {
  if (!canStore()) return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<ModerationStore>;
    const events = Array.isArray(parsed.events) ? parsed.events : [];
    return { version: 1, events };
  } catch {
    return empty();
  }
}

function save(store: ModerationStore): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function recordModerationEvent(
  action: ModerationAction,
  targetId: string,
  reason: string,
): ModerationEvent | null {
  if (!canAccessAdmin()) {
    console.warn('[KANE] moderation stub — denied (not admin)');
    return null;
  }
  const event: ModerationEvent = {
    id: `mod-${Date.now().toString(36)}`,
    atMs: Date.now(),
    action,
    targetId: targetId.trim() || 'unknown',
    reason: reason.trim() || '(no reason)',
    byAdminId: localAdminCandidateId(),
  };
  const store = loadModerationLog();
  store.events = [event, ...store.events].slice(0, MAX);
  save(store);
  console.info(
    `[KANE] moderation stub · ${action} → ${event.targetId} (${event.id})`,
  );
  return event;
}

export function resetModerationLog(): ModerationStore {
  const store = empty();
  save(store);
  return store;
}

export function formatModerationLog(
  store: ModerationStore = loadModerationLog(),
  limit = 5,
): string {
  if (store.events.length === 0) return 'Moderation log: (empty stub)';
  const lines = [`Moderation log (last ${Math.min(limit, store.events.length)}):`];
  for (const e of store.events.slice(0, limit)) {
    lines.push(`  ${e.action} ${e.targetId} — ${e.reason}`);
  }
  return lines.join('\n');
}
