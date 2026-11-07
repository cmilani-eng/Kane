/**
 * Friend lobbies: a host opens a lobby under a short code, a friend joins it, and
 * either side can close it. These functions decide each change; the Realtime
 * Database wrapper in lobbyRealtime.ts runs them as transactions, so two friends
 * joining at the same moment cannot both take the seat.
 */

/** Bump when the lobby or match format changes. Clients on other versions refuse to join. */
export const LOBBY_PROTOCOL = 1;

export const LOBBY_CODE_LENGTH = 6;

/** No I, O, 0 or 1, so a code read aloud or typed from a screenshot stays unambiguous. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type LobbyStatus = 'open' | 'full' | 'closed';

export interface LobbyRecord {
  hostUid: string;
  guestUid?: string;
  createdAt: number;
  status: LobbyStatus;
  protocol: number;
}

export type JoinReject = 'missing' | 'full' | 'closed' | 'protocol' | 'own';

export type JoinPlan = { write: LobbyRecord } | { reject: JoinReject };

/** A new code from the platform's secure random source. 32 symbols, so a byte masked to 5 bits is unbiased. */
export function newLobbyCode(random: (bytes: Uint8Array) => Uint8Array = fillSecure): string {
  const bytes = random(new Uint8Array(LOBBY_CODE_LENGTH));
  let code = '';
  for (let i = 0; i < LOBBY_CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i]! & 31];
  }
  return code;
}

function fillSecure(bytes: Uint8Array): Uint8Array {
  return globalThis.crypto.getRandomValues(bytes);
}

export function isLobbyCode(value: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{${LOBBY_CODE_LENGTH}}$`).test(value);
}

/** A host may open a lobby only under a code nobody else holds. */
export function planCreate(current: LobbyRecord | null, host: LobbyRecord): LobbyRecord | null {
  return current === null ? host : null;
}

export function planJoin(current: LobbyRecord | null, guestUid: string): JoinPlan {
  if (current === null) return { reject: 'missing' };
  if (current.protocol !== LOBBY_PROTOCOL) return { reject: 'protocol' };
  if (current.hostUid === guestUid) return { reject: 'own' };
  if (current.status === 'closed') return { reject: 'closed' };
  if (current.status !== 'open' || current.guestUid) return { reject: 'full' };
  return { write: { ...current, guestUid, status: 'full' } };
}

/** Only the host can close a lobby. */
export function planClose(current: LobbyRecord | null, hostUid: string): LobbyRecord | null {
  if (current === null || current.hostUid !== hostUid) return null;
  return { ...current, status: 'closed' };
}
