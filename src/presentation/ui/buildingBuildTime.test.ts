import { describe, expect, it } from 'vitest';
import { getBuildingType } from '../../data/buildings';
import { t } from '../../i18n';
import {
  buildingBuildTimeLabel,
  buildingBuildTimeSec,
} from './buildingBuildTime';

describe('buildingBuildTime', () => {
  it('ceils catalog buildMs to whole seconds', () => {
    const ms = getBuildingType('bonker_hut').buildMs;
    expect(ms).toBeGreaterThan(0);
    expect(buildingBuildTimeSec('bonker_hut')).toBe(Math.ceil(ms / 1000));
    expect(buildingBuildTimeLabel('bonker_hut')).toBe(
      t('sel.buildTimeTip', { n: buildingBuildTimeSec('bonker_hut')! }),
    );
    expect(buildingBuildTimeLabel('bonker_hut')).toMatch(/^Build · \d+s$/);
  });

  it('omits the tip when the building has no catalog build time', () => {
    expect(buildingBuildTimeSec('junkyard')).toBeNull();
    expect(buildingBuildTimeLabel('junkyard')).toBeNull();
  });
});
