import { describe, expect, it } from 'vitest';
import {
  ATTENTION_PING_LIFE_MS,
  ATTENTION_PING_MAX,
  attentionPingFade,
  spawnAttentionPing,
  tickAttentionPings,
} from './battlefieldAttentionPing';
import type { BattlefieldWorld } from './battlefieldWorld';

function stubWorld(): BattlefieldWorld {
  return { attentionPings: [] } as unknown as BattlefieldWorld;
}

describe('attention ping', () => {
  it('spawns with a finite lifetime', () => {
    const world = stubWorld();
    const ping = spawnAttentionPing(world, 100, 200);
    expect(ping.x).toBe(100);
    expect(ping.y).toBe(200);
    expect(ping.lifeMs).toBe(ATTENTION_PING_LIFE_MS);
    expect(world.attentionPings).toHaveLength(1);
  });

  it('caps concurrent pings and expires them', () => {
    const world = stubWorld();
    for (let i = 0; i < ATTENTION_PING_MAX + 2; i++) {
      spawnAttentionPing(world, i, i);
    }
    expect(world.attentionPings).toHaveLength(ATTENTION_PING_MAX);
    expect(world.attentionPings[0]!.x).toBe(2);

    tickAttentionPings(world, ATTENTION_PING_LIFE_MS + 1);
    expect(world.attentionPings).toHaveLength(0);
  });

  it('fades opacity to zero over lifetime (no hard floor)', () => {
    expect(attentionPingFade(ATTENTION_PING_LIFE_MS, ATTENTION_PING_LIFE_MS)).toBe(1);
    expect(attentionPingFade(ATTENTION_PING_LIFE_MS / 2, ATTENTION_PING_LIFE_MS)).toBeCloseTo(
      0.25,
      5,
    );
    expect(attentionPingFade(0, ATTENTION_PING_LIFE_MS)).toBe(0);
    expect(attentionPingFade(-10, ATTENTION_PING_LIFE_MS)).toBe(0);
  });
});
