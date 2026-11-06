import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';

/** Whole seconds for a full construction from buildMs (place-mode strip). */
export function placeBuildSec(buildMs: number): number {
  if (buildMs <= 0) return 0;
  return Math.max(0, Math.ceil(buildMs / 1000));
}

describe('placeBuildSec', () => {
  it('ceils full buildMs to whole seconds', () => {
    expect(placeBuildSec(4500)).toBe(5);
    expect(placeBuildSec(1000)).toBe(1);
    expect(placeBuildSec(0)).toBe(0);
  });
});

describe('hud.place build duration copy', () => {
  it('includes build seconds beside the footprint', () => {
    const build = t('hud.placeBuild', { sec: 5 });
    const line = t('hud.place', {
      name: 'Barracks',
      gold: 100,
      crystal: '',
      pay: '',
      foot: '2×2',
      build,
    });
    expect(line).toContain('2×2');
    expect(line).toContain('5s');
    expect(line.toLowerCase()).toContain('esc');
  });
});
