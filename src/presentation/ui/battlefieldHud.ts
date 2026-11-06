/**
 * Battlefield HUD — responsive resource strip, hero ability pads, control hints.
 * Phaser 4 GameObjects only (touch-friendly min sizes).
 */
import Phaser from 'phaser';
import { heroForSpecies, type HeroAbilitySlot } from '../../data/heroes';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import { getAiDifficulty } from '../../gameplay/battlefield/aiDifficulty';
import {
  castHeroAbility,
  heroHudLine,
  recruitHero,
} from '../../gameplay/battlefield/battlefieldHeroes';
import {
  countIdleWorkers,
  selectIdleWorkers,
} from '../../gameplay/battlefield/idleWorkers';
import {
  countVisibleMilitary,
  selectAllVisibleMilitary,
} from '../../gameplay/battlefield/selectMilitary';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { isSfxMuted, playSfx, setSfxMuted } from '../audio/sfx';

type AbilityBtn = {
  slot: HeroAbilitySlot | 'recruit';
  key: string;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  sub: Phaser.GameObjects.Text;
};

export class BattlefieldHud {
  private readonly scene: Phaser.Scene;
  private readonly world: BattlefieldWorld;
  private readonly speciesId: SpeciesId;

  readonly title!: Phaser.GameObjects.Text;
  readonly matchLine!: Phaser.GameObjects.Text;
  readonly goldText!: Phaser.GameObjects.Text;
  readonly crystalText!: Phaser.GameObjects.Text;
  readonly status!: Phaser.GameObjects.Text;
  readonly heroLine!: Phaser.GameObjects.Text;
  readonly hint!: Phaser.GameObjects.Text;
  readonly menuBtn!: Phaser.GameObjects.Text;
  readonly muteBtn!: Phaser.GameObjects.Text;
  /** Mobile/desktop arm control for attack-move. */
  readonly attackMoveBtn!: Phaser.GameObjects.Text;
  /** Mobile/desktop Stop (S) — clear label for touch. */
  readonly stopBtn!: Phaser.GameObjects.Text;
  /** Select all fog-visible combat units (Ctrl+A). */
  readonly armyBtn!: Phaser.GameObjects.Text;
  /** Subtle idle-worker attention chip (hidden when 0). */
  readonly idlePingBtn!: Phaser.GameObjects.Text;
  /** Recenter camera on player keep / hall. */
  readonly baseBtn!: Phaser.GameObjects.Text;
  /** Mobile/desktop open in-match pause overlay. */
  readonly pauseBtn!: Phaser.GameObjects.Text;
  /** Scene wires this to toggle A-move mode. */
  onArmAttackMove: (() => void) | null = null;
  /** Scene wires this to issue stop + pulse. */
  onStopSelected: (() => void) | null = null;
  /** Scene wires this to snap camera to base. */
  onRecenterBase: (() => void) | null = null;
  /** Scene wires this to open/toggle pause menu. */
  onPause: (() => void) | null = null;
  /** Scene wires this after army select (clears building focus). */
  onSelectArmy: (() => void) | null = null;

  private goldDot!: Phaser.GameObjects.Arc;
  private crystalDot!: Phaser.GameObjects.Arc;
  private resourcePanel!: Phaser.GameObjects.Rectangle;
  private abilityBtns: AbilityBtn[] = [];
  private narrow = false;
  private attackMoveArmed = false;
  private groupFlashText: string | null = null;
  private groupFlashColor = '#f0c75e';
  private groupFlashUntil = 0;
  private idlePulseMs = 0;

  constructor(scene: Phaser.Scene, world: BattlefieldWorld) {
    this.scene = scene;
    this.world = world;
    this.speciesId = world.speciesId;

    const accent =
      this.speciesId === 'weirdos'
        ? '#6ecfbf'
        : this.speciesId === 'nobles'
          ? '#f0c75e'
          : '#d4782e';

    this.title = scene.add
      .text(12, 8, `KANE  ·  ${SPECIES[this.speciesId].name}`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '18px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    const enemy = SPECIES[world.enemySpeciesId];
    const diff = getAiDifficulty(world.aiDifficulty);
    const mech =
      this.speciesId === 'nobles'
        ? 'FORMATIONS · F'
        : this.speciesId === 'weirdos'
          ? 'MUTATION · M'
          : 'RAGE · R';
    this.matchLine = scene.add
      .text(
        12,
        42,
        `vs ${enemy.name}  ·  ${diff.label}  ·  ${mech}`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#9eb4c8',
          backgroundColor: '#0f1a2ecc',
          padding: { x: 8, y: 4 },
        },
      )
      .setScrollFactor(0)
      .setDepth(100);

    this.resourcePanel = scene.add
      .rectangle(12, 68, 280, 36, 0x0f1a2e, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x3a4555, 0.9)
      .setScrollFactor(0)
      .setDepth(99);

    this.goldDot = scene.add
      .circle(28, 86, 7, 0xf0c75e)
      .setScrollFactor(0)
      .setDepth(100);
    this.goldText = scene.add
      .text(42, 76, 'Gold 0', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#f5e6c8',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.crystalDot = scene.add
      .circle(150, 86, 7, 0x7ec8ff)
      .setScrollFactor(0)
      .setDepth(100);
    this.crystalText = scene.add
      .text(164, 76, 'Crystals 0', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#c8e4ff',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.status = scene.add
      .text(12, 110, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#d7e6f2',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
        wordWrap: { width: 420 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.heroLine = scene.add
      .text(12, 148, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: accent,
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
        wordWrap: { width: 520 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.hint = scene.add
      .text(0, 0, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#b8c9d9',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 10, y: 8 },
        align: 'center',
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(100);

    this.menuBtn = scene.add
      .text(scene.scale.width - 12, 12, 'Menu', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });

    this.muteBtn = scene.add
      .text(scene.scale.width - 12, 52, isSfxMuted() ? 'Sound: Off' : 'Sound: On', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#2a3545',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        setSfxMuted(!isSfxMuted());
        this.muteBtn.setText(isSfxMuted() ? 'Sound: Off' : 'Sound: On');
        if (!isSfxMuted()) playSfx('ui');
      });

    this.pauseBtn = scene.add
      .text(scene.scale.width - 12, 92, 'Pause', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#2a4050',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.onPause?.();
      })
      .on('pointerover', () =>
        this.pauseBtn.setStyle({ backgroundColor: '#3a5565' }),
      )
      .on('pointerout', () =>
        this.pauseBtn.setStyle({ backgroundColor: '#2a4050' }),
      );

    this.baseBtn = scene.add
      .text(scene.scale.width - 12, 132, 'Base', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff8e8',
        backgroundColor: '#2a4050',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.onRecenterBase?.();
      })
      .on('pointerover', () =>
        this.baseBtn.setStyle({ backgroundColor: '#3a5565' }),
      )
      .on('pointerout', () =>
        this.baseBtn.setStyle({ backgroundColor: '#2a4050' }),
      );

    this.attackMoveBtn = scene.add
      .text(12, scene.scale.height - 48, 'A · Atk', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#2a3545',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.onArmAttackMove?.();
      });

    this.stopBtn = scene.add
      .text(100, scene.scale.height - 48, 'S · Stop', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#3a4555',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.onStopSelected?.();
      })
      .on('pointerover', () =>
        this.stopBtn.setStyle({ backgroundColor: '#4a5565' }),
      )
      .on('pointerout', () =>
        this.stopBtn.setStyle({ backgroundColor: '#3a4555' }),
      );

    this.armyBtn = scene.add
      .text(200, scene.scale.height - 48, 'Army', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#354555',
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        this.pickArmy();
      })
      .on('pointerover', () =>
        this.armyBtn.setStyle({ backgroundColor: '#455565' }),
      )
      .on('pointerout', () =>
        this.armyBtn.setStyle({ backgroundColor: '#354555' }),
      );

    this.idlePingBtn = scene.add
      .text(12, 110, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#ffe6a0',
        backgroundColor: '#3a3020cc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        if (selectIdleWorkers(this.world) > 0) playSfx('select');
      });

    this.buildAbilityPad(accent);
    this.layout();
    scene.scale.on('resize', () => this.layout());
  }

  private buildAbilityPad(accentHex: string): void {
    const def = heroForSpecies(this.speciesId);
    const accent = Phaser.Display.Color.HexStringToColor(accentHex).color;
    const entries: { slot: HeroAbilitySlot | 'recruit'; key: string; name: string }[] =
      [
        { slot: 'recruit', key: 'H', name: 'Recruit' },
        {
          slot: 'ability1',
          key: 'Q',
          name: def?.abilities.ability1.name ?? 'Ability',
        },
        {
          slot: 'ability2',
          key: 'W',
          name: def?.abilities.ability2.name ?? 'Ability',
        },
        {
          slot: 'ultimate',
          key: 'E',
          name: def?.abilities.ultimate.name ?? 'Ultimate',
        },
      ];

    for (const e of entries) {
      const bg = this.scene.add
        .rectangle(0, 0, 88, 56, 0x1a2838, 0.92)
        .setStrokeStyle(2, e.slot === 'ultimate' ? 0xf0c75e : accent, 0.95)
        .setScrollFactor(0)
        .setDepth(102)
        .setInteractive({ useHandCursor: true });
      const label = this.scene.add
        .text(0, 0, e.key, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#fff8e8',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 1)
        .setScrollFactor(0)
        .setDepth(103);
      const sub = this.scene.add
        .text(0, 0, e.name, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '10px',
          color: '#b8c9d9',
          align: 'center',
          wordWrap: { width: 80 },
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(103);

      bg.on('pointerup', () => {
        if (e.slot === 'recruit') {
          if (recruitHero(this.world, 'player')) playSfx('hero');
        } else if (castHeroAbility(this.world, e.slot, 'player')) {
          playSfx('ability');
        }
      });
      bg.on('pointerover', () => bg.setFillStyle(0x2a3a4a, 0.95));
      bg.on('pointerout', () => bg.setFillStyle(0x1a2838, 0.92));

      this.abilityBtns.push({ slot: e.slot, key: e.key, bg, label, sub });
    }
  }

  /** All HUD GameObjects — hide from the zoomed world camera. */
  worldExcludeList(): Phaser.GameObjects.GameObject[] {
    const list: Phaser.GameObjects.GameObject[] = [
      this.title,
      this.matchLine,
      this.goldText,
      this.crystalText,
      this.status,
      this.heroLine,
      this.hint,
      this.menuBtn,
      this.muteBtn,
      this.pauseBtn,
      this.baseBtn,
      this.attackMoveBtn,
      this.stopBtn,
      this.armyBtn,
      this.idlePingBtn,
      this.goldDot,
      this.crystalDot,
      this.resourcePanel,
    ];
    for (const b of this.abilityBtns) {
      list.push(b.bg, b.label, b.sub);
    }
    return list;
  }

  layout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.narrow = w < 720;

    const pad = this.narrow ? 8 : 12;
    const titleSize = this.narrow ? '15px' : '18px';
    this.title.setFontSize(titleSize).setPosition(pad, pad);
    this.matchLine
      .setFontSize(this.narrow ? '11px' : '12px')
      .setPosition(pad, pad + (this.narrow ? 28 : 34));

    const resY = pad + (this.narrow ? 50 : 60);
    this.resourcePanel.setPosition(pad, resY);
    this.resourcePanel.width = this.narrow ? Math.min(w - pad * 2, 300) : 300;
    this.resourcePanel.height = this.narrow ? 56 : 36;

    if (this.narrow) {
      this.goldDot.setPosition(pad + 14, resY + 16);
      this.goldText.setPosition(pad + 28, resY + 8).setFontSize('14px');
      this.crystalDot.setPosition(pad + 14, resY + 40);
      this.crystalText.setPosition(pad + 28, resY + 32).setFontSize('14px');
    } else {
      this.goldDot.setPosition(pad + 16, resY + 18);
      this.goldText.setPosition(pad + 30, resY + 8).setFontSize('15px');
      this.crystalDot.setPosition(pad + 140, resY + 18);
      this.crystalText.setPosition(pad + 154, resY + 8).setFontSize('15px');
    }

    const belowRes = resY + this.resourcePanel.height + 8;
    this.idlePingBtn
      .setPosition(pad, belowRes)
      .setFontSize(this.narrow ? '11px' : '12px');
    const idleOffset = this.idlePingBtn.visible ? 28 : 0;
    this.status
      .setPosition(pad, belowRes + idleOffset)
      .setStyle({ wordWrap: { width: Math.min(520, w - pad * 2) } });
    this.heroLine
      .setPosition(pad, belowRes + idleOffset + (this.narrow ? 44 : 36))
      .setStyle({ wordWrap: { width: Math.min(560, w - pad * 2) } })
      .setFontSize(this.narrow ? '11px' : '12px');

    this.menuBtn.setPosition(w - pad, pad).setFontSize(this.narrow ? '13px' : '14px');
    this.muteBtn
      .setPosition(w - pad, pad + (this.narrow ? 36 : 42))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(isSfxMuted() ? 'Sound: Off' : 'Sound: On');
    this.pauseBtn
      .setPosition(w - pad, pad + (this.narrow ? 70 : 80))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(this.narrow ? 'Pause' : 'Esc · Pause');
    this.baseBtn
      .setPosition(w - pad, pad + (this.narrow ? 104 : 118))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(this.narrow ? 'Base' : 'Home · Base');

    const btnW = this.narrow ? Math.min(78, (w - pad * 2 - 18) / 4) : 92;
    const btnH = this.narrow ? 52 : 58;
    const gap = this.narrow ? 6 : 10;
    const total = this.abilityBtns.length * btnW + (this.abilityBtns.length - 1) * gap;
    let x = (w - total) / 2 + btnW / 2;
    const y = h - pad - btnH / 2 - (this.narrow ? 36 : 28);
    for (const b of this.abilityBtns) {
      b.bg.setSize(btnW, btnH).setPosition(x, y);
      b.label.setPosition(x, y - 2).setFontSize(this.narrow ? '14px' : '16px');
      b.sub
        .setPosition(x, y + 2)
        .setFontSize(this.narrow ? '9px' : '10px')
        .setStyle({ wordWrap: { width: btnW - 8 } });
      x += btnW + gap;
    }

    const orderFont = this.narrow ? '13px' : '14px';
    this.stopBtn
      .setPosition(pad, h - pad)
      .setFontSize(orderFont)
      .setOrigin(0, 1)
      .setText(this.narrow ? 'Stop' : 'S · Stop');
    const stopW = this.stopBtn.width;
    this.attackMoveBtn
      .setPosition(pad + stopW + 8, h - pad)
      .setFontSize(orderFont)
      .setOrigin(0, 1);
    this.applyAttackMoveBtnStyle();
    const atkW = this.attackMoveBtn.width;
    const armyN = countVisibleMilitary(this.world);
    this.armyBtn
      .setPosition(pad + stopW + 8 + atkW + 8, h - pad)
      .setFontSize(orderFont)
      .setOrigin(0, 1)
      .setText(
        this.narrow
          ? armyN > 0
            ? `Army ${armyN}`
            : 'Army'
          : armyN > 0
            ? `Ctrl+A · Army ${armyN}`
            : 'Ctrl+A · Army',
      );

    this.hint
      .setPosition(w / 2, y - btnH / 2 - 10)
      .setFontSize(this.narrow ? '11px' : '12px')
      .setStyle({ wordWrap: { width: Math.min(w - 24, 640) } })
      .setColor(this.attackMoveArmed ? '#ffb8b8' : '#b8c9d9');
  }

  /** HUD / Ctrl+A — select fog-visible combat units (not workers). */
  pickArmy(): number {
    const n = selectAllVisibleMilitary(this.world);
    if (n > 0) {
      playSfx('select');
      this.onSelectArmy?.();
    }
    return n;
  }

  /** Brief highlight when Stop is issued (mobile clarity). */
  flashStopButton(): void {
    this.stopBtn.setStyle({ backgroundColor: '#8a7030', color: '#fff8e8' });
    this.scene.time.delayedCall(220, () => {
      this.stopBtn.setStyle({ backgroundColor: '#3a4555', color: '#fff8e8' });
    });
  }

  /** Brief HUD cue for Ctrl+# assign / # recall. */
  flashControlGroup(slot: number, kind: 'assign' | 'recall'): void {
    this.groupFlashText =
      kind === 'assign' ? `Group ${slot} saved` : `Group ${slot} selected`;
    this.groupFlashColor = kind === 'assign' ? '#6ecfbf' : '#f0c75e';
    this.groupFlashUntil = this.scene.time.now + 700;
    this.hint.setText(this.groupFlashText).setColor(this.groupFlashColor);
  }

  /** Visual state for A-move armed (tint button + hint). */
  setAttackMoveArmed(armed: boolean): void {
    this.attackMoveArmed = armed;
    this.applyAttackMoveBtnStyle();
    this.hint.setColor(armed ? '#ffb8b8' : '#b8c9d9');
  }

  /** Keep HUD mute chip in sync when pause overlay toggles audio. */
  syncMuteLabel(): void {
    this.muteBtn.setText(isSfxMuted() ? 'Sound: Off' : 'Sound: On');
  }

  private applyAttackMoveBtnStyle(): void {
    this.attackMoveBtn.setStyle({
      backgroundColor: this.attackMoveArmed ? '#8a3030' : '#2a3545',
      color: this.attackMoveArmed ? '#ffe0e0' : '#fff8e8',
    });
    this.attackMoveBtn.setText(
      this.attackMoveArmed ? 'A · Armed' : 'A · Atk',
    );
  }

  refresh(statusText: string, hintText: string, dtMs = 16): void {
    const w = this.world.wallet;
    this.goldText.setText(`Gold  ${Math.floor(w.gold)}`);
    this.crystalText.setText(`Crystals  ${Math.floor(w.magic_crystals)}`);
    this.status.setText(statusText);
    this.heroLine.setText(heroHudLine(this.world));
    const armyN = countVisibleMilitary(this.world);
    this.armyBtn.setText(
      this.narrow
        ? armyN > 0
          ? `Army ${armyN}`
          : 'Army'
        : armyN > 0
          ? `Ctrl+A · Army ${armyN}`
          : 'Ctrl+A · Army',
    );
    if (this.groupFlashText && this.scene.time.now < this.groupFlashUntil) {
      this.hint.setText(this.groupFlashText).setColor(this.groupFlashColor);
    } else {
      this.groupFlashText = null;
      this.hint
        .setText(hintText)
        .setColor(this.attackMoveArmed ? '#ffb8b8' : '#b8c9d9');
    }

    // Subtle idle worker chip — slow pulse, no SFX spam
    this.idlePulseMs += dtMs;
    const idleN = countIdleWorkers(this.world);
    const wasIdleVisible = this.idlePingBtn.visible;
    if (idleN > 0) {
      const pulse = 0.72 + 0.28 * Math.sin(this.idlePulseMs / 900);
      const holding = this.world.units.some(
        (u) =>
          u.team === 'player' &&
          u.canGather &&
          u.carrying > 0 &&
          !u.moveTarget &&
          u.path.length === 0 &&
          u.gatherNodeId == null,
      );
      this.idlePingBtn
        .setVisible(true)
        .setAlpha(pulse)
        .setText(
          holding
            ? `Idle ${idleN} · tap (cargo)`
            : `Idle ${idleN} · tap`,
        );
    } else {
      this.idlePingBtn.setVisible(false).setAlpha(1);
    }
    if (wasIdleVisible !== this.idlePingBtn.visible) this.layout();

    // Brutes: live Rage count on match line
    if (this.speciesId === 'brutes') {
      const enemy = SPECIES[this.world.enemySpeciesId];
      const diff = getAiDifficulty(this.world.aiDifficulty);
      const hot = this.world.units.filter(
        (u) => u.team === 'player' && u.enraged && u.hp > 0,
      ).length;
      const locked = this.world.units.filter(
        (u) => u.team === 'player' && u.rageLocked && u.hp > 0,
      ).length;
      this.matchLine.setText(
        `vs ${enemy.name}  ·  ${diff.label}  ·  RAGE · R  ·  ${hot} hot${locked ? ` (${locked} lock)` : ''}`,
      );
    }

    const rt = this.world.heroRuntime;
    for (const b of this.abilityBtns) {
      if (b.slot === 'recruit') {
        const ready = !rt;
        b.bg.setAlpha(ready ? 1 : 0.45);
        b.sub.setText(ready ? 'Recruit' : 'Recruited');
        continue;
      }
      if (!rt) {
        b.bg.setAlpha(0.4);
        b.sub.setColor('#7a8fa3');
        continue;
      }
      const cd = rt.cds[b.slot];
      if (cd > 0) {
        b.bg.setAlpha(0.55);
        b.sub.setText(`${Math.ceil(cd / 1000)}s`);
        b.sub.setColor('#f0c75e');
      } else {
        b.bg.setAlpha(1);
        const def = heroForSpecies(this.speciesId);
        const name =
          b.slot === 'ability1'
            ? def?.abilities.ability1.name
            : b.slot === 'ability2'
              ? def?.abilities.ability2.name
              : def?.abilities.ultimate.name;
        b.sub.setText(name ?? b.key);
        b.sub.setColor('#b8c9d9');
      }
    }
  }

  controlHint(
    placing: boolean,
    placeName?: string,
    placeCost?: number,
    attackMove = false,
  ): string {
    if (attackMove) {
      return 'Attack-move: click ground to march & fight · Esc/RMB cancel';
    }
    if (placing) {
      return `Place ${placeName ?? 'building'} (${placeCost ?? 0}g) · tap map · B cycle · Esc cancel`;
    }
    if (this.narrow) {
      return 'Home · S stop · A atk-move · Army · pads H/Q/W/E';
    }
    return this.speciesId === 'nobles'
      ? 'Home · Ctrl+1-0 · Ctrl+A army · S stop · A attack-move · F · H/Q/W/E'
      : this.speciesId === 'weirdos'
        ? 'Home · Ctrl+1-0 · Ctrl+A army · S stop · A attack-move · M · H/Q/W/E'
        : 'Home · Ctrl+1-0 · Ctrl+A army · S stop · A attack-move · R · B · H/Q/W/E';
  }
}
