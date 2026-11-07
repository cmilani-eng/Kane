import { describe, expect, it } from 'vitest';
import { CATALOGS } from '../../i18n/messages';
import { t } from '../../i18n';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { countIdleMilitary } from '../../gameplay/battlefield/idleMilitary';

describe('idle army chip count', () => {
  it('counts idle combat units for the chip label', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const n = countIdleMilitary(world);
    expect(n).toBeGreaterThan(0);
    const en = CATALOGS['en-GB']['hud.idleArmy'];
    expect(en.startsWith('{n}')).toBe(true);
    expect(en).toContain('{n}');
  });

  it('formats nearest-threat tip with direction arrow', () => {
    const line = t('hud.idleArmyThreat', {
      n: 3,
      action: 'tap',
      dir: '→',
    });
    expect(line).toContain('3');
    expect(line).toContain('→');
  });
});

