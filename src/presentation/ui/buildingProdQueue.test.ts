import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { buildingProdQueueLabel } from './buildingProdQueue';

describe('buildingProdQueue', () => {
  it('returns null when the building cannot train', () => {
    expect(buildingProdQueueLabel(false, 0, null)).toBeNull();
    expect(buildingProdQueueLabel(false, 2, 'Bonker')).toBeNull();
  });

  it('labels empty, training, and multi-slot queues', () => {
    expect(buildingProdQueueLabel(true, 0, null)).toBe(t('sel.prodQueueEmpty'));
    expect(buildingProdQueueLabel(true, 1, 'Bonker')).toBe(
      t('sel.prodQueueTraining', { name: 'Bonker' }),
    );
    expect(buildingProdQueueLabel(true, 3, 'Bonker')).toBe(
      t('sel.prodQueueTip', { n: 3 }),
    );
  });
});
