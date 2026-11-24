/**
 * SATs Quest stage art (Phaser): a storybook night sky with hills and a castle, a friendly
 * guardian per realm, the hero token and gentle hit / blocked / defeat effects. Everything is
 * painted once into canvas textures. No flashing: effects are single fades or moves, and with
 * reduced motion they become still fades.
 *
 * Called by: SatsQuestScene.ts (through the controller's stage API)
 */
import Phaser from 'phaser';
import { COLOUR_HEX, HERO_COPY } from './satsCopy';
import type { HeroColour, HeroId } from './satsSave';
import { createRng } from './satsRandom';
import type { RealmId } from './satsTypes';

export type BossKind = RealmId | 'mock';

const BOSS_TEX = 240;

function dprOf(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function canvas(w: number, h: number, dpr: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * dpr));
  c.height = Math.max(1, Math.round(h * dpr));
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  ctx.scale(dpr, dpr);
  return { c, ctx };
}

const SKY: Record<BossKind | 'menu', [string, string]> = {
  menu: ['#1b1140', '#3b2a73'],
  arithmetic: ['#0f2a24', '#245a45'],
  reasoning: ['#1a2236', '#4a5a7a'],
  grammar: ['#2a1640', '#6a3d7a'],
  spelling: ['#0d2833', '#1f6170'],
  reading: ['#2b1a12', '#7a5230'],
  mock: ['#26100c', '#6b2f1e'],
};

/** Night sky, stars (fixed, never twinkling), moon, hills and a castle silhouette. */
export function paintBackdrop(w: number, h: number, theme: BossKind | 'menu', dpr: number): HTMLCanvasElement {
  const { c, ctx } = canvas(w, h, dpr);
  const [top, bottom] = SKY[theme];
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, top);
  sky.addColorStop(1, bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const rng = createRng(7);
  ctx.fillStyle = 'rgba(255, 248, 220, 0.8)';
  for (let i = 0; i < Math.round((w * h) / 9000); i++) {
    const r = 0.6 + rng() * 1.4;
    ctx.beginPath();
    ctx.arc(rng() * w, rng() * h * 0.6, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const moonR = Math.min(w, h) * 0.07;
  const glow = ctx.createRadialGradient(w * 0.82, h * 0.16, moonR * 0.4, w * 0.82, h * 0.16, moonR * 2.6);
  glow.addColorStop(0, 'rgba(255, 240, 200, 0.35)');
  glow.addColorStop(1, 'rgba(255, 240, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff3cf';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.16, moonR, 0, Math.PI * 2);
  ctx.fill();

  const hill = (y: number, amp: number, colour: string, phase: number): void => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y + Math.sin(x / (w / 3) + phase) * amp);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };
  hill(h * 0.72, h * 0.04, 'rgba(10, 6, 24, 0.45)', 0.4);

  // Castle silhouette on the far hill.
  ctx.fillStyle = 'rgba(12, 8, 28, 0.7)';
  const cx = w * 0.3;
  const base = h * 0.73;
  const unit = Math.min(w, h) * 0.035;
  ctx.fillRect(cx - unit * 3, base - unit * 4, unit * 6, unit * 4);
  for (const dx of [-3.5, 2.5]) ctx.fillRect(cx + dx * unit, base - unit * 6.5, unit, unit * 6.5);
  ctx.fillRect(cx - unit * 0.6, base - unit * 7.5, unit * 1.2, unit * 7.5);
  ctx.beginPath();
  for (const [x, top2] of [
    [cx - 3.5 * unit, base - 6.5 * unit],
    [cx + 2.5 * unit, base - 6.5 * unit],
    [cx - 0.6 * unit, base - 7.5 * unit],
  ] as const) {
    const wTower = x === cx - 0.6 * unit ? unit * 1.2 : unit;
    ctx.moveTo(x - unit * 0.2, top2);
    ctx.lineTo(x + wTower / 2, top2 - unit * 1.6);
    ctx.lineTo(x + wTower + unit * 0.2, top2);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 214, 120, 0.75)';
  ctx.fillRect(cx - unit * 0.25, base - unit * 5.8, unit * 0.5, unit * 0.8);
  ctx.fillRect(cx - unit * 2, base - unit * 2.5, unit * 0.5, unit * 0.8);

  hill(h * 0.82, h * 0.05, 'rgba(8, 4, 18, 0.65)', 2.1);
  return c;
}

function eyes(ctx: CanvasRenderingContext2D, x: number, y: number, gap: number, r: number): void {
  for (const dx of [-gap, gap]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + dx, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1530';
    ctx.beginPath();
    ctx.arc(x + dx + r * 0.15, y + r * 0.1, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + dx + r * 0.32, y - r * 0.18, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function smile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.strokeStyle = '#1b1530';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y - w * 0.3, w * 0.5, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}

/** A friendly guardian for each realm, painted at BOSS_TEX × BOSS_TEX. */
export function paintBoss(kind: BossKind, dpr: number): HTMLCanvasElement {
  const s = BOSS_TEX;
  const { c, ctx } = canvas(s, s, dpr);
  const mid = s / 2;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  switch (kind) {
    case 'arithmetic': {
      // Riddle Troll: round, green, big ears, a cheeky tooth.
      ctx.fillStyle = '#5fb86a';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(mid + dir * 62, 96);
        ctx.lineTo(mid + dir * 112, 70);
        ctx.lineTo(mid + dir * 74, 128);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.ellipse(mid, 140, 78, 82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      eyes(ctx, mid, 120, 26, 15);
      smile(ctx, mid, 176, 46);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mid + 6, 168, 10, 12);
      ctx.fillStyle = '#2d6b36';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText('7+', mid - 18, 210);
      break;
    }
    case 'reasoning': {
      // Stone Giant: blocky, grey, mossy, heavy brows.
      ctx.fillStyle = '#9aa3ad';
      ctx.beginPath();
      ctx.roundRect(mid - 82, 54, 164, 168, 34);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#6fae5e';
      ctx.beginPath();
      ctx.roundRect(mid - 82, 54, 164, 26, [34, 34, 6, 6]);
      ctx.fill();
      ctx.fillStyle = '#5d6670';
      ctx.fillRect(mid - 50, 100, 36, 9);
      ctx.fillRect(mid + 14, 100, 36, 9);
      eyes(ctx, mid, 126, 30, 13);
      smile(ctx, mid, 186, 44);
      ctx.strokeStyle = 'rgba(60, 66, 74, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mid + 50, 150);
      ctx.lineTo(mid + 64, 172);
      ctx.lineTo(mid + 56, 196);
      ctx.stroke();
      break;
    }
    case 'grammar': {
      // Grammar Gryphon: golden, wings, orange beak.
      ctx.fillStyle = '#c8933a';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(mid + dir * 78, 120, 44, 70, dir * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e8b54a';
      ctx.beginPath();
      ctx.ellipse(mid, 140, 70, 80, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      eyes(ctx, mid, 118, 24, 14);
      ctx.fillStyle = '#f07c2a';
      ctx.beginPath();
      ctx.moveTo(mid - 16, 146);
      ctx.lineTo(mid + 16, 146);
      ctx.lineTo(mid, 172);
      ctx.fill();
      ctx.fillStyle = '#7a4a10';
      ctx.font = 'bold 28px Georgia, serif';
      ctx.fillText('“ ”', mid - 22, 212);
      break;
    }
    case 'spelling': {
      // Echo Sprite: glowing teal orb with leaf wings.
      ctx.shadowColor = 'rgba(120, 240, 230, 0.7)';
      ctx.shadowBlur = 30;
      ctx.fillStyle = 'rgba(190, 255, 240, 0.55)';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(mid + dir * 70, 110, 34, 58, dir * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      const orb = ctx.createRadialGradient(mid - 20, 110, 10, mid, 135, 80);
      orb.addColorStop(0, '#d6fff8');
      orb.addColorStop(1, '#3fb8b0');
      ctx.fillStyle = orb;
      ctx.beginPath();
      ctx.arc(mid, 135, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      eyes(ctx, mid, 128, 24, 13);
      smile(ctx, mid, 176, 36);
      break;
    }
    case 'reading': {
      // Story Sphinx: sandy face with a striped headdress.
      ctx.fillStyle = '#2f5fa8';
      ctx.beginPath();
      ctx.moveTo(mid - 96, 214);
      ctx.lineTo(mid - 70, 56);
      ctx.lineTo(mid + 70, 56);
      ctx.lineTo(mid + 96, 214);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#f0c75e';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(mid - 92 + i * 4, 80 + i * 22, 184 - i * 8, 8);
      }
      ctx.fillStyle = '#d9b77a';
      ctx.beginPath();
      ctx.ellipse(mid, 140, 58, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      eyes(ctx, mid, 128, 22, 12);
      smile(ctx, mid, 178, 34);
      break;
    }
    case 'mock': {
      // Clockwork Dragon: bronze head, horns and a clock on its brow.
      ctx.fillStyle = '#8a5a2b';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(mid + dir * 40, 70);
        ctx.lineTo(mid + dir * 84, 22);
        ctx.lineTo(mid + dir * 66, 84);
        ctx.fill();
      }
      ctx.fillStyle = '#c08a4a';
      ctx.beginPath();
      ctx.roundRect(mid - 84, 64, 168, 150, 60);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#fff3cf';
      ctx.beginPath();
      ctx.arc(mid, 98, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a2c10';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mid, 98);
      ctx.lineTo(mid, 84);
      ctx.moveTo(mid, 98);
      ctx.lineTo(mid + 11, 104);
      ctx.stroke();
      eyes(ctx, mid, 140, 32, 13);
      ctx.fillStyle = '#4a2c10';
      for (const dx of [-14, 14]) {
        ctx.beginPath();
        ctx.arc(mid + dx, 186, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
  return c;
}

/** The Phaser side of SATs Quest. Purely visual: it never reads input or game rules. */
export class SatsStage {
  private readonly scene: Phaser.Scene;
  private backdrop: Phaser.GameObjects.Image | null = null;
  private boss: Phaser.GameObjects.Image | null = null;
  private hero: Phaser.GameObjects.Container | null = null;
  private theme: BossKind | 'menu' = 'menu';
  private visibleH = 0;
  private reduce = false;
  private heroId: HeroId = 'knight';
  private heroColour: HeroColour = 'sky';
  private backdropKey: string | null = null;
  private bossKey: string | null = null;
  private bossKeyTheme: BossKind | null = null;
  private serial = 0;

  constructor(scene: Phaser.Scene, reduceMotion: boolean) {
    this.scene = scene;
    this.reduce = reduceMotion;
    this.visibleH = scene.scale.height;
    this.layout();
  }

  setReduceMotion(on: boolean): void {
    this.reduce = on;
    this.layout();
  }

  setVisibleHeight(px: number): void {
    const next = Math.max(160, Math.round(px));
    if (Math.abs(next - this.visibleH) < 2) return;
    this.visibleH = next;
    this.layoutActors();
  }

  setHero(hero: HeroId, colour: HeroColour): void {
    this.heroId = hero;
    this.heroColour = colour;
    this.layoutActors();
  }

  showMenu(): void {
    this.theme = 'menu';
    this.layout();
  }

  showBattle(kind: BossKind): void {
    this.theme = kind;
    this.layout();
  }

  /** Repaint everything for the current size (call on resize). */
  layout(): void {
    const { width, height } = this.scene.scale;
    if (width < 1 || height < 1) return;
    this.backdrop?.destroy();
    this.backdrop = null;
    this.dropTexture(this.backdropKey);
    this.backdropKey = this.addTexture(paintBackdrop(width, height, this.theme, dprOf()));
    this.backdrop = this.scene.add.image(0, 0, this.backdropKey).setOrigin(0, 0).setDisplaySize(width, height).setDepth(0);
    this.layoutActors();
  }

  private addTexture(source: HTMLCanvasElement): string {
    const key = `sats-tex-${++this.serial}`;
    this.scene.textures.addCanvas(key, source);
    return key;
  }

  /** Only call after the image using the texture has been destroyed. */
  private dropTexture(key: string | null): void {
    if (key && this.scene.textures.exists(key)) this.scene.textures.remove(key);
  }

  /** The guardian is painted once per realm, not on every resize. */
  private bossTexture(kind: BossKind): string {
    if (this.bossKey && this.bossKeyTheme === kind) return this.bossKey;
    this.dropTexture(this.bossKey);
    this.bossKey = this.addTexture(paintBoss(kind, dprOf()));
    this.bossKeyTheme = kind;
    return this.bossKey;
  }

  private layoutActors(): void {
    const { width } = this.scene.scale;
    const h = this.visibleH;
    this.scene.tweens.killTweensOf([this.boss, this.hero].filter(Boolean) as Phaser.GameObjects.GameObject[]);
    this.boss?.destroy();
    this.boss = null;
    this.hero?.destroy();
    this.hero = null;

    if (this.theme !== 'menu') {
      const size = Math.max(90, Math.min(h * 0.72, 240, width * 0.5));
      this.boss = this.scene.add.image(width / 2, h * 0.5, this.bossTexture(this.theme)).setDisplaySize(size, size).setDepth(5);
      if (!this.reduce) {
        this.scene.tweens.add({ targets: this.boss, y: h * 0.5 - 6, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }

    const r = Math.max(20, Math.min(32, h * 0.09));
    const disc = this.scene.add.circle(0, 0, r, Number.parseInt(COLOUR_HEX[this.heroColour].slice(1), 16), 1).setStrokeStyle(3, 0xffffff, 0.8);
    const icon = this.scene.add
      .text(0, 0, HERO_COPY[this.heroId].icon, { fontSize: `${Math.round(r * 1.1)}px` })
      .setOrigin(0.5)
      .setResolution(dprOf());
    const x = this.theme === 'menu' ? width * 0.3 : Math.max(r + 12, width * 0.16);
    const y = this.theme === 'menu' ? h * 0.62 : h * 0.78;
    this.hero = this.scene.add.container(x, y, [disc, icon]).setDepth(6);
  }

  private floatText(x: number, y: number, text: string, colour: string): void {
    const label = this.scene.add
      .text(x, y, text, { fontFamily: 'system-ui, sans-serif', fontSize: '30px', fontStyle: '900', color: colour, stroke: '#1b1530', strokeThickness: 5 })
      .setOrigin(0.5)
      .setResolution(dprOf())
      .setDepth(10);
    this.scene.tweens.add({
      targets: label,
      y: this.reduce ? y : y - 50,
      alpha: 0,
      duration: 1100,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  hit(marks: number): void {
    if (!this.boss) return;
    const { x, y } = this.boss;
    this.floatText(x, y - this.boss.displayHeight * 0.45, `−${marks}`, '#ffd37a');
    if (this.reduce) {
      this.scene.tweens.add({ targets: this.boss, alpha: 0.6, duration: 220, yoyo: true });
    } else {
      this.scene.tweens.add({ targets: this.boss, x: x + 10, duration: 70, yoyo: true, repeat: 2, onComplete: () => this.boss?.setX(x) });
    }
  }

  blocked(): void {
    if (!this.boss) return;
    this.floatText(this.boss.x + this.boss.displayWidth * 0.45, this.boss.y, '🛡️', '#ffffff');
  }

  defeat(): void {
    if (!this.boss) return;
    const boss = this.boss;
    this.scene.tweens.killTweensOf(boss);
    this.floatText(boss.x, boss.y, '✨', '#ffffff');
    this.scene.tweens.add({ targets: boss, alpha: 0.15, scale: this.reduce ? boss.scale : boss.scale * 0.6, duration: 700, ease: 'Sine.easeIn' });
  }

  destroy(): void {
    this.scene.tweens.killAll();
    this.backdrop?.destroy();
    this.boss?.destroy();
    this.hero?.destroy();
    this.dropTexture(this.backdropKey);
    this.dropTexture(this.bossKey);
    this.backdropKey = null;
    this.bossKey = null;
    this.bossKeyTheme = null;
  }
}
