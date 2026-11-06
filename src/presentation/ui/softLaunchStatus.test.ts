import { describe, expect, it } from 'vitest';
import { softLaunchStatusStrip } from './softLaunchStatus';

describe('softLaunchStatusStrip', () => {
  it('mentions the hub root and canonical Kane play path after the hub split', () => {
    const strip = softLaunchStatusStrip();
    expect(strip).toContain('hub /');
    expect(strip).toContain('/kane');
  });
});
