import { describe, expect, it } from 'vitest';
import { getUnitType } from '../../data/units';
import { t } from '../../i18n';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { buildSelectionView, trainFullSec } from './selectionPanel';

describe('train button duration seconds', () => {
  it('sets trainSec from trainMs on production browse options', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    const keep = world.buildings.find(
      (b) => b.team === 'player' && b.typeId === 'junkyard',
    );
    expect(keep).toBeDefined();
    keep!.complete = true;
    keep!.buildProgress = 1;

    const view = buildSelectionView(world, keep!, [], false);
    expect(view.kind).toBe('building');
    if (view.kind !== 'building') return;
    expect(view.trains.length).toBeGreaterThan(0);
    for (const train of view.trains) {
      const ms = getUnitType(train.typeId).trainMs;
      expect(train.trainSec).toBe(trainFullSec(ms));
      expect(train.trainSec).toBeGreaterThan(0);
    }
  });

  it('formats quiet trainSec copy', () => {
    expect(t('sel.trainSec', { sec: 3 })).toBe('3s');
  });
});
