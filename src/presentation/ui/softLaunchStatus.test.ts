import { describe, expect, it } from 'vitest';
import {
  softLaunchKanePathTip,
  softLaunchStatusStrip,
} from './softLaunchStatus';

describe('softLaunchStatusStrip', () => {
  it('mentions the hub root and canonical Kane + Blob play paths', () => {
    const strip = softLaunchStatusStrip();
    expect(strip).toContain('hub /');
    expect(strip).toContain(softLaunchKanePathTip());
    expect(strip).toContain('/kane/');
    expect(strip).toContain('/blob-evolution');
    expect(strip).not.toMatch(/(^|[^/])\/kane([^/]|$)/);
  });

  it('labels the Kane soft-launch play path with a trailing slash', () => {
    expect(softLaunchKanePathTip()).toBe('/kane/');
  });
});
