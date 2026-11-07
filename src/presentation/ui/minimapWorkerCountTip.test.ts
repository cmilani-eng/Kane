import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { minimapWorkerCountTipText } from './minimapWorkerCountTip';

describe('minimapWorkerCountTipText', () => {
  it('labels Workers · n, distinct from Idle and Army tips', () => {
    expect(minimapWorkerCountTipText(4)).toBe(
      t('hud.minimapWorkers', { n: 4 }),
    );
    expect(minimapWorkerCountTipText(4)).toMatch(/^Workers ·/);
    expect(minimapWorkerCountTipText(0)).toBe(
      t('hud.minimapWorkers', { n: 0 }),
    );
    expect(minimapWorkerCountTipText(4)).not.toBe(minimapIdleWorkerTipText(4));
    expect(minimapWorkerCountTipText(4)).not.toBe(minimapArmyCountTipText(4));
  });
});
