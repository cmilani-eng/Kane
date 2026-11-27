import { describe, expect, it } from 'vitest';
import { setLocale, t } from '../../i18n';
import { minimapArmyCountTipText } from './minimapArmyCountTip';
import { minimapIdleWorkerTipText } from './minimapIdleWorkerTip';
import { minimapPopulationTipText } from './minimapPopulationTip';
import { minimapWorkerCountTipText } from './minimapWorkerCountTip';
import { pauseIdleWorkersTipLine } from './pauseIdleWorkersTip';

describe('minimapIdleWorkerTipText', () => {
  it('labels Idle · n with middot, distinct from Workers · / Army · / Pop ·', () => {
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    expect(minimapIdleWorkerTipText(3)).toBe('Idle · 3');
    expect(minimapIdleWorkerTipText(3)).toMatch(/^Idle \u00b7 /);
    expect(minimapIdleWorkerTipText(0)).toBe(t('hud.minimapIdle', { n: 0 }));
    expect(minimapIdleWorkerTipText(0)).toBe('Idle · 0');
    expect(minimapIdleWorkerTipText(0)).toMatch(/^Idle \u00b7 /);

    const idle = minimapIdleWorkerTipText(3);
    expect(idle).not.toBe(minimapWorkerCountTipText(3));
    expect(idle).not.toBe(minimapArmyCountTipText(3));
    expect(idle).not.toBe(minimapPopulationTipText(3));
    expect(idle).not.toMatch(/^Workers \u00b7 /);
    expect(idle).not.toMatch(/^Army \u00b7 /);
    expect(idle).not.toMatch(/^Pop \u00b7 /);

    // Same en copy as pause tip; distinct i18n key / surface.
    expect(idle).toBe(pauseIdleWorkersTipLine(3));
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
    expect(pauseIdleWorkersTipLine(3)).toBe('Idle · 3');
    expect(pauseIdleWorkersTipLine(3)).toMatch(/^Idle \u00b7 /);
    expect(t('hud.minimapIdle', { n: 1 })).toBe(t('pause.idleTip', { n: 1 }));
  });

  it('localizes Idle middot for pt-BR and es; stays distinct from Workers / Army / Pop', () => {
    setLocale('pt-BR');
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    expect(minimapIdleWorkerTipText(3)).toBe('Ociosos · 3');
    expect(minimapIdleWorkerTipText(3)).toMatch(/^Ociosos \u00b7 /);

    const idlePt = minimapIdleWorkerTipText(3);
    expect(idlePt).not.toBe(minimapWorkerCountTipText(3));
    expect(idlePt).not.toBe(minimapArmyCountTipText(3));
    expect(idlePt).not.toBe(minimapPopulationTipText(3));
    expect(idlePt).not.toMatch(/^Trabalhadores \u00b7 /);
    expect(idlePt).not.toMatch(/^Tropa \u00b7 /);
    expect(idlePt).not.toMatch(/^Pop \u00b7 /);
    expect(idlePt).toBe(pauseIdleWorkersTipLine(3));
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));

    setLocale('es');
    expect(minimapIdleWorkerTipText(3)).toBe(t('hud.minimapIdle', { n: 3 }));
    expect(minimapIdleWorkerTipText(3)).toBe('Inactivos · 3');
    expect(minimapIdleWorkerTipText(3)).toMatch(/^Inactivos \u00b7 /);

    const idleEs = minimapIdleWorkerTipText(3);
    expect(idleEs).not.toBe(minimapWorkerCountTipText(3));
    expect(idleEs).not.toBe(minimapArmyCountTipText(3));
    expect(idleEs).not.toBe(minimapPopulationTipText(3));
    expect(idleEs).not.toMatch(/^Trabajadores \u00b7 /);
    expect(idleEs).not.toMatch(/^Tropa \u00b7 /);
    expect(idleEs).not.toMatch(/^Pop \u00b7 /);
    expect(idleEs).toBe(pauseIdleWorkersTipLine(3));
    expect(pauseIdleWorkersTipLine(3)).toBe(t('pause.idleTip', { n: 3 }));
    setLocale('en-GB');
  });
});
