/**
 * Skate Rush 3 — Easy is the game exactly as it was before there were levels.
 * The fingerprints were recorded from that version's rules: every item's position and hitbox,
 * the skater, the score and what happened, over long runs with the same dice and the same
 * presses. A change to how Easy plays shows up here.
 */
import { describe, expect, it } from 'vitest';
import { createRun, hazardBox, jump, stepRun, type BoardId, type Run } from './skateRules';
import { roll, type Dice } from './skateSolver.testkit';

const sparks = (): number => 0.5;

function snapshot(run: Run): string {
  const items = run.items.map((o) => {
    const place = `${o.type} ${o.x.toFixed(1)} ${o.y.toFixed(1)} ${o.w.toFixed(1)}`;
    if (o.type === 'coin' || o.type === 'power') return place;
    const box = hazardBox(o, run.frame);
    return `${place} [${[box.x, box.y, box.w, box.h].map((v) => v.toFixed(1)).join(' ')}]`;
  });
  const head = [run.player.y, run.score, run.spawn, run.speed].map((v) => v.toFixed(2)).join(' ');
  return `${head} ${run.runCoins} ${items.join(';')}`;
}

/** Long enough to reach top speed and see every kind of hazard many times. */
const STEPS = 14000;

function fingerprint(board: BoardId, seed: number): string {
  const run = createRun(board);
  const dice: Dice = { state: seed };
  const presses = roll({ state: seed + 1000 });
  let hash = 2166136261;
  const mix = (text: string): void => {
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  };
  for (let step = 0; step < STEPS; step++) {
    if (presses() < 0.03) jump(run, sparks);
    mix(stepRun(run, roll(dice), sparks).join());
    // Hits are noted above, then ignored, so that every run lasts the full length.
    run.over = false;
    if (step % 5 === 0) mix(snapshot(run));
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

const RECORDED: Record<BoardId, readonly [string, string, string]> = {
  basic: ['934f5914', '46797f22', '890072fd'],
  speed: ['effcdfc9', '2abefdc1', 'aa855a7f'],
  jump: ['373eec02', 'e9bf66fb', 'd398daf2'],
  magnet: ['4319e160', '7e27f512', 'f6b26524'],
};

describe('Easy plays exactly as the game did before levels', () => {
  it.each(Object.keys(RECORDED) as BoardId[])('on the %s deck', (board) => {
    expect([1, 2, 3].map((seed) => fingerprint(board, seed))).toEqual(RECORDED[board]);
  });
});
