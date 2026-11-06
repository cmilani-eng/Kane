/** Brief gold wash after a successful double-tap minimap recenter. */
export const MINIMAP_FOCUS_FLASH_MS = 280;

/** 1 at flash start → 0 at expiry. */
export function minimapFocusFlashAlpha(
  remainMs: number,
  totalMs = MINIMAP_FOCUS_FLASH_MS,
): number {
  if (totalMs <= 0 || remainMs <= 0) return 0;
  return Math.min(1, remainMs / totalMs);
}
