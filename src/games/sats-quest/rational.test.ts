import { describe, expect, it } from 'vitest';
import {
  add,
  div,
  eq,
  formatDecimal,
  formatFraction,
  formatInt,
  isTerminating,
  mul,
  parseAnswer,
  rat,
  sub,
} from './rational';

describe('rational arithmetic', () => {
  it('keeps fractions in lowest terms with a positive denominator', () => {
    expect(rat(6, 8)).toEqual({ n: 3, d: 4 });
    expect(rat(3, -6)).toEqual({ n: -1, d: 2 });
    expect(rat(0, 5)).toEqual({ n: 0, d: 1 });
    expect(() => rat(1, 0)).toThrow();
    expect(() => rat(1.5, 2)).toThrow();
  });

  it('adds, subtracts, multiplies and divides exactly', () => {
    expect(add(rat(3, 4), rat(1, 6))).toEqual(rat(11, 12));
    expect(sub(rat(9, 4), rat(5, 3))).toEqual(rat(7, 12));
    expect(mul(rat(2, 3), rat(3, 5))).toEqual(rat(2, 5));
    expect(div(rat(3, 4), rat(3))).toEqual(rat(1, 4));
  });

  it('knows which fractions are terminating decimals', () => {
    expect(isTerminating(rat(3, 8))).toBe(true);
    expect(isTerminating(rat(7, 20))).toBe(true);
    expect(isTerminating(rat(1, 3))).toBe(false);
  });
});

describe('formatting', () => {
  it('prints whole numbers with thousands commas', () => {
    expect(formatInt(9022)).toBe('9,022');
    expect(formatInt(1234567)).toBe('1,234,567');
    expect(formatInt(-8)).toBe('-8');
    expect(formatInt(512)).toBe('512');
  });

  it('prints exact decimals', () => {
    expect(formatDecimal(rat(9, 4))).toBe('2.25');
    expect(formatDecimal(rat(12345, 10))).toBe('1,234.5');
    expect(formatDecimal(rat(7, 100))).toBe('0.07');
    expect(formatDecimal(rat(-3, 2))).toBe('-1.5');
    expect(() => formatDecimal(rat(1, 3))).toThrow();
  });

  it('prints fractions and mixed numbers', () => {
    expect(formatFraction(rat(3, 4))).toBe('3/4');
    expect(formatFraction(rat(13, 12))).toBe('1 1/12');
    expect(formatFraction(rat(13, 12), false)).toBe('13/12');
    expect(formatFraction(rat(-7, 4))).toBe('-1 3/4');
    expect(formatFraction(rat(4, 2))).toBe('2');
  });
});

describe('parseAnswer', () => {
  it.each([
    ['9022', rat(9022)],
    ['9,022', rat(9022)],
    ['1,234,567', rat(1234567)],
    [' 42 ', rat(42)],
    ['-8', rat(-8)],
    ['−8', rat(-8)],
    ['2.25', rat(9, 4)],
    ['2.250', rat(9, 4)],
    ['.5', rat(1, 2)],
    ['5.', rat(5)],
    ['3/4', rat(3, 4)],
    ['6/8', rat(3, 4)],
    ['1 1/12', rat(13, 12)],
    ['1  1/12', rat(13, 12)],
    ['-1 3/4', rat(-7, 4)],
  ])('reads %j', (text, value) => {
    const parsed = parseAnswer(text);
    expect(parsed).not.toBeNull();
    expect(eq(parsed!, value)).toBe(true);
  });

  it.each(['', '   ', 'abc', '1/0', '0,5', '12,34', '1.2.3', '3/', '/4', '--3', '1 1/0', '12345678901234567'])(
    'rejects %j',
    (text) => {
      expect(parseAnswer(text)).toBeNull();
    },
  );

  it('treats equivalent forms as equal', () => {
    expect(eq(parseAnswer('0.75')!, parseAnswer('3/4')!)).toBe(true);
    expect(eq(parseAnswer('1 1/2')!, parseAnswer('3/2')!)).toBe(true);
    expect(eq(parseAnswer('1.5')!, parseAnswer('6/4')!)).toBe(true);
  });
});
