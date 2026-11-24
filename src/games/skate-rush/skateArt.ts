/**
 * Skate Rush 3 — the original cartoon artwork, drawn on a 2D canvas.
 * Ported line for line from the standalone page so the look is unchanged: the same colours,
 * shapes and motion. The scene draws a frame here every step and shows the canvas as a texture.
 *
 * Called by: src/games/skate-rush/SkateRushScene.ts
 */
import { GROUND, SKATERS, VIEW_H, VIEW_W, WORLDS, type Item, type Run, type SkaterId } from './skateRules';

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
      return;
    case 'animal':
    case 'chaser':
    case 'monster':
      ctx.fillStyle = o.type === 'animal' ? '#a16207' : o.type === 'monster' ? '#16a34a' : '#ef4444';
      ctx.beginPath();
      ctx.arc(x + 25, G - 26, 22, 0, FULL);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 13, G - 34, 8, 9);
      ctx.fillRect(x + 29, G - 34, 8, 9);
      ctx.fillStyle = '#111827';
      ctx.fillRect(x + 16, G - 31, 4, 5);
      ctx.fillRect(x + 32, G - 31, 4, 5);
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
  for (const o of run.items) drawItem(ctx, o, run.frame);
  for (const q of run.particles) {
    ctx.globalAlpha = Math.max(0, q.life / 27);
    ctx.fillStyle = q.col;
    ctx.fillRect(q.x, q.y, 5, 5);
  }
  ctx.globalAlpha = 1;
  drawPlayer(ctx, run, skater);
}
