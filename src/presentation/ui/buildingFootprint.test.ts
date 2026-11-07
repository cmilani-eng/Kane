import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  buildingFootprintLabel,
  buildingFootprintSize,
} from './buildingFootprint';

describe('buildingFootprint', () => {
  it('labels catalog size as Size · w×h tiles', () => {
    const hall = buildingFootprintSize('junkyard');
    expect(hall.w).toBeGreaterThan(0);
    expect(hall.h).toBeGreaterThan(0);
    expect(buildingFootprintLabel('junkyard')).toBe(
      t('sel.footprintTip', { w: hall.w, h: hall.h }),
    );

    const tower = buildingFootprintSize('watchtower');
    expect(buildingFootprintLabel('watchtower')).toBe(
      t('sel.footprintTip', { w: tower.w, h: tower.h }),
    );
  });
});
