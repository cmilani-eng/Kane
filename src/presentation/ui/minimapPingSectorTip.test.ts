import { describe, expect, it } from 'vitest';
import { ATTENTION_PING_SECTOR_HINT_MS } from '../../gameplay/battlefield/battlefieldAttentionPing';
import { t } from '../../i18n';
import {
  minimapPingSectorTipAlpha,
  minimapPingSectorTipText,
} from './minimapPingSectorTip';

describe('minimapPingSectorTip', () => {
  it('labels the pinged sector for the chip', () => {
    expect(minimapPingSectorTipText('NW')).toBe(
      t('hud.pingSector', { sector: 'NW' }),
    );
    expect(minimapPingSectorTipText('SE')).toContain('SE');
  });

  it('fades with remaining hint life', () => {
    expect(
      minimapPingSectorTipAlpha(ATTENTION_PING_SECTOR_HINT_MS),
    ).toBeGreaterThan(minimapPingSectorTipAlpha(100));
    expect(minimapPingSectorTipAlpha(0)).toBe(0);
  });
});
