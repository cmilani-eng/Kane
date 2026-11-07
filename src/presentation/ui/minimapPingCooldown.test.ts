import { describe, expect, it } from 'vitest';
import { attentionPingOnCooldown } from '../../gameplay/battlefield/battlefieldAttentionPing';
import {
  ATTENTION_PING_COOLDOWN_MS,
  MINIMAP_PING_DENY_FLASH_MS,
  minimapPingDenyFlashAlpha,
} from './minimapPingCooldown';

describe('minimap ping cooldown', () => {
  it('exposes a short hold-to-ping cooldown window', () => {
    expect(ATTENTION_PING_COOLDOWN_MS).toBeGreaterThan(500);
    expect(attentionPingOnCooldown(ATTENTION_PING_COOLDOWN_MS)).toBe(true);
    expect(attentionPingOnCooldown(0)).toBe(false);
  });

  it('fades the deny flash from 1 to 0', () => {
    expect(minimapPingDenyFlashAlpha(MINIMAP_PING_DENY_FLASH_MS)).toBe(1);
    expect(minimapPingDenyFlashAlpha(0)).toBe(0);
    expect(
      minimapPingDenyFlashAlpha(MINIMAP_PING_DENY_FLASH_MS / 2),
    ).toBeCloseTo(0.5);
  });
});
