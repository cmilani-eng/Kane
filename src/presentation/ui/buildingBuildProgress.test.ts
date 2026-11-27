import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { buildingBuildTimeLabel } from './buildingBuildTime';
import { buildingFootprintLabel } from './buildingFootprint';
import { buildingProdQueueLabel } from './buildingProdQueue';
import { buildingBuildProgressLabel } from './buildingBuildProgress';

beforeEach(() => {
  setLocale('en-GB');
});

describe('buildingBuildProgress', () => {
  it('returns null when the building is ready', () => {
    expect(buildingBuildProgressLabel(true, 0.5, 3)).toBeNull();
  });

  it('labels Build · pct% · secs left with middot, distinct from Build · time / Building pct / Size · / Queue ·', () => {
    const line = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(line).toBe(t('sel.buildProgressTip', { pct: 42, sec: 3 }));
    expect(line).toBe('Build · 42% · 3s left');
    expect(line).toMatch(/^Build \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    // Two middots: after Build and between pct% and secs.
    expect(line.match(/\u00b7/g)?.length).toBe(2);
    expect(line).toMatch(/% \u00b7 /);
    expect(line).toMatch(/ left$/);
    expect(line).not.toContain('  ·  ');

    expect(buildingBuildProgressLabel(false, 0, 5)).toBe(
      'Build · 0% · 5s left',
    );
    expect(buildingBuildProgressLabel(false, 0, 5)).toMatch(/^Build \u00b7 /);

    // Distinct from catalog Build · {n}s.
    const buildTime = buildingBuildTimeLabel('bonker_hut');
    if (buildTime) {
      expect(line).not.toBe(buildTime);
      expect(buildTime).toMatch(/^Build \u00b7 /);
      expect(buildTime).toMatch(/\d+s$/);
      expect(buildTime).not.toMatch(/%/);
      expect(buildTime).not.toMatch(/ left$/);
    }

    // Distinct from longer Building pct · secs line (no Build · prefix / left).
    expect(line).not.toBe(t('sel.buildingPct', { pct: 42, sec: 3 }));
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toBe(
      'Building 42% · 3s',
    );
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toMatch(
      /% \u00b7 /,
    );
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).not.toMatch(
      /^Build \u00b7 /,
    );

    // Distinct from Size · / Queue · building selection peers.
    expect(line).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Size \u00b7 /);
    expect(line).not.toMatch(/^Size \u00b7 /);
    expect(line).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Queue · empty');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Queue \u00b7 /);
    expect(line).not.toMatch(/^Queue \u00b7 /);
    expect(line).not.toMatch(/^Training \u00b7 /);
  });

  it('localizes Build · pct% · secs left middot for pt-BR and es; stays distinct from Build · time / Building pct / Size · / Queue ·', () => {
    setLocale('pt-BR');
    const pt = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(pt).toBe(t('sel.buildProgressTip', { pct: 42, sec: 3 }));
    expect(pt).toBe('Construção · 42% · 3s restantes');
    expect(pt).toMatch(/^Construção \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt.match(/\u00b7/g)?.length).toBe(2);
    expect(pt).toMatch(/% \u00b7 /);
    expect(pt).not.toContain('  ·  ');
    const ptBuild = buildingBuildTimeLabel('bonker_hut');
    if (ptBuild) {
      expect(pt).not.toBe(ptBuild);
      expect(ptBuild).toMatch(/^Construção \u00b7 /);
      expect(ptBuild).not.toMatch(/%/);
    }
    expect(pt).not.toBe(t('sel.buildingPct', { pct: 42, sec: 3 }));
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toBe(
      'Construindo 42% · 3s',
    );
    expect(pt).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Tamanho \u00b7 /);
    expect(pt).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Fila · vazia');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Fila \u00b7 /);

    setLocale('es');
    const es = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(es).toBe(t('sel.buildProgressTip', { pct: 42, sec: 3 }));
    expect(es).toBe('Construcción · 42% · 3s restantes');
    expect(es).toMatch(/^Construcción \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es.match(/\u00b7/g)?.length).toBe(2);
    expect(es).toMatch(/% \u00b7 /);
    expect(es).not.toContain('  ·  ');
    const esBuild = buildingBuildTimeLabel('bonker_hut');
    if (esBuild) {
      expect(es).not.toBe(esBuild);
      expect(esBuild).toMatch(/^Construcción \u00b7 /);
      expect(esBuild).not.toMatch(/%/);
    }
    expect(es).not.toBe(t('sel.buildingPct', { pct: 42, sec: 3 }));
    expect(t('sel.buildingPct', { pct: 42, sec: 3 })).toBe(
      'Construyendo 42% · 3s',
    );
    expect(es).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Tamaño \u00b7 /);
    expect(es).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Cola · vacía');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Cola \u00b7 /);
    setLocale('en-GB');
  });
});
