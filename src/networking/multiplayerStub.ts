/**
 * Multiplayer networking — stub only for the first prototype.
 * Future: deterministic lockstep command stream over Firebase RTDB.
 * Do not introduce online matchmaking or netcode complexity here.
 */

export type NetCommand =
  | { type: 'move'; unitIds: number[]; x: number; y: number; tick: number }
  | { type: 'train'; buildingId: number; kind: string; tick: number }
  | { type: 'build'; kind: string; x: number; y: number; tick: number };

export interface MultiplayerSession {
  readonly enabled: false;
  readonly mode: 'local-ai';
}

/** Always returns a disabled local session in the vertical slice. */
export function createLocalSession(): MultiplayerSession {
  return { enabled: false, mode: 'local-ai' };
}

export function enqueueRemoteCommand(_cmd: NetCommand): void {
  // no-op — multiplayer deferred
}

export function pollRemoteCommands(_tick: number): NetCommand[] {
  return [];
}
