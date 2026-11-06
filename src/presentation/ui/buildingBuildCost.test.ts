import { describe, expect, it } from 'vitest';
import { getBuildingType } from '../../data/buildings';
import { t } from '../../i18n';
import { buildingBuildCostLabel } from './buildingBuildCost';

describe('buildingBuildCostLabel', () => {
  it('formats gold-only and gold+crystal catalog costs', () => {
    const hut = getBuildingType('bonker_hut');
    expect(hut.cost.gold).toBeGreaterThan(0);
    expect(buildingBuildCostLabel('bonker_hut')).toBe(
      t('sel.buildCostGold', { gold: hut.cost.gold ?? 0 }),
    );
    const works = getBuildingType('scrap_works');
    expect(works.cost.magic_crystals).toBeGreaterThan(0);
    expect(buildingBuildCostLabel('scrap_works')).toBe(
      t('sel.buildCostBoth', {
        gold: works.cost.gold ?? 0,
        crystals: works.cost.magic_crystals ?? 0,
      }),
    );
  });

  it('omits the tip when the building has no catalog cost', () => {
    expect(buildingBuildCostLabel('junkyard')).toBeNull();
  });
});
