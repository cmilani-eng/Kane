import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { minimapWorkerCountTipText } from './minimapWorkerCountTip';
import { pauseIdleWorkersTipLine } from './pauseIdleWorkersTip';

describe('minimapIdleWorkerTipText', () => {
  it('labels Idle · n, distinct from Workers tip and pause tip key', () => {
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    expect(minimapIdleWorkerTipText(3)).toMatch(/^Idle ·/);
    expect(minimapIdleWorkerTipText(0)).toBe(t('hud.minimapIdle', { n: 0 }));
    expect(minimapIdleWorkerTipText(3)).not.toBe(minimapWorkerCountTipText(3));
    // Same en copy as pause Idle tip; distinct i18n key / surface.
    expect(minimapIdleWorkerTipText(3)).toBe(pauseIdleWorkersTipLine(3));
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
  });
});
