import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { formatMatchClock } from './matchClock';

describe('pause menu elapsed line', () => {
  it('labels match elapsed time with mm:ss from the snapshot clock', () => {
    const clock = formatMatchClock(125_000);
    expect(clock).toBe('2:05');
    const line = t('pause.elapsed', { clock });
    expect(line).toContain('2:05');
    expect(line.toLowerCase()).toMatch(/elapsed|tempo|tiempo/);
  });
});
