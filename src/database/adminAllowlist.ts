/**
 * Phase 7 admin allowlist stub — local only until Auth UIDs exist.
 * Non-allowlisted clients still see Stats; destructive actions can gate later.
 */
import { flags } from '../config/flags';

const KEY = 'kane.adminAllowlist.v1';

/** Dev stub emails / local uids — replace with real Auth UIDs post-emulator. */
export const DEFAULT_ADMIN_ALLOWLIST = [
  'local-commander',
  'cassio@local.dev',
] as const;

export interface AdminAllowlistState {
  version: 1;
  /** Lowercased ids (email or local uid). */
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

export function loadAdminAllowlist(): AdminAllowlistState {
  const fallback: AdminAllowlistState = {
    version: 1,
    ids: [...DEFAULT_ADMIN_ALLOWLIST].map(normalizeId),
  };
  if (!canStore()) return fallback;
  try {
    const raw = localStorage.getItem(KEY);
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
      KEY,
      JSON.stringify({
        version: 1,
        ids: state.ids.map(normalizeId),
      }),
    );
  } catch {
    // ignore
  }
}

export function isAllowlistedAdmin(id: string): boolean {
  if (!flags.adminAllowlistStub) return true;
  const needle = normalizeId(id);
  if (loadAdminAllowlist().ids.includes(needle)) return true;
  // Soft-launch: anonymous local-* stubs count as admin on this device.
  return needle.startsWith('local-');
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

export function formatAdminAllowlist(
  state: AdminAllowlistState = loadAdminAllowlist(),
): string {
  const lines = [
    `Admin allowlist stub (${state.ids.length}):`,
    ...state.ids.map((id) => `  - ${id}`),
    '',
    `You: ${localAdminCandidateId()} · ${
      isAllowlistedAdmin(localAdminCandidateId()) ? 'allowed' : 'not on list'
    }`,
  ];
  return lines.join('\n');
}
