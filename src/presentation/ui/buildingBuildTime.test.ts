import { beforeEach, describe, expect, it } from 'vitest';
import { getBuildingType } from '../../data/buildings';
import { setLocale, t } from '../../i18n';
import { buildingBuildProgressLabel } from './buildingBuildProgress';
import { buildingFootprintLabel } from './buildingFootprint';
import { buildingProdQueueLabel } from './buildingProdQueue';
import {
  buildingBuildTimeLabel,
  buildingBuildTimeSec,
} from './buildingBuildTime';

beforeEach(() => {
  setLocale('en-GB');
});

describe('buildingBuildTime', () => {
  it('ceils catalog buildMs to whole seconds', () => {
    const ms = getBuildingType('bonker_hut').buildMs;
    expect(ms).toBeGreaterThan(0);
    expect(buildingBuildTimeSec('bonker_hut')).toBe(Math.ceil(ms / 1000));
  });

  it('labels Build · {n}s with middot, distinct from Build · progress / Building pct / place / Size · / Queue ·', () => {
    const n = buildingBuildTimeSec('bonker_hut')!;
    const line = buildingBuildTimeLabel('bonker_hut')!;
    expect(line).toBe(t('sel.buildTimeTip', { n }));
    expect(line).toBe(`Build · ${n}s`);
    expect(line).toMatch(/^Build \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).toMatch(/\d+s$/);

    // Distinct from live Build · pct% · secs left progress tip.
    const progress = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(line).not.toBe(progress);
    expect(progress).toBe(t('sel.buildProgressTip', { pct: 42, sec: 3 }));
    expect(progress).toBe('Build · 42% · 3s left');
    expect(progress).toMatch(/^Build \u00b7 /);
    expect(progress).toContain(' \u00b7 ');

    // Distinct from longer Building pct · secs line.
    expect(line).not.toBe(t('sel.buildingPct', { pct: 42, sec: 3 }));
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toBe(
      'Building 42% · 3s',
    );

    // Distinct from place-mode cost strip seconds chip.
    expect(line).not.toBe(t('hud.placeBuild', { sec: n }));
    expect(t('hud.placeBuild', { sec: n })).toBe(`  ·  ${n}s`);

    // Distinct from build-cost tips (Build gold / Build gold · crystal — no Build · Ns).
    expect(line).not.toBe(t('sel.buildCostGold', { gold: 50 }));
    expect(t('sel.buildCostGold', { gold: 50 })).toBe('Build 50g');
    expect(line).not.toBe(
      t('sel.buildCostBoth', { gold: 50, crystals: 10 }),
    );

    // Distinct from Size · / Queue · building selection peers.
    expect(line).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Size/);
    expect(line).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Queue · empty');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Queue \u00b7 /);
    expect(line).not.toMatch(/^Queue \u00b7 /);
    expect(line).not.toMatch(/%/);
    expect(line).not.toMatch(/ left$/);
  });

  it('localizes Build · {n}s middot for pt-BR and es; stays distinct from progress / Building pct / place / Size · / Queue ·', () => {
    const n = buildingBuildTimeSec('bonker_hut')!;

    setLocale('pt-BR');
    const pt = buildingBuildTimeLabel('bonker_hut')!;
    expect(pt).toBe(t('sel.buildTimeTip', { n }));
    expect(pt).toBe(`Construção · ${n}s`);
    expect(pt).toMatch(/^Construção \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    const ptProgress = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(pt).not.toBe(ptProgress);
    expect(ptProgress).toBe(
      t('sel.buildProgressTip', { pct: 42, sec: 3 }),
    );
    expect(ptProgress).toBe('Construção · 42% · 3s restantes');
    expect(ptProgress).toMatch(/^Construção \u00b7 /);
    expect(pt).not.toBe(t('sel.buildingPct', { pct: 42, sec: 3 }));
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toBe(
      'Construindo 42% · 3s',
    );
    expect(pt).not.toBe(t('hud.placeBuild', { sec: n }));
    expect(pt).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Tamanho/);
    expect(pt).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Fila · vazia');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Fila \u00b7 /);

    setLocale('es');
    const es = buildingBuildTimeLabel('bonker_hut')!;
    expect(es).toBe(t('sel.buildTimeTip', { n }));
    expect(es).toBe(`Construcción · ${n}s`);
    expect(es).toMatch(/^Construcción \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    const esProgress = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(es).not.toBe(esProgress);
    expect(esProgress).toBe(
      t('sel.buildProgressTip', { pct: 42, sec: 3 }),
    );
    expect(esProgress).toBe('Construcción · 42% · 3s restantes');
    expect(esProgress).toMatch(/^Construcción \u00b7 /);
    expect(es).not.toBe(t('sel.buildingPct', { pct: 42, sec: 3 }));
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toBe(
      'Construyendo 42% · 3s',
    );
    expect(es).not.toBe(t('hud.placeBuild', { sec: n }));
    expect(es).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Tamaño/);
    expect(es).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Cola · vacía');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Cola \u00b7 /);
    setLocale('en-GB');
  });

  it('omits the tip when the building has no catalog build time', () => {
    expect(buildingBuildTimeSec('junkyard')).toBeNull();
    expect(buildingBuildTimeLabel('junkyard')).toBeNull();
  });
});
