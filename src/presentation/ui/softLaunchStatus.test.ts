import { describe, expect, it } from 'vitest';
import { softLaunchStatusStrip } from './softLaunchStatus';

describe('softLaunchStatusStrip', () => {
  it('mentions the hub root and canonical Kane + Blob play paths', () => {
    const strip = softLaunchStatusStrip();
    expect(strip).toContain('hub /');
    expect(strip).toContain('/kane');
    expect(strip).toContain('/blob-evolution');
  });
});

