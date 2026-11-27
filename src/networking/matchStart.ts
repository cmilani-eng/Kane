/**
 * Starting a two-player match from a lobby. The host picks the seed and the map, and
 * writes them as the match setup; the guest writes their species and waits for the
 * setup. Both then launch the battle scene with the same seed, map and difficulty.
 */
import { get, ref } from 'firebase/database';
import { loadMatchPrefs } from '../database/matchPrefs';
import { watchMatchSetup, writeGuestSpecies, writeMatchSetup, type MatchSetup } from './matchChannel';
import { getMatchDatabase } from './matchDatabase';

export interface PvpLaunch {
  code: string;
  role: 'host' | 'guest';
  uid: string;
  peerUid: string;
  seed: number;
  mapId: string;
  difficulty: string;
  hostSpecies: string;
  guestSpecies: string;
}

/** The host starts: writes the setup and reads the guest's species. Null when offline. */
export async function startAsHost(code: string, hostUid: string, guestUid: string): Promise<PvpLaunch | null> {
  const db = getMatchDatabase();
  if (!db) return null;
  const prefs = loadMatchPrefs();
  const seed = Math.floor(Math.random() * 0x100000000);
  const setup: MatchSetup = {
    seed,
    mapId: prefs.mapId,
    difficulty: prefs.difficulty,
    hostSpecies: prefs.species,
    startedAt: Date.now(),
  };
  await writeMatchSetup(db, code, setup);
  const guestSnap = await get(ref(db, `matches/${code}/guestSpecies`));
  const guestSpecies = typeof guestSnap.val() === 'string' ? (guestSnap.val() as string) : prefs.species;
  return {
    code,
    role: 'host',
    uid: hostUid,
    peerUid: guestUid,
    seed,
    mapId: setup.mapId,
    difficulty: setup.difficulty,
    hostSpecies: setup.hostSpecies,
    guestSpecies,
  };
}

/**
 * The guest joins: writes their species, then calls `onStart` once the host's setup
 * arrives. Returns the stop function. Without a database there is no match to join.
 */
export function joinAsGuest(
  code: string,
  hostUid: string,
  guestUid: string,
  onStart: (launch: PvpLaunch) => void,
): () => void {
  const db = getMatchDatabase();
  if (!db) return () => undefined;
  const prefs = loadMatchPrefs();
  void writeGuestSpecies(db, code, prefs.species);
  let started = false;
  return watchMatchSetup(db, code, (setup) => {
    if (started) return;
    started = true;
    onStart({
      code,
      role: 'guest',
      uid: guestUid,
      peerUid: hostUid,
      seed: setup.seed,
      mapId: setup.mapId,
      difficulty: setup.difficulty,
      hostSpecies: setup.hostSpecies,
      guestSpecies: prefs.species,
    });
  });
}
