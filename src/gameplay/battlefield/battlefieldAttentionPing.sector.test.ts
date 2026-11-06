import { describe, expect, it } from 'vitest';
import {
  ATTENTION_PING_SECTOR_HINT_MS,
  spawnAttentionPing,
  tickAttentionPings,
} from './battlefieldAttentionPing';
import { createBattlefieldWorld } from './battlefieldWorld';

describe('attention ping sector hint', () => {
  it('arms a 3×3 sector tip when a ping lands', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    spawnAttentionPing(world, 100, 100);
    expect(world.attentionPingSectorHint).not.toBeNull();
    expect(world.attentionPingSectorHint!.sector).toBe('NW');
    expect(world.attentionPingSectorHint!.lifeMs).toBe(
      ATTENTION_PING_SECTOR_HINT_MS,
    );
  });

  it('expires the sector tip after its life window', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    spawnAttentionPing(world, 1200, 800);
    tickAttentionPings(world, ATTENTION_PING_SECTOR_HINT_MS + 1);
    expect(world.attentionPingSectorHint).toBeNull();
  });
});
