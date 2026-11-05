/**
 * Battlefield HUD — responsive resource strip, hero ability pads, control hints.
 * Phaser 4 GameObjects only (touch-friendly min sizes).
 */
import Phaser from 'phaser';
import { heroForSpecies, type HeroAbilitySlot } from '../../data/heroes';
import { SPECIES, type SpeciesId } from '../../data/speciesStub';
import {
  castHeroAbility,
  heroHudLine,
  recruitHero,
} from '../../gameplay/battlefield/battlefieldHeroes';
import type { BattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';

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

  private goldDot!: Phaser.GameObjects.Arc;
  private crystalDot!: Phaser.GameObjects.Arc;
  private resourcePanel!: Phaser.GameObjects.Rectangle;
  private abilityBtns: AbilityBtn[] = [];
  private narrow = false;

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
    const mech =
      this.speciesId === 'nobles'
        ? 'FORMATIONS · F'
        : this.speciesId === 'weirdos'
          ? 'MUTATION · M'
          : 'SWARM';
    this.matchLine = scene.add
      .text(12, 42, `vs ${enemy.name}  ·  ${mech}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#9eb4c8',
        backgroundColor: '#0f1a2ecc',
        padding: { x: 8, y: 4 },
      })
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
        if (e.slot === 'recruit') recruitHero(this.world, 'player');
        else castHeroAbility(this.world, e.slot, 'player');
      });
      bg.on('pointerover', () => bg.setFillStyle(0x2a3a4a, 0.95));
      bg.on('pointerout', () => bg.setFillStyle(0x1a2838, 0.92));

      this.abilityBtns.push({ slot: e.slot, key: e.key, bg, label, sub });
    }
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
    this.status
      .setPosition(pad, belowRes)
      .setStyle({ wordWrap: { width: Math.min(520, w - pad * 2) } });
    this.heroLine
      .setPosition(pad, belowRes + (this.narrow ? 44 : 36))
      .setStyle({ wordWrap: { width: Math.min(560, w - pad * 2) } })
      .setFontSize(this.narrow ? '11px' : '12px');

    this.menuBtn.setPosition(w - pad, pad).setFontSize(this.narrow ? '13px' : '14px');

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

    this.hint
      .setPosition(w / 2, y - btnH / 2 - 10)
      .setFontSize(this.narrow ? '11px' : '12px')
      .setStyle({ wordWrap: { width: Math.min(w - 24, 640) } });
  }

  refresh(statusText: string, hintText: string): void {
    const w = this.world.wallet;
    this.goldText.setText(`Gold  ${Math.floor(w.gold)}`);
    this.crystalText.setText(`Crystals  ${Math.floor(w.magic_crystals)}`);
    this.status.setText(statusText);
    this.heroLine.setText(heroHudLine(this.world));
    this.hint.setText(hintText);

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

  controlHint(placing: boolean, placeName?: string, placeCost?: number): string {
    if (placing) {
      return `Place ${placeName ?? 'building'} (${placeCost ?? 0}g) · tap map · B cycle · Esc cancel`;
    }
    if (this.narrow) {
      return this.speciesId === 'nobles'
        ? 'Tap select · pads: H/Q/W/E · F formation · B build'
        : this.speciesId === 'weirdos'
          ? 'Tap select · pads: H/Q/W/E · M mutate · B build'
          : 'Tap select · pads: H/Q/W/E · B build · long-press pan';
    }
    return this.speciesId === 'nobles'
      ? 'H recruit · Q/W/E abilities · F formation · B build · RMB orders'
      : this.speciesId === 'weirdos'
        ? 'H ZOGGLE · Q/W/E · M mutation · B build · RMB orders'
        : 'H GRUK · Q/W/E abilities · B build · RMB gather/attack · Esc';
  }
}
