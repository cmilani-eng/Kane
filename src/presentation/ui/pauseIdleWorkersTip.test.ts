import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseIdleWorkersTipLine } from './pauseIdleWorkersTip';
import { pausePopulationTipLine } from './pausePopulationTip';

describe('pauseIdleWorkersTipLine', () => {
  it('labels Idle · n, distinct from Pop / Army; same en copy as minimap', () => {
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
    expect(pauseIdleWorkersTipLine(3)).toMatch(/^Idle ·/);
    expect(pauseIdleWorkersTipLine(0)).toBe(t('pause.idleTip', { n: 0 }));
    expect(pauseIdleWorkersTipLine(3)).not.toBe(pausePopulationTipLine(3));
    expect(pauseIdleWorkersTipLine(3)).not.toBe(pauseArmySizeTipLine(3));
    // Same en copy as minimap idle tip; distinct i18n key / surface.
    expect(pauseIdleWorkersTipLine(3)).toBe(minimapIdleWorkerTipText(3));
  });
});
