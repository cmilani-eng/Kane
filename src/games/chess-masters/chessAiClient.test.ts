/** The computer still answers when its worker cannot start, fails or hangs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startPosition } from './chessCore';
import { AiClient, type AiRequest, type WorkerLike } from './chessAiClient';
import type { AiInput, AiSettings } from './chessAi';
import { findLegalAction } from './chessRules';

const input: AiInput = { pos: startPosition(), seen: {}, powerUps: false };
const settings: AiSettings = { level: 'easy', seed: 1, timeMs: 50 };

function fakeWorker(onPost: (worker: WorkerLike, request: AiRequest) => void): WorkerLike & { stopped: boolean } {
  const worker = {
    stopped: false,
    onmessage: null,
    onerror: null,
    postMessage(request: AiRequest) {
      onPost(worker as unknown as WorkerLike, request);
    },
    terminate() {
      worker.stopped = true;
    },
  };
  return worker as unknown as WorkerLike & { stopped: boolean };
}

const answer = (worker: WorkerLike, id: number): void => {
  const reply = { action: { type: 'move', from: 12, to: 28 }, depth: 1, nodes: 1, score: 0 };
  worker.onmessage?.call(worker as Worker, { data: { id, reply } } as MessageEvent);
};

afterEach(() => vi.useRealTimers());

describe('AiClient', () => {
  it('passes on what the worker answers', async () => {
    const client = new AiClient(() => fakeWorker((w, r) => queueMicrotask(() => answer(w, r.id))));
    expect((await client.think(input, settings))?.action).toEqual({ type: 'move', from: 12, to: 28 });
  });

  it('works it out itself when a worker cannot start', async () => {
    const client = new AiClient(() => {
      throw new Error('no workers here');
    });
    const reply = await client.think(input, settings);
    expect(findLegalAction(input.pos, reply!.action)).not.toBeNull();
  });

  it('works it out itself when the worker fails', async () => {
    const client = new AiClient(() =>
      fakeWorker((w) => queueMicrotask(() => w.onerror?.call(w as Worker, {} as ErrorEvent))),
    );
    const reply = await client.think(input, settings);
    expect(findLegalAction(input.pos, reply!.action)).not.toBeNull();
  });

  it('works it out itself when the worker goes quiet', async () => {
    vi.useFakeTimers();
    const client = new AiClient(() => fakeWorker(() => undefined));
    const waiting = client.think(input, settings);
    await vi.advanceTimersByTimeAsync(6000);
    expect(findLegalAction(input.pos, (await waiting)!.action)).not.toBeNull();
  });

  it('drops a cancelled question and stops that worker', async () => {
    const workers: (WorkerLike & { stopped: boolean })[] = [];
    let late: (() => void) | undefined;
    const client = new AiClient(() => {
      const worker = fakeWorker((w, r) => {
        late = () => answer(w, r.id);
      });
      workers.push(worker);
      return worker;
    });
    const heard = vi.fn();
    void client.think(input, settings).then(heard);
    client.cancel();
    late?.();
    await Promise.resolve();
    expect(heard).not.toHaveBeenCalled();
    expect(workers[0]!.stopped).toBe(true);
  });
});
