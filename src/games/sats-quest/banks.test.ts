import { describe, expect, it } from 'vitest';
import { buildGpsItem, GPS_BANK } from './gpsBank';
import { difficultyOf, drawItem, drawItems, readingEntryForLevel, readingItems } from './itemBank';
import { READING_BANK } from './readingBank';
import { createRng } from './satsRandom';
import { buildSpellItem, gapSentence, misspellings, SPELLING_BANK } from './spellingBank';
import { LEVELS } from './satsTypes';

const GPS_CODE = /^G([1-7])\.\d{1,2}[a-d]?$/;

describe('grammar and punctuation bank', () => {
  it('has unique ids and STA Paper 1 content codes', () => {
    const ids = GPS_BANK.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of GPS_BANK) expect(e.code, e.id).toMatch(GPS_CODE);
  });

  it('has questions at every level', () => {
    for (const level of LEVELS) expect(GPS_BANK.filter((e) => e.level === level).length).toBeGreaterThanOrEqual(8);
  });

  it('tap questions have exactly one matching word', () => {
    for (const e of GPS_BANK) {
      if (e.kind !== 'tapWord') continue;
      const tokens = e.sentence.split(' ');
      expect(tokens.filter((t) => t === e.target), e.id).toHaveLength(1);
    }
  });

  it('choice questions have four distinct options', () => {
    for (const e of GPS_BANK) {
      if (e.kind !== 'choice') continue;
      expect(e.options, e.id).toHaveLength(4);
      expect(new Set(e.options).size, e.id).toBe(4);
    }
  });

  it('keeps the right answer after shuffling', () => {
    for (const e of GPS_BANK) {
      for (const seed of [1, 2, 3, 4, 5]) {
        const item = buildGpsItem(e, createRng(seed));
        if (item.kind === 'choice' && e.kind === 'choice') expect(item.options[item.answer]).toBe(e.options[0]);
        if (item.kind === 'tapWord' && e.kind === 'tapWord') expect(item.tokens[item.answer]).toBe(e.target);
      }
    }
  });

  it('does not always put the answer in the same place', () => {
    const rng = createRng(9);
    const positions = new Set(
      GPS_BANK.filter((e) => e.kind === 'choice').map((e) => {
        const item = buildGpsItem(e, rng);
        return item.kind === 'choice' ? item.answer : -1;
      }),
    );
    expect(positions.size).toBeGreaterThan(2);
  });
});

describe('spelling bank', () => {
  it('uses STA Paper 2 spelling codes and unique words', () => {
    const words = SPELLING_BANK.map((e) => e.word);
    expect(new Set(words).size).toBe(words.length);
    for (const e of SPELLING_BANK) {
      expect(e.code, e.word).toMatch(/^S(3[7-9]|[45]\d|6[01])$/);
      expect(e.word).toMatch(/^[a-z]+$/);
    }
    for (const level of LEVELS) expect(SPELLING_BANK.filter((e) => e.level === level).length).toBeGreaterThanOrEqual(8);
  });

  it('puts each word in its sentence exactly once and gaps it out', () => {
    for (const e of SPELLING_BANK) {
      const matches = e.sentence.match(new RegExp(`\\b${e.word}\\b`, 'gi')) ?? [];
      expect(matches, e.word).toHaveLength(1);
      const gapped = gapSentence(e);
      expect(gapped).toContain('________');
      expect(gapped.toLowerCase()).not.toMatch(new RegExp(`\\b${e.word}\\b`));
    }
  });

  it('makes three distinct misspellings for every word', () => {
    for (const e of SPELLING_BANK) {
      const wrong = misspellings(e);
      expect(wrong, e.word).toHaveLength(3);
      expect(new Set(wrong).size).toBe(3);
      expect(wrong).not.toContain(e.word);
    }
  });

  it('uses the real-word confusion for homophones', () => {
    expect(misspellings(SPELLING_BANK.find((e) => e.word === 'stationery')!)).toContain('stationary');
    expect(misspellings(SPELLING_BANK.find((e) => e.word === 'principal')!)).toContain('principle');
  });

  it('builds items with the word among four options', () => {
    const item = buildSpellItem(SPELLING_BANK[0]!, createRng(3));
    expect(item.options).toHaveLength(4);
    expect(item.options).toContain(item.word);
  });
});

describe('reading bank', () => {
  it('has a passage at every level with reading content codes', () => {
    for (const level of LEVELS) expect(READING_BANK.some((e) => e.passage.level === level)).toBe(true);
    for (const e of READING_BANK) {
      expect(e.questions.length).toBeGreaterThanOrEqual(4);
      for (const q of e.questions) {
        expect(q.code).toMatch(/^2[a-h]$/);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
      }
    }
  });

  it('keeps the answer after shuffling and links questions to the passage', () => {
    for (const e of READING_BANK) {
      const items = readingItems(e, createRng(5));
      items.forEach((item, i) => {
        expect(item.kind).toBe('choice');
        if (item.kind !== 'choice') return;
        expect(item.options[item.answer]).toBe(e.questions[i]!.options[0]);
        expect(item.passageId).toBe(e.passage.id);
      });
    }
  });

  it('leans on retrieval and inference, as the real test does', () => {
    const codes = READING_BANK.flatMap((e) => e.questions.map((q) => q.code));
    const share = codes.filter((c) => c === '2b' || c === '2d').length / codes.length;
    expect(share).toBeGreaterThanOrEqual(0.4);
  });

  it('finds a passage for every level', () => {
    for (const level of LEVELS) expect(readingEntryForLevel(level, createRng(1)).passage.level).toBe(level);
  });
});

describe('drawing items', () => {
  it('never repeats a template inside one raid while fresh ones exist', () => {
    for (const realm of ['arithmetic', 'reasoning', 'grammar', 'spelling'] as const) {
      const items = drawItems(realm, [1, 1, 2, 2, 3, 3], createRng(11));
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    }
  });

  it('stays close to the requested level', () => {
    for (const level of LEVELS) {
      const item = drawItem({ realm: 'grammar', level, rng: createRng(level) });
      expect(Math.abs(item.level - level)).toBeLessThanOrEqual(1);
    }
  });

  it('leans toward weak-spot codes when asked', () => {
    let hits = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const item = drawItem({ realm: 'arithmetic', level: 3, rng: createRng(seed), preferCodes: ['6R2'] });
      if (item.code === '6R2') hits++;
    }
    expect(hits).toBeGreaterThan(25);
  });

  it('gives level 3 a difficulty of zero', () => {
    const item = drawItem({ realm: 'arithmetic', level: 3, rng: createRng(4) });
    expect(difficultyOf(item)).toBe(0);
  });
});
