import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapWorkerCountTipText } from './minimapWorkerCountTip';

describe('minimapWorkerCountTipText', () => {
  it('labels Workers · n with middot, distinct from Idle · / Army · / Pop ·', () => {
    expect(minimapWorkerCountTipText(4)).toBe(t('hud.minimapWorkers', { n: 4 }));
    expect(minimapWorkerCountTipText(4)).toBe('Workers · 4');
    expect(minimapWorkerCountTipText(4)).toMatch(/^Workers \u00b7 /);
    expect(minimapWorkerCountTipText(0)).toBe(t('hud.minimapWorkers', { n: 0 }));
    expect(minimapWorkerCountTipText(0)).toBe('Workers · 0');
    expect(minimapWorkerCountTipText(0)).toMatch(/^Workers \u00b7 /);

    const workers = minimapWorkerCountTipText(4);
    expect(workers).not.toBe(minimapIdleWorkerTipText(4));
    expect(workers).not.toBe(minimapArmyCountTipText(4));
    expect(workers).not.toBe(minimapPopulationTipText(4));
    expect(workers).not.toMatch(/^Idle \u00b7 /);
    expect(workers).not.toMatch(/^Army \u00b7 /);
    expect(workers).not.toMatch(/^Pop \u00b7 /);
  });

  it('localizes Workers middot for pt-BR and es; stays distinct from Idle / Army / Pop', () => {
    setLocale('pt-BR');
    expect(minimapWorkerCountTipText(4)).toBe(t('hud.minimapWorkers', { n: 4 }));
    expect(minimapWorkerCountTipText(4)).toBe('Trabalhadores · 4');
    expect(minimapWorkerCountTipText(4)).toMatch(/^Trabalhadores \u00b7 /);

    const workersPt = minimapWorkerCountTipText(4);
    expect(workersPt).not.toBe(minimapIdleWorkerTipText(4));
    expect(workersPt).not.toBe(minimapArmyCountTipText(4));
    expect(workersPt).not.toBe(minimapPopulationTipText(4));
    expect(workersPt).not.toMatch(/^Ociosos \u00b7 /);
    expect(workersPt).not.toMatch(/^Tropa \u00b7 /);
    expect(workersPt).not.toMatch(/^Pop \u00b7 /);

    setLocale('es');
    expect(minimapWorkerCountTipText(4)).toBe(t('hud.minimapWorkers', { n: 4 }));
    expect(minimapWorkerCountTipText(4)).toBe('Trabajadores · 4');
    expect(minimapWorkerCountTipText(4)).toMatch(/^Trabajadores \u00b7 /);

    const workersEs = minimapWorkerCountTipText(4);
    expect(workersEs).not.toBe(minimapIdleWorkerTipText(4));
    expect(workersEs).not.toBe(minimapArmyCountTipText(4));
    expect(workersEs).not.toBe(minimapPopulationTipText(4));
    expect(workersEs).not.toMatch(/^Inactivos \u00b7 /);
    expect(workersEs).not.toMatch(/^Tropa \u00b7 /);
    expect(workersEs).not.toMatch(/^Pop \u00b7 /);
    setLocale('en-GB');
  });
});
