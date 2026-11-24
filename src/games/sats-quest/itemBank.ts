/**
 * One place to draw questions for any realm and level, without repeats inside a raid and
 * with an optional lean toward the child's weakest content codes.
 *
 * Called by: satsController.ts. Tested by: banks.test.ts
 */
import { buildGpsItem, GPS_BANK } from './gpsBank';
import { buildMathsItem, mathsTemplates } from './mathsItems';
import { buildReadingItems, READING_BANK, readingDifficulty, type ReadingEntry } from './readingBank';
import { pick, type Rng } from './satsRandom';
import { buildSpellItem, SPELLING_BANK } from './spellingBank';
import type { Item, Level, RealmId } from './satsTypes';

export interface DrawOptions {
  readonly realm: Exclude<RealmId, 'reading'>;
  readonly level: Level;
  readonly rng: Rng;
  /** Template / bank ids already used in this raid. */
  readonly used?: ReadonlySet<string>;
  /** Content codes to prefer (the child's weak spots), when the level has them. */
  readonly preferCodes?: readonly string[];
}

interface Candidate {
  readonly id: string;
  readonly code: string;
  readonly level: Level;
  readonly build: (rng: Rng) => Item;
}

function candidates(realm: Exclude<RealmId, 'reading'>): Candidate[] {
  switch (realm) {
    case 'arithmetic':
    case 'reasoning':
      return mathsTemplates(realm).map((t) => ({ id: t.id, code: t.code, level: t.level, build: (rng) => buildMathsItem(t, rng) }));
    case 'grammar':
      return GPS_BANK.map((e) => ({ id: e.id, code: e.code, level: e.level, build: (rng) => buildGpsItem(e, rng) }));
    case 'spelling':
      return SPELLING_BANK.map((e) => ({ id: `sp.${e.word}`, code: e.code, level: e.level, build: (rng) => buildSpellItem(e, rng) }));
  }
}

const CANDIDATES: Record<Exclude<RealmId, 'reading'>, Candidate[]> = {
  arithmetic: candidates('arithmetic'),
  reasoning: candidates('reasoning'),
  grammar: candidates('grammar'),
  spelling: candidates('spelling'),
};

/**
 * Draw one item. Looks at the requested level first, then the nearest levels, skipping ids
 * already used; if everything was used it allows a repeat of the requested level.
 */
export function drawItem(opts: DrawOptions): Item {
  const pool = CANDIDATES[opts.realm];
  const used = opts.used ?? new Set<string>();
  for (const distance of [0, 1, 2, 3, 4]) {
    const fresh = pool.filter((c) => Math.abs(c.level - opts.level) === distance && !used.has(c.id));
    if (!fresh.length) continue;
    // Within the nearest level, prefer the requested level, then a weak-spot code.
    const exact = fresh.filter((c) => c.level === opts.level);
    const levelPool = exact.length ? exact : fresh;
    const weak = opts.preferCodes?.length ? levelPool.filter((c) => opts.preferCodes!.includes(c.code)) : [];
    const choice = pick(opts.rng, weak.length && opts.rng() < 0.6 ? weak : levelPool);
    return choice.build(opts.rng);
  }
  const fallback = pool.filter((c) => c.level === opts.level);
  return pick(opts.rng, fallback.length ? fallback : pool).build(opts.rng);
}

/** Draw a list of items for the given levels with no repeated template or word. */
export function drawItems(
  realm: Exclude<RealmId, 'reading'>,
  levels: readonly Level[],
  rng: Rng,
  preferCodes?: readonly string[],
): Item[] {
  const used = new Set<string>();
  return levels.map((level) => {
    const item = drawItem({ realm, level, rng, used, ...(preferCodes ? { preferCodes } : {}) });
    used.add(item.id);
    return item;
  });
}

export function readingEntryForLevel(level: Level, rng: Rng, avoid?: string): ReadingEntry {
  const exact = READING_BANK.filter((e) => e.passage.level === level && e.passage.id !== avoid);
  if (exact.length) return pick(rng, exact);
  const sorted = [...READING_BANK].sort((a, b) => Math.abs(a.passage.level - level) - Math.abs(b.passage.level - level));
  return sorted[0]!;
}

export function readingItems(entry: ReadingEntry, rng: Rng): Item[] {
  return buildReadingItems(entry, rng);
}

/** Rasch difficulty (logits) for placement: level 3 is centred on 0. */
export function difficultyOf(item: Item): number {
  if (item.realm === 'reading' && item.kind === 'choice') {
    return readingDifficulty(item.level, item.code as Parameters<typeof readingDifficulty>[1]);
  }
  return item.level - 3;
}
