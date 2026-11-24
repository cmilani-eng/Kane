import { describe, expect, it } from 'vitest';
import type { RaidAnswer } from './raid';
import {
  allPlaced,
  applyDomainStats,
  applyMock,
  applyPlacement,
  applyRaid,
  isProgressShape,
  MAX_DOMAIN_CODES,
  newProgress,
  sanitiseProgress,
  sessionDoc,
} from './satsSave';
import { REALM_IDS } from './satsTypes';

const NOW = 1_800_000_000_000;
const answer = (code: string, correct: boolean, marks = 1): RaidAnswer => ({
  key: code,
  code,
  correct,
  marks: correct ? marks : 0,
  marksAvailable: marks,
  ms: 1000,
});

describe('new progress', () => {
  it('starts unplaced everywhere with only minimal fields', () => {
    const p = newProgress(NOW);
    expect(isProgressShape(p)).toBe(true);
    expect(allPlaced(p)).toBe(false);
    expect(Object.keys(p).sort()).toEqual(
      ['createdAtMs', 'domainStats', 'hero', 'heroColor', 'mockBest', 'realms', 'schemaVersion', 'settings', 'updatedAtMs', 'xp'].sort(),
    );
    for (const id of REALM_IDS) expect(p.realms[id]).toEqual({ placed: false, band: 'unplaced', ability: 0, unlocked: 1, stars: [0, 0, 0, 0, 0] });
  });
});

describe('sanitiseProgress', () => {
  it('repairs missing, wrong-typed or out-of-range values', () => {
    const p = sanitiseProgress(
      {
        hero: 'pirate',
        heroColor: 'rose',
        xp: -5,
        mockBest: 7,
        realms: { arithmetic: { placed: true, band: 'expected', ability: 9, unlocked: 12, stars: [3, 9, -1] } },
        settings: { timer: 'turbo', dyslexiaFont: 'yes' },
        domainStats: { '6C7a': { a: 3, c: 5 }, 'bad code!': { a: 1, c: 1 } },
      },
      NOW,
    );
    expect(isProgressShape(p)).toBe(true);
    expect(p.hero).toBeNull();
    expect(p.heroColor).toBe('rose');
    expect(p.xp).toBe(0);
    expect(p.mockBest).toBe(3);
    expect(p.realms.arithmetic).toEqual({ placed: true, band: 'expected', ability: 4, unlocked: 5, stars: [3, 3, 0, 0, 0] });
    expect(p.realms.grammar.placed).toBe(false);
    expect(p.settings).toEqual({ timer: 'standard', dyslexiaFont: false });
    expect(p.domainStats).toEqual({ '6C7a': { a: 3, c: 3 } });
  });

  it('returns fresh progress for junk', () => {
    expect(sanitiseProgress(null, NOW)).toEqual(newProgress(NOW));
    expect(sanitiseProgress('hello', NOW)).toEqual(newProgress(NOW));
  });

  it('round-trips a valid progress object unchanged', () => {
    const p = applyPlacement(newProgress(NOW), 'arithmetic', 0.4, [answer('6C7a', true)], NOW + 1);
    expect(sanitiseProgress(JSON.parse(JSON.stringify(p)), NOW)).toEqual(p);
  });
});

describe('placement and raids', () => {
  it('places a realm, opens its starting chapter and counts the codes', () => {
    const p = applyPlacement(newProgress(NOW), 'grammar', 0.2, [answer('G1.1', true), answer('G5.8', false)], NOW + 5);
    expect(p.realms.grammar).toMatchObject({ placed: true, band: 'expected', unlocked: 3 });
    expect(p.domainStats).toEqual({ 'G1.1': { a: 1, c: 1 }, 'G5.8': { a: 1, c: 0 } });
    expect(p.updatedAtMs).toBe(NOW + 5);
    expect(isProgressShape(p)).toBe(true);
  });

  it('opens the next chapter on two stars and keeps the best stars', () => {
    let p = applyPlacement(newProgress(NOW), 'arithmetic', -2, [], NOW);
    expect(p.realms.arithmetic.unlocked).toBe(1);
    p = applyRaid(p, 'arithmetic', 1, 1, 5, [], NOW);
    expect(p.realms.arithmetic.unlocked).toBe(1);
    p = applyRaid(p, 'arithmetic', 1, 2, 7, [], NOW);
    expect(p.realms.arithmetic.unlocked).toBe(2);
    p = applyRaid(p, 'arithmetic', 1, 1, 5, [], NOW);
    expect(p.realms.arithmetic.stars[0]).toBe(2);
    expect(p.xp).toBe(50 + 20 + 70 + 40 + 50 + 20);
  });

  it('never opens beyond chapter 5', () => {
    let p = applyPlacement(newProgress(NOW), 'spelling', 3, [], NOW);
    p = applyRaid(p, 'spelling', 5, 3, 8, [], NOW);
    expect(p.realms.spelling.unlocked).toBe(5);
  });

  it('moves a band up after strong raids but never down', () => {
    let p = applyPlacement(newProgress(NOW), 'reading', -2, [], NOW);
    expect(p.realms.reading.band).toBe('towards');
    p = applyRaid(p, 'reading', 4, 2, 4, [], NOW);
    expect(p.realms.reading.band).toBe('expected');
    p = applyRaid(p, 'reading', 5, 3, 5, [], NOW);
    expect(p.realms.reading.band).toBe('higher');
    p = applyRaid(p, 'reading', 1, 0, 0, [], NOW);
    expect(p.realms.reading.band).toBe('higher');
  });

  it('records the mock best', () => {
    const p = applyMock(applyMock(newProgress(NOW), 2, 10, [], NOW), 1, 5, [], NOW);
    expect(p.mockBest).toBe(2);
  });

  it('caps the number of content codes kept', () => {
    const many = Array.from({ length: MAX_DOMAIN_CODES + 10 }, (_, i) => answer(`C${i}`, true));
    expect(Object.keys(applyDomainStats({}, many)).length).toBe(MAX_DOMAIN_CODES);
  });
});

describe('session summary', () => {
  it('stores counts only, never the answers themselves', () => {
    const doc = sessionDoc('raid', 'arithmetic', 3, NOW, NOW + 60_000, [answer('6C7a', true, 2), answer('6F4', false)], 2, 'extra');
    expect(doc).toEqual({
      kind: 'raid',
      realm: 'arithmetic',
      chapter: 3,
      startedAtMs: NOW,
      endedAtMs: NOW + 60_000,
      items: 2,
      correct: 1,
      marks: 2,
      marksAvailable: 3,
      stars: 2,
      timer: 'extra',
    });
  });
});
