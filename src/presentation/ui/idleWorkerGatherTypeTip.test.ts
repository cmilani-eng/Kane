import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { idleWorkerGatherTypeTip } from './idleWorkerGatherTypeTip';

describe('idleWorkerGatherTypeTip', () => {
  it('labels Gold and Crystals gather types', () => {
    expect(idleWorkerGatherTypeTip('gold')).toBe(
      t('hud.idleGatherType', { resource: t('hud.resourceGold') }),
    );
    expect(idleWorkerGatherTypeTip('magic_crystals')).toBe(
      t('hud.idleGatherType', { resource: t('hud.resourceCrystals') }),
    );
  });

  it('omits the tip when there is no gather target', () => {
    expect(idleWorkerGatherTypeTip(null)).toBeNull();
  });
});
