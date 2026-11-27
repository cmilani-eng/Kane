import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : [];
  });
}

/**
 * A Phaser 4 Graphics has no default hit area. Making one interactive without a shape leaves a
 * null hitAreaCallback, and the input manager then throws on every pointer event on the canvas,
 * so no button works. Rectangles, text and images have a default area; Graphics need their own.
 */
function graphicsWithoutHitArea(source: string): number[] {
  const lines: number[] = [];
  const lineOf = (index: number): number => source.slice(0, index).split('\n').length;

  for (const m of source.matchAll(/\.graphics\(\)[^;]*?\.setInteractive\(\s*\{[^}]*\}\s*\)/g)) {
    if (!m[0].includes('hitArea')) lines.push(lineOf(m.index ?? 0));
  }
  for (const v of source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*[^;]*?\.graphics\(\)/g)) {
    const call = new RegExp(`\\b${v[1]}\\s*\\.setInteractive\\(\\s*(\\{[^}]*\\})?\\s*\\)`, 'g');
    for (const m of source.matchAll(call)) {
      if (!m[0].includes('hitArea')) lines.push(lineOf(m.index ?? 0));
    }
  }
  return lines;
}

describe('Graphics hit areas', () => {
  it('flags a Graphics made interactive without a hit area', () => {
    const chained = 'const bg = this.add.graphics().setPosition(x, y).setInteractive({ useHandCursor: true });';
    const viaVariable = 'const bg = this.add.graphics();\nbg.setInteractive({ useHandCursor: true });';
    expect(graphicsWithoutHitArea(chained)).toHaveLength(1);
    expect(graphicsWithoutHitArea(viaVariable)).toHaveLength(1);
  });

  it('accepts a Graphics that brings its own hit area', () => {
    const ok = [
      'const bg = this.add.graphics().setInteractive({ hitArea: rect, hitAreaCallback: Phaser.Geom.Rectangle.Contains });',
      'const g = this.add.graphics();\ng.setInteractive({ hitArea: rect, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });',
    ];
    for (const source of ok) expect(graphicsWithoutHitArea(source)).toHaveLength(0);
  });

  it('is not broken anywhere in the game source', () => {
    const offenders = sourceFiles(srcRoot).flatMap((file) => {
      const lines = graphicsWithoutHitArea(readFileSync(file, 'utf8'));
      return lines.map((line) => `${relative(srcRoot, file)}:${line}`);
    });
    expect(offenders).toEqual([]);
  });
});
