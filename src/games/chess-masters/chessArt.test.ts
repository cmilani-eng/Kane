/** The art has a drawing for every piece, and uses no Unicode chess characters or emoji. */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PIECE_SHAPES } from './chessPieceShapes';
import { POWER_KINDS } from './chessCore';
import { POWER_COLORS } from './chessArt';
import { CATALOGS } from '../../i18n';

const CHESS_OR_EMOJI = /[♔-♟]|\p{Extended_Pictographic}/u;

describe('chess art', () => {
  it('has its own drawing for all six pieces', () => {
    expect(Object.keys(PIECE_SHAPES)).toEqual(['1', '2', '3', '4', '5', '6']);
    for (const shape of Object.values(PIECE_SHAPES)) {
      expect(shape.parts.length).toBeGreaterThan(0);
      for (const d of [...shape.parts, ...(shape.lines ?? [])]) expect(d).toMatch(/^M-?\d/);
    }
    const drawings = Object.values(PIECE_SHAPES).map((s) => s.parts.join());
    expect(new Set(drawings).size).toBe(6);
  });

  it('colours every power-up differently', () => {
    expect(new Set(POWER_KINDS.map((k) => POWER_COLORS[k])).size).toBe(4);
  });

  it('never leans on Unicode chess characters or emoji', () => {
    const folder = resolve(import.meta.dirname);
    for (const file of readdirSync(folder).filter((f) => f.endsWith('.ts') && !f.includes('.test'))) {
      expect(readFileSync(resolve(folder, file), 'utf8'), file).not.toMatch(CHESS_OR_EMOJI);
    }
    for (const catalog of Object.values(CATALOGS)) {
      for (const [key, value] of Object.entries(catalog)) {
        if (key.startsWith('chess.') || key === 'hub.chess.blurb') expect(value, key).not.toMatch(CHESS_OR_EMOJI);
      }
    }
  });
});
