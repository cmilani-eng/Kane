/**
 * Exact fractions for SATs Quest marking. Every maths answer key is a Rational computed in
 * code, and a child's typed answer is parsed into one, so 3/4, 6/8 and 0.75 all compare equal
 * without floating-point error. Numbers stay well inside safe integers for KS2 sizes.
 *
 * Called by: mathsItems.ts, marking.ts. Tested by: rational.test.ts
 */

/** A fraction in lowest terms with a positive denominator. */
export interface Rational {
  readonly n: number;
  readonly d: number;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

export function rat(n: number, d = 1): Rational {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) {
    throw new Error(`bad fraction ${n}/${d}`);
  }
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  // `+ 0` turns -0 into 0 so equal values are also deeply equal.
  return { n: (sign * n) / g + 0, d: Math.abs(d) / g };
}

export const add = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational): Rational => rat(a.n * b.d, a.d * b.n);
export const eq = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d;
export const isInteger = (a: Rational): boolean => a.d === 1;

/** True when the denominator has no prime factors other than 2 and 5 (a terminating decimal). */
export function isTerminating(a: Rational): boolean {
  let d = a.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

/** 1234567 → "1,234,567", the way STA papers print whole numbers. */
export function formatInt(value: number): string {
  const sign = value < 0 ? '-' : '';
  return sign + Math.abs(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Exact decimal string for a terminating value, e.g. 9/4 → "2.25", 12345/10 → "1,234.5". */
export function formatDecimal(a: Rational): string {
  if (!isTerminating(a)) throw new Error('not a terminating decimal');
  let places = 0;
  let scale = 1;
  while ((a.n * scale) % a.d !== 0) {
    places++;
    scale *= 10;
  }
  const scaled = Math.abs((a.n * scale) / a.d);
  const whole = Math.floor(scaled / scale);
  const frac = places ? '.' + String(scaled % scale).padStart(places, '0') : '';
  return (a.n < 0 ? '-' : '') + formatInt(whole) + frac;
}

/** "a/b" for a proper fraction, "w a/b" for a mixed number, plain integer when whole. */
export function formatFraction(a: Rational, mixed = true): string {
  if (a.d === 1) return formatInt(a.n);
  const sign = a.n < 0 ? '-' : '';
  const n = Math.abs(a.n);
  if (!mixed || n < a.d) return `${sign}${n}/${a.d}`;
  return `${sign}${Math.floor(n / a.d)} ${n % a.d}/${a.d}`;
}

const MAX_INPUT = 16;

/**
 * Parse what a child typed: whole numbers (with or without thousands commas), decimals,
 * fractions and mixed numbers ("1 1/2"). Returns null for anything else, so the game can
 * ask again instead of marking a typo wrong.
 */
export function parseAnswer(raw: string): Rational | null {
  const text = raw
    .trim()
    .replace(/[−–]/g, '-')
    .replace(/\s+/g, ' ');
  if (!text || text.length > MAX_INPUT) return null;

  const mixed = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(text);
  if (mixed) {
    const [, sign, w, n, d] = mixed;
    if (Number(d) === 0) return null;
    const value = add(rat(Number(w)), rat(Number(n), Number(d)));
    return sign ? rat(-value.n, value.d) : value;
  }

  const frac = /^(-?)(\d+)\/(\d+)$/.exec(text);
  if (frac) {
    const [, sign, n, d] = frac;
    if (Number(d) === 0) return null;
    return rat((sign ? -1 : 1) * Number(n), Number(d));
  }

  // Thousands commas are only accepted in the proper 3-digit groups, so "0,5" is rejected.
  const grouped = /^-?\d{1,3}(,\d{3})+(\.\d*)?$/.test(text);
  const plain = grouped ? text.replace(/,/g, '') : text;
  const dec = /^(-?)(\d*)(?:\.(\d*))?$/.exec(plain);
  if (!dec) return null;
  const [, sign, whole = '', fracDigits = ''] = dec;
  if (!whole && !fracDigits) return null;
  const n = Number((whole || '0') + fracDigits);
  const d = 10 ** fracDigits.length;
  return rat((sign ? -1 : 1) * n, d);
}
