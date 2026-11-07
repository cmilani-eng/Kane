import { describe, expect, it } from 'vitest';
import {
  coreBannerBottom,
  coreBannerCenterY,
  coreHoldProgress,
  coreHoldRemainSec,
  hudChipStackTop,
  placeCostStripTop,
} from './coreVictoryBanner';

describe('coreHoldRemainSec', () => {
  it('ceils remaining ms to whole seconds', () => {
    expect(coreHoldRemainSec(60_000)).toBe(60);
    expect(coreHoldRemainSec(10_001)).toBe(11);
    expect(coreHoldRemainSec(999)).toBe(1);
    expect(coreHoldRemainSec(0)).toBe(0);
    expect(coreHoldRemainSec(-50)).toBe(0);
  });
});

describe('hudChipStackTop', () => {
  it('stays under the resource band on a tall screen', () => {
    expect(hudChipStackTop(1280, 800)).toBe(12 + 60 + 36 + 8);
    expect(hudChipStackTop(874, 500)).toBe(12 + 60 + 36 + 8);
  });

  it('starts below the CORE banner on a short screen', () => {
    expect(hudChipStackTop(874, 402)).toBe(coreBannerBottom(874, 402) + 8);
    expect(hudChipStackTop(390, 400)).toBe(coreBannerBottom(390, 400) + 8);
  });
});

describe('placeCostStripTop', () => {
  it('stays under the match clock on a tall screen', () => {
    expect(placeCostStripTop(1280, 800)).toBe(52);
    expect(placeCostStripTop(390, 800)).toBe(42);
  });

  it('sits under the CORE banner on a short screen', () => {
    expect(placeCostStripTop(874, 402)).toBe(coreBannerBottom(874, 402) + 8);
  });
});

describe('coreBannerCenterY', () => {
  it('stays under the match timer on a tall screen', () => {
    expect(coreBannerCenterY(1280, 800)).toBe(58);
    expect(coreBannerCenterY(874, 500)).toBe(58);
  });

  it('clears the stock strip on a short screen', () => {
    // Wide short strip: top 62, height 36, bottom 98. Panel is 76 tall.
    expect(coreBannerCenterY(874, 402)).toBe(98 + 8 + 38);
    // Narrow short strip is 76 tall, so the banner drops further.
    expect(coreBannerCenterY(390, 400)).toBe(8 + 50 + 76 + 8 + 38);
  });
});

describe('coreHoldProgress', () => {
  it('maps remaining ms to 0→1 hold progress', () => {
    expect(coreHoldProgress(60_000, 60_000)).toBe(0);
    expect(coreHoldProgress(30_000, 60_000)).toBeCloseTo(0.5);
    expect(coreHoldProgress(0, 60_000)).toBe(1);
    expect(coreHoldProgress(-10, 60_000)).toBe(1);
  });
});
