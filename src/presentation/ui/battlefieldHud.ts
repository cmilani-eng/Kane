/**
 * Battlefield HUD — responsive resource strip, hero ability pads, control hints.
 * Phaser 4 GameObjects only (touch-friendly min sizes).
 */
import Phaser from 'phaser';
import { flags } from '../../config/flags';
import { heroForSpecies, type HeroAbilitySlot } from '../../data/heroes';
import type { SpeciesId } from '../../data/speciesStub';
import { difficultyCopy, speciesCopy, speciesName, t } from '../../i18n';
import { livingByTeam } from '../../gameplay/battlefield/battlefieldCombat';
import {
  castHeroAbility,
  heroHudState,
  recruitHero,
} from '../../gameplay/battlefield/battlefieldHeroes';
import {
  countIdleWorkers,
  selectOrCycleIdleWorkers,
  type IdleChipResult,
} from '../../gameplay/battlefield/idleWorkers';
import {
  countIdleMilitary,
  isIdleMilitary,
  selectOrCycleIdleMilitary,
  type IdleMilitaryChipResult,
} from '../../gameplay/battlefield/idleMilitary';
import { coreHudModel } from '../../gameplay/battlefield/battlefieldCoreFragments';
import { CORE_TONE_COLOR, formatCoreLine, formatHeroLine } from './matchStatusCopy';
import {
  SUPPLY_TONE_COLOR,
  SUPPLY_TONE_DOT,
  supplyTone,
} from './supplyTone';
import {
  countVisibleMilitary,
  selectAllVisibleMilitary,
} from '../../gameplay/battlefield/selectMilitary';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { isSfxMuted, playSfx, setSfxMuted } from '../audio/sfx';
import { formatMatchClock } from './matchClock';

export { formatMatchClock } from './matchClock';

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
  /** Pause-aware match clock (mm:ss). */
  readonly timerText!: Phaser.GameObjects.Text;
  readonly goldText!: Phaser.GameObjects.Text;
  readonly crystalText!: Phaser.GameObjects.Text;
  /** Living player units vs `flags.unitCap`. */
  readonly supplyText!: Phaser.GameObjects.Text;
  readonly status!: Phaser.GameObjects.Text;
  readonly heroLine!: Phaser.GameObjects.Text;
  /** CORE fragment ownership + capture/contest progress. */
  readonly coreLine!: Phaser.GameObjects.Text;
  /** Place-mode gold/crystal cost strip (hidden when not placing). */
  readonly placeCostStrip!: Phaser.GameObjects.Text;
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
  /** Idle military chip — cycle + recenter (mirrors idle workers). */
  readonly idleMilPingBtn!: Phaser.GameObjects.Text;
  /** Critical under-attack chip (Keep/hero) — tap to jump camera. */
  readonly attackPingBtn!: Phaser.GameObjects.Text;
  /** Recenter camera on player keep / hall. */
  readonly baseBtn!: Phaser.GameObjects.Text;
  /** Mobile/desktop open in-match pause overlay. */
  readonly pauseBtn!: Phaser.GameObjects.Text;
  /** Mobile/desktop open controls / hotkey cheat sheet. */
  readonly helpBtn!: Phaser.GameObjects.Text;
  /** Scene wires this to toggle A-move mode. */
  onArmAttackMove: (() => void) | null = null;
  /** Scene wires this to issue stop + pulse. */
  onStopSelected: (() => void) | null = null;
  /** Scene wires this to snap camera to base. */
  onRecenterBase: (() => void) | null = null;
  /** Scene wires this to open/toggle pause menu. */
  onPause: (() => void) | null = null;
  /** Scene wires this to open/toggle controls help. */
  onHelp: (() => void) | null = null;
  /** Scene wires this after army select (clears building focus). */
  onSelectArmy: (() => void) | null = null;
  /** Scene wires idle-chip select/cycle (clear building + camera). */
  onIdleWorkers: ((result: IdleChipResult) => void) | null = null;
  /** Scene wires idle-military chip select/cycle (clear building + camera). */
  onIdleMilitary: ((result: IdleMilitaryChipResult) => void) | null = null;
  /** Scene wires critical under-attack chip → camera jump. */
  onUnderAttackJump: ((x: number, y: number) => void) | null = null;

  private goldDot!: Phaser.GameObjects.Arc;
  private crystalDot!: Phaser.GameObjects.Arc;
  private supplyDot!: Phaser.GameObjects.Arc;
  private resourcePanel!: Phaser.GameObjects.Rectangle;
  private abilityBtns: AbilityBtn[] = [];
  private narrow = false;
  private attackMoveArmed = false;
  private groupFlashText: string | null = null;
  private groupFlashColor = '#f0c75e';
  private groupFlashUntil = 0;
  private idlePulseMs = 0;
  private idleMilPulseMs = 0;
  private attackPulseMs = 0;
  /** Extra lift for DOM selection panel (px from bottom). */
  private bottomInset = 0;

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
      .text(12, 8, `KANE  ·  ${speciesName(this.speciesId)}`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '18px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.matchLine = scene.add
      .text(
        12,
        42,
        this.matchupLine(),
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

    this.timerText = scene.add
      .text(scene.scale.width / 2, 12, '0:00', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#f5e6c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(101);

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
      .text(42, 76, t('hud.gold', { n: 0 }), {
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
      .text(164, 76, t('hud.crystals', { n: 0 }), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#c8e4ff',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.supplyDot = scene.add
      .circle(280, 86, 7, 0xb8c9d9)
      .setScrollFactor(0)
      .setDepth(100);
    this.supplyText = scene.add
      .text(294, 76, t('pause.supply', { current: 0, cap: flags.unitCap }), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#d7e6f2',
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

    this.coreLine = scene.add
      .text(12, 184, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#c8e4ff',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 6 },
        wordWrap: { width: 520 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.placeCostStrip = scene.add
      .text(scene.scale.width / 2, 52, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff8e8',
        backgroundColor: '#122033ee',
        padding: { x: 14, y: 8 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(105)
      .setVisible(false);

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
      .text(scene.scale.width - 12, 12, t('hud.menu'), {
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
      .text(scene.scale.width - 12, 52, this.soundLabel(), {
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
        this.muteBtn.setText(this.soundLabel());
        if (!isSfxMuted()) playSfx('ui');
      });

    this.pauseBtn = scene.add
      .text(scene.scale.width - 12, 92, t('hud.pause'), {
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
      .text(scene.scale.width - 12, 132, t('hud.base'), {
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

    this.helpBtn = scene.add
      .text(scene.scale.width - 12, 172, t('hud.help'), {
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
        this.onHelp?.();
      })
      .on('pointerover', () =>
        this.helpBtn.setStyle({ backgroundColor: '#3a5565' }),
      )
      .on('pointerout', () =>
        this.helpBtn.setStyle({ backgroundColor: '#2a4050' }),
      );

    this.attackMoveBtn = scene.add
      .text(12, scene.scale.height - 48, t('hud.atk'), {
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
      .text(100, scene.scale.height - 48, t('hud.stopKey'), {
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
      .text(200, scene.scale.height - 48, t('hud.army'), {
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
        const result = selectOrCycleIdleWorkers(this.world);
        if (result.count <= 0) return;
        playSfx('select');
        this.onIdleWorkers?.(result);
      });

    this.idleMilPingBtn = scene.add
      .text(12, 138, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#c8e0ff',
        backgroundColor: '#203040cc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        const result = selectOrCycleIdleMilitary(this.world);
        if (result.count <= 0) return;
        playSfx('select');
        this.onIdleMilitary?.(result);
      });

    this.attackPingBtn = scene.add
      .text(12, 140, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#ffe0e0',
        backgroundColor: '#5a2030cc',
        padding: { x: 10, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        const a = this.world.underAttackAlert;
        if (!a || a.lifeMs <= 0 || a.severity !== 'critical') return;
        playSfx('alert');
        this.onUnderAttackJump?.(a.x, a.y);
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
        // H opens Controls help; recruit stays on this pad (tap).
        { slot: 'recruit', key: '★', name: t('hud.recruit') },
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
      this.timerText,
      this.goldText,
      this.crystalText,
      this.supplyText,
      this.status,
      this.heroLine,
      this.coreLine,
      this.placeCostStrip,
      this.hint,
      this.menuBtn,
      this.muteBtn,
      this.pauseBtn,
      this.baseBtn,
      this.helpBtn,
      this.attackMoveBtn,
      this.stopBtn,
      this.armyBtn,
      this.idlePingBtn,
      this.idleMilPingBtn,
      this.attackPingBtn,
      this.goldDot,
      this.crystalDot,
      this.supplyDot,
      this.resourcePanel,
    ];
    for (const b of this.abilityBtns) {
      list.push(b.bg, b.label, b.sub);
    }
    return list;
  }

  /** Lift bottom chrome when the DOM selection panel is open. */
  setBottomInset(px: number): void {
    const next = Math.max(0, Math.floor(px));
    if (next === this.bottomInset) return;
    this.bottomInset = next;
    this.layout();
  }

  layout(): void {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    this.narrow = w < 720;

    const pad = this.narrow ? 8 : 12;
    const inset = this.bottomInset;
    const titleSize = this.narrow ? '15px' : '18px';
    this.title.setFontSize(titleSize).setPosition(pad, pad);
    this.matchLine
      .setFontSize(this.narrow ? '11px' : '12px')
      .setPosition(pad, pad + (this.narrow ? 28 : 34));
    this.timerText
      .setPosition(w / 2, pad)
      .setFontSize(this.narrow ? '14px' : '16px');
    this.placeCostStrip
      .setPosition(w / 2, pad + (this.narrow ? 34 : 40))
      .setFontSize(this.narrow ? '12px' : '14px');

    const resY = pad + (this.narrow ? 50 : 60);
    this.resourcePanel.setPosition(pad, resY);
    this.resourcePanel.width = this.narrow
      ? Math.min(w - pad * 2, 340)
      : 560;
    this.resourcePanel.height = this.narrow ? 80 : 36;

    if (this.narrow) {
      this.goldDot.setPosition(pad + 14, resY + 14);
      this.goldText.setPosition(pad + 28, resY + 6).setFontSize('14px');
      this.crystalDot.setPosition(pad + 14, resY + 38);
      this.crystalText.setPosition(pad + 28, resY + 30).setFontSize('14px');
      this.supplyDot.setPosition(pad + 14, resY + 62);
      this.supplyText.setPosition(pad + 28, resY + 54).setFontSize('14px');
    } else {
      this.goldDot.setPosition(pad + 16, resY + 18);
      this.goldText.setPosition(pad + 30, resY + 8).setFontSize('15px');
      this.crystalDot.setPosition(pad + 130, resY + 18);
      this.crystalText.setPosition(pad + 144, resY + 8).setFontSize('15px');
      this.supplyDot.setPosition(pad + 280, resY + 18);
      this.supplyText.setPosition(pad + 294, resY + 8).setFontSize('15px');
    }

    const belowRes = resY + this.resourcePanel.height + 8;
    this.idlePingBtn
      .setPosition(pad, belowRes)
      .setFontSize(this.narrow ? '11px' : '12px');
    const idleOffset = this.idlePingBtn.visible ? 28 : 0;
    this.idleMilPingBtn
      .setPosition(pad, belowRes + idleOffset)
      .setFontSize(this.narrow ? '11px' : '12px');
    const idleMilOffset =
      idleOffset + (this.idleMilPingBtn.visible ? 28 : 0);
    this.attackPingBtn
      .setPosition(pad, belowRes + idleMilOffset)
      .setFontSize(this.narrow ? '11px' : '12px');
    const alertOffset =
      idleMilOffset + (this.attackPingBtn.visible ? 28 : 0);
    this.status
      .setPosition(pad, belowRes + alertOffset)
      .setStyle({ wordWrap: { width: Math.min(520, w - pad * 2) } });
    this.heroLine
      .setPosition(pad, belowRes + alertOffset + (this.narrow ? 44 : 36))
      .setStyle({ wordWrap: { width: Math.min(560, w - pad * 2) } })
      .setFontSize(this.narrow ? '11px' : '12px');
    const coreY =
      belowRes +
      alertOffset +
      (this.narrow ? 44 : 36) +
      (this.heroLine.visible && this.heroLine.text ? (this.narrow ? 28 : 30) : 0);
    this.coreLine
      .setPosition(pad, coreY)
      .setStyle({ wordWrap: { width: Math.min(560, w - pad * 2) } })
      .setFontSize(this.narrow ? '11px' : '12px');

    this.menuBtn
      .setPosition(w - pad, pad)
      .setFontSize(this.narrow ? '13px' : '14px')
      .setText(t('hud.menu'));
    this.muteBtn
      .setPosition(w - pad, pad + (this.narrow ? 36 : 42))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(this.soundLabel());
    this.pauseBtn
      .setPosition(w - pad, pad + (this.narrow ? 70 : 80))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(this.narrow ? t('hud.pause') : t('hud.pauseKey'));
    this.baseBtn
      .setPosition(w - pad, pad + (this.narrow ? 104 : 118))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(this.narrow ? t('hud.base') : t('hud.baseKey'));
    this.helpBtn
      .setPosition(w - pad, pad + (this.narrow ? 138 : 156))
      .setFontSize(this.narrow ? '12px' : '13px')
      .setText(this.narrow ? t('hud.help') : t('hud.helpKey'));

    const short = h < 500;
    if (short) {
      // Wide landscape phones have no vertical room for a right-hand stack.
      // Short labels keep the row clear of the match timer.
      this.menuBtn.setText(t('hud.menu'));
      this.pauseBtn.setText(t('hud.pause'));
      this.baseBtn.setText(t('hud.base'));
      this.helpBtn.setText(t('hud.help'));
      const rail = [this.helpBtn, this.baseBtn, this.pauseBtn, this.muteBtn, this.menuBtn];
      let rx = w - pad;
      for (const b of rail) {
        b.setFontSize('12px').setPosition(rx, pad);
        rx -= b.width + 6;
      }
      const titleRight = pad + this.title.width;
      this.timerText.setPosition((titleRight + rx) / 2, pad);
    }

    const btnW = this.narrow || short ? Math.min(78, (w - pad * 2 - 18) / 4) : 92;
    const btnH = short ? 44 : this.narrow ? 52 : 58;
    const gap = this.narrow || short ? 6 : 10;
    const total = this.abilityBtns.length * btnW + (this.abilityBtns.length - 1) * gap;
    let x = (w - total) / 2 + btnW / 2;
    // When selection panel is open, tuck hero pads above it; order buttons hide
    // (panel owns Stop / Atk-move) so we still keep Army reachable on the left.
    const y =
      h - pad - btnH / 2 - (short ? 48 : this.narrow ? 36 : 28) - inset;
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
    const orderVisible = inset <= 0;
    this.stopBtn.setVisible(orderVisible);
    this.attackMoveBtn.setVisible(orderVisible);
    this.stopBtn
      .setPosition(pad, h - pad - inset)
      .setFontSize(orderFont)
      .setOrigin(0, 1)
      .setText(this.narrow ? t('hud.stop') : t('hud.stopKey'));
    const stopW = this.stopBtn.width;
    this.attackMoveBtn
      .setPosition(pad + stopW + 8, h - pad - inset)
      .setFontSize(orderFont)
      .setOrigin(0, 1);
    this.applyAttackMoveBtnStyle();
    const atkW = this.attackMoveBtn.width;
    const armyN = countVisibleMilitary(this.world);
    // Army stays available; sit above the selection panel when open.
    this.armyBtn
      .setPosition(
        orderVisible ? pad + stopW + 8 + atkW + 8 : pad,
        h - pad - inset,
      )
      .setFontSize(orderFont)
      .setOrigin(0, 1)
      .setText(this.armyLabel(armyN));

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
      kind === 'assign'
        ? t('hud.groupSaved', { slot })
        : t('hud.groupSelected', { slot });
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
    this.muteBtn.setText(this.soundLabel());
  }

  /** Pause-aware match elapsed display (does not advance while paused). */
  setMatchTimer(elapsedMs: number): void {
    this.timerText.setText(formatMatchClock(elapsedMs));
  }

  /**
   * Place-mode cost strip under the match clock.
   * Pass null to hide when not placing.
   */
  setPlacementCost(
    info: {
      name: string;
      gold: number;
      crystals: number;
      canPay: boolean;
    } | null,
  ): void {
    if (!info) {
      this.placeCostStrip.setVisible(false).setText('');
      return;
    }
    const crystalBit =
      info.crystals > 0 ? t('hud.placeCrystal', { n: info.crystals }) : '';
    const payBit = info.canPay ? '' : t('hud.placeNeed');
    this.placeCostStrip
      .setVisible(true)
      .setText(
        t('hud.place', {
          name: info.name,
          gold: info.gold,
          crystal: crystalBit,
          pay: payBit,
        }),
      )
      .setColor(info.canPay ? '#fff8e8' : '#ffb8b8')
      .setBackgroundColor(info.canPay ? '#122033ee' : '#2a1818ee');
  }

  private applyAttackMoveBtnStyle(): void {
    this.attackMoveBtn.setStyle({
      backgroundColor: this.attackMoveArmed ? '#8a3030' : '#2a3545',
      color: this.attackMoveArmed ? '#ffe0e0' : '#fff8e8',
    });
    this.attackMoveBtn.setText(
      this.attackMoveArmed ? t('hud.atkArmed') : t('hud.atk'),
    );
  }

  refresh(statusText: string, hintText: string, dtMs = 16): void {
    const w = this.world.wallet;
    this.goldText.setText(t('hud.gold', { n: Math.floor(w.gold) }));
    this.crystalText.setText(
      t('hud.crystals', { n: Math.floor(w.magic_crystals) }),
    );
    const pop = livingByTeam(this.world, 'player');
    const cap = flags.unitCap;
    this.supplyText.setText(t('pause.supply', { current: pop, cap }));
    this.fitResourceStrip();
    const tone = supplyTone(pop, cap);
    this.supplyText.setColor(SUPPLY_TONE_COLOR[tone]);
    this.supplyDot.setFillStyle(SUPPLY_TONE_DOT[tone]);
    this.status.setText(statusText);
    this.heroLine.setText(formatHeroLine(heroHudState(this.world)));
    const core = coreHudModel(this.world);
    const wasCore = this.coreLine.visible;
    this.coreLine.setText(core ? formatCoreLine(core) : '').setVisible(!!core);
    this.coreLine.setColor(core ? CORE_TONE_COLOR[core.tone] : '#c8e4ff');
    if (wasCore !== this.coreLine.visible) this.layout();
    const armyN = countVisibleMilitary(this.world);
    this.armyBtn.setText(this.armyLabel(armyN));
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
      const cycling = this.world.units.some(
        (u) => u.selected && u.team === 'player' && u.canGather && u.hp > 0,
      );
      const action = t(cycling ? 'hud.idleCycle' : 'hud.idleTap');
      this.idlePingBtn
        .setVisible(true)
        .setAlpha(pulse)
        .setText(
          t(holding ? 'hud.idleCargo' : 'hud.idle', { n: idleN, action }),
        );
    } else {
      this.idlePingBtn.setVisible(false).setAlpha(1);
    }
    if (wasIdleVisible !== this.idlePingBtn.visible) this.layout();

    // Idle military chip — count-first label, select-all → cycle like workers
    this.idleMilPulseMs += dtMs;
    const idleMilN = countIdleMilitary(this.world);
    const wasIdleMilVisible = this.idleMilPingBtn.visible;
    if (idleMilN > 0) {
      const pulse = 0.72 + 0.28 * Math.sin(this.idleMilPulseMs / 900);
      const cycling = this.world.units.some(
        (u) => u.selected && isIdleMilitary(u),
      );
      const action = t(cycling ? 'hud.idleCycle' : 'hud.idleTap');
      this.idleMilPingBtn
        .setVisible(true)
        .setAlpha(pulse)
        .setText(t('hud.idleArmy', { n: idleMilN, action }));
    } else {
      this.idleMilPingBtn.setVisible(false).setAlpha(1);
    }
    if (wasIdleMilVisible !== this.idleMilPingBtn.visible) this.layout();

    // Critical Keep/hero under-attack chip
    this.attackPulseMs += dtMs;
    const alert = this.world.underAttackAlert;
    const wasAttackVisible = this.attackPingBtn.visible;
    const showAttack =
      !!alert &&
      alert.lifeMs > 0 &&
      alert.severity === 'critical';
    if (showAttack && alert) {
      const pulse = 0.7 + 0.3 * Math.sin(this.attackPulseMs / 220);
      const label =
        alert.kind === 'keep'
          ? t('hud.attackKeep')
          : alert.kind === 'hero'
            ? t('hud.attackHero')
            : t('hud.attackBase');
      this.attackPingBtn
        .setVisible(true)
        .setAlpha(pulse)
        .setText(label);
    } else {
      this.attackPingBtn.setVisible(false).setAlpha(1);
    }
    if (wasAttackVisible !== this.attackPingBtn.visible) this.layout();

    // Brutes: live Rage count on match line
    this.matchLine.setText(this.matchupLine());

    const rt = this.world.heroRuntime;
    for (const b of this.abilityBtns) {
      if (b.slot === 'recruit') {
        const ready = !rt;
        b.bg.setAlpha(ready ? 1 : 0.45);
        b.sub.setText(ready ? t('hud.recruit') : t('hud.recruited'));
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
    placeCostGold?: number,
    attackMove = false,
    placeCostCrystals = 0,
  ): string {
    if (attackMove) return t('hud.hintAttack');
    if (placing) {
      const g = placeCostGold ?? 0;
      const c = placeCostCrystals;
      const cost = c > 0 ? `${g}g / ${c}c` : `${g}g`;
      return t('hud.hintPlace', { name: placeName ?? 'building', cost });
    }
    if (this.scene.scale.height < 500) return '';
    if (this.narrow) return t('hud.hintNarrow');
    return this.speciesId === 'nobles'
      ? t('hud.hintNobles')
      : this.speciesId === 'weirdos'
        ? t('hud.hintWeirdos')
        : t('hud.hintBrutes');
  }

  private soundLabel(): string {
    return isSfxMuted() ? t('pause.soundOff') : t('pause.soundOn');
  }

  private armyLabel(n: number): string {
    if (this.narrow || this.scene.scale.height < 500) {
      return n > 0 ? t('hud.armyCount', { n }) : t('hud.army');
    }
    return n > 0 ? t('hud.armyKeyCount', { n }) : t('hud.armyKey');
  }

  /** Keep Gold / Crystals / Supply from overlapping when the words get longer. */
  private fitResourceStrip(): void {
    if (this.narrow) {
      const widest = Math.max(
        this.goldText.width,
        this.crystalText.width,
        this.supplyText.width,
      );
      const pad = 8;
      this.resourcePanel.width = Math.min(
        this.scene.scale.width - pad * 2,
        Math.max(160, widest + 44),
      );
      return;
    }
    const gap = 22;
    const crystalX = this.goldText.x + this.goldText.width + gap;
    this.crystalDot.setX(crystalX);
    this.crystalText.setX(crystalX + 14);
    const supplyX = this.crystalText.x + this.crystalText.width + gap;
    this.supplyDot.setX(supplyX);
    this.supplyText.setX(supplyX + 14);
    const end = this.supplyText.x + this.supplyText.width + 16;
    this.resourcePanel.width = Math.max(280, end - this.resourcePanel.x);
  }

  private matchupLine(): string {
    const enemy = speciesName(this.world.enemySpeciesId);
    const difficulty = difficultyCopy(this.world.aiDifficulty).label;
    const letter =
      this.speciesId === 'nobles' ? 'F' : this.speciesId === 'weirdos' ? 'M' : 'R';
    const mechanic = `${speciesCopy(this.speciesId).mechanic} · ${letter}`;
    if (this.speciesId !== 'brutes') {
      return t('hud.vs', { enemy, difficulty, mechanic });
    }
    const hot = this.world.units.filter(
      (u) => u.team === 'player' && u.enraged && u.hp > 0,
    ).length;
    const locked = this.world.units.filter(
      (u) => u.team === 'player' && u.rageLocked && u.hp > 0,
    ).length;
    return t('hud.vsRage', {
      enemy,
      difficulty,
      mechanic,
      hot,
      lock: locked ? t('hud.rageLock', { n: locked }) : '',
    });
  }
}
