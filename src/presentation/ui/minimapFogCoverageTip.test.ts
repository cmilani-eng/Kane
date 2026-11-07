import { describe, expect, it } from 'vitest';
import { createFogState } from '../../gameplay/battlefield/battlefieldFog';
import { t } from '../../i18n';
import {
  fogExploredCoveragePct,
  minimapFogCoverageTipText,
} from './minimapFogCoverageTip';

describe('fogExploredCoveragePct', () => {
  it('is 0 on a fresh fog grid and 100 when fully explored', () => {
    const fog = createFogState();
    expect(fogExploredCoveragePct(fog)).toBe(0);
    fog.explored.fill(1);
    expect(fogExploredCoveragePct(fog)).toBe(100);
  });

  it('rounds explored / total as a whole percent', () => {
    const fog = createFogState();
    const quarter = Math.floor(fog.explored.length / 4);
    for (let i = 0; i < quarter; i++) fog.explored[i] = 1;
    expect(fogExploredCoveragePct(fog)).toBe(
      Math.round((100 * quarter) / fog.explored.length),
    );
  });
});

describe('minimapFogCoverageTipText', () => {
  it('labels Fog · pct%', () => {
    expect(minimapFogCoverageTipText(42)).toBe(
      t('hud.minimapFog', { pct: 42 }),
    );
    expect(minimapFogCoverageTipText(42)).toMatch(/^Fog ·/);
    expect(minimapFogCoverageTipText(42)).toMatch(/%$/);
    expect(minimapFogCoverageTipText(150)).toBe(t('hud.minimapFog', { pct: 100 }));
  });
});
