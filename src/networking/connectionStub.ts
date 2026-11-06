/**
 * Online multiplayer connection — STUB.
 * Diagram layer between KANE GAME CLIENT and MULTIPLAYER SERVER.
 * Phase 6: foundation stubs only — no live MP / command sync yet.
 */

export interface OnlineConnection {
  readonly status: 'offline' | 'connecting' | 'connected';
  readonly enabled: false;
}

export function createOfflineConnection(): OnlineConnection {
  return { status: 'offline', enabled: false };
}

export function connectToMatch(_matchId: string): OnlineConnection {
  console.info(
    '[KANE] networking stub — online connection deferred (emulator lobby later)',
  );
  return createOfflineConnection();
}
