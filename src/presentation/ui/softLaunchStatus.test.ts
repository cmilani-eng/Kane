import { describe, expect, it } from 'vitest';
import {
  softLaunchBlobPathTip,
  softLaunchKanePathTip,
  softLaunchStatusStrip,
} from './softLaunchStatus';

describe('softLaunchStatusStrip', () => {
  it('mentions the hub root and canonical Kane + Blob play paths', () => {
    const strip = softLaunchStatusStrip();
    expect(strip).toContain('hub /');
    expect(strip).toContain(softLaunchKanePathTip());
    expect(strip).toContain('/kane/');
    expect(strip).toContain(softLaunchBlobPathTip());
    expect(strip).toContain('/blob-evolution/');
    expect(strip).not.toMatch(/(^|[^/])\/kane([^/]|$)/);
    expect(strip).not.toMatch(/(^|[^/])\/blob-evolution([^/]|$)/);
  });

  it('labels the Kane soft-launch play path with a trailing slash', () => {
    expect(softLaunchKanePathTip()).toBe('/kane/');
  });

  it('labels the Blob soft-launch play path with a trailing slash', () => {
    expect(softLaunchBlobPathTip()).toBe('/blob-evolution/');
  });
});
