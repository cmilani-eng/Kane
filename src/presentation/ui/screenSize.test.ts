import { describe, expect, it } from 'vitest';
import { isPhoneSizedScreen, PHONE_MAX_SHORT_SIDE } from './screenSize';

describe('isPhoneSizedScreen', () => {
  it.each([
    ['a phone in portrait', 375, 812],
    ['a phone in landscape', 812, 375],
    ['a small Android phone', 360, 740],
    ['a phone just under the limit', 599, 900],
  ])('treats %s as a phone', (_label, width, height) => {
    expect(isPhoneSizedScreen(width, height)).toBe(true);
  });

  it.each([
    ['an iPad mini in portrait', 744, 1133],
    ['an iPad in portrait', 810, 1080],
    ['an iPad in landscape', 1080, 810],
    ['a laptop', 1440, 900],
    ['a phone-width window exactly at the limit', 600, 900],
  ])('lets %s play', (_label, width, height) => {
    expect(isPhoneSizedScreen(width, height)).toBe(false);
  });

  it('uses the shorter side, so rotating a phone does not change the answer', () => {
    expect(isPhoneSizedScreen(375, 812)).toBe(isPhoneSizedScreen(812, 375));
    expect(PHONE_MAX_SHORT_SIDE).toBe(600);
  });
});
