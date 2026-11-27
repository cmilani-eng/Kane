import { describe, expect, it } from 'vitest';
import { correctAnswerText, markResponse, stripUnits } from './marking';
import { rat } from './rational';
import type { ChoiceItem, NumberItem, SpellItem, TapWordItem } from './satsTypes';

const base = { id: 't', key: 't', level: 3 as const, code: '6F4', marks: 1, prompt: 'x', explain: ['y'] };
const fracItem: NumberItem = { ...base, realm: 'arithmetic', kind: 'number', answer: rat(13, 12), display: '1 1/12' };
const moneyItem: NumberItem = {
  ...base,
  realm: 'reasoning',
  kind: 'number',
  answer: rat(305, 100),
  display: '£3.05',
  unitBefore: '£',
};
const cmItem: NumberItem = { ...base, realm: 'reasoning', kind: 'number', answer: rat(240), display: '240', unitAfter: 'cm' };
const longMul: NumberItem = { ...base, realm: 'arithmetic', kind: 'number', marks: 2, answer: rat(9022), display: '9,022' };
const choice: ChoiceItem = { ...base, realm: 'grammar', kind: 'choice', options: ['a', 'b', 'c', 'd'], answer: 2 };
const tap: TapWordItem = { ...base, realm: 'grammar', kind: 'tapWord', tokens: ['The', 'cat', 'sat.'], answer: 1 };
const spell: SpellItem = {
  ...base,
  realm: 'spelling',
  kind: 'spell',
  word: 'receive',
  sentence: 'You will receive a medal.',
  gapped: 'You will ________ a medal.',
  options: ['receive', 'recieve', 'receeve', 'resieve'],
};

describe('markResponse', () => {
  it('accepts any equivalent form of a fraction answer', () => {
    for (const text of ['1 1/12', '13/12', '26/24']) {
      expect(markResponse(fracItem, { kind: 'number', text })).toEqual({ status: 'marked', correct: true, marks: 1 });
    }
    expect(markResponse(fracItem, { kind: 'number', text: '1 1/6' })).toEqual({ status: 'marked', correct: false, marks: 0 });
  });

  it('awards both marks for a correct long multiplication', () => {
    expect(markResponse(longMul, { kind: 'number', text: '9022' })).toEqual({ status: 'marked', correct: true, marks: 2 });
    expect(markResponse(longMul, { kind: 'number', text: '9,022' })).toEqual({ status: 'marked', correct: true, marks: 2 });
  });

  it('reads money with or without the pound sign and trailing zero', () => {
    for (const text of ['3.05', '£3.05', '£ 3.05']) expect(markResponse(moneyItem, { kind: 'number', text })).toMatchObject({ correct: true });
    expect(markResponse(moneyItem, { kind: 'number', text: '3.5' })).toMatchObject({ correct: false });
  });

  it('ignores a unit typed after the number', () => {
    expect(markResponse(cmItem, { kind: 'number', text: '240cm' })).toMatchObject({ correct: true });
    expect(markResponse(cmItem, { kind: 'number', text: '240 cm' })).toMatchObject({ correct: true });
    expect(stripUnits('42 m²')).toBe('42');
  });

  it('asks again instead of marking unreadable input wrong', () => {
    for (const text of ['', 'abc', '0,5', '1/0']) {
      expect(markResponse(fracItem, { kind: 'number', text })).toEqual({ status: 'unreadable' });
    }
    expect(markResponse(fracItem, { kind: 'choice', index: 0 })).toEqual({ status: 'unreadable' });
  });

  it('marks choice and tap answers by index and rejects out-of-range picks', () => {
    expect(markResponse(choice, { kind: 'choice', index: 2 })).toMatchObject({ correct: true });
    expect(markResponse(choice, { kind: 'choice', index: 0 })).toMatchObject({ correct: false });
    expect(markResponse(choice, { kind: 'choice', index: 9 })).toEqual({ status: 'unreadable' });
    expect(markResponse(tap, { kind: 'tapWord', index: 1 })).toMatchObject({ correct: true });
    expect(markResponse(tap, { kind: 'tapWord', index: -1 })).toEqual({ status: 'unreadable' });
  });

  it('marks spelling exactly, ignoring case and spaces at the ends', () => {
    expect(markResponse(spell, { kind: 'spell', text: ' Receive ' })).toMatchObject({ correct: true });
    expect(markResponse(spell, { kind: 'spell', text: 'recieve' })).toMatchObject({ correct: false });
    expect(markResponse(spell, { kind: 'spell', text: '   ' })).toEqual({ status: 'unreadable' });
  });
});

describe('correctAnswerText', () => {
  it('shows the answer the way a mark scheme would', () => {
    expect(correctAnswerText(fracItem)).toBe('1 1/12');
    expect(correctAnswerText(moneyItem)).toBe('£3.05');
    expect(correctAnswerText(choice)).toBe('c');
    expect(correctAnswerText(tap)).toBe('cat');
    expect(correctAnswerText(spell)).toBe('receive');
  });
});
