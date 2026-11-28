/** Saved progress survives bad data and keeps points honest. */
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, buyUpgrade, emptyProgress, finishGame, loadProgress, refundUpgrades, saveProgress } from './chessStore';
import { START_POINTS } from './chessUpgrades';

function memory(initial?: string): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void } {
  const data = new Map<string, string>(initial === undefined ? [] : [[STORAGE_KEY, initial]]);
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('chess progress', () => {
  it('uses the versioned key', () => {
    expect(STORAGE_KEY).toBe('kane.chessMasters.v1');
  });

  it('starts with a few points and no upgrades', () => {
    expect(loadProgress(memory())).toEqual(emptyProgress());
    expect(emptyProgress()).toMatchObject({ points: START_POINTS, owned: [] });
    expect(loadProgress(null)).toEqual(emptyProgress());
  });

  it('round-trips', () => {
    const storage = memory();
    const saved = { ...emptyProgress(), points: 21, owned: ['trot' as const], playAs: 'black' as const, blitz: '5+0' as const };
    saveProgress(saved, storage);
    expect(loadProgress(storage)).toEqual(saved);
  });

  it.each(['not json', 'null', '7', '"text"', '[]'])('survives %s', (text) => {
    expect(loadProgress(memory(text))).toEqual(emptyProgress());
  });

  it('drops anything that makes no sense', () => {
    const bad = JSON.stringify({
      points: -4,
      owned: ['amazon', 'flying', 'amazon', 7],
      wins: 2.9,
      losses: 'many',
      draws: 1e12,
      playAs: 'green',
      blitz: '99+99',
      level: 'impossible',
    });
    expect(loadProgress(memory(bad))).toEqual({ ...emptyProgress(), owned: ['amazon'], wins: 2, draws: 9999 });
  });

  it('copes with storage that refuses to work', () => {
    const broken = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(loadProgress(broken)).toEqual(emptyProgress());
    expect(() => saveProgress(emptyProgress(), broken)).not.toThrow();
  });

  it('buys, then refunds in full', () => {
    const rich = { ...emptyProgress(), points: 10 };
    const bought = buyUpgrade(rich, 'amazon');
    expect(bought.result).toBe('bought');
    expect(bought.progress.points).toBe(2);
    expect(buyUpgrade(bought.progress, 'spearhead').result).toBe('short');
    expect(refundUpgrades(bought.progress)).toMatchObject({ points: 10, owned: [] });
  });

  it('records results, and pays points only for Upgrades games', () => {
    const start = emptyProgress();
    const upgrades = finishGame(start, { mode: 'upgrades', level: 'easy', result: 'win', captured: [5] });
    expect(upgrades.earned).toBe(9);
    expect(upgrades.progress).toMatchObject({ points: START_POINTS + 9, wins: 1 });
    const classic = finishGame(start, { mode: 'classic', level: 'hard', result: 'loss', captured: [5] });
    expect(classic.earned).toBe(0);
    expect(classic.progress).toMatchObject({ points: START_POINTS, losses: 1 });
    expect(finishGame(start, { mode: 'blitz', level: 'medium', result: 'draw', captured: [] }).progress.draws).toBe(1);
  });
});
