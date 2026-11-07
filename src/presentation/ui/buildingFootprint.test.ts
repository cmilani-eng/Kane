import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { buildingBuildProgressLabel } from './buildingBuildProgress';
import { buildingBuildTimeLabel } from './buildingBuildTime';
import { buildingProdQueueLabel } from './buildingProdQueue';
import {
  buildingFootprintLabel,
  buildingFootprintSize,
} from './buildingFootprint';

beforeEach(() => {
  setLocale('en-GB');
});

describe('buildingFootprint', () => {
  it('labels Size · w×h with middot, distinct from Build · / Queue · / place foot / Map · size', () => {
    const hall = buildingFootprintSize('junkyard');
    expect(hall.w).toBeGreaterThan(0);
    expect(hall.h).toBeGreaterThan(0);
    const line = buildingFootprintLabel('junkyard');
    expect(line).toBe(t('sel.footprintTip', { w: hall.w, h: hall.h }));
    expect(line).toBe(`Size · ${hall.w}×${hall.h}`);
    expect(line).toMatch(/^Size \u00b7 /);
    expect(line).toContain(' \u00b7 ');
    expect(line).toMatch(/\d+×\d+$/);
    // Exact single-space middot (not the old double-space Size  ·  form).
    expect(line).not.toContain('  ·  ');
    expect(line).not.toMatch(/^Size {2}\u00b7 {2}/);

    const tower = buildingFootprintSize('watchtower');
    expect(buildingFootprintLabel('watchtower')).toBe(
      `Size · ${tower.w}×${tower.h}`,
    );
    expect(buildingFootprintLabel('watchtower')).toMatch(/^Size \u00b7 /);

    // Distinct from catalog Build · {n}s and live Build · progress.
    const buildTime = buildingBuildTimeLabel('bonker_hut');
    if (buildTime) {
      expect(line).not.toBe(buildTime);
      expect(buildTime).toMatch(/^Build \u00b7 /);
      expect(line).not.toMatch(/^Build \u00b7 /);
    }
    const progress = buildingBuildProgressLabel(false, 0.42, 3)!;
    expect(line).not.toBe(progress);
    expect(progress).toBe('Build · 42% · 3s left');
    expect(progress).toMatch(/^Build \u00b7 /);

    // Distinct from Queue · peers.
    expect(line).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Queue · empty');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Queue \u00b7 /);
    expect(line).not.toMatch(/^Queue \u00b7 /);
    expect(line).not.toMatch(/^Training \u00b7 /);

    // Distinct from place-mode footprint chip (no Size · prefix).
    expect(line).not.toBe(t('hud.placeFoot', { cols: hall.w, rows: hall.h }));
    expect(t('hud.placeFoot', { cols: hall.w, rows: hall.h })).toBe(
      `${hall.w}×${hall.h}`,
    );
    expect(t('hud.placeFoot', { cols: hall.w, rows: hall.h })).not.toMatch(
      /^Size \u00b7 /,
    );

    // Distinct from Map · w×h size tips (end / lobby surfaces).
    expect(line).not.toBe(t('end.mapSizeTip', { w: hall.w, h: hall.h }));
    expect(t('end.mapSizeTip', { w: hall.w, h: hall.h })).toBe(
      `Map · ${hall.w}×${hall.h}`,
    );
    expect(t('end.mapSizeTip', { w: hall.w, h: hall.h })).toMatch(
      /^Map \u00b7 /,
    );
    expect(line).not.toBe(t('lobby.lastMapSizeTip', { w: hall.w, h: hall.h }));
    expect(t('lobby.lastMapSizeTip', { w: hall.w, h: hall.h })).toMatch(
      /^Map \u00b7 /,
    );
    expect(line).not.toMatch(/^Map \u00b7 /);
  });

  it('localizes Size · w×h middot for pt-BR and es; stays distinct from Build · / Queue · / place / Map ·', () => {
    const hall = buildingFootprintSize('junkyard');

    setLocale('pt-BR');
    const pt = buildingFootprintLabel('junkyard');
    expect(pt).toBe(t('sel.footprintTip', { w: hall.w, h: hall.h }));
    expect(pt).toBe(`Tamanho · ${hall.w}×${hall.h}`);
    expect(pt).toMatch(/^Tamanho \u00b7 /);
    expect(pt).toContain(' \u00b7 ');
    expect(pt).not.toContain('  ·  ');
    expect(pt).not.toMatch(/^Tamanho {2}\u00b7 {2}/);
    const ptBuild = buildingBuildTimeLabel('bonker_hut');
    if (ptBuild) {
      expect(pt).not.toBe(ptBuild);
      expect(ptBuild).toMatch(/^Construção \u00b7 /);
    }
    expect(pt).not.toBe(buildingBuildProgressLabel(false, 0.42, 3));
    expect(buildingBuildProgressLabel(false, 0.42, 3)).toMatch(
      /^Construção \u00b7 /,
    );
    expect(pt).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Fila · vazia');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Fila \u00b7 /);
    expect(pt).not.toBe(t('hud.placeFoot', { cols: hall.w, rows: hall.h }));
    expect(pt).not.toBe(t('end.mapSizeTip', { w: hall.w, h: hall.h }));
    expect(t('end.mapSizeTip', { w: hall.w, h: hall.h })).toMatch(
      /^Mapa \u00b7 /,
    );
    expect(pt).not.toMatch(/^Mapa \u00b7 /);

    setLocale('es');
    const es = buildingFootprintLabel('junkyard');
    expect(es).toBe(t('sel.footprintTip', { w: hall.w, h: hall.h }));
    expect(es).toBe(`Tamaño · ${hall.w}×${hall.h}`);
    expect(es).toMatch(/^Tamaño \u00b7 /);
    expect(es).toContain(' \u00b7 ');
    expect(es).not.toContain('  ·  ');
    expect(es).not.toMatch(/^Tamaño {2}\u00b7 {2}/);
    const esBuild = buildingBuildTimeLabel('bonker_hut');
    if (esBuild) {
      expect(es).not.toBe(esBuild);
      expect(esBuild).toMatch(/^Construcción \u00b7 /);
    }
    expect(es).not.toBe(buildingBuildProgressLabel(false, 0.42, 3));
    expect(buildingBuildProgressLabel(false, 0.42, 3)).toMatch(
      /^Construcción \u00b7 /,
    );
    expect(es).not.toBe(buildingProdQueueLabel(true, 0, null));
    expect(buildingProdQueueLabel(true, 0, null)).toBe('Cola · vacía');
    expect(buildingProdQueueLabel(true, 0, null)).toMatch(/^Cola \u00b7 /);
    expect(es).not.toBe(t('hud.placeFoot', { cols: hall.w, rows: hall.h }));
    expect(es).not.toBe(t('end.mapSizeTip', { w: hall.w, h: hall.h }));
    expect(t('end.mapSizeTip', { w: hall.w, h: hall.h })).toMatch(
      /^Mapa \u00b7 /,
    );
    expect(es).not.toMatch(/^Mapa \u00b7 /);
    setLocale('en-GB');
  });
});
