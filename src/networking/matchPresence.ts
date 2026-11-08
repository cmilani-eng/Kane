/**
 * Who is in a two-player match right now. Each player marks themselves at
 * `matches/{code}/presence/{uid}` while the battle runs. The database clears the mark when
 * that player's connection drops, and a hidden tab marks itself `away`, since its battle
 * stops while hidden. Both players read the other's mark to tell "still joining",
 * "in the background" and "left".
 */
import { onDisconnect, onValue, ref, set, type Database } from 'firebase/database';

export type PeerPresence = 'missing' | 'here' | 'away';

/** Reads a presence value. Anything other than `here` or `away` means the player is not in the match. */
export function peerPresenceOf(value: unknown): PeerPresence {
  return value === 'here' || value === 'away' ? value : 'missing';
}

/** Marks `uid` as in the match and keeps the mark current. Returns the function that leaves. */
export function announcePresence(db: Database, code: string, uid: string): () => void {
  const mine = ref(db, `matches/${code}/presence/${uid}`);
  const mark = (value: 'here' | 'away' | null): void => {
    set(mine, value).catch((error: unknown) => {
      console.warn(`[KANE] presence write failed at matches/${code}/presence/${uid}`, error);
    });
  };
  const current = (): 'here' | 'away' => (document.visibilityState === 'hidden' ? 'away' : 'here');
  const onVisibility = (): void => mark(current());
  mark(current());
  void onDisconnect(mine).remove();
  document.addEventListener('visibilitychange', onVisibility);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    void onDisconnect(mine).cancel();
    mark(null);
  };
}

/** Calls `onChange` whenever the friend's presence changes. Returns the stop function. */
export function watchPresence(
  db: Database,
  code: string,
  peerUid: string,
  onChange: (presence: PeerPresence) => void,
): () => void {
  return onValue(ref(db, `matches/${code}/presence/${peerUid}`), (snap) => {
    onChange(peerPresenceOf(snap.val()));
  });
}
