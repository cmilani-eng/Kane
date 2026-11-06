import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { trainRemainSec } from './selectionPanel';

describe('trainRemainSec', () => {
  it('ceils remaining ms to whole seconds', () => {
    expect(trainRemainSec(5000, 0)).toBe(5);
    expect(trainRemainSec(5000, 1001)).toBe(4);
    expect(trainRemainSec(5000, 4999)).toBe(1);
    expect(trainRemainSec(5000, 5000)).toBe(0);
  });

  it('clamps empty or finished trains to zero', () => {
    expect(trainRemainSec(0, 0)).toBe(0);
    expect(trainRemainSec(3000, 4000)).toBe(0);
  });
});

describe('sel.training ETA copy', () => {
  it('includes remaining seconds beside percent', () => {
    const line = t('sel.training', {
      name: 'Grunt',
      pct: 40,
      sec: 3,
      hint: '',
    });
    expect(line).toContain('40%');
    expect(line).toContain('3s');
  });
});
