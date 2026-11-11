/**
 * The database side of a two-player match, keyed by the lobby code. Each player writes
 * only their own orders and hashes; both can read the match. The host writes the
 * setup (seed, map, difficulty, host species); the guest writes their species.
 */
import { onChildAdded, onValue, ref, set, type Database } from 'firebase/database';
import type { BattleCommand } from '../gameplay/battlefield/battlefieldCommands';
import type { LockstepTransport } from './lockstep';

export interface MatchSetup {
  seed: number;
  mapId: string;
  difficulty: string;
  hostSpecies: string;
  startedAt: number;
}

/** Lockstep transport over the match's paths: each side writes its own orders and hashes. */
export function createMatchChannel(
  db: Database,
  code: string,
  me: string,
  peer: string,
): LockstepTransport {
  const base = `matches/${code}`;
  const write = (path: string, value: string): void => {
    set(ref(db, path), value).catch((error: unknown) => {
      console.warn(`[KANE] match write failed at ${path}`, error);
    });
  };
  return {
    sendOrders(tick, commands) {
      write(`${base}/cmd/${me}/${tick}`, JSON.stringify(commands));
    },
    onPeerOrders(listener) {
      return onChildAdded(ref(db, `${base}/cmd/${peer}`), (snap) => {
        listener(Number(snap.key), JSON.parse(String(snap.val())) as BattleCommand[]);
      });
    },
    sendHash(tick, hash) {
      write(`${base}/hash/${me}/${tick}`, hash);
    },
    onPeerHash(listener) {
      return onChildAdded(ref(db, `${base}/hash/${peer}`), (snap) => {
        listener(Number(snap.key), String(snap.val()));
      });
    },
  };
}

/** The host writes this once; the guest reads it to start on the same seed and map. */
export function writeMatchSetup(db: Database, code: string, setup: MatchSetup): Promise<void> {
  return set(ref(db, `matches/${code}/setup`), setup);
}

/** Calls `onSetup` when the host has written the setup. Returns the stop function. */
export function watchMatchSetup(
  db: Database,
  code: string,
  onSetup: (setup: MatchSetup) => void,
): () => void {
  return onValue(ref(db, `matches/${code}/setup`), (snap) => {
    if (snap.exists()) onSetup(snap.val() as MatchSetup);
  });
}

/** The guest writes their own species once they have joined. */
export function writeGuestSpecies(db: Database, code: string, species: string): Promise<void> {
  return set(ref(db, `matches/${code}/guestSpecies`), species);
}

/** Calls `onSpecies` when the guest has written their species. Returns the stop function. */
export function watchGuestSpecies(
  db: Database,
  code: string,
  onSpecies: (species: string) => void,
): () => void {
  return onValue(ref(db, `matches/${code}/guestSpecies`), (snap) => {
    if (typeof snap.val() === 'string') onSpecies(snap.val() as string);
  });
}
