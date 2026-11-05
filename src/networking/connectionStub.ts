/**
 * Online multiplayer connection — STUB.
 * Diagram layer between KANE GAME CLIENT and MULTIPLAYER SERVER.
 * Do not introduce real netcode in the SP vs AI prototype.
 */

export interface OnlineConnection {
  readonly status: 'offline' | 'connecting' | 'connected';
  readonly enabled: false;
}

export function createOfflineConnection(): OnlineConnection {
  return { status: 'offline', enabled: false };
}

export function connectToMatch(_matchId: string): OnlineConnection {
  console.info('[KANE] networking stub — online connection deferred');
  return createOfflineConnection();
}
