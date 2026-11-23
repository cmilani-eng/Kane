import { describe, expect, it } from 'vitest';
import { buildMathsItem, MATHS_TEMPLATES, mathsTemplates, ordinal } from './mathsItems';
import { add, div, eq, mul, parseAnswer, rat, sub, type Rational } from './rational';
import { createRng } from './satsRandom';
import { LEVELS } from './satsTypes';

/**
 * An evaluator written only for this test, so each arithmetic answer key is checked against
 * the printed question rather than against the template's own maths.
 */
function evaluatePrompt(prompt: string): Rational {
  let text = prompt.replace(/=\s*$/, '').replace(/−/g, '-');
  // Thousands commas, then mixed numbers like "2 1/4" → "(2 + 1/4)".
  while (/(\d),(\d{3})/.test(text)) text = text.replace(/(\d),(\d{3})/, '$1$2');
  text = text.replace(/(\d+) (\d+)\/(\d+)/g, '($1 + $2/$3)');
  const tokens = text.match(/\d+(?:\.\d+)?|of|[-+×÷/()²³%]/g) ?? [];
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  const number = (tok: string): Rational => {
    const [w, f = ''] = tok.split('.');
    return rat(Number(w + f), 10 ** f.length);
  };
  const postfix = (value: Rational): Rational => {
    let v = value;
    for (;;) {
      if (peek() === '²') v = mul(v, v);
      else if (peek() === '³') v = mul(mul(v, v), v);
      else if (peek() === '%') v = div(v, rat(100));
      else return v;
      next();
    }
  };
  const primary = (): Rational => {
    const tok = next();
    if (tok === '(') {
      const v = expr();
      expect(next()).toBe(')');
      return postfix(v);
    }
    if (tok === '-') return mul(rat(-1), primary());
    expect(tok).toMatch(/^\d/);
    return postfix(number(tok!));
  };
  const term = (): Rational => {
    let v = primary();
    while (['×', '÷', '/', 'of'].includes(peek() ?? '')) {
      const op = next();
      const rhs = primary();
      v = op === '÷' || op === '/' ? div(v, rhs) : mul(v, rhs);
    }
    return v;
  };
  function expr(): Rational {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const rhs = term();
      v = op === '+' ? add(v, rhs) : sub(v, rhs);
    }
    return v;
  }
  const value = expr();
  expect(pos).toBe(tokens.length);
  return value;
}

const SEEDS = Array.from({ length: 250 }, (_, i) => i * 7919 + 13);

describe('maths templates', () => {
  it('cover every level in both maths realms', () => {
    for (const realm of ['arithmetic', 'reasoning'] as const) {
      for (const level of LEVELS) expect(mathsTemplates(realm, level).length).toBeGreaterThan(0);
    }
  });

  it('have unique ids and real content domain references', () => {
    const ids = MATHS_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of MATHS_TEMPLATES) expect(t.code).toMatch(/^[3-6](N|C|F|R|A|M|G|P|S)\d{1,2}[a-d]?$/);
  });

  it.each(mathsTemplates('arithmetic').map((t) => [t.id, t] as const))(
    '%s: the answer key matches the printed calculation',
    (_id, template) => {
      for (const seed of SEEDS) {
        const item = buildMathsItem(template, createRng(seed));
        expect(eq(evaluatePrompt(item.prompt), item.answer), `${item.prompt} → ${item.display}`).toBe(true);
      }
    },
  );

  it.each(MATHS_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s: shows an answer a child could type, with sensible steps',
    (_id, template) => {
      for (const seed of SEEDS) {
        const item = buildMathsItem(template, createRng(seed));
        const typed = parseAnswer(item.display.replace(/^£/, ''));
        expect(typed, item.display).not.toBeNull();
        expect(eq(typed!, item.answer), `${item.prompt} shows ${item.display}`).toBe(true);
        expect(item.prompt).not.toMatch(/NaN|undefined|Infinity/);
        expect(item.explain.length).toBeGreaterThan(0);
        for (const step of item.explain) expect(step).not.toMatch(/NaN|undefined|Infinity/);
        expect(item.key.startsWith(`${template.id}:`)).toBe(true);
      }
    },
  );

  it('gives 2 marks only to long multiplication and long division, as on Paper 1', () => {
    for (const template of MATHS_TEMPLATES) {
      const item = buildMathsItem(template, createRng(1));
      const long = /^ar\.long(Mul|Div)/.test(template.id);
      expect(item.marks).toBe(long ? 2 : 1);
    }
  });

  it('keeps whole-number answers positive except for the negative-numbers template', () => {
    for (const template of MATHS_TEMPLATES) {
      for (const seed of SEEDS.slice(0, 60)) {
        const item = buildMathsItem(template, createRng(seed));
        if (template.id === 'ar.negative') expect(item.answer.n).toBeLessThan(0);
        else expect(item.answer.n).toBeGreaterThan(0);
      }
    }
  });

  it('long division always divides exactly and long multiplication has two rows', () => {
    for (const seed of SEEDS) {
      for (const id of ['ar.longDiv3', 'ar.longDiv4']) {
        const item = buildMathsItem(MATHS_TEMPLATES.find((t) => t.id === id)!, createRng(seed));
        expect(item.answer.d).toBe(1);
      }
      const mul4 = buildMathsItem(MATHS_TEMPLATES.find((t) => t.id === 'ar.longMul4')!, createRng(seed));
      const b = Number(mul4.prompt.split('×')[1]!.replace('=', '').trim());
      expect(b % 10).not.toBe(0);
      expect(b).toBeGreaterThanOrEqual(14);
    }
  });

  it('is repeatable from a seed', () => {
    const template = MATHS_TEMPLATES[0]!;
    expect(buildMathsItem(template, createRng(42))).toEqual(buildMathsItem(template, createRng(42)));
  });

  it('writes ordinals correctly', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(ordinal)).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '23rd',
      '101st',
      '111th',
    ]);
  });

  it('shows money answers to two decimal places', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const item = buildMathsItem(MATHS_TEMPLATES.find((t) => t.id === 'rs.change')!, createRng(seed));
      expect(item.display).toMatch(/^£\d\.\d{2}$/);
      expect(item.unitBefore).toBe('£');
    }
  });
});
