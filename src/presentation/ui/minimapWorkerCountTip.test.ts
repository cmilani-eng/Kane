import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapWorkerCountTipText } from './minimapWorkerCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('minimapWorkerCountTipText', () => {
  it('labels Workers · n with middot, distinct from Idle · / Army · / Pop ·', () => {
    const workers = minimapWorkerCountTipText(4);
    expect(workers).toBe(t('hud.minimapWorkers', { n: 4 }));
    expect(workers).toBe('Workers · 4');
    expect(workers).toMatch(/^Workers \u00b7 /);
    expect(workers).toMatch(/^Workers \u00b7 4$/);
    expect(workers).toContain(' \u00b7 ');
    expect(workers).not.toContain('  ·  ');

    const zero = minimapWorkerCountTipText(0);
    expect(zero).toBe(t('hud.minimapWorkers', { n: 0 }));
    expect(zero).toBe('Workers · 0');
    expect(zero).toMatch(/^Workers \u00b7 0$/);
    expect(zero).toContain(' \u00b7 ');
    expect(zero).not.toContain('  ·  ');

    // Distinct from Idle · / Army · / Pop · peers.
    expect(workers).not.toBe(minimapIdleWorkerTipText(4));
    expect(minimapIdleWorkerTipText(4)).toBe('Idle · 4');
    expect(minimapIdleWorkerTipText(4)).toMatch(/^Idle \u00b7 /);
    expect(workers).not.toBe(minimapArmyCountTipText(4));
    expect(minimapArmyCountTipText(4)).toBe('Army · 4');
    expect(minimapArmyCountTipText(4)).toMatch(/^Army \u00b7 /);
    expect(workers).not.toBe(minimapPopulationTipText(4));
    expect(minimapPopulationTipText(4)).toBe('Pop · 4');
    expect(minimapPopulationTipText(4)).toMatch(/^Pop \u00b7 /);
    expect(workers).not.toMatch(/^Idle \u00b7 /);
    expect(workers).not.toMatch(/^Army \u00b7 /);
    expect(workers).not.toMatch(/^Pop \u00b7 /);
  });

  it('localizes Workers · middot for pt-BR and es; stays distinct from Idle · / Army · / Pop ·', () => {
    setLocale('pt-BR');
    const workersPt = minimapWorkerCountTipText(4);
    expect(workersPt).toBe(t('hud.minimapWorkers', { n: 4 }));
    expect(workersPt).toBe('Trabalhadores · 4');
    expect(workersPt).toMatch(/^Trabalhadores \u00b7 /);
    expect(workersPt).toMatch(/^Trabalhadores \u00b7 4$/);
    expect(workersPt).toContain(' \u00b7 ');
    expect(workersPt).not.toContain('  ·  ');

    expect(workersPt).not.toBe(minimapIdleWorkerTipText(4));
    expect(minimapIdleWorkerTipText(4)).toBe('Ociosos · 4');
    expect(minimapIdleWorkerTipText(4)).toMatch(/^Ociosos \u00b7 /);
    expect(workersPt).not.toBe(minimapArmyCountTipText(4));
    expect(minimapArmyCountTipText(4)).toBe('Tropa · 4');
    expect(minimapArmyCountTipText(4)).toMatch(/^Tropa \u00b7 /);
    expect(workersPt).not.toBe(minimapPopulationTipText(4));
    expect(minimapPopulationTipText(4)).toBe('Pop · 4');
    expect(minimapPopulationTipText(4)).toMatch(/^Pop \u00b7 /);
    expect(workersPt).not.toMatch(/^Ociosos \u00b7 /);
    expect(workersPt).not.toMatch(/^Tropa \u00b7 /);
    expect(workersPt).not.toMatch(/^Pop \u00b7 /);

    setLocale('es');
    const workersEs = minimapWorkerCountTipText(4);
    expect(workersEs).toBe(t('hud.minimapWorkers', { n: 4 }));
    expect(workersEs).toBe('Trabajadores · 4');
    expect(workersEs).toMatch(/^Trabajadores \u00b7 /);
    expect(workersEs).toMatch(/^Trabajadores \u00b7 4$/);
    expect(workersEs).toContain(' \u00b7 ');
    expect(workersEs).not.toContain('  ·  ');

    expect(workersEs).not.toBe(minimapIdleWorkerTipText(4));
    expect(minimapIdleWorkerTipText(4)).toBe('Inactivos · 4');
    expect(minimapIdleWorkerTipText(4)).toMatch(/^Inactivos \u00b7 /);
    expect(workersEs).not.toBe(minimapArmyCountTipText(4));
    expect(minimapArmyCountTipText(4)).toBe('Tropa · 4');
    expect(minimapArmyCountTipText(4)).toMatch(/^Tropa \u00b7 /);
    expect(workersEs).not.toBe(minimapPopulationTipText(4));
    expect(minimapPopulationTipText(4)).toBe('Pop · 4');
    expect(minimapPopulationTipText(4)).toMatch(/^Pop \u00b7 /);
    expect(workersEs).not.toMatch(/^Inactivos \u00b7 /);
    expect(workersEs).not.toMatch(/^Tropa \u00b7 /);
    expect(workersEs).not.toMatch(/^Pop \u00b7 /);
  });
});
