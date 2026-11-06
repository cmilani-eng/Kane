import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  endObjectiveResultText,
  endObjectiveResultTipLine,
} from './endObjectiveResultTip';

describe('endObjectiveResultTipLine', () => {
  it('labels Keep / CORE / wipe wins and losses', () => {
    expect(endObjectiveResultText(true, 'keep')).toBe(
      t('end.objectiveResult.keep.win'),
    );
    expect(endObjectiveResultTipLine(true, 'core_hold')).toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.core_hold.win'),
      }),
    );
    expect(endObjectiveResultTipLine(false, 'wipe')).toBe(
      t('end.objectiveTip', {
        text: t('end.objectiveResult.wipe.loss'),
      }),
    );
    expect(endObjectiveResultTipLine(true, null)).toBeNull();
  });
});
