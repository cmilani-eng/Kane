/**
 * SATs Quest maths items. Every question is a template filled with random numbers, and its
 * answer and worked steps are computed here, so no answer key ever comes from an LLM.
 * Templates are tagged with the STA KS2 mathematics test framework (2016, still current)
 * content domain references, and with a level 1–5 used by placement and progression.
 *
 * Arithmetic mirrors Paper 1 (context-free calculations; long multiplication and long division
 * are worth 2 marks). Reasoning mirrors Papers 2 and 3 with storybook contexts.
 * No question is copied from a past STA paper.
 *
 * Called by: itemBank.ts. Tested by: mathsItems.test.ts
 */
import {
  add,
  div,
  formatDecimal,
  formatFraction,
  formatInt,
  gcd,
  isInteger,
  lcm,
  mul,
  rat,
  sub,
  type Rational,
} from './rational';
import { int, pick, type Rng } from './satsRandom';
import type { Level, NumberItem } from './satsTypes';

interface Draft {
  prompt: string;
  answer: Rational;
  display?: string;
  explain: string[];
  marks?: number;
  unitBefore?: string;
  unitAfter?: string;
  /** The random numbers, so each instance has a stable key. */
  params: readonly number[];
}

export interface MathsTemplate {
  readonly id: string;
  readonly realm: 'arithmetic' | 'reasoning';
  readonly level: Level;
  readonly code: string;
  readonly make: (rng: Rng) => Draft;
}

const n = formatInt;
const MINUS = '−';
/** Shown text uses the real minus sign; typed answers accept either. */
const signed = (text: string): string => text.replace(/^-/, MINUS);
const dec = (r: Rational): string => signed(formatDecimal(r));
const frac = (r: Rational): string => signed(formatFraction(r));
const money = (pence: number): string => (pence / 100).toFixed(2);

function display(answer: Rational): string {
  if (isInteger(answer)) return signed(n(answer.n));
  return frac(answer);
}

/** "6/8 = 3/4" when the fraction simplifies, otherwise nothing. */
function simplifyStep(num: number, den: number): string[] {
  const g = gcd(num, den);
  if (g === 1) return [];
  const simple = rat(num, den);
  return [`Simplify: ${num}/${den} = ${frac(simple)}`];
}

function improperToMixedStep(value: Rational): string[] {
  return Math.abs(value.n) > value.d && value.d !== 1
    ? [`${Math.abs(value.n)}/${value.d} as a mixed number is ${frac(value)}`]
    : [];
}

const NAMES = ['Robin', 'Alex', 'Sam', 'Kit', 'Rowan', 'Sky', 'Jordan', 'Ash', 'Remy', 'Ari'] as const;

export function ordinal(k: number): string {
  const teen = k % 100 >= 11 && k % 100 <= 13;
  const suffix = teen ? 'th' : (['th', 'st', 'nd', 'rd'][k % 10] ?? 'th');
  return `${k}${suffix}`;
}

function clock(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** A whole number from lo..hi whose last digit is not zero (so long multiplication has two rows). */
function noZeroOnes(rng: Rng, lo: number, hi: number): number {
  let v = int(rng, lo, hi);
  while (v % 10 === 0) v = int(rng, lo, hi);
  return v;
}

function longMulSteps(a: number, b: number): string[] {
  const ones = b % 10;
  const tens = b - ones;
  return [
    `Long multiplication: split ${b} into ${tens} and ${ones}.`,
    `${n(a)} × ${ones} = ${n(a * ones)}`,
    `${n(a)} × ${tens} = ${n(a * tens)}`,
    `Add the two rows: ${n(a * ones)} + ${n(a * tens)} = ${n(a * b)}`,
  ];
}

function longDivSteps(dividend: number, d: number, q: number): string[] {
  const steps = [`Long division: write out multiples of ${d} to help.`];
  const tens = Math.floor(q / 10) * 10;
  if (tens >= 10) steps.push(`${d} × ${tens} = ${n(d * tens)}, which leaves ${n(dividend - d * tens)}.`);
  const rest = q - tens;
  if (rest) steps.push(`${d} × ${rest} = ${n(d * rest)}, so ${n(dividend - d * tens)} ÷ ${d} = ${rest}.`);
  steps.push(`${n(dividend)} ÷ ${d} = ${n(q)}  (check: ${n(q)} × ${d} = ${n(dividend)})`);
  return steps;
}

const PERCENT_HINT: Record<number, string> = {
  5: 'Find 10% by dividing by 10, then halve it to get 5%.',
  10: '10% is one tenth, so divide by 10.',
  20: 'Find 10% by dividing by 10, then double it to get 20%.',
  25: '25% is one quarter, so divide by 4.',
  50: '50% is one half, so divide by 2.',
  75: '75% is three quarters: divide by 4, then multiply by 3.',
};

function percentParts(p: number): number[] {
  const parts: number[] = [];
  let left = p;
  for (const part of [50, 25, 10, 5]) {
    while (left >= part) {
      parts.push(part);
      left -= part;
    }
  }
  return parts;
}

// ------------------------------------------------------------------ arithmetic (Paper 1)

const ARITHMETIC: MathsTemplate[] = [
  // Level 1
  {
    id: 'ar.add',
    realm: 'arithmetic',
    level: 1,
    code: '4C2',
    make: (rng) => {
      const a = int(rng, 1200, 7999);
      const b = int(rng, 150, 1999);
      return {
        prompt: `${n(a)} + ${n(b)} =`,
        answer: rat(a + b),
        explain: [
          'Write the numbers in columns: thousands, hundreds, tens and ones.',
          'Add each column from the right. If a column makes ten or more, carry the ten into the next column.',
          `${n(a)} + ${n(b)} = ${n(a + b)}`,
        ],
        params: [a, b],
      };
    },
  },
  {
    id: 'ar.sub',
    realm: 'arithmetic',
    level: 1,
    code: '4C2',
    make: (rng) => {
      const a = int(rng, 3000, 9999);
      const b = int(rng, 1000, a - 500);
      return {
        prompt: `${n(a)} ${MINUS} ${n(b)} =`,
        answer: rat(a - b),
        explain: [
          'Write the bigger number on top and line up the columns.',
          'Subtract each column from the right. If the top digit is smaller, exchange 1 from the column to its left.',
          `${n(a)} ${MINUS} ${n(b)} = ${n(a - b)}`,
        ],
        params: [a, b],
      };
    },
  },
  {
    id: 'ar.times',
    realm: 'arithmetic',
    level: 1,
    code: '4C6a',
    make: (rng) => {
      const a = int(rng, 6, 12);
      const b = int(rng, 6, 12);
      return {
        prompt: `${a} × ${b} =`,
        answer: rat(a * b),
        explain: [`Use your times tables: ${a} groups of ${b}.`, `${a} × ${b} = ${a * b}`],
        params: [a, b],
      };
    },
  },
  {
    id: 'ar.x10',
    realm: 'arithmetic',
    level: 1,
    code: '5C6b',
    make: (rng) => {
      const v = int(rng, 14, 950);
      const f = pick(rng, [10, 100, 1000]);
      const places = Math.log10(f);
      return {
        prompt: `${n(v)} × ${n(f)} =`,
        answer: rat(v * f),
        explain: [
          `Multiplying by ${n(f)} moves every digit ${places} place${places > 1 ? 's' : ''} to the left.`,
          `${n(v)} × ${n(f)} = ${n(v * f)}`,
        ],
        params: [v, f],
      };
    },
  },
  // Level 2
  {
    id: 'ar.shortMul',
    realm: 'arithmetic',
    level: 2,
    code: '5C7a',
    make: (rng) => {
      const a = int(rng, 215, 2899);
      const b = int(rng, 3, 9);
      return {
        prompt: `${n(a)} × ${b} =`,
        answer: rat(a * b),
        explain: [
          `Short multiplication: multiply each digit of ${n(a)} by ${b}, starting with the ones.`,
          'Carry any tens into the next column and add them on.',
          `${n(a)} × ${b} = ${n(a * b)}`,
        ],
        params: [a, b],
      };
    },
  },
  {
    id: 'ar.shortDiv',
    realm: 'arithmetic',
    level: 2,
    code: '5C7b',
    make: (rng) => {
      const d = int(rng, 3, 9);
      const q = int(rng, 112, 999);
      return {
        prompt: `${n(q * d)} ÷ ${d} =`,
        answer: rat(q),
        explain: [
          `Short division: divide each digit by ${d}, starting from the left.`,
          'Carry any remainder across to the next digit.',
          `${n(q * d)} ÷ ${d} = ${n(q)}  (check: ${n(q)} × ${d} = ${n(q * d)})`,
        ],
        params: [d, q],
      };
    },
  },
  {
    id: 'ar.decAdd',
    realm: 'arithmetic',
    level: 2,
    code: '5F10',
    make: (rng) => {
      const x = rat(int(rng, 105, 2995), 100);
      const y = rat(int(rng, 12, 989), 10);
      const sum = add(x, y);
      return {
        prompt: `${dec(x)} + ${dec(y)} =`,
        answer: sum,
        display: dec(sum),
        explain: [
          'Line up the decimal points, one under the other.',
          'Fill any empty places with zeros, then add each column from the right.',
          `${dec(x)} + ${dec(y)} = ${dec(sum)}`,
        ],
        params: [x.n, x.d, y.n, y.d],
      };
    },
  },
  {
    id: 'ar.decSub',
    realm: 'arithmetic',
    level: 2,
    code: '5F10',
    make: (rng) => {
      const xh = int(rng, 500, 9999);
      const x = rat(xh, 100);
      const y = rat(int(rng, 11, Math.floor(xh / 10) - 1), 10);
      const diff = sub(x, y);
      return {
        prompt: `${dec(x)} ${MINUS} ${dec(y)} =`,
        answer: diff,
        display: dec(diff),
        explain: [
          'Line up the decimal points, one under the other.',
          'Fill any empty places with zeros, then subtract each column from the right, exchanging where you need to.',
          `${dec(x)} ${MINUS} ${dec(y)} = ${dec(diff)}`,
        ],
        params: [x.n, x.d, y.n, y.d],
      };
    },
  },
  {
    id: 'ar.fracSame',
    realm: 'arithmetic',
    level: 2,
    code: '5F4',
    make: (rng) => {
      const d = pick(rng, [5, 7, 8, 9, 11, 12]);
      const a = int(rng, 1, d - 1);
      const b = int(rng, 1, d - 1);
      const sum = rat(a + b, d);
      return {
        prompt: `${a}/${d} + ${b}/${d} =`,
        answer: sum,
        display: frac(sum),
        explain: [
          'The denominators are the same, so add the numerators and keep the denominator.',
          `${a}/${d} + ${b}/${d} = ${a + b}/${d}`,
          ...simplifyStep(a + b, d),
          ...improperToMixedStep(sum),
        ],
        params: [a, b, d],
      };
    },
  },
  {
    id: 'ar.div10',
    realm: 'arithmetic',
    level: 2,
    code: '5C6b',
    make: (rng) => {
      const v = int(rng, 1234, 9876);
      const f = pick(rng, [10, 100]);
      const places = Math.log10(f);
      const q = rat(v, f);
      return {
        prompt: `${n(v)} ÷ ${f} =`,
        answer: q,
        display: dec(q),
        explain: [
          `Dividing by ${f} moves every digit ${places} place${places > 1 ? 's' : ''} to the right.`,
          `${n(v)} ÷ ${f} = ${dec(q)}`,
        ],
        params: [v, f],
      };
    },
  },
  {
    id: 'ar.negative',
    realm: 'arithmetic',
    level: 2,
    code: '6N5',
    make: (rng) => {
      const a = int(rng, 4, 30);
      const b = int(rng, a + 3, a + 40);
      return {
        prompt: `${a} ${MINUS} ${b} =`,
        answer: rat(a - b),
        explain: [
          `${b} is bigger than ${a}, so the answer is below zero.`,
          `Count back ${a} to reach 0, then ${b - a} more: ${a} ${MINUS} ${b} = ${MINUS}${b - a}`,
        ],
        params: [a, b],
      };
    },
  },
  // Level 3
  {
    id: 'ar.longMul3',
    realm: 'arithmetic',
    level: 3,
    code: '5C7a',
    make: (rng) => {
      const a = int(rng, 124, 989);
      const b = noZeroOnes(rng, 13, 89);
      return { prompt: `${a} × ${b} =`, answer: rat(a * b), marks: 2, explain: longMulSteps(a, b), params: [a, b] };
    },
  },
  {
    id: 'ar.longDiv3',
    realm: 'arithmetic',
    level: 3,
    code: '6C7b',
    make: (rng) => {
      const d = int(rng, 12, 29);
      const q = int(rng, 12, 34);
      return {
        prompt: `${n(d * q)} ÷ ${d} =`,
        answer: rat(q),
        marks: 2,
        explain: longDivSteps(d * q, d, q),
        params: [d, q],
      };
    },
  },
  {
    id: 'ar.percent',
    realm: 'arithmetic',
    level: 3,
    code: '6R2',
    make: (rng) => {
      const p = pick(rng, [5, 10, 20, 25, 50, 75]);
      const step = 100 / gcd(p, 100);
      const amount = step * int(rng, Math.ceil(40 / step), Math.floor(900 / step));
      const ans = (amount * p) / 100;
      return {
        prompt: `${p}% of ${n(amount)} =`,
        answer: rat(ans),
        explain: [PERCENT_HINT[p]!, `${p}% of ${n(amount)} = ${n(ans)}`],
        params: [p, amount],
      };
    },
  },
  {
    id: 'ar.fracOf',
    realm: 'arithmetic',
    level: 3,
    code: '4F10a',
    make: (rng) => {
      const den = pick(rng, [3, 4, 5, 6, 8, 10]);
      let num = int(rng, 2, den - 1);
      while (gcd(num, den) !== 1) num = int(rng, 2, den - 1);
      const total = den * int(rng, 3, 15);
      const unit = total / den;
      return {
        prompt: `${num}/${den} of ${n(total)} =`,
        answer: rat(unit * num),
        explain: [
          `Find 1/${den} first: ${n(total)} ÷ ${den} = ${n(unit)}`,
          `Then multiply by ${num}: ${n(unit)} × ${num} = ${n(unit * num)}`,
        ],
        params: [num, den, total],
      };
    },
  },
  {
    id: 'ar.powers',
    realm: 'arithmetic',
    level: 3,
    code: '5C5d',
    make: (rng) => {
      if (rng() < 0.6) {
        const b = int(rng, 4, 15);
        return {
          prompt: `${b}² =`,
          answer: rat(b * b),
          explain: [`${b}² means ${b} × ${b} (${b} squared).`, `${b} × ${b} = ${b * b}`],
          params: [b, 2],
        };
      }
      const b = int(rng, 2, 6);
      return {
        prompt: `${b}³ =`,
        answer: rat(b ** 3),
        explain: [`${b}³ means ${b} × ${b} × ${b} (${b} cubed).`, `${b} × ${b} = ${b * b}, then ${b * b} × ${b} = ${b ** 3}`],
        params: [b, 3],
      };
    },
  },
  {
    id: 'ar.fracRelated',
    realm: 'arithmetic',
    level: 3,
    code: '5F4',
    make: (rng) => {
      const d1 = pick(rng, [2, 3, 4, 5]);
      const m = pick(rng, [2, 3]);
      const d2 = d1 * m;
      const a = int(rng, 1, d1 - 1);
      const b = int(rng, 1, d2 - 1);
      const sum = add(rat(a, d1), rat(b, d2));
      return {
        prompt: `${a}/${d1} + ${b}/${d2} =`,
        answer: sum,
        display: frac(sum),
        explain: [
          `Make the denominators the same: ${a}/${d1} = ${a * m}/${d2}`,
          `${a * m}/${d2} + ${b}/${d2} = ${a * m + b}/${d2}`,
          ...simplifyStep(a * m + b, d2),
          ...improperToMixedStep(sum),
        ],
        params: [a, d1, b, d2],
      };
    },
  },
  // Level 4
  {
    id: 'ar.longMul4',
    realm: 'arithmetic',
    level: 4,
    code: '6C7a',
    make: (rng) => {
      const a = int(rng, 1023, 4987);
      const b = noZeroOnes(rng, 14, 79);
      return { prompt: `${n(a)} × ${b} =`, answer: rat(a * b), marks: 2, explain: longMulSteps(a, b), params: [a, b] };
    },
  },
  {
    id: 'ar.longDiv4',
    realm: 'arithmetic',
    level: 4,
    code: '6C7b',
    make: (rng) => {
      const d = int(rng, 13, 36);
      const q = int(rng, 105, Math.min(299, Math.floor(9999 / d)));
      return {
        prompt: `${n(d * q)} ÷ ${d} =`,
        answer: rat(q),
        marks: 2,
        explain: longDivSteps(d * q, d, q),
        params: [d, q],
      };
    },
  },
  {
    id: 'ar.order',
    realm: 'arithmetic',
    level: 4,
    code: '6C9',
    make: (rng) => {
      const form = int(rng, 0, 3);
      const rule = 'Order of operations: brackets first, then multiply and divide, then add and subtract.';
      if (form === 0) {
        const a = int(rng, 12, 90);
        const b = int(rng, 3, 12);
        const c = int(rng, 3, 12);
        return {
          prompt: `${a} + ${b} × ${c} =`,
          answer: rat(a + b * c),
          explain: [rule, `${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`],
          params: [form, a, b, c],
        };
      }
      if (form === 1) {
        const a = int(rng, 3, 12);
        const b = int(rng, 3, 12);
        const c = int(rng, 2, a * b - 1);
        return {
          prompt: `${a} × ${b} ${MINUS} ${c} =`,
          answer: rat(a * b - c),
          explain: [rule, `${a} × ${b} = ${a * b}`, `${a * b} ${MINUS} ${c} = ${a * b - c}`],
          params: [form, a, b, c],
        };
      }
      if (form === 2) {
        const a = int(rng, 4, 25);
        const b = int(rng, 3, 25);
        const c = int(rng, 3, 9);
        return {
          prompt: `(${a} + ${b}) × ${c} =`,
          answer: rat((a + b) * c),
          explain: [rule, `Brackets first: ${a} + ${b} = ${a + b}`, `${a + b} × ${c} = ${(a + b) * c}`],
          params: [form, a, b, c],
        };
      }
      const c = int(rng, 3, 9);
      const b = c * int(rng, 3, 12);
      const a = int(rng, b / c + 5, 150);
      return {
        prompt: `${a} ${MINUS} ${b} ÷ ${c} =`,
        answer: rat(a - b / c),
        explain: [rule, `${b} ÷ ${c} = ${b / c}`, `${a} ${MINUS} ${b / c} = ${a - b / c}`],
        params: [form, a, b, c],
      };
    },
  },
  {
    id: 'ar.fracUnlike',
    realm: 'arithmetic',
    level: 4,
    code: '6F4',
    make: (rng) => {
      const pairs = [
        [3, 4],
        [2, 5],
        [3, 5],
        [4, 5],
        [5, 6],
        [3, 8],
        [4, 6],
        [6, 8],
        [2, 7],
        [3, 7],
      ] as const;
      const [d1, d2] = pick(rng, pairs);
      const a = int(rng, 1, d1 - 1);
      const b = int(rng, 1, d2 - 1);
      const common = lcm(d1, d2);
      const subtract = rng() < 0.4 && a * d2 !== b * d1;
      const [hi, lo] = !subtract || a / d1 > b / d2 ? [[a, d1], [b, d2]] : [[b, d2], [a, d1]];
      const x = rat(hi[0]!, hi[1]!);
      const y = rat(lo[0]!, lo[1]!);
      const result = subtract ? sub(x, y) : add(x, y);
      const xn = (hi[0]! * common) / hi[1]!;
      const yn = (lo[0]! * common) / lo[1]!;
      const op = subtract ? MINUS : '+';
      const rawNum = subtract ? xn - yn : xn + yn;
      return {
        prompt: `${hi[0]}/${hi[1]} ${op} ${lo[0]}/${lo[1]} =`,
        answer: result,
        display: frac(result),
        explain: [
          `Find a common denominator: ${common} is a multiple of both ${hi[1]} and ${lo[1]}.`,
          `${hi[0]}/${hi[1]} = ${xn}/${common} and ${lo[0]}/${lo[1]} = ${yn}/${common}`,
          `${xn}/${common} ${op} ${yn}/${common} = ${rawNum}/${common}`,
          ...simplifyStep(rawNum, common),
          ...improperToMixedStep(result),
        ],
        params: [hi[0]!, hi[1]!, lo[0]!, lo[1]!, subtract ? 1 : 0],
      };
    },
  },
  {
    id: 'ar.decMul',
    realm: 'arithmetic',
    level: 4,
    code: '6F9b',
    make: (rng) => {
      const hundredths = int(rng, 101, 999);
      const x = rat(hundredths, 100);
      const k = int(rng, 3, 9);
      const product = mul(x, rat(k));
      return {
        prompt: `${dec(x)} × ${k} =`,
        answer: product,
        display: dec(product),
        explain: [
          `Ignore the decimal point first: ${hundredths} × ${k} = ${n(hundredths * k)}`,
          `${dec(x)} is ${hundredths} hundredths, so the answer is ${n(hundredths * k)} hundredths.`,
          `${dec(x)} × ${k} = ${dec(product)}`,
        ],
        params: [hundredths, k],
      };
    },
  },
  {
    id: 'ar.percentHard',
    realm: 'arithmetic',
    level: 4,
    code: '6R2',
    make: (rng) => {
      const p = pick(rng, [15, 30, 35, 45, 60, 65]);
      const amount = 20 * int(rng, 3, 32);
      const parts = percentParts(p);
      const values = parts.map((part) => (amount * part) / 100);
      const ans = (amount * p) / 100;
      return {
        prompt: `${p}% of ${n(amount)} =`,
        answer: rat(ans),
        explain: [
          `Split ${p}% into easy parts: ${parts.map((x) => `${x}%`).join(' + ')}.`,
          ...parts.map((part, i) => `${part}% of ${n(amount)} = ${n(values[i]!)}`),
          `Add them: ${values.map((v) => n(v)).join(' + ')} = ${n(ans)}`,
        ],
        params: [p, amount],
      };
    },
  },
  {
    id: 'ar.fracMul',
    realm: 'arithmetic',
    level: 4,
    code: '6F5a',
    make: (rng) => {
      const b = int(rng, 2, 9);
      const a = int(rng, 1, b - 1);
      const d = int(rng, 2, 9);
      const c = int(rng, 1, d - 1);
      const product = mul(rat(a, b), rat(c, d));
      return {
        prompt: `${a}/${b} × ${c}/${d} =`,
        answer: product,
        display: frac(product),
        explain: [
          'Multiply the numerators, then multiply the denominators.',
          `${a} × ${c} = ${a * c} and ${b} × ${d} = ${b * d}, so the answer is ${a * c}/${b * d}`,
          ...simplifyStep(a * c, b * d),
        ],
        params: [a, b, c, d],
      };
    },
  },
  {
    id: 'ar.mixedTimesWhole',
    realm: 'arithmetic',
    level: 4,
    code: '5F5',
    make: (rng) => {
      const w = int(rng, 1, 3);
      const b = int(rng, 2, 6);
      const a = int(rng, 1, b - 1);
      const k = int(rng, 2, 6);
      const improper = w * b + a;
      const product = mul(rat(improper, b), rat(k));
      return {
        prompt: `${w} ${a}/${b} × ${k} =`,
        answer: product,
        display: frac(product),
        explain: [
          `Change the mixed number to an improper fraction: ${w} ${a}/${b} = ${improper}/${b}`,
          `${improper}/${b} × ${k} = ${improper * k}/${b}`,
          ...simplifyStep(improper * k, b),
          ...improperToMixedStep(product),
        ],
        params: [w, a, b, k],
      };
    },
  },
  // Level 5
  {
    id: 'ar.mixedSub',
    realm: 'arithmetic',
    level: 5,
    code: '6F4',
    make: (rng) => {
      const pairs = [
        [4, 3],
        [3, 2],
        [5, 2],
        [6, 4],
        [8, 3],
        [5, 3],
      ] as const;
      const [b1, b2] = pick(rng, pairs);
      const w1 = int(rng, 3, 5);
      const a1 = int(rng, 1, b1 - 1);
      const w2 = int(rng, 1, 2);
      const a2 = int(rng, 1, b2 - 1);
      const x = add(rat(w1), rat(a1, b1));
      const y = add(rat(w2), rat(a2, b2));
      const result = sub(x, y);
      const common = lcm(b1, b2);
      const xn = (w1 * b1 + a1) * (common / b1);
      const yn = (w2 * b2 + a2) * (common / b2);
      return {
        prompt: `${w1} ${a1}/${b1} ${MINUS} ${w2} ${a2}/${b2} =`,
        answer: result,
        display: frac(result),
        explain: [
          `Change both to improper fractions: ${w1} ${a1}/${b1} = ${w1 * b1 + a1}/${b1} and ${w2} ${a2}/${b2} = ${w2 * b2 + a2}/${b2}`,
          `Use the common denominator ${common}: ${xn}/${common} ${MINUS} ${yn}/${common} = ${xn - yn}/${common}`,
          ...simplifyStep(xn - yn, common),
          ...improperToMixedStep(result),
        ],
        params: [w1, a1, b1, w2, a2, b2],
      };
    },
  },
  {
    id: 'ar.fracDivWhole',
    realm: 'arithmetic',
    level: 5,
    code: '6F5b',
    make: (rng) => {
      const b = int(rng, 2, 9);
      const a = int(rng, 1, b - 1);
      const k = int(rng, 2, 6);
      const q = div(rat(a, b), rat(k));
      return {
        prompt: `${a}/${b} ÷ ${k} =`,
        answer: q,
        display: frac(q),
        explain: [
          `Dividing by ${k} is the same as multiplying by 1/${k}.`,
          `${a}/${b} × 1/${k} = ${a}/${b * k}`,
          ...simplifyStep(a, b * k),
        ],
        params: [a, b, k],
      };
    },
  },
  {
    id: 'ar.decDiv',
    realm: 'arithmetic',
    level: 5,
    code: '6F9c',
    make: (rng) => {
      const k = int(rng, 3, 9);
      const qh = int(rng, 105, 999);
      const q = rat(qh, 100);
      const dividend = mul(q, rat(k));
      return {
        prompt: `${dec(dividend)} ÷ ${k} =`,
        answer: q,
        display: dec(q),
        explain: [
          'Use short division and keep the decimal point in the same place in the answer.',
          `${dec(dividend)} ÷ ${k} = ${dec(q)}`,
          `Check: ${dec(q)} × ${k} = ${dec(dividend)}`,
        ],
        params: [qh, k],
      };
    },
  },
  {
    id: 'ar.orderPow',
    realm: 'arithmetic',
    level: 5,
    code: '6C9',
    make: (rng) => {
      const a = int(rng, 5, 12);
      const b = int(rng, 2, 9);
      const c = int(rng, 2, Math.max(2, Math.floor((a * a - 1) / b)));
      const value = a * a - b * c;
      return {
        prompt: `${a}² ${MINUS} ${b} × ${c} =`,
        answer: rat(value),
        explain: [
          'Order of operations: powers (like ²) come before multiplying, and multiplying comes before subtracting.',
          `${a}² = ${a * a} and ${b} × ${c} = ${b * c}`,
          `${a * a} ${MINUS} ${b * c} = ${signed(n(value))}`,
        ],
        params: [a, b, c],
      };
    },
  },
];

// ------------------------------------------------------------------ reasoning (Papers 2 and 3)

const REASONING: MathsTemplate[] = [
  // Level 1
  {
    id: 'rs.coins',
    realm: 'reasoning',
    level: 1,
    code: '4C4',
    make: (rng) => {
      const a = int(rng, 120, 480);
      const b = int(rng, 40, 360);
      return {
        prompt: `A dragon has ${a} gold coins in its cave. It finds ${b} more. How many gold coins does it have now?`,
        answer: rat(a + b),
        explain: ['"More" means add.', `${a} + ${b} = ${a + b}`],
        params: [a, b],
      };
    },
  },
  {
    id: 'rs.change',
    realm: 'reasoning',
    level: 1,
    code: '5M9a',
    make: (rng) => {
      let p = int(rng, 105, 495);
      if (p % 100 === 0) p += 15;
      const name = pick(rng, NAMES);
      const change = 500 - p;
      return {
        prompt: `A healing potion costs £${money(p)}. ${name} pays with a £5 note. How much change is given?`,
        answer: rat(change, 100),
        display: `£${money(change)}`,
        unitBefore: '£',
        explain: [`£5 is 500p and £${money(p)} is ${p}p.`, `500p ${MINUS} ${p}p = ${change}p`, `${change}p = £${money(change)}`],
        params: [p, NAMES.indexOf(name)],
      };
    },
  },
  {
    id: 'rs.bags',
    realm: 'reasoning',
    level: 1,
    code: '5C8a',
    make: (rng) => {
      const k = int(rng, 4, 9);
      const bags = int(rng, 6, 15);
      return {
        prompt: `A wizard shares ${k * bags} crystals equally into bags of ${k}. How many bags are filled?`,
        answer: rat(bags),
        explain: ['Sharing into equal groups means divide.', `${k * bags} ÷ ${k} = ${bags}`],
        params: [k, bags],
      };
    },
  },
  // Level 2
  {
    id: 'rs.duration',
    realm: 'reasoning',
    level: 2,
    code: '6M9',
    make: (rng) => {
      const start = int(rng, 9, 14) * 60 + 5 * int(rng, 1, 11);
      const d = int(rng, 35, 95);
      const end = start + d;
      const nextHour = (Math.floor(start / 60) + 1) * 60;
      const explain =
        end > nextHour
          ? [
              `Count on from ${clock(start)} to ${clock(nextHour)}: ${nextHour - start} minutes.`,
              `Then from ${clock(nextHour)} to ${clock(end)}: ${end - nextHour} minutes.`,
              `${nextHour - start} + ${end - nextHour} = ${d} minutes`,
            ]
          : [`From ${clock(start)} to ${clock(end)} is ${d} minutes.`];
      return {
        prompt: `The castle gates open at ${clock(start)} and close at ${clock(end)}. For how many minutes are the gates open?`,
        answer: rat(d),
        unitAfter: 'minutes',
        explain,
        params: [start, d],
      };
    },
  },
  {
    id: 'rs.cakes',
    realm: 'reasoning',
    level: 2,
    code: '5C8b',
    make: (rng) => {
      const a = int(rng, 3, 9);
      const b = int(rng, 6, 12);
      const c = int(rng, 5, a * b - 5);
      return {
        prompt: `An elf baker makes ${a} trays of ${b} cakes. ${c} cakes are eaten at the feast. How many cakes are left?`,
        answer: rat(a * b - c),
        explain: [`First find how many cakes: ${a} × ${b} = ${a * b}`, `Then take away the eaten ones: ${a * b} ${MINUS} ${c} = ${a * b - c}`],
        params: [a, b, c],
      };
    },
  },
  {
    id: 'rs.convert',
    realm: 'reasoning',
    level: 2,
    code: '5M5',
    make: (rng) => {
      const tenths = int(rng, 12, 49);
      const x = rat(tenths, 10);
      return {
        prompt: `A giant's footprint is ${dec(x)} m long. How long is it in centimetres?`,
        answer: rat(tenths * 10),
        unitAfter: 'cm',
        explain: ['1 m = 100 cm, so multiply by 100.', `${dec(x)} × 100 = ${tenths * 10}`],
        params: [tenths],
      };
    },
  },
  // Level 3
  {
    id: 'rs.ratio',
    realm: 'reasoning',
    level: 3,
    code: '6R1',
    make: (rng) => {
      const a = int(rng, 2, 5);
      let b = int(rng, 3, 7);
      if (b === a) b += 1;
      const k = int(rng, 2, 6);
      return {
        prompt: `A potion needs ${a} spoons of moon dust for every ${b} spoons of berry juice. How many spoons of moon dust are needed for ${b * k} spoons of berry juice?`,
        answer: rat(a * k),
        explain: [`${b * k} ÷ ${b} = ${k}, so the recipe is made ${k} times bigger.`, `${a} × ${k} = ${a * k} spoons of moon dust`],
        params: [a, b, k],
      };
    },
  },
  {
    id: 'rs.perimeter',
    realm: 'reasoning',
    level: 3,
    code: '5M7a',
    make: (rng) => {
      const l = int(rng, 8, 25);
      const w = int(rng, 4, l - 1);
      return {
        prompt: `A rectangular dragon pen is ${l} m long and ${w} m wide. What is its perimeter?`,
        answer: rat(2 * (l + w)),
        unitAfter: 'm',
        explain: ['The perimeter is the distance all the way around.', `${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} m`],
        params: [l, w],
      };
    },
  },
  {
    id: 'rs.thinkNumber',
    realm: 'reasoning',
    level: 3,
    code: '6A1',
    make: (rng) => {
      const x = int(rng, 3, 15);
      const m = int(rng, 3, 9);
      const c = int(rng, 4, 20);
      const name = pick(rng, NAMES);
      return {
        prompt: `${name} thinks of a number, multiplies it by ${m} and then adds ${c}. The answer is ${m * x + c}. What number did ${name} think of?`,
        answer: rat(x),
        explain: [
          'Work backwards, doing the inverse operations.',
          `Take away ${c}: ${m * x + c} ${MINUS} ${c} = ${m * x}`,
          `Divide by ${m}: ${m * x} ÷ ${m} = ${x}`,
        ],
        params: [x, m, c, NAMES.indexOf(name)],
      };
    },
  },
  // Level 4
  {
    id: 'rs.sale',
    realm: 'reasoning',
    level: 4,
    code: '6R2',
    make: (rng) => {
      const price = pick(rng, [40, 60, 80, 120, 160, 200, 240]);
      const d = pick(rng, [10, 20, 25, 50]);
      const off = (price * d) / 100;
      return {
        prompt: `A wizard's cloak costs £${price}. In the sale, the price is reduced by ${d}%. What is the sale price?`,
        answer: rat(price - off),
        unitBefore: '£',
        display: `£${price - off}`,
        explain: [`${d}% of £${price} = £${off}`, `£${price} ${MINUS} £${off} = £${price - off}`],
        params: [price, d],
      };
    },
  },
  {
    id: 'rs.mean',
    realm: 'reasoning',
    level: 4,
    code: '6S3',
    make: (rng) => {
      const a = int(rng, 6, 20);
      const b = int(rng, 6, 20);
      const c = int(rng, 6, 20);
      let d = int(rng, 6, 20);
      while ((a + b + c + d) % 4 !== 0) d++;
      const sum = a + b + c + d;
      return {
        prompt: `Four goblins score ${a}, ${b}, ${c} and ${d} points in a game. What is the mean score?`,
        answer: rat(sum / 4),
        explain: [`Add the scores: ${a} + ${b} + ${c} + ${d} = ${sum}`, `Divide by how many scores there are: ${sum} ÷ 4 = ${sum / 4}`],
        params: [a, b, c, d],
      };
    },
  },
  {
    id: 'rs.triangle',
    realm: 'reasoning',
    level: 4,
    code: '6M7b',
    make: (rng) => {
      const b = 2 * int(rng, 3, 10);
      const h = int(rng, 4, 15);
      return {
        prompt: `A triangular flag has a base of ${b} cm and a perpendicular height of ${h} cm. What is its area?`,
        answer: rat((b * h) / 2),
        unitAfter: 'cm²',
        explain: ['Area of a triangle = ½ × base × height.', `½ × ${b} × ${h} = ${(b * h) / 2} cm²`],
        params: [b, h],
      };
    },
  },
  {
    id: 'rs.volume',
    realm: 'reasoning',
    level: 4,
    code: '6M8a',
    make: (rng) => {
      const l = int(rng, 3, 9);
      const w = int(rng, 2, 8);
      const h = int(rng, 2, 7);
      return {
        prompt: `A treasure chest is a cuboid ${l} cm long, ${w} cm wide and ${h} cm high. What is its volume?`,
        answer: rat(l * w * h),
        unitAfter: 'cm³',
        explain: ['Volume of a cuboid = length × width × height.', `${l} × ${w} × ${h} = ${l * w * h} cm³`],
        params: [l, w, h],
      };
    },
  },
  // Level 5
  {
    id: 'rs.share',
    realm: 'reasoning',
    level: 5,
    code: '6R4',
    make: (rng) => {
      const pairs = [
        [1, 2],
        [1, 3],
        [2, 3],
        [3, 4],
        [2, 5],
        [3, 5],
      ] as const;
      const [a, b] = pick(rng, pairs);
      const k = int(rng, 3, 12);
      const total = (a + b) * k;
      const first = pick(rng, NAMES);
      const second = pick(
        rng,
        NAMES.filter((x) => x !== first),
      );
      return {
        prompt: `${first} and ${second} share ${total} gems in the ratio ${a} : ${b}. How many gems does ${second} get?`,
        answer: rat(b * k),
        explain: [`There are ${a} + ${b} = ${a + b} parts.`, `One part is ${total} ÷ ${a + b} = ${k} gems.`, `${second} gets ${b} parts: ${b} × ${k} = ${b * k}`],
        params: [a, b, k, NAMES.indexOf(first), NAMES.indexOf(second)],
      };
    },
  },
  {
    id: 'rs.sequence',
    realm: 'reasoning',
    level: 5,
    code: '6A3',
    make: (rng) => {
      const s = int(rng, 3, 15);
      const d = int(rng, 3, 9);
      const k = int(rng, 8, 15);
      const term = s + (k - 1) * d;
      return {
        prompt: `A magic sequence starts ${s}, ${s + d}, ${s + 2 * d}, ${s + 3 * d}, … and goes up by the same amount each time. What is the ${ordinal(k)} number in the sequence?`,
        answer: rat(term),
        explain: [
          `The sequence goes up by ${d} each time.`,
          `To reach the ${ordinal(k)} number, add ${d} on ${k - 1} times: ${s} + ${k - 1} × ${d}`,
          `${s} + ${(k - 1) * d} = ${term}`,
        ],
        params: [s, d, k],
      };
    },
  },
  {
    id: 'rs.formula',
    realm: 'reasoning',
    level: 5,
    code: '6A2',
    make: (rng) => {
      const a = int(rng, 3, 9);
      const c = int(rng, 2, 12);
      const k = int(rng, 4, 15);
      return {
        prompt: `A spell needs (${a} × the number of stars) + ${c} drops of potion. How many drops are needed for ${k} stars?`,
        answer: rat(a * k + c),
        unitAfter: 'drops',
        explain: [`Put ${k} in place of the number of stars: ${a} × ${k} + ${c}`, `${a} × ${k} = ${a * k}, then ${a * k} + ${c} = ${a * k + c}`],
        params: [a, c, k],
      };
    },
  },
];

export const MATHS_TEMPLATES: readonly MathsTemplate[] = [...ARITHMETIC, ...REASONING];

export function mathsTemplates(realm: 'arithmetic' | 'reasoning', level?: Level): MathsTemplate[] {
  return MATHS_TEMPLATES.filter((t) => t.realm === realm && (level === undefined || t.level === level));
}

export function buildMathsItem(template: MathsTemplate, rng: Rng): NumberItem {
  const draft = template.make(rng);
  return {
    kind: 'number',
    id: template.id,
    key: `${template.id}:${draft.params.join(',')}`,
    realm: template.realm,
    level: template.level,
    code: template.code,
    marks: draft.marks ?? 1,
    prompt: draft.prompt,
    answer: draft.answer,
    display: draft.display ?? display(draft.answer),
    explain: draft.explain,
    ...(draft.unitBefore ? { unitBefore: draft.unitBefore } : {}),
    ...(draft.unitAfter ? { unitAfter: draft.unitAfter } : {}),
  };
}
