import { describe, expect, it } from 'vitest';
import {
  MAX_LEADERS,
  STORAGE_KEY,
  emptyProgress,
  finishRun,
  loadProgress,
  purchase,
  saveProgress,
  type Progress,
} from './skateStore';

function fakeStorage(initial?: string) {
  const map = new Map<string, string>();
  if (initial !== undefined) map.set(STORAGE_KEY, initial);
  return {
    map,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe('loading progress', () => {
  it('starts empty, with only the Starter Deck', () => {
    expect(loadProgress(fakeStorage())).toEqual({ coins: 0, owned: ['basic'], leaders: [] });
  });

  it('gets back what it saved', () => {
    const storage = fakeStorage();
    const progress: Progress = {
      coins: 120,
      owned: ['basic', 'speed'],
      leaders: [
        { score: 240, name: 'Kai' },
        { score: 90, name: 'Nova' },
      ],
    };
    saveProgress(progress, storage);
    expect(loadProgress(storage)).toEqual(progress);
  });

  it('shrugs off corrupt data', () => {
    expect(loadProgress(fakeStorage('{not json'))).toEqual(emptyProgress());
    expect(loadProgress(fakeStorage('42'))).toEqual(emptyProgress());
    expect(loadProgress(fakeStorage('null'))).toEqual(emptyProgress());
  });

  it('cleans up bad values instead of trusting them', () => {
    const messy = JSON.stringify({
      coins: 12.9,
      owned: ['speed', 'rocket', 3, 'speed'],
      leaders: [
        { score: 10, name: 'Rex' },
        { score: 'lots', name: 'Bad' },
        { score: -4, name: 'Neg' },
        { score: 300, name: 'A name that is much too long' },
        'nope',
      ],
    });
    const loaded = loadProgress(fakeStorage(messy));
    expect(loaded.coins).toBe(12);
    expect(loaded.owned).toEqual(['basic', 'speed']);
    expect(loaded.leaders).toEqual([
      { score: 300, name: 'A name that ' },
      { score: 10, name: 'Rex' },
    ]);
    expect(loadProgress(fakeStorage(JSON.stringify({ coins: -5 }))).coins).toBe(0);
    expect(loadProgress(fakeStorage(JSON.stringify({ coins: 'lots' }))).coins).toBe(0);
  });

  it('keeps only the best ten scores, best first', () => {
    const leaders = Array.from({ length: 15 }, (_, i) => ({ score: i * 10, name: 'Kai' }));
    const loaded = loadProgress(fakeStorage(JSON.stringify({ leaders })));
    expect(loaded.leaders).toHaveLength(MAX_LEADERS);
    expect(loaded.leaders[0].score).toBe(140);
    expect(loaded.leaders[MAX_LEADERS - 1].score).toBe(50);
  });

  it('copes with storage that throws, or none at all', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(() => saveProgress(emptyProgress(), broken)).not.toThrow();
    expect(loadProgress(null)).toEqual(emptyProgress());
    expect(() => saveProgress(emptyProgress(), null)).not.toThrow();
  });
});

describe('buying decks', () => {
  const withCoins = (coins: number): Progress => ({ ...emptyProgress(), coins });

  it('refuses when there are too few coins, and changes nothing', () => {
    const before = withCoins(50);
    const { progress, result } = purchase(before, 'speed');
    expect(result).toBe('short');
    expect(progress).toEqual(before);
  });

  it('takes the price and adds the deck', () => {
    const { progress, result } = purchase(withCoins(100), 'speed');
    expect(result).toBe('bought');
    expect(progress.coins).toBe(20);
    expect(progress.owned).toEqual(['basic', 'speed']);
  });

  it('charges each deck its own price', () => {
    expect(purchase(withCoins(200), 'jump').progress.coins).toBe(120);
    expect(purchase(withCoins(200), 'magnet').progress.coins).toBe(80);
  });

  it('never charges twice for a deck, nor for the Starter Deck', () => {
    const bought = purchase(withCoins(300), 'magnet').progress;
    const again = purchase(bought, 'magnet');
    expect(again.result).toBe('owned');
    expect(again.progress.coins).toBe(bought.coins);
    expect(purchase(emptyProgress(), 'basic').result).toBe('owned');
  });
});

describe('finishing a run', () => {
  it('banks the coins and records the score under the skater', () => {
    const before: Progress = { ...emptyProgress(), coins: 10 };
    const after = finishRun(before, { score: 123.9, coins: 7, skater: 'pink' });
    expect(after.coins).toBe(17);
    expect(after.leaders).toEqual([{ score: 123, name: 'Nova' }]);
    expect(before.leaders).toEqual([]); // the old value is left alone
  });

  it('keeps the top scores sorted and capped', () => {
    let progress = emptyProgress();
    for (let i = 1; i <= 12; i++) progress = finishRun(progress, { score: i * 10, coins: 0, skater: 'cyan' });
    expect(progress.leaders).toHaveLength(MAX_LEADERS);
    expect(progress.leaders[0].score).toBe(120);
    expect(progress.leaders[MAX_LEADERS - 1].score).toBe(30);
  });
});
