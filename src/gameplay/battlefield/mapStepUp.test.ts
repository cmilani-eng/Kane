import { describe, expect, it } from 'vitest';
import { nextMapAfterHardWin } from './mapStepUp';

describe('map step up', () => {
  it('walks the map order after a Hard win', () => {
    expect(nextMapAfterHardWin(true, 'hard', 'crossing')).toBe('ridge');
    expect(nextMapAfterHardWin(true, 'hard', 'ridge')).toBe('gap');
    expect(nextMapAfterHardWin(true, 'hard', 'gap')).toBe('crossing');
  });

  it('stays put on a loss or below Hard', () => {
    expect(nextMapAfterHardWin(false, 'hard', 'crossing')).toBeNull();
    expect(nextMapAfterHardWin(true, 'normal', 'crossing')).toBeNull();
    expect(nextMapAfterHardWin(true, 'easy', 'ridge')).toBeNull();
    expect(nextMapAfterHardWin(true, 'practice', 'gap')).toBeNull();
  });
});
