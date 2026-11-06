import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { MAP } from '../../config/balance';
import { rallyDistanceTiles } from '../../gameplay/battlefield/rallyDistance';

describe('rally distance marker copy', () => {
  it('formats tile distance for the rally flag label', () => {
    const n = rallyDistanceTiles({
      x: 0,
      y: 0,
      rallyX: 0,
      rallyY: MAP.tile * 4,
    });
    expect(n).toBe(4);
    expect(t('hud.rallyDist', { n })).toContain('4');
  });
});
