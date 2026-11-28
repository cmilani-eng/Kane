/**
 * Chess Masters — asks the computer opponent for a move. The search runs in a Web Worker; if a
 * worker cannot start, fails or goes quiet, the same search runs here with a short time limit,
 * so the game can always carry on.
 *
 * Called by: src/games/chess-masters/ChessMastersScene.ts
 * Tested by: src/games/chess-masters/chessAiClient.test.ts
 */
import { STRENGTH, chooseAction, type AiInput, type AiReply, type AiSettings } from './chessAi';

export interface AiRequest {
  id: number;
  input: AiInput;
  settings: AiSettings;
}

export interface AiResponse {
  id: number;
  reply: AiReply | null;
}

export type WorkerLike = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror'>;

const startWorker = (): WorkerLike => new Worker(new URL('./chessAi.worker.ts', import.meta.url), { type: 'module' });

/** How long past its own limit a worker may take before the answer is worked out here instead. */
const GRACE_MS = 4000;
/** The longest the stand-in search may hold up the screen. */
const FALLBACK_MS = 400;

interface Pending {
  id: number;
  input: AiInput;
  settings: AiSettings;
  resolve: (reply: AiReply | null) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

export class AiClient {
  private worker: WorkerLike | null = null;
  private pending: Pending | null = null;
  private serial = 0;
  private readonly makeWorker: () => WorkerLike;

  constructor(makeWorker: () => WorkerLike = startWorker) {
    this.makeWorker = makeWorker;
  }

  /** Resolves with the computer's reply. A cancelled request never resolves. */
  think(input: AiInput, settings: AiSettings): Promise<AiReply | null> {
    this.cancel();
    return new Promise((resolve) => {
      const pending: Pending = { id: ++this.serial, input, settings, resolve, timer: null };
      this.pending = pending;
      try {
        const worker = this.worker ?? this.openWorker();
        const limit = settings.timeMs ?? STRENGTH[settings.level].timeMs;
        pending.timer = setTimeout(() => this.fallBack(pending.id), limit + GRACE_MS);
        const request: AiRequest = { id: pending.id, input, settings };
        worker.postMessage(request);
      } catch {
        this.fallBack(pending.id);
      }
    });
  }

  /** Forget the question being thought about (a new game, or leaving the board). */
  cancel(): void {
    if (!this.pending) return;
    this.clearTimer(this.pending);
    this.pending = null;
    // The worker is busy with a search nobody wants any more: stop it.
    this.closeWorker();
  }

  destroy(): void {
    this.cancel();
    this.closeWorker();
  }

  private openWorker(): WorkerLike {
    const worker = this.makeWorker();
    worker.onmessage = (event: MessageEvent<AiResponse>) => this.finish(event.data.id, event.data.reply);
    worker.onerror = () => {
      this.closeWorker();
      if (this.pending) this.fallBack(this.pending.id);
    };
    this.worker = worker;
    return worker;
  }

  private closeWorker(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  private clearTimer(pending: Pending): void {
    if (pending.timer !== null) clearTimeout(pending.timer);
    pending.timer = null;
  }

  private finish(id: number, reply: AiReply | null): void {
    const pending = this.pending;
    if (!pending || pending.id !== id) return;
    this.clearTimer(pending);
    this.pending = null;
    pending.resolve(reply);
  }

  private fallBack(id: number): void {
    const pending = this.pending;
    if (!pending || pending.id !== id) return;
    this.clearTimer(pending);
    this.closeWorker();
    // Let the screen draw "thinking" before this short search takes the thread.
    pending.timer = setTimeout(() => {
      const timeMs = Math.min(FALLBACK_MS, pending.settings.timeMs ?? FALLBACK_MS);
      this.finish(id, chooseAction(pending.input, { ...pending.settings, timeMs }));
    }, 30);
  }
}
