/**
 * Chess Masters — the computer opponent's Web Worker, so thinking never freezes the board.
 *
 * Called by: src/games/chess-masters/chessAiClient.ts
 */
import { chooseAction } from './chessAi';
import type { AiRequest, AiResponse } from './chessAiClient';

self.onmessage = (event: MessageEvent<AiRequest>): void => {
  const { id, input, settings } = event.data;
  const response: AiResponse = { id, reply: chooseAction(input, settings) };
  self.postMessage(response);
};
