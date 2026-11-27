import { beforeEach, describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { pauseArmySizeTipLine } from './pauseArmySizeTip';
import { pauseIdleWorkersTipLine } from './pauseIdleWorkersTip';
import { pausePopulationTipLine } from './pausePopulationTip';
import { pauseSelectionCountTipLine } from './pauseSelectionCountTip';

beforeEach(() => {
  setLocale('en-GB');
});

describe('pauseIdleWorkersTipLine', () => {
  it('labels Idle · n with middot, distinct from Army · / Pop · / Selected ·', () => {
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
    expect(pauseIdleWorkersTipLine(3)).toBe('Idle · 3');
    expect(pauseIdleWorkersTipLine(3)).toMatch(/^Idle \u00b7 /);
    expect(pauseIdleWorkersTipLine(0)).toBe(t('pause.idleTip', { n: 0 }));
    expect(pauseIdleWorkersTipLine(0)).toBe('Idle · 0');
    expect(pauseIdleWorkersTipLine(0)).toMatch(/^Idle \u00b7 /);

    const idle = pauseIdleWorkersTipLine(3);
    expect(idle).not.toBe(pauseArmySizeTipLine(3));
    expect(idle).not.toBe(pausePopulationTipLine(3));
    expect(idle).not.toBe(pauseSelectionCountTipLine(3));
    expect(idle).not.toMatch(/^Army \u00b7 /);
    expect(idle).not.toMatch(/^Pop \u00b7 /);
    expect(idle).not.toMatch(/^Selected \u00b7 /);

    // Same en copy as minimap tip; distinct i18n key / surface.
    expect(idle).toBe(minimapIdleWorkerTipText(3));
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    expect(minimapIdleWorkerTipText(3)).toBe('Idle · 3');
    expect(minimapIdleWorkerTipText(3)).toMatch(/^Idle \u00b7 /);
    expect(t('pause.idleTip', { n: 1 })).toBe(t('hud.minimapIdle', { n: 1 }));
  });

  it('localizes Idle middot for pt-BR and es; stays distinct from Army / Pop / Selected', () => {
    setLocale('pt-BR');
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
    expect(pauseIdleWorkersTipLine(3)).toBe('Ociosos · 3');
    expect(pauseIdleWorkersTipLine(3)).toMatch(/^Ociosos \u00b7 /);

    const idlePt = pauseIdleWorkersTipLine(3);
    expect(idlePt).not.toBe(pauseArmySizeTipLine(3));
    expect(idlePt).not.toBe(pausePopulationTipLine(3));
    expect(idlePt).not.toBe(pauseSelectionCountTipLine(3));
    expect(idlePt).not.toMatch(/^Tropa \u00b7 /);
    expect(idlePt).not.toMatch(/^Pop \u00b7 /);
    expect(idlePt).not.toMatch(/^Selecionados \u00b7 /);
    expect(idlePt).toBe(minimapIdleWorkerTipText(3));
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));

    setLocale('es');
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
    expect(pauseIdleWorkersTipLine(3)).toBe('Inactivos · 3');
    expect(pauseIdleWorkersTipLine(3)).toMatch(/^Inactivos \u00b7 /);

    const idleEs = pauseIdleWorkersTipLine(3);
    expect(idleEs).not.toBe(pauseArmySizeTipLine(3));
    expect(idleEs).not.toBe(pausePopulationTipLine(3));
    expect(idleEs).not.toBe(pauseSelectionCountTipLine(3));
    expect(idleEs).not.toMatch(/^Tropa \u00b7 /);
    expect(idleEs).not.toMatch(/^Pop \u00b7 /);
    expect(idleEs).not.toMatch(/^Seleccionados \u00b7 /);
    expect(idleEs).toBe(minimapIdleWorkerTipText(3));
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    setLocale('en-GB');
  });
});
