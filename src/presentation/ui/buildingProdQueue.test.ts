import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { buildingBuildProgressLabel } from './buildingBuildProgress';
import { buildingBuildTimeLabel } from './buildingBuildTime';
import { buildingFootprintLabel } from './buildingFootprint';
import { buildingProdQueueLabel } from './buildingProdQueue';

beforeEach(() => {
  setLocale('en-GB');
});

describe('buildingProdQueue', () => {
  it('returns null when the building cannot train', () => {
    expect(buildingProdQueueLabel(false, 0, null)).toBeNull();
    expect(buildingProdQueueLabel(false, 2, 'Bonker')).toBeNull();
  });

  it('labels Queue · empty / Training · name / Queue · n with middot, distinct from Build · / Size · / live Training ETA / Queue row', () => {
    const empty = buildingProdQueueLabel(true, 0, null)!;
    expect(empty).toBe(t('sel.prodQueueEmpty'));
    expect(empty).toBe('Queue · empty');
    expect(empty).toMatch(/^Queue \u00b7 /);
    expect(empty).toContain(' \u00b7 ');
    expect(empty).toMatch(/ empty$/);
    expect(empty).not.toContain('  ·  ');

    const training = buildingProdQueueLabel(true, 1, 'Bonker')!;
    expect(training).toBe(t('sel.prodQueueTraining', { name: 'Bonker' }));
    expect(training).toBe('Training · Bonker');
    expect(training).toMatch(/^Training \u00b7 /);
    expect(training).toContain(' \u00b7 ');
    expect(training).not.toContain('  ·  ');
    expect(training).not.toMatch(/%/);
    expect(training).not.toMatch(/\d+s/);

    const queued = buildingProdQueueLabel(true, 3, 'Bonker')!;
    expect(queued).toBe(t('sel.prodQueueTip', { n: 3 }));
    expect(queued).toBe('Queue · 3');
    expect(queued).toMatch(/^Queue \u00b7 /);
    expect(queued).toContain(' \u00b7 ');
    expect(queued).not.toContain('  ·  ');
    expect(queued).not.toMatch(/ empty$/);

    // Distinct from catalog Build · {n}s / live Build · pct% · secs left.
    const buildTime = buildingBuildTimeLabel('bonker_hut');
    if (buildTime) {
      expect(empty).not.toBe(buildTime);
      expect(training).not.toBe(buildTime);
      expect(queued).not.toBe(buildTime);
      expect(buildTime).toMatch(/^Build \u00b7 /);
    }
    const progress = buildingBuildProgressLabel(false, 0.42, 3);
    if (progress) {
      expect(empty).not.toBe(progress);
      expect(training).not.toBe(progress);
      expect(queued).not.toBe(progress);
      expect(progress).toMatch(/^Build \u00b7 /);
    }
    expect(empty).not.toMatch(/^Build \u00b7 /);
    expect(training).not.toMatch(/^Build \u00b7 /);
    expect(queued).not.toMatch(/^Build \u00b7 /);

    // Distinct from Size · footprint tip.
    expect(empty).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Size \u00b7 /);
    expect(empty).not.toMatch(/^Size \u00b7 /);
    expect(training).not.toMatch(/^Size \u00b7 /);
    expect(queued).not.toMatch(/^Size \u00b7 /);

    // Distinct from live queue ETA row (Training name · pct% · secs — no middot after Training).
    const liveTraining = t('sel.training', {
      name: 'Bonker',
      pct: 42,
      sec: 3,
      hint: '',
    });
    expect(training).not.toBe(liveTraining);
    expect(liveTraining).toBe('Training Bonker · 42% · 3s');
    expect(liveTraining).toMatch(/^Training /);
    expect(liveTraining).not.toMatch(/^Training \u00b7 /);
    expect(training).not.toMatch(/%/);

    // Distinct from live multi-slot Queue {n} row (no middot after Queue).
    const liveQueue = t('sel.queue', { n: 3, hint: '' });
    expect(queued).not.toBe(liveQueue);
    expect(liveQueue).toBe('Queue 3');
    expect(liveQueue).toMatch(/^Queue /);
    expect(liveQueue).not.toMatch(/^Queue \u00b7 /);
    expect(queued).toMatch(/^Queue \u00b7 /);

    // Empty / Training · / Queue · n stay mutually distinct.
    expect(empty).not.toBe(training);
    expect(empty).not.toBe(queued);
    expect(training).not.toBe(queued);
    expect(empty).not.toMatch(/^Training \u00b7 /);
    expect(queued).not.toMatch(/^Training \u00b7 /);
    expect(training).not.toMatch(/^Queue \u00b7 /);
  });

  it('localizes Queue · / Training · middot for pt-BR and es; stays distinct from Build · / Size · / live Training ETA / Queue row', () => {
    setLocale('pt-BR');
    const ptEmpty = buildingProdQueueLabel(true, 0, null)!;
    expect(ptEmpty).toBe(t('sel.prodQueueEmpty'));
    expect(ptEmpty).toBe('Fila · vazia');
    expect(ptEmpty).toMatch(/^Fila \u00b7 /);
    expect(ptEmpty).toContain(' \u00b7 ');
    expect(ptEmpty).not.toContain('  ·  ');
    const ptTraining = buildingProdQueueLabel(true, 1, 'Bonker')!;
    expect(ptTraining).toBe(t('sel.prodQueueTraining', { name: 'Bonker' }));
    expect(ptTraining).toBe('Treinando · Bonker');
    expect(ptTraining).toMatch(/^Treinando \u00b7 /);
    expect(ptTraining).toContain(' \u00b7 ');
    const ptQueued = buildingProdQueueLabel(true, 3, 'Bonker')!;
    expect(ptQueued).toBe(t('sel.prodQueueTip', { n: 3 }));
    expect(ptQueued).toBe('Fila · 3');
    expect(ptQueued).toMatch(/^Fila \u00b7 /);
    const ptBuild = buildingBuildTimeLabel('bonker_hut');
    if (ptBuild) {
      expect(ptEmpty).not.toBe(ptBuild);
      expect(ptBuild).toMatch(/^Construção \u00b7 /);
    }
    expect(ptEmpty).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Tamanho \u00b7 /);
    const ptLiveTraining = t('sel.training', {
      name: 'Bonker',
      pct: 42,
      sec: 3,
      hint: '',
    });
    expect(ptTraining).not.toBe(ptLiveTraining);
    expect(ptLiveTraining).toBe('Treinando Bonker · 42% · 3s');
    expect(ptLiveTraining).not.toMatch(/^Treinando \u00b7 /);
    const ptLiveQueue = t('sel.queue', { n: 3, hint: '' });
    expect(ptQueued).not.toBe(ptLiveQueue);
    expect(ptLiveQueue).toBe('Fila 3');
    expect(ptLiveQueue).not.toMatch(/^Fila \u00b7 /);

    setLocale('es');
    const esEmpty = buildingProdQueueLabel(true, 0, null)!;
    expect(esEmpty).toBe(t('sel.prodQueueEmpty'));
    expect(esEmpty).toBe('Cola · vacía');
    expect(esEmpty).toMatch(/^Cola \u00b7 /);
    expect(esEmpty).toContain(' \u00b7 ');
    expect(esEmpty).not.toContain('  ·  ');
    const esTraining = buildingProdQueueLabel(true, 1, 'Bonker')!;
    expect(esTraining).toBe(t('sel.prodQueueTraining', { name: 'Bonker' }));
    expect(esTraining).toBe('Entrenando · Bonker');
    expect(esTraining).toMatch(/^Entrenando \u00b7 /);
    expect(esTraining).toContain(' \u00b7 ');
    const esQueued = buildingProdQueueLabel(true, 3, 'Bonker')!;
    expect(esQueued).toBe(t('sel.prodQueueTip', { n: 3 }));
    expect(esQueued).toBe('Cola · 3');
    expect(esQueued).toMatch(/^Cola \u00b7 /);
    const esBuild = buildingBuildTimeLabel('bonker_hut');
    if (esBuild) {
      expect(esEmpty).not.toBe(esBuild);
      expect(esBuild).toMatch(/^Construcción \u00b7 /);
    }
    expect(esEmpty).not.toBe(buildingFootprintLabel('bonker_hut'));
    expect(buildingFootprintLabel('bonker_hut')).toMatch(/^Tamaño \u00b7 /);
    const esLiveTraining = t('sel.training', {
      name: 'Bonker',
      pct: 42,
      sec: 3,
      hint: '',
    });
    expect(esTraining).not.toBe(esLiveTraining);
    expect(esLiveTraining).toBe('Entrenando Bonker · 42% · 3s');
    expect(esLiveTraining).not.toMatch(/^Entrenando \u00b7 /);
    const esLiveQueue = t('sel.queue', { n: 3, hint: '' });
    expect(esQueued).not.toBe(esLiveQueue);
    expect(esLiveQueue).toBe('Cola 3');
    expect(esLiveQueue).not.toMatch(/^Cola \u00b7 /);
    setLocale('en-GB');
  });
});
