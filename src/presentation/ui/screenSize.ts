/**
 * Kane needs a big screen. A phone is a screen whose shorter side is under 600 CSS px, in
 * either orientation. Tablets and computers are at or above that, so they keep playing.
 */
export const PHONE_MAX_SHORT_SIDE = 600;

export function isPhoneSizedScreen(width: number, height: number): boolean {
  return Math.min(width, height) < PHONE_MAX_SHORT_SIDE;
}
