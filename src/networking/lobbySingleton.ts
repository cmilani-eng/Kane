/**
 * Shared lobby stub instance — mirrors Firebase foundation singleton.
 */
import { getFirebaseFoundation } from '../firebase/foundation';
import { createLobbyStub, type LobbyStub } from './lobbyStub';

let lobby: LobbyStub | null = null;

export function getLobbyStub(): LobbyStub {
  if (!lobby) {
    lobby = createLobbyStub(getFirebaseFoundation().auth);
  }
  return lobby;
}
