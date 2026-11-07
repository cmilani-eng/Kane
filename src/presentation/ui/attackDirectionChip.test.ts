import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { attackDirectionArrow } from '../../gameplay/battlefield/attackDirection';

describe('under-attack chip direction copy', () => {
  it('prefixes Keep alert with an arrow toward the hit', () => {
    const dir = attackDirectionArrow(0, 0, 0, -300);
    const line = t('hud.attackKeep', { dir });
    expect(dir).toBe('↑');
    expect(line.startsWith('↑')).toBe(true);
    expect(line.toLowerCase()).toContain('keep');
  });
});
