/**
 * Skate Rush 3 — the original cartoon artwork, drawn on a 2D canvas.
 * Ported line for line from the standalone page so the look is unchanged: the same colours,
 * shapes and motion. Added in the same style: a tell on every enemy that does something (ears
 * hop, brows charge, horns pounce, a spring bounces, wheels roll), a "!" just before it does,
 * and the boss's bomb. On the upper levels any enemy can be a boss: the same creature, bigger,
 * crowned, and holding the bombs it has still to throw. The scene draws a frame here every step
 * and shows the canvas as a texture.
 *
 * Called by: src/games/skate-rush/SkateRushScene.ts
 * Tested by: src/games/skate-rush/skateArt.test.ts
 */
import { drawCeiling } from './skateCeilingArt';
import { BOSS_SCALE, LEVELS, type LevelId } from './skateLevels';
import {
  GROUND,
  SKATERS,
  SKATER_X,
  VIEW_H,
  VIEW_W,
  WORLDS,
  aheadOf,
  isFlyer,
  isRushing,
  liftOf,
  type Item,
  type ItemType,
  type Run,
  type SkaterId,
} from './skateRules';

type Ctx = CanvasRenderingContext2D;

/** The original passes 7 (a little over a full turn) as the end angle of every arc. */
const FULL = 7;

function drawBackground(ctx: Ctx, run: Run): void {
  const w = WORLDS[run.worldIndex];
  const G = GROUND;
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, w.sky[0]);
  sky.addColorStop(1, w.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (run.worldIndex === 3) {
    for (let i = 0; i < 55; i++) {
      const x = (i * 173 - run.frame * 0.08) % VIEW_W;
      const y = (i * 79) % 290;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, 2, 2);
    }
  } else {
    ctx.fillStyle = '#ffe09a';
    ctx.beginPath();
    ctx.arc(790, 88, 36, 0, FULL);
    ctx.fill();
    for (let i = 0; i < 13; i++) {
      const x = ((((i * 112 - run.frame * 0.22) % 1250) + 1250) % 1250) - 130;
      const h = 85 + ((i * 43) % 125);
      ctx.fillStyle = w.build;
      ctx.fillRect(x, G - h, 76, h);
      if (run.worldIndex === 2) {
        ctx.fillStyle = '#55a66c';
        ctx.beginPath();
        ctx.arc(x + 35, G - h, 30, 0, FULL);
        ctx.fill();
      }
    }
  }

  ctx.fillStyle = w.ground;
  ctx.fillRect(0, G, VIEW_W, VIEW_H - G);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, G, VIEW_W, 5);
  ctx.fillStyle = w.stripe;
  for (let x = -((run.frame * run.speed) % 130); x < VIEW_W; x += 130) ctx.fillRect(x, G + 65, 62, 5);
}

function drawItem(ctx: Ctx, o: Item, frame: number): void {
  const x = o.x;
  const y = o.y;
  const G = GROUND;
  switch (o.type) {
    case 'coin':
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 10, 0, FULL);
      ctx.fill();
      ctx.strokeStyle = '#fff0a6';
      ctx.lineWidth = 3;
      ctx.stroke();
      return;
    case 'power':
      ctx.fillStyle = o.power === 'shield' ? '#38bdf8' : o.power === 'magnet' ? '#c084fc' : '#fb923c';
      ctx.beginPath();
      ctx.arc(x + 14, y + 14, 14, 0, FULL);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(o.power === 'shield' ? 'S' : o.power === 'magnet' ? 'M' : 'T', x + 14, y + 20);
      ctx.textAlign = 'left';
      return;
    case 'pit':
      ctx.fillStyle = '#080d18';
      ctx.fillRect(x, G, o.w, VIEW_H - G);
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(x, G, o.w, 5);
      return;
    case 'spikes':
      ctx.fillStyle = '#dbeafe';
      ctx.beginPath();
      ctx.moveTo(x, G);
      for (let xx = x; xx < x + o.w; xx += 25) {
        ctx.lineTo(xx + 12, G - 34);
        ctx.lineTo(xx + 25, G);
      }
      ctx.fill();
      return;
    case 'crate':
      ctx.fillStyle = '#a65c2b';
      ctx.fillRect(x, G - 47, o.w, 47);
      ctx.strokeStyle = '#f5c17d';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + 3, G - 44, o.w - 6, 41);
      return;
    case 'swing': {
      const bx = x + 25 + Math.sin(frame * 0.07 + o.phase) * 28;
      const by = G - 130 + Math.cos(frame * 0.07 + o.phase) * 10;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x + 25, G - 190);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(bx, by, 18, 0, FULL);
      ctx.fill();
      return;
    }
    case 'laser':
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x, G - 88, 8, 88);
      ctx.fillRect(x + o.w - 8, G - 88, 8, 88);
      ctx.shadowColor = '#fb174d';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#fb174d';
      ctx.fillRect(x + 5, G - 78, o.w - 10, 8);
      ctx.shadowBlur = 0;
      return;
    case 'fire':
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(x, G);
      ctx.quadraticCurveTo(x - 5, G - 28, x + 20, G - 40);
      ctx.quadraticCurveTo(x + 25, G - 20, x + o.w, G);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(x + 23, G - 12, 10, 20, 0, 0, FULL);
      ctx.fill();
      return;
    case 'drone':
    case 'alien':
      ctx.fillStyle = o.type === 'alien' ? '#84cc16' : '#a78bfa';
      ctx.fillRect(x + 5, y - 12, 40, 24);
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(x, y - 19, 50, 5);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(x + 18, y - 4, 15, 8);
      return;
    case 'bird':
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 18, y - 24, x + 25, y);
      ctx.quadraticCurveTo(x + 38, y - 24, x + 50, y);
      ctx.quadraticCurveTo(x + 25, y + 12, x, y);
      ctx.fill();
      return;
    case 'roller':
    case 'robot':
      ctx.fillStyle = o.type === 'robot' ? '#94a3b8' : '#f97316';
      ctx.fillRect(x + 5, G - 43, 40, 39);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 12, G - 34, 8, 8);
      ctx.fillRect(x + 30, G - 34, 8, 8);
      ctx.fillStyle = '#fb7185';
      ctx.fillRect(x + 14, G - 17, 22, 4);
      if (o.type === 'roller') drawWheels(ctx, x);
      return;
    case 'animal':
    case 'chaser':
    case 'monster': {
      const body = o.type === 'animal' ? '#a16207' : o.type === 'monster' ? '#16a34a' : '#ef4444';
      // Ears, horns or nothing, behind the body.
      if (o.type !== 'chaser') {
        const tall = o.type === 'animal' ? 60 : 56;
        ctx.fillStyle = o.type === 'animal' ? body : '#d9f99d';
        triangle(ctx, x + 6, G - 38, x + 10, G - tall, x + 22, G - 45);
        triangle(ctx, x + 44, G - 38, x + 40, G - tall, x + 28, G - 45);
      }
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(x + 25, G - 26, 22, 0, FULL);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 13, G - 34, 8, 9);
      ctx.fillRect(x + 29, G - 34, 8, 9);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 16, G - 31, 4, 5);
      ctx.fillRect(x + 32, G - 31, 4, 5);
      if (o.type === 'chaser') {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x + 10, G - 43);
        ctx.lineTo(x + 22, G - 36);
        ctx.moveTo(x + 40, G - 43);
        ctx.lineTo(x + 28, G - 36);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        triangle(ctx, x + 15, G - 17, x + 20, G - 10, x + 25, G - 17);
        triangle(ctx, x + 25, G - 17, x + 30, G - 10, x + 35, G - 17);
      }
      return;
    }
    case 'bridge':
    case 'lasernet':
    case 'maces':
      drawCeiling(ctx, o.type, o, frame);
      return;
    case 'bomb':
      drawBomb(ctx, x, frame);
      return;
    case 'boss':
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(x, G - 75, 70, 75);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x + 13, G - 58, 13, 15);
      ctx.fillRect(x + 44, G - 58, 13, 15);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 23, G - 29, 27, 7);
      ctx.font = '20px sans-serif';
      ctx.fillText('👑', x + 20, G - 78);
      return;
  }
}

/** How far above its feet (or, for a flyer, its middle) each enemy's head reaches. */
const HEAD_TOP: Partial<Record<ItemType, number>> = {
  chaser: 48,
  monster: 55,
  animal: 58,
  roller: 43,
  robot: 43,
  drone: 19,
  alien: 19,
  bird: 12,
};

/** A boss version of an enemy: the same creature, bigger about its middle, wearing the crown. */
function drawBossVersion(ctx: Ctx, o: Item, frame: number): void {
  const middle = o.x + o.w / 2;
  const anchor = isFlyer(o.type) ? o.y : GROUND;
  ctx.save();
  ctx.translate(middle, anchor);
  ctx.scale(BOSS_SCALE, BOSS_SCALE);
  ctx.translate(-middle, -anchor);
  drawItem(ctx, o, frame);
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👑', middle, anchor - (HEAD_TOP[o.type] ?? 48) - 2);
  ctx.textAlign = 'left';
  ctx.restore();
}

/** Where a boss holds its bombs: each one's middle, from its left edge and the ground. */
function heldAt(o: Item, i: number): [number, number] {
  // Flyers carry theirs slung underneath, side by side.
  if (isFlyer(o.type)) return [o.x + 12 + i * 28, o.y + 32];
  // The others hold them up in front, each next one a little further out and higher.
  const [out, up] = o.type === 'boss' ? [20, 64] : [14, 52];
  return [o.x - out - i * 22, GROUND - up - i * 20];
}

/** The bombs a boss has still to throw, held where they can be counted. */
function drawHeldBombs(ctx: Ctx, o: Item, count: number, frame: number): void {
  for (let i = 0; i < count; i++) {
    const [cx, cy] = heldAt(o, i);
    // An arm (or, under a flyer, a string) out to the bomb.
    const flyer = isFlyer(o.type);
    ctx.strokeStyle = flyer ? '#e2e8f0' : o.type === 'boss' ? '#7c3aed' : '#475569';
    ctx.lineWidth = flyer ? 2 : o.type === 'boss' ? 8 : 6;
    ctx.beginPath();
    ctx.moveTo(o.x + (flyer ? 25 : 6), flyer ? o.y : GROUND - (o.type === 'boss' ? 42 : 30));
    ctx.lineTo(cx + (flyer ? 0 : 6), cy + (flyer ? -12 : 4));
    ctx.stroke();
    ctx.save();
    // `drawBomb` draws one resting on the ground, its middle 14 along and 14 up.
    ctx.translate(cx - o.x - 14, cy - (GROUND - 14));
    drawBomb(ctx, o.x, frame);
    ctx.restore();
  }
}

function triangle(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.fill();
}

/** Two wheels whose spokes turn as the roller rolls. */
function drawWheels(ctx: Ctx, x: number): void {
  const turn = -x / 7;
  for (const cx of [x + 13, x + 37]) {
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(cx, GROUND - 8, 8, 0, FULL);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const spoke of [turn, turn + Math.PI / 2]) {
      ctx.moveTo(cx - Math.cos(spoke) * 6, GROUND - 8 - Math.sin(spoke) * 6);
      ctx.lineTo(cx + Math.cos(spoke) * 6, GROUND - 8 + Math.sin(spoke) * 6);
    }
    ctx.stroke();
  }
}

/** Resting on the ground; callers raise it by moving the canvas. */
function drawBomb(ctx: Ctx, x: number, frame: number): void {
  const cx = x + 14;
  const cy = GROUND - 14;
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, FULL);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();
  const turn = -x / 9;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(cx + Math.cos(turn) * 6 - 2, cy + Math.sin(turn) * 6 - 2, 4, 4);
  ctx.strokeStyle = '#d6a15c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy - 12);
  ctx.quadraticCurveTo(cx + 10, cy - 22, cx + 16, cy - 20);
  ctx.stroke();
  ctx.fillStyle = frame % 8 < 4 ? '#fde047' : '#fb923c';
  ctx.beginPath();
  ctx.arc(cx + 16, cy - 20, frame % 8 < 4 ? 5 : 3.5, 0, FULL);
  ctx.fill();
}

/** An item at the height it is really at: hoppers, pouncers and bombs leave a shadow behind. */
function drawRaised(ctx: Ctx, o: Item, frame: number): void {
  const lift = liftOf(o);
  if (lift > 3) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, GROUND + 3, Math.max(8, 26 - lift * 0.25), 4, 0, 0, FULL);
    ctx.fill();
  }
  if (o.type === 'robot' && lift > 3) {
    // The spring it bounces on.
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x + 25, GROUND - lift - 4);
    for (let i = 1; i <= 4; i++) ctx.lineTo(o.x + 25 + (i % 2 ? 11 : -11), GROUND - lift - 4 + ((lift + 4) * i) / 5);
    ctx.lineTo(o.x + 25, GROUND);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(0, -lift);
  if (o.crowned) drawBossVersion(ctx, o, frame);
  else drawItem(ctx, o, frame);
  if (o.throws?.length) drawHeldBombs(ctx, o, o.throws.length, frame);
  ctx.restore();
}

/** How many pixels of travel the "!" shows for before an enemy does its trick. */
const WARNING_REACH = 220;

/** The distances ahead at which this enemy has still to throw, dive or charge. */
function tricksToCome(o: Item, level: LevelId): number[] {
  const throws = [...(o.throws ?? [])];
  if (isFlyer(o.type) && o.target === undefined) return [...throws, LEVELS[level].swoop.trigger];
  if ((o.type === 'chaser' || o.type === 'monster') && o.trigger !== undefined) return [...throws, o.trigger];
  return throws;
}

function drawAlert(ctx: Ctx, x: number, y: number, frame: number): void {
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x, y, frame % 16 < 8 ? 13 : 11, 0, FULL);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 2.5, y - 8, 5, 10);
  ctx.fillRect(x - 2.5, y + 4, 5, 5);
}

/** Dashes from a diving flyer to the height it has locked on to. */
function drawDivePath(ctx: Ctx, o: Item, target: number, end: number): void {
  const levelAt = SKATER_X + end + 25;
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.85)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(o.x + 25, o.y);
  ctx.lineTo(levelAt, target);
  ctx.lineTo(SKATER_X + 95, target);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(251, 113, 133, 0.85)';
  triangle(ctx, SKATER_X + 80, target, SKATER_X + 96, target - 8, SKATER_X + 96, target + 8);
}

/** What an enemy is about to do, or is doing, drawn over everything else on the track. */
function drawCue(ctx: Ctx, o: Item, level: LevelId, frame: number): void {
  const ahead = aheadOf(o);
  if (tricksToCome(o, level).some((at) => ahead > at && ahead <= at + WARNING_REACH)) {
    // Above the crown, on a boss.
    const lift = o.crowned ? 20 : 0;
    const above = isFlyer(o.type) ? o.y - 38 - lift : GROUND - (o.type === 'boss' ? 120 : 82) - lift;
    drawAlert(ctx, o.x + o.w / 2, above, frame);
  }
  const { end } = LEVELS[level].swoop;
  if (isFlyer(o.type) && o.target !== undefined && ahead > end) drawDivePath(ctx, o, o.target, end);
  if (isRushing(o) && o.type !== 'bomb' && ahead > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    const lift = liftOf(o);
    for (const [dy, length] of [
      [38, 26],
      [26, 40],
      [14, 22],
    ]) {
      ctx.fillRect(o.x + 55 + (frame % 6), GROUND - dy - lift, length, 3);
    }
  }
}

function drawPlayer(ctx: Ctx, run: Run, skater: SkaterId): void {
  const p = run.player;
  const color = SKATERS[skater].color;
  ctx.save();
  ctx.translate(p.x + 27, p.y + 29);
  ctx.rotate(p.rot);
  ctx.fillStyle =
    run.board === 'speed' ? '#fb923c' : run.board === 'jump' ? '#a78bfa' : run.board === 'magnet' ? '#34d399' : '#facc15';
  ctx.fillRect(-31, 23, 63, 7);
  ctx.fillStyle = '#18243a';
  ctx.beginPath();
  ctx.arc(-18, 33, 6, 0, FULL);
  ctx.arc(20, 33, 6, 0, FULL);
  ctx.fill();
  ctx.strokeStyle = '#26334d';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, 12);
  ctx.lineTo(-14, 23);
  ctx.lineTo(-22, 22);
  ctx.moveTo(9, 12);
  ctx.lineTo(16, 22);
  ctx.lineTo(22, 22);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fillRect(-13, -14, 28, 29);
  ctx.fillStyle = '#f3bd91';
  ctx.beginPath();
  ctx.arc(2, -25, 13, 0, FULL);
  ctx.fill();
  ctx.fillStyle = '#29213c';
  ctx.beginPath();
  ctx.arc(0, -29, 13, Math.PI, FULL);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-10, -41, 25, 5);
  ctx.strokeStyle = '#f3bd91';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(10, -7);
  ctx.lineTo(24, -17);
  ctx.stroke();
  ctx.restore();
  if (run.shield) {
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x + 27, p.y + 28, 43, 0, FULL);
    ctx.stroke();
  }
}

/** Draw one full frame of the run. */
export function drawFrame(ctx: Ctx, run: Run, skater: SkaterId): void {
  drawBackground(ctx, run);
  for (const o of run.items) drawRaised(ctx, o, run.frame);
  for (const o of run.items) drawCue(ctx, o, run.level, run.frame);
  for (const q of run.particles) {
    ctx.globalAlpha = Math.max(0, q.life / 27);
    ctx.fillStyle = q.col;
    ctx.fillRect(q.x, q.y, 5, 5);
  }
  ctx.globalAlpha = 1;
  drawPlayer(ctx, run, skater);
}
