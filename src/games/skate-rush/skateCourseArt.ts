/**
 * Skate Rush 3 — the map of the timing course ahead, along the bottom of the screen. A course is
 * far longer than what can be seen coming at Extreme's speed, so the map shows all of it from the
 * moment it is sent: every piece to scale along its length, and a dot for where the skater is.
 *
 * Called by: src/games/skate-rush/skateArt.ts
 * Tested by: src/games/skate-rush/skateArt.test.ts
 */
import { COURSES, courseSteps, type Piece } from './skateCourses';
import { CEILING_Y, GROUND, SKATERS, VIEW_W, courseAhead, type Run, type SkaterId } from './skateRules';

type Ctx = CanvasRenderingContext2D;

/** Pixels of map for one step of travel, and for one pixel of height. */
const ALONG = 3.4;
const UP = 0.26;
/** Steps of map before the course, where the dot waits for it, and after it. */
const BEFORE = 30;
const AFTER = 8;
/** The map's box, in the empty road below the ground, and the line in it that stands for the ground. */
const TOP = 390;
const HEIGHT = 86;
const FLOOR = TOP + 74;
const PAPER = '#0b1020';

function drawPiece(ctx: Ctx, { type }: Piece, x: number, w: number): void {
  if (type === 'pit') {
    ctx.fillStyle = PAPER;
    ctx.fillRect(x, FLOOR, w, 4);
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(x, FLOOR, 4, 10);
    ctx.fillRect(x + w - 4, FLOOR, 4, 10);
    ctx.fillRect(x, FLOOR + 8, w, 2);
  } else if (type === 'spikes') {
    const teeth = Math.max(1, Math.round(w / 10));
    const tooth = w / teeth;
    ctx.fillStyle = '#dbeafe';
    ctx.beginPath();
    ctx.moveTo(x, FLOOR);
    for (let i = 0; i < teeth; i++) {
      ctx.lineTo(x + (i + 0.5) * tooth, FLOOR - 34 * UP);
      ctx.lineTo(x + (i + 1) * tooth, FLOOR);
    }
    ctx.fill();
  } else if (type === 'laser') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x, FLOOR - 82 * UP, 3, 82 * UP);
    ctx.fillRect(x + w - 3, FLOOR - 82 * UP, 3, 82 * UP);
    ctx.fillStyle = '#fb174d';
    ctx.fillRect(x, FLOOR - 78 * UP, w, 4);
  } else {
    // A low roof: solid from the top of the box down to where it would be.
    const under = FLOOR - (GROUND - CEILING_Y) * UP;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x, TOP + 4, w, under - TOP - 4);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x, under - 3, w, 3);
  }
}

export function drawCourseMap(ctx: Ctx, run: Run, skater: SkaterId): void {
  const ahead = courseAhead(run);
  if (!ahead) return;
  const width = (BEFORE + courseSteps(ahead.id) + AFTER) * ALONG;
  const left = (VIEW_W - width) / 2;
  const front = left + BEFORE * ALONG;

  ctx.fillStyle = PAPER;
  ctx.fillRect(left, TOP, width, HEIGHT);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2;
  ctx.strokeRect(left, TOP, width, HEIGHT);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(left + 4, FLOOR, width - 8, 3);
  ctx.font = '20px sans-serif';
  ctx.fillText('⏱', left + 8, TOP + 24);

  for (const piece of COURSES[ahead.id]) drawPiece(ctx, piece, front + piece.at * ALONG, piece.long * ALONG);

  const lift = GROUND - (run.player.y + run.player.h);
  ctx.fillStyle = SKATERS[skater].color;
  ctx.beginPath();
  ctx.arc(front - Math.min(BEFORE, ahead.steps) * ALONG, Math.max(TOP + 8, FLOOR - lift * UP - 6), 6, 0, Math.PI * 2);
  ctx.fill();
}
