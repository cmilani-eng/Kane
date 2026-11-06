import { ATTENTION_PING_COOLDOWN_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';

/** Brief ice flash when hold-to-ping is refused during cooldown. */
export const MINIMAP_PING_DENY_FLASH_MS = 240;

export { ATTENTION_PING_COOLDOWN_MS };

/** 1 at deny flash start → 0 at expiry. */
export function minimapPingDenyFlashAlpha(
  remainMs: number,
  totalMs = MINIMAP_PING_DENY_FLASH_MS,
): number {
  if (totalMs <= 0 || remainMs <= 0) return 0;
  return Math.min(1, remainMs / totalMs);
}
