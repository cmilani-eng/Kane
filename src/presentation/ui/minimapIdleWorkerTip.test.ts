import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';

describe('minimapIdleWorkerTipText', () => {
  it('labels Idle · n', () => {
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    expect(minimapIdleWorkerTipText(3)).toMatch(/^Idle ·/);
    expect(minimapIdleWorkerTipText(0)).toBe(t('hud.minimapIdle', { n: 0 }));
  });
});
