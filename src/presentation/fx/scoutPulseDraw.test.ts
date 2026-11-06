import { describe, expect, it } from 'vitest';
import { scoutPulseAlpha, scoutPulseExpand } from './scoutPulseDraw';

describe('scout pulse reduce-motion', () => {
  it('is quieter and less expanding when reduce-motion is on', () => {
    expect(scoutPulseAlpha(1, true)).toBeLessThan(scoutPulseAlpha(1, false));
    expect(scoutPulseExpand(0.2, true)).toBeLessThan(
      scoutPulseExpand(0.2, false),
    );
  });
});
