import { describe, expect, it } from 'vitest';
import { softLaunchStatusStrip } from './softLaunchStatus';

describe('softLaunchStatusStrip', () => {
  it('mentions the canonical Kane play path after the hub split', () => {
    expect(softLaunchStatusStrip()).toContain('/kane');
  });
});
