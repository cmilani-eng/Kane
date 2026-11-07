import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { endEfficiencyTipLine, matchEfficiencyPct } from './endEfficiencyTip';
import { endKillsTipLine } from './endKillsTip';

describe('matchEfficiencyPct', () => {
  it('is kills / (kills + losses) as a whole percent', () => {
    expect(matchEfficiencyPct(3, 1)).toBe(75);
    expect(matchEfficiencyPct(0, 4)).toBe(0);
    expect(matchEfficiencyPct(5, 0)).toBe(100);
    expect(matchEfficiencyPct(0, 0)).toBeNull();
  });
});

describe('endEfficiencyTipLine', () => {
  it('labels Efficiency · pct% distinct from Kills · n', () => {
    expect(endEfficiencyTipLine(3, 1)).toBe(t('end.efficiencyTip', { pct: 75 }));
    expect(endEfficiencyTipLine(3, 1)).toMatch(/^Efficiency ·/);
    expect(endEfficiencyTipLine(3, 1)).toMatch(/%$/);
    expect(endEfficiencyTipLine(3, 1)).not.toBe(endKillsTipLine(3));
    expect(endEfficiencyTipLine(0, 0)).toBeNull();
  });
});
