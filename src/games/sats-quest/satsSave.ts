/**
 * The saved SATs Quest progress and session summaries, and the pure rules for updating them.
 * Data minimisation by design: the hero choice, per-realm band and level, stars, XP, settings
 * and per-content-code counts. No answers, names, ages or schools are stored.
 *
 * Firestore: users/{uid}/sats/progress and users/{uid}/satsSessions/{id} — the shapes here
 * must match firestore.rules (`isProgressShape` mirrors those checks and is tested).
 *
 * Called by: satsStore.ts, satsController.ts. Tested by: satsSave.test.ts
 */
import { bandFor, startChapterFor } from './placement';
import { CHAPTERS, CLEAR_STARS, type CodeStat, xpFor } from './progression';
import type { RaidAnswer } from './raid';
import { REALM_IDS, TIMER_MODES, type BandOrUnplaced, type RealmId, type TimerMode } from './satsTypes';

export const HEROES = ['knight', 'wizard', 'fairy', 'ranger'] as const;
export type HeroId = (typeof HEROES)[number];
export const HERO_COLOURS = ['rose', 'amber', 'emerald', 'sky', 'violet', 'silver'] as const;
export type HeroColour = (typeof HERO_COLOURS)[number];

export interface RealmProgress {
  readonly placed: boolean;
  readonly band: BandOrUnplaced;
  /** Latest ability estimate in logits, kept within ±4. */
  readonly ability: number;
  /** Highest chapter open, 1–5. */
  readonly unlocked: number;
  /** Best stars per chapter (index 0 = chapter 1). */
  readonly stars: readonly number[];
}

export interface SatsProgress {
  readonly schemaVersion: 1;
  readonly hero: HeroId | null;
  readonly heroColor: HeroColour;
  readonly realms: Readonly<Record<RealmId, RealmProgress>>;
  /** Best stars against the Clockwork Dragon (mock). */
  readonly mockBest: number;
  readonly xp: number;
  readonly settings: { readonly timer: TimerMode; readonly dyslexiaFont: boolean };
  readonly domainStats: Readonly<Record<string, CodeStat>>;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export type SessionKind = 'placement' | 'raid' | 'mock';

export interface SatsSessionDoc {
  readonly kind: SessionKind;
  readonly realm: RealmId | 'mixed';
  readonly chapter: number;
  readonly startedAtMs: number;
  readonly endedAtMs: number;
  readonly items: number;
  readonly correct: number;
  readonly marks: number;
  readonly marksAvailable: number;
  readonly stars: number;
  readonly timer: TimerMode;
}

export const MAX_DOMAIN_CODES = 80;
export const MAX_XP = 10_000_000;
const MAX_COUNT = 100_000;

const clampInt = (v: unknown, lo: number, hi: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback;

function emptyRealm(): RealmProgress {
  return { placed: false, band: 'unplaced', ability: 0, unlocked: 1, stars: [0, 0, 0, 0, 0] };
}

export function newProgress(nowMs: number): SatsProgress {
  const realms = Object.fromEntries(REALM_IDS.map((id) => [id, emptyRealm()])) as Record<RealmId, RealmProgress>;
  return {
    schemaVersion: 1,
    hero: null,
    heroColor: 'sky',
    realms,
    mockBest: 0,
    xp: 0,
    settings: { timer: 'standard', dyslexiaFont: false },
    domainStats: {},
    createdAtMs: Math.round(nowMs),
    updatedAtMs: Math.round(nowMs),
  };
}

function sanitiseRealm(raw: unknown): RealmProgress {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const band = ['unplaced', 'towards', 'expected', 'higher'].includes(r.band as string) ? (r.band as BandOrUnplaced) : 'unplaced';
  const stars = Array.isArray(r.stars) ? r.stars : [];
  const ability = typeof r.ability === 'number' && Number.isFinite(r.ability) ? Math.min(4, Math.max(-4, r.ability)) : 0;
  return {
    placed: r.placed === true && band !== 'unplaced',
    band,
    ability,
    unlocked: clampInt(r.unlocked, 1, CHAPTERS, 1),
    stars: Array.from({ length: CHAPTERS }, (_, i) => clampInt(stars[i], 0, 3, 0)),
  };
}

/** Turn whatever was stored (possibly old or hand-edited) into a valid progress object. */
export function sanitiseProgress(raw: unknown, nowMs: number): SatsProgress {
  if (!raw || typeof raw !== 'object') return newProgress(nowMs);
  const d = raw as Record<string, unknown>;
  const base = newProgress(nowMs);
  const realmsRaw = (d.realms && typeof d.realms === 'object' ? d.realms : {}) as Record<string, unknown>;
  const settings = (d.settings && typeof d.settings === 'object' ? d.settings : {}) as Record<string, unknown>;
  const statsRaw = (d.domainStats && typeof d.domainStats === 'object' ? d.domainStats : {}) as Record<string, unknown>;
  const domainStats: Record<string, CodeStat> = {};
  for (const [code, value] of Object.entries(statsRaw).slice(0, MAX_DOMAIN_CODES)) {
    if (!/^[A-Za-z0-9.]{1,8}$/.test(code) || !value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    const a = clampInt(v.a, 0, MAX_COUNT, 0);
    domainStats[code] = { a, c: clampInt(v.c, 0, a, 0) };
  }
  return {
    schemaVersion: 1,
    hero: HEROES.includes(d.hero as HeroId) ? (d.hero as HeroId) : null,
    heroColor: HERO_COLOURS.includes(d.heroColor as HeroColour) ? (d.heroColor as HeroColour) : base.heroColor,
    realms: Object.fromEntries(REALM_IDS.map((id) => [id, sanitiseRealm(realmsRaw[id])])) as Record<RealmId, RealmProgress>,
    mockBest: clampInt(d.mockBest, 0, 3, 0),
    xp: clampInt(d.xp, 0, MAX_XP, 0),
    settings: {
      timer: TIMER_MODES.includes(settings.timer as TimerMode) ? (settings.timer as TimerMode) : 'standard',
      dyslexiaFont: settings.dyslexiaFont === true,
    },
    domainStats,
    createdAtMs: clampInt(d.createdAtMs, 0, Number.MAX_SAFE_INTEGER, base.createdAtMs),
    updatedAtMs: clampInt(d.updatedAtMs, 0, Number.MAX_SAFE_INTEGER, base.updatedAtMs),
  };
}

function withRealm(p: SatsProgress, realm: RealmId, next: RealmProgress, nowMs: number, extra: Partial<SatsProgress> = {}): SatsProgress {
  return { ...p, ...extra, realms: { ...p.realms, [realm]: next }, updatedAtMs: Math.round(nowMs) };
}

export function applyDomainStats(stats: Readonly<Record<string, CodeStat>>, answers: readonly RaidAnswer[]): Record<string, CodeStat> {
  const next: Record<string, CodeStat> = { ...stats };
  for (const a of answers) {
    const old = next[a.code] ?? { a: 0, c: 0 };
    next[a.code] = { a: Math.min(MAX_COUNT, old.a + 1), c: Math.min(MAX_COUNT, old.c + (a.correct ? 1 : 0)) };
  }
  const codes = Object.keys(next);
  if (codes.length > MAX_DOMAIN_CODES) {
    // Keep the most-practised codes.
    codes.sort((x, y) => next[y]!.a - next[x]!.a);
    for (const code of codes.slice(MAX_DOMAIN_CODES)) delete next[code];
  }
  return next;
}

export function applyPlacement(p: SatsProgress, realm: RealmId, theta: number, answers: readonly RaidAnswer[], nowMs: number): SatsProgress {
  const band = bandFor(theta);
  const old = p.realms[realm];
  return withRealm(
    p,
    realm,
    { ...old, placed: true, band, ability: Math.min(4, Math.max(-4, theta)), unlocked: Math.max(old.unlocked, startChapterFor(band)) },
    nowMs,
    { domainStats: applyDomainStats(p.domainStats, answers) },
  );
}

const BAND_ORDER: readonly BandOrUnplaced[] = ['unplaced', 'towards', 'expected', 'higher'];

/** Raids can move a band up (never down): clearing chapter 4 shows the expected standard; 3 stars on chapter 5 shows higher. */
function bandAfterRaid(band: BandOrUnplaced, chapter: number, stars: number): BandOrUnplaced {
  let earned: BandOrUnplaced = band;
  if (chapter >= 4 && stars >= CLEAR_STARS) earned = 'expected';
  if (chapter >= 5 && stars >= 3) earned = 'higher';
  return BAND_ORDER.indexOf(earned) > BAND_ORDER.indexOf(band) ? earned : band;
}

export function applyRaid(
  p: SatsProgress,
  realm: RealmId,
  chapter: number,
  stars: number,
  marks: number,
  answers: readonly RaidAnswer[],
  nowMs: number,
): SatsProgress {
  const old = p.realms[realm];
  const i = Math.min(CHAPTERS, Math.max(1, chapter)) - 1;
  const bestStars = old.stars.map((s, k) => (k === i ? Math.max(s, stars) : s));
  const unlocked = stars >= CLEAR_STARS ? Math.max(old.unlocked, Math.min(CHAPTERS, i + 2)) : old.unlocked;
  const band = old.placed ? bandAfterRaid(old.band, i + 1, stars) : old.band;
  return withRealm(p, realm, { ...old, stars: bestStars, unlocked, band }, nowMs, {
    xp: Math.min(MAX_XP, p.xp + xpFor(marks, stars)),
    domainStats: applyDomainStats(p.domainStats, answers),
  });
}

export function applyMock(p: SatsProgress, stars: number, marks: number, answers: readonly RaidAnswer[], nowMs: number): SatsProgress {
  return {
    ...p,
    mockBest: Math.max(p.mockBest, Math.min(3, Math.max(0, stars))),
    xp: Math.min(MAX_XP, p.xp + xpFor(marks, stars)),
    domainStats: applyDomainStats(p.domainStats, answers),
    updatedAtMs: Math.round(nowMs),
  };
}

export function allPlaced(p: SatsProgress): boolean {
  return REALM_IDS.every((id) => p.realms[id].placed);
}

export function sessionDoc(
  kind: SessionKind,
  realm: RealmId | 'mixed',
  chapter: number,
  startedAtMs: number,
  endedAtMs: number,
  answers: readonly RaidAnswer[],
  stars: number,
  timer: TimerMode,
): SatsSessionDoc {
  const marks = answers.reduce((s, a) => s + a.marks, 0);
  return {
    kind,
    realm,
    chapter: Math.min(CHAPTERS, Math.max(0, Math.round(chapter))),
    startedAtMs: Math.round(startedAtMs),
    endedAtMs: Math.round(Math.max(startedAtMs, endedAtMs)),
    items: answers.length,
    correct: answers.filter((a) => a.correct).length,
    marks,
    marksAvailable: answers.reduce((s, a) => s + a.marksAvailable, 0),
    stars: Math.min(3, Math.max(0, stars)),
    timer,
  };
}

/** The same checks firestore.rules makes on users/{uid}/sats/progress. */
export function isProgressShape(d: SatsProgress): boolean {
  const realmOk = (r: RealmProgress): boolean =>
    typeof r.placed === 'boolean' &&
    BAND_ORDER.includes(r.band) &&
    r.ability >= -4 &&
    r.ability <= 4 &&
    Number.isInteger(r.unlocked) &&
    r.unlocked >= 1 &&
    r.unlocked <= CHAPTERS &&
    r.stars.length === CHAPTERS &&
    r.stars.every((s) => Number.isInteger(s) && s >= 0 && s <= 3);
  return (
    d.schemaVersion === 1 &&
    (d.hero === null || HEROES.includes(d.hero)) &&
    HERO_COLOURS.includes(d.heroColor) &&
    REALM_IDS.every((id) => realmOk(d.realms[id])) &&
    Object.keys(d.realms).length === REALM_IDS.length &&
    Number.isInteger(d.mockBest) &&
    d.mockBest >= 0 &&
    d.mockBest <= 3 &&
    Number.isInteger(d.xp) &&
    d.xp >= 0 &&
    d.xp <= MAX_XP &&
    TIMER_MODES.includes(d.settings.timer) &&
    typeof d.settings.dyslexiaFont === 'boolean' &&
    Object.keys(d.domainStats).length <= MAX_DOMAIN_CODES &&
    Number.isInteger(d.createdAtMs) &&
    Number.isInteger(d.updatedAtMs)
  );
}
