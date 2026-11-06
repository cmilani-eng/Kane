/**
 * Phase 7 admin allowlist stub for #/admin.
 * Modes: `open` (local-dev default) or `allowlist` (configurable deny).
 */
import { flags } from '../config/flags';

const LIST_KEY = 'kane.adminAllowlist.v1';
const MODE_KEY = 'kane.adminAccessMode.v1';

export type AdminAccessMode = 'open' | 'allowlist';

/** Dev stub ids — replace with Auth UIDs when emulator Auth lands. */
export const DEFAULT_ADMIN_ALLOWLIST = [
  'local-commander',
  'cassio@local.dev',
] as const;

export interface AdminAllowlistState {
  version: 1;
  ids: string[];
}

function canStore(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

/** Effective mode: localStorage override → env → flags default (open). */
export function getAdminAccessMode(): AdminAccessMode {
  if (canStore()) {
    try {
      const raw = localStorage.getItem(MODE_KEY);
      if (raw === 'open' || raw === 'allowlist') return raw;
    } catch {
      // ignore
    }
  }
  const env = import.meta.env.VITE_ADMIN_ACCESS_MODE;
  if (env === 'open' || env === 'allowlist') return env;
  return flags.adminAccessMode;
}

export function setAdminAccessMode(mode: AdminAccessMode): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // ignore
  }
}

export function loadAdminAllowlist(): AdminAllowlistState {
  const fallback: AdminAllowlistState = {
    version: 1,
    ids: [...DEFAULT_ADMIN_ALLOWLIST].map(normalizeId),
  };
  if (!canStore()) return fallback;
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AdminAllowlistState>;
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.map((x) => normalizeId(String(x))).filter(Boolean)
      : fallback.ids;
    return { version: 1, ids: ids.length > 0 ? ids : fallback.ids };
  } catch {
    return fallback;
  }
}

export function saveAdminAllowlist(state: AdminAllowlistState): void {
  if (!canStore()) return;
  try {
    localStorage.setItem(
      LIST_KEY,
      JSON.stringify({
        version: 1,
        ids: state.ids.map(normalizeId),
      }),
    );
  } catch {
    // ignore
  }
}

export function addAdminAllowlistId(id: string): AdminAllowlistState {
  const state = loadAdminAllowlist();
  const n = normalizeId(id);
  if (n && !state.ids.includes(n)) {
    state.ids.push(n);
    saveAdminAllowlist(state);
  }
  return state;
}

/** Local anonymous / stub identity used before Firebase Auth. */
export function localAdminCandidateId(): string {
  try {
    const uid = localStorage.getItem('kane.localAuthUid.v1');
    if (uid) return normalizeId(uid);
  } catch {
    // ignore
  }
  return 'local-commander';
}

export function isAllowlistedAdmin(id: string): boolean {
  const needle = normalizeId(id);
  if (loadAdminAllowlist().ids.includes(needle)) return true;
  // Device anonymous stubs still match soft local-* entries.
  return needle.startsWith('local-');
}

/**
 * Can open #/admin (and reset)?
 * - open: always (local-dev default)
 * - allowlist: must be on list / local-*
 */
export function canAccessAdmin(
  id: string = localAdminCandidateId(),
): boolean {
  if (!flags.adminAllowlistStub) return true;
  if (getAdminAccessMode() === 'open') return true;
  return isAllowlistedAdmin(id);
}

export function adminDenyReason(
  id: string = localAdminCandidateId(),
): string | null {
  if (canAccessAdmin(id)) return null;
  return `Denied — ${id} is not on the admin allowlist (mode=allowlist). Switch access mode to open for local soft-launch, or add this id to the allowlist.`;
}

export function formatAdminAllowlist(
  state: AdminAllowlistState = loadAdminAllowlist(),
): string {
  const mode = getAdminAccessMode();
  const you = localAdminCandidateId();
  const lines = [
    `Access mode: ${mode}${mode === 'open' ? ' (open for soft-launch)' : ''}`,
    `Allowlist (${state.ids.length}):`,
    ...state.ids.map((id) => `  - ${id}`),
    '',
    `This device: ${you} · ${canAccessAdmin(you) ? 'allowed' : 'DENIED'}`,
  ];
  return lines.join('\n');
}
