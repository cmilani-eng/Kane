/**
 * Shared lobby stub instance — mirrors Firebase foundation singleton.
 */
import { signInAsGuest } from '../firebase/auth';
import { getFirebaseFoundation } from '../firebase/foundation';
import { getRealtimeLobbies } from './lobbyRealtime';
import { createLobbySession, type LobbySession } from './lobbySession';
import { createLobbyStub, type LobbyStub } from './lobbyStub';

let lobby: LobbyStub | null = null;
let session: LobbySession | null = null;

export function getLobbyStub(): LobbyStub {
  if (!lobby) {
    lobby = createLobbyStub(getFirebaseFoundation().auth);
  }
  return lobby;
}

/** The friend-lobby panel's session, on the live lobbies when Firebase is configured. */
export function getLobbySession(): LobbySession {
  if (!session) {
    session = createLobbySession({
      lobbies: getRealtimeLobbies(),
      signIn: async () => {
        try {
          return (await signInAsGuest()).uid;
        } catch {
          return null;
        }
      },
    });
  }
  return session;
}
