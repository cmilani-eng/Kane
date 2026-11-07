import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { buildingBuildProgressLabel } from './buildingBuildProgress';

describe('buildingBuildProgress', () => {
  it('returns null when the building is ready', () => {
    expect(buildingBuildProgressLabel(true, 0.5, 3)).toBeNull();
  });

  it('labels incomplete construction as Build · pct% · secs', () => {
    expect(buildingBuildProgressLabel(false, 0.42, 3)).toBe(
      t('sel.buildProgressTip', { pct: 42, sec: 3 }),
    );
    expect(buildingBuildProgressLabel(false, 0, 5)).toBe(
      t('sel.buildProgressTip', { pct: 0, sec: 5 }),
    );
  });
});
