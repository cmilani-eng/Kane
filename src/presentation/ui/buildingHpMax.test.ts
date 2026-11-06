import { describe, expect, it } from 'vitest';
import { getBuildingType } from '../../data/buildings';
import { t } from '../../i18n';
import { buildingHpMax, buildingHpMaxLabel } from './buildingHpMax';

describe('buildingHpMax', () => {
  it('reads catalog max HP for a known building', () => {
    const id = 'junkyard' as const;
    const n = buildingHpMax(id);
    expect(n).toBe(getBuildingType(id).maxHp);
    expect(buildingHpMaxLabel(id)).toBe(t('sel.hpMaxTip', { n: n! }));
  });
});
