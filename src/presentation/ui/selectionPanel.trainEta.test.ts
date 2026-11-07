import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  trainFullSec,
  trainQueueTotalSec,
  trainRemainSec,
} from './selectionPanel';

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

describe('trainFullSec', () => {
  it('ceils full trainMs to whole seconds', () => {
    expect(trainFullSec(2500)).toBe(3);
    expect(trainFullSec(1000)).toBe(1);
    expect(trainFullSec(0)).toBe(0);
  });
});

describe('trainQueueTotalSec', () => {
  it('sums head remain with full durations of waiting slots', () => {
    // scavenger trainMs 2500 → 3s; bonker 2800 → 3s (brutes data)
    expect(trainQueueTotalSec(['scavenger', 'bonker', 'bonker'], 4)).toBe(
      4 + trainFullSec(2800) + trainFullSec(2800),
    );
  });

  it('equals remainSec when only the head is queued', () => {
    expect(trainQueueTotalSec(['scavenger'], 5)).toBe(5);
  });

  it('is zero for an empty queue', () => {
    expect(trainQueueTotalSec([], 0)).toBe(0);
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

  it('includes total queue seconds when units are waiting', () => {
    const line = t('sel.trainingWait', {
      name: 'Bonker',
      pct: 40,
      sec: 3,
      waiting: 2,
      total: 9,
      hint: '',
    });
    expect(line).toContain('2');
    expect(line).toContain('9s');
    expect(line).toContain('3s');
  });
});
