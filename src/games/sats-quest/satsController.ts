/**
 * SATs Quest flow: sign in → choose a hero → the Royal Trial (adaptive placement per realm)
 * → the kingdom map → raids at the placed chapter → results, saved to the child's account.
 * Pure rules live in placement.ts / raid.ts / progression.ts / satsSave.ts; this file only
 * wires them to the store, the DOM overlay and the Phaser stage.
 *
 * Called by: SatsQuestScene.ts
 */
import { isReduceMotion, setReduceMotion } from '../../database/motionPrefs';
import { isFirebaseSdkReady } from '../../firebase/app';
import { isCloudAccount, subscribeAuth } from '../../firebase/auth';
import type { KaneAuthUser } from '../../firebase/types';
import { playSfx } from '../../presentation/audio/sfx';
import { showAuthPanel } from '../../presentation/ui/authPanel';
import { difficultyOf, drawItem, drawItems, readingEntryForLevel, readingItems } from './itemBank';
import { correctAnswerText, markResponse } from './marking';
import {
  estimateAbility,
  levelForNext,
  placementItemMs,
  READING_PLACEMENT_LEVEL,
  shouldStop,
  startChapterFor,
  type PlacementResponse,
} from './placement';
import {
  budgetMs,
  chapterLevel,
  chapterLevels,
  CHAPTERS,
  CLEAR_STARS,
  MOCK_CHAPTER,
  MOCK_PLAN,
  RAID_SIZE,
  starsFor,
  weakestCodes,
  xpFor,
} from './progression';
import {
  answerCurrent,
  canCast,
  castSpell,
  createRaid,
  currentItem,
  paceProgress,
  raidMarks,
  tick,
  timeLeftMs,
  type RaidAnswer,
  type RaidState,
} from './raid';
import type { BossKind } from './satsArt';
import { BAND_COPY, COPY, HERO_COPY, MOCK_COPY, REALM_COPY } from './satsCopy';
import { createRng, shuffle, type Rng } from './satsRandom';
import {
  allPlaced,
  applyMock,
  applyPlacement,
  applyRaid,
  newProgress,
  sessionDoc,
  type HeroColour,
  type HeroId,
  type SatsProgress,
  type SessionKind,
} from './satsSave';
import { createSatsStore, type SatsStore } from './satsStore';
import { askOwl, canAskOwl } from './satsTutor';
import { REALM_IDS, type Item, type ItemResponse, type Passage, type RealmId } from './satsTypes';
import { SatsUi, type HudView } from './satsUi';
import { readingEntry } from './readingBank';

/** What the controller needs from the Phaser stage (implemented by SatsStage). */
export interface StageApi {
  showMenu(): void;
  showBattle(kind: BossKind): void;
  setHero(hero: HeroId, colour: HeroColour): void;
  setVisibleHeight(px: number): void;
  setReduceMotion(on: boolean): void;
  hit(marks: number): void;
  blocked(): void;
  defeat(): void;
}

interface TrialRun {
  readonly kind: 'trial';
  readonly realm: RealmId;
  readonly startedAtMs: number;
  readonly responses: PlacementResponse[];
  readonly answers: RaidAnswer[];
  readonly used: Set<string>;
  readonly queue: Item[];
  readonly passage: Passage | null;
  item: Item;
  number: number;
  questionMs: number;
  limitMs: number | null;
  phase: 'question' | 'idle';
}

interface BattleRun {
  readonly kind: 'raid' | 'mock';
  readonly realm: RealmId | 'mixed';
  readonly chapter: number;
  readonly startedAtMs: number;
  readonly passage: Passage | null;
  raid: RaidState;
  phase: 'question' | 'feedback' | 'idle';
}

type Run = TrialRun | BattleRun;

const MAX_TICK_MS = 250;
const SIGN_IN_GRACE_MS = 1200;

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

export class SatsQuestController {
  private readonly ui: SatsUi;
  private readonly rng: Rng = createRng((Math.random() * 2 ** 32) >>> 0);
  private store: SatsStore | null = null;
  private progress: SatsProgress = newProgress(Date.now());
  private user: KaneAuthUser | null = null;
  private deviceMode = false;
  private run: Run | null = null;
  private unsubscribeAuth: (() => void) | null = null;
  private graceTimer: ReturnType<typeof setTimeout> | null = null;
  private saveNoteTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  private loadToken = 0;

  constructor(
    private readonly stage: StageApi,
    private readonly exit: () => void,
  ) {
    this.ui = new SatsUi(
      () => this.leave(),
      (panelPx) => this.stage.setVisibleHeight(window.innerHeight - panelPx),
    );
    this.applyModes();
  }

  start(): void {
    this.ui.showCard({ title: COPY.loading, buttons: [] });
    if (!isFirebaseSdkReady()) {
      this.showSignIn();
      return;
    }
    this.graceTimer = setTimeout(() => {
      if (!this.user && !this.deviceMode) this.showSignIn();
    }, SIGN_IN_GRACE_MS);
    this.unsubscribeAuth = subscribeAuth((user) => this.onAuth(user));
  }

  destroy(): void {
    this.destroyed = true;
    this.unsubscribeAuth?.();
    if (this.graceTimer) clearTimeout(this.graceTimer);
    if (this.saveNoteTimer) clearTimeout(this.saveNoteTimer);
    this.ui.destroy();
  }

  private leave(): void {
    playSfx('ui');
    this.exit();
  }

  // ---------------------------------------------------------------- accounts

  private onAuth(user: KaneAuthUser | null): void {
    if (this.destroyed || this.deviceMode) return;
    const signedIn = user && isCloudAccount(user) ? user : null;
    if (signedIn && signedIn.uid !== this.user?.uid) {
      void this.useAccount(signedIn);
    } else if (!signedIn && this.user) {
      // Signed out elsewhere: stop and go back to the sign-in card.
      this.user = null;
      this.store = null;
      this.run = null;
      this.showSignIn();
    }
  }

  private showSignIn(): void {
    if (this.destroyed) return;
    this.stage.showMenu();
    const sdk = isFirebaseSdkReady();
    this.ui.showCard({
      pill: 'SATs Quest',
      title: COPY.signInTitle,
      body: sdk ? [COPY.signInBody] : [COPY.playDeviceNote],
      buttons: [
        ...(sdk
          ? [
              {
                label: COPY.signIn,
                kind: 'primary' as const,
                onClick: () =>
                  showAuthPanel({
                    mode: 'login',
                    allowGuest: true,
                    onAuthed: (user) => void this.useAccount(user),
                    onGuest: () => void this.useDevice(),
                    onClose: () => this.showSignIn(),
                  }),
              },
            ]
          : []),
        { label: COPY.playDevice, kind: sdk ? ('ghost' as const) : ('primary' as const), onClick: () => void this.useDevice() },
      ],
      note: sdk ? COPY.playDeviceNote : undefined,
    });
  }

  private async useDevice(): Promise<void> {
    this.deviceMode = true;
    this.user = null;
    await this.open(createSatsStore(null));
  }

  private async useAccount(user: KaneAuthUser): Promise<void> {
    this.user = user;
    this.deviceMode = false;
    await this.open(createSatsStore(user));
  }

  private async open(store: SatsStore): Promise<void> {
    if (this.graceTimer) clearTimeout(this.graceTimer);
    const token = ++this.loadToken;
    this.store = store;
    this.ui.showCard({ title: COPY.loading, buttons: [] });
    const progress = await store.load();
    if (this.destroyed || token !== this.loadToken) return;
    this.progress = progress;
    this.applyModes();
    if (progress.hero) {
      this.stage.setHero(progress.hero, progress.heroColor);
      this.showHome();
    } else {
      this.showHeroPicker();
    }
  }

  private async persist(): Promise<void> {
    if (!this.store) return;
    const ok = await this.store.save(this.progress);
    const note = this.store.kind === 'device' ? COPY.savedDevice : ok ? COPY.savedCloud : COPY.saveFailed;
    this.ui.setSaveNote(note);
    if (this.saveNoteTimer) clearTimeout(this.saveNoteTimer);
    this.saveNoteTimer = setTimeout(() => this.ui.setSaveNote(null), 4000);
  }

  private recordSession(kind: SessionKind, realm: RealmId | 'mixed', chapter: number, startedAtMs: number, answers: readonly RaidAnswer[], stars: number): void {
    void this.store?.addSession(sessionDoc(kind, realm, chapter, startedAtMs, Date.now(), answers, stars, this.progress.settings.timer));
  }

  private applyModes(): void {
    const reduce = isReduceMotion();
    this.ui.setModes(this.progress.settings.dyslexiaFont, reduce);
    this.stage.setReduceMotion(reduce);
  }

  private heroIcon(): string {
    return HERO_COPY[this.progress.hero ?? 'knight'].icon;
  }

  // ---------------------------------------------------------------- menus

  private showHeroPicker(): void {
    this.stage.showMenu();
    this.ui.showHeroPicker(this.progress.hero, this.progress.heroColor, (hero, colour) => {
      playSfx('ui');
      this.progress = { ...this.progress, hero, heroColor: colour, updatedAtMs: Date.now() };
      this.stage.setHero(hero, colour);
      void this.persist();
      this.showHome();
    });
  }

  private showHome(): void {
    this.run = null;
    this.stage.showMenu();
    const p = this.progress;
    this.ui.showHome(
      {
        hero: p.hero ?? 'knight',
        colour: p.heroColor,
        xp: p.xp,
        realms: REALM_IDS.map((id) => ({ id, ...p.realms[id] })),
        mockOpen: allPlaced(p),
        mockBest: p.mockBest,
        trialLeft: REALM_IDS.filter((id) => !p.realms[id].placed).length,
      },
      {
        onTrial: () => {
          const next = REALM_IDS.find((id) => !this.progress.realms[id].placed);
          if (next) this.showTrialIntro(next);
        },
        onRealmTrial: (realm) => this.showTrialIntro(realm),
        onPlay: (realm, chapter) => this.startRaid(realm, chapter),
        onMock: () => this.startMock(),
        onSettings: () => this.showSettings(),
        onAbout: () => this.showAbout(),
      },
    );
  }

  private showSettings(): void {
    const s = this.progress.settings;
    this.ui.showSettings(
      { timer: s.timer, dyslexia: s.dyslexiaFont, reduce: isReduceMotion() },
      {
        onTimer: (timer) => {
          this.progress = { ...this.progress, settings: { ...this.progress.settings, timer }, updatedAtMs: Date.now() };
        },
        onDyslexia: (on) => {
          this.progress = { ...this.progress, settings: { ...this.progress.settings, dyslexiaFont: on }, updatedAtMs: Date.now() };
          this.applyModes();
        },
        onReduce: (on) => {
          setReduceMotion(on);
          this.applyModes();
        },
        onDone: () => {
          void this.persist();
          this.showHome();
        },
      },
    );
  }

  private showAbout(): void {
    this.ui.showCard({
      pill: 'SATs Quest',
      title: COPY.aboutTitle,
      list: COPY.aboutBody,
      buttons: [
        { label: COPY.done, kind: 'primary', onClick: () => this.showHome() },
        { label: COPY.deleteData, kind: 'danger', onClick: () => this.confirmDelete() },
      ],
    });
  }

  private confirmDelete(): void {
    this.ui.showCard({
      title: COPY.deleteConfirmTitle,
      body: [COPY.deleteConfirmBody],
      buttons: [
        { label: COPY.deleteNo, kind: 'primary', onClick: () => this.showAbout() },
        {
          label: COPY.deleteYes,
          kind: 'danger',
          onClick: () => {
            void (async () => {
              const ok = (await this.store?.deleteAll()) ?? false;
              if (this.destroyed) return;
              if (!ok) {
                this.ui.showCard({ title: COPY.deleteFailed, buttons: [{ label: COPY.done, kind: 'primary', onClick: () => this.showAbout() }] });
                return;
              }
              this.progress = newProgress(Date.now());
              this.applyModes();
              this.ui.showCard({ title: COPY.deleted, buttons: [{ label: COPY.heroGo, kind: 'primary', onClick: () => this.showHeroPicker() }] });
            })();
          },
        },
      ],
    });
  }

  // ---------------------------------------------------------------- the Royal Trial

  private showTrialIntro(realm: RealmId): void {
    const copy = REALM_COPY[realm];
    this.stage.showBattle(realm);
    const count = realm === 'reading' ? 'One short passage with a few questions.' : 'A few questions that get easier or harder as you go.';
    this.ui.showCard({
      pill: COPY.trialPill,
      title: `${copy.icon} ${copy.name}`,
      body: [copy.blurb, COPY.trialIntroBody(count)],
      buttons: [
        { label: COPY.begin, kind: 'primary', onClick: () => this.startTrial(realm) },
        { label: COPY.notNow, onClick: () => this.showHome() },
      ],
    });
  }

  private startTrial(realm: RealmId): void {
    playSfx('ui');
    let queue: Item[] = [];
    let passage: Passage | null = null;
    let first: Item;
    if (realm === 'reading') {
      const entry = readingEntryForLevel(READING_PLACEMENT_LEVEL, this.rng);
      passage = entry.passage;
      queue = readingItems(entry, this.rng);
      first = queue.shift()!;
    } else {
      first = drawItem({ realm, level: levelForNext(realm, []), rng: this.rng });
    }
    const run: TrialRun = {
      kind: 'trial',
      realm,
      startedAtMs: Date.now(),
      responses: [],
      answers: [],
      used: new Set([first.id]),
      queue,
      passage,
      item: first,
      number: 1,
      questionMs: 0,
      limitMs: null,
      phase: 'idle',
    };
    this.run = run;
    this.showTrialQuestion(run, null);
  }

  private showTrialQuestion(run: TrialRun, notice: string | null): void {
    const timer = this.progress.settings.timer;
    const limit = placementItemMs(run.realm, run.item.marks, timer);
    // The first reading question also covers reading the passage.
    run.limitMs = limit !== null && run.realm === 'reading' && run.number === 1 ? limit * 2 : limit;
    run.questionMs = 0;
    run.phase = 'question';
    this.ui.showQuestion(
      { mode: 'trial', title: `${COPY.trialPill} · ${REALM_COPY[run.realm].name}`, item: run.item, passage: run.passage, spellsAllowed: false },
      {
        onSubmit: (response) => this.answerTrial(run, response),
        onSpell: () => undefined,
      },
    );
    if (notice) this.ui.showNotice(notice);
    this.updateHud();
  }

  private answerTrial(run: TrialRun, response: ItemResponse | null): void {
    if (this.run !== run || run.phase !== 'question') return;
    let correct = false;
    if (response) {
      const result = markResponse(run.item, response);
      if (result.status === 'unreadable') {
        this.ui.showNotice(COPY.unreadable);
        return;
      }
      correct = result.correct;
    }
    run.phase = 'idle';
    run.responses.push({ difficulty: difficultyOf(run.item), correct });
    run.answers.push({
      key: run.item.key,
      code: run.item.code,
      correct,
      marks: correct ? run.item.marks : 0,
      marksAvailable: run.item.marks,
      ms: Math.round(run.questionMs),
    });

    const finished = run.realm === 'reading' ? run.queue.length === 0 : shouldStop(run.realm, run.responses);
    if (finished) {
      this.finishTrial(run);
      return;
    }
    run.item =
      run.realm === 'reading'
        ? run.queue.shift()!
        : drawItem({ realm: run.realm, level: levelForNext(run.realm, run.responses), rng: this.rng, used: run.used });
    run.used.add(run.item.id);
    run.number += 1;
    this.showTrialQuestion(run, response ? null : COPY.timeUpQuestion);
  }

  private finishTrial(run: TrialRun): void {
    const theta = estimateAbility(run.responses).mean;
    this.progress = applyPlacement(this.progress, run.realm, theta, run.answers, Date.now());
    this.recordSession('placement', run.realm, 0, run.startedAtMs, run.answers, 0);
    void this.persist();
    this.run = null;
    playSfx('victory');
    const realm = this.progress.realms[run.realm];
    const band = realm.band === 'unplaced' ? 'towards' : realm.band;
    const nextRealm = REALM_IDS.find((id) => !this.progress.realms[id].placed);
    this.ui.showCard({
      pill: COPY.trialPill,
      title: COPY.trialDoneTitle(REALM_COPY[run.realm].name),
      body: [COPY.trialDoneBody(BAND_COPY[band].rank, startChapterFor(band)), BAND_COPY[band].plain],
      buttons: [
        ...(nextRealm
          ? [{ label: COPY.nextGate(REALM_COPY[nextRealm].name), kind: 'primary' as const, onClick: () => this.showTrialIntro(nextRealm) }]
          : [{ label: `${COPY.play}: ${COPY.chapter} ${startChapterFor(band)}`, kind: 'primary' as const, onClick: () => this.startRaid(run.realm, startChapterFor(band)) }]),
        { label: COPY.toKingdom, onClick: () => this.showHome() },
      ],
      note: COPY.practiceNote,
    });
  }

  // ---------------------------------------------------------------- raids and the mock

  private startRaid(realm: RealmId, chapter: number): void {
    playSfx('ui');
    const timer = this.progress.settings.timer;
    let items: Item[];
    let passage: Passage | null = null;
    if (realm === 'reading') {
      const last = this.run?.kind === 'raid' ? this.run.passage?.id : undefined;
      const entry = readingEntryForLevel(chapterLevel(chapter), this.rng, last);
      passage = entry.passage;
      items = readingItems(entry, this.rng);
    } else {
      const weak = weakestCodes(this.progress.domainStats, undefined, 4);
      items = drawItems(realm, chapterLevels(chapter, RAID_SIZE[realm], this.rng), this.rng, weak);
    }
    const raid = createRaid(items, items.map((item) => budgetMs(realm, item.marks, chapter, timer)));
    this.beginBattle({ kind: 'raid', realm, chapter, startedAtMs: Date.now(), passage, raid, phase: 'idle' }, realm);
  }

  private startMock(): void {
    playSfx('ui');
    const timer = this.progress.settings.timer;
    const items: Item[] = [];
    const budgets: (number | null)[] = [];
    for (const part of MOCK_PLAN) {
      const drawn = drawItems(part.realm, chapterLevels(MOCK_CHAPTER, part.count, this.rng), this.rng);
      for (const item of drawn) {
        items.push(item);
        budgets.push(budgetMs(part.realm, item.marks, MOCK_CHAPTER, timer));
      }
    }
    // Mix the order, as the real papers mix topics, but keep the budgets with their items.
    const order = shuffle(this.rng, items.map((_, i) => i));
    const raid = createRaid(order.map((i) => items[i]!), order.map((i) => budgets[i]!));
    this.beginBattle({ kind: 'mock', realm: 'mixed', chapter: MOCK_CHAPTER, startedAtMs: Date.now(), passage: null, raid, phase: 'idle' }, 'mock');
  }

  private beginBattle(run: BattleRun, boss: BossKind): void {
    this.run = run;
    this.stage.showBattle(boss);
    const title = run.kind === 'mock' ? MOCK_COPY.name : `${REALM_COPY[run.realm as RealmId].name} · ${COPY.chapter} ${run.chapter}`;
    const guardian = run.kind === 'mock' ? MOCK_COPY.name : capitalise(REALM_COPY[run.realm as RealmId].boss);
    const total = run.raid.timeLimitMs;
    this.ui.showCard({
      pill: title,
      title: `${guardian} awaits`,
      body: [
        `${run.raid.items.length} questions, ${run.raid.hpMax} marks. Each right answer takes that many marks off the guardian.`,
        total === null ? COPY.noTimer : `The Moon Hourglass holds ${Math.round(total / 60000)} minutes. Quick answers earn stardust for spells.`,
        'A wrong answer never costs you time.',
      ],
      buttons: [
        { label: COPY.begin, kind: 'primary', onClick: () => this.showBattleQuestion(run) },
        { label: COPY.notNow, onClick: () => this.showHome() },
      ],
    });
  }

  private battleTitle(run: BattleRun): string {
    return run.kind === 'mock' ? MOCK_COPY.name : `${REALM_COPY[run.realm as RealmId].name} · ${COPY.chapter} ${run.chapter}`;
  }

  private showBattleQuestion(run: BattleRun): void {
    if (this.run !== run) return;
    const item = currentItem(run.raid);
    if (!item) {
      this.finishBattle(run);
      return;
    }
    run.phase = 'question';
    const passage = item.kind === 'choice' && item.passageId ? (readingEntry(item.passageId)?.passage ?? run.passage) : null;
    this.ui.showQuestion(
      { mode: run.kind, title: this.battleTitle(run), item, passage, spellsAllowed: run.kind === 'raid' },
      {
        onSubmit: (response) => this.answerBattle(run, item, response),
        onSpell: (spell) => this.cast(run, item, spell),
      },
    );
    this.updateHud();
  }

  private cast(run: BattleRun, item: Item, spell: 'hint' | 'slow'): void {
    if (this.run !== run || run.phase !== 'question' || run.kind !== 'raid' || !canCast(run.raid, spell)) return;
    run.raid = castSpell(run.raid, spell);
    playSfx('ability');
    if (spell === 'hint') {
      if (item.kind === 'choice') {
        const wrong = item.options.map((_, i) => i).filter((i) => i !== item.answer);
        this.ui.showHint(null, shuffle(this.rng, wrong).slice(0, 2));
      } else if (item.kind === 'spell') {
        this.ui.showHint(`It starts with "${item.word[0]}" and has ${item.word.length} letters.`);
      } else {
        this.ui.showHint(item.explain[0] ?? null);
      }
    }
    this.updateHud();
  }

  private answerBattle(run: BattleRun, item: Item, response: ItemResponse): void {
    if (this.run !== run || run.phase !== 'question' || currentItem(run.raid) !== item) return;
    const result = markResponse(item, response);
    if (result.status === 'unreadable') {
      this.ui.showNotice(COPY.unreadable);
      return;
    }
    run.raid = answerCurrent(run.raid, result.correct);
    run.phase = 'feedback';
    this.updateHud();
    const nextLabel = run.raid.finished ? COPY.finish : COPY.next;
    const onNext = (): void => (run.raid.finished ? this.finishBattle(run) : this.showBattleQuestion(run));
    if (result.correct) {
      this.stage.hit(result.marks);
      playSfx('attack');
      this.ui.showFeedback({ tone: 'good', heading: COPY.hit(result.marks), lines: [], steps: [] }, nextLabel, onNext);
      return;
    }
    this.stage.blocked();
    playSfx('select');
    const given = response.kind === 'number' ? response.text : '';
    this.ui.showFeedback(
      {
        tone: 'bad',
        heading: COPY.blocked,
        lines: [COPY.answerWas(correctAnswerText(item))],
        steps: item.explain,
        ...(canAskOwl(item, !!this.user) && given.trim() ? { askOwl: () => askOwl(item, given) } : {}),
      },
      nextLabel,
      onNext,
    );
  }

  private finishBattle(run: BattleRun): void {
    if (this.run !== run || run.phase === 'idle') return;
    run.phase = 'idle';
    const raid = run.raid;
    const marks = raidMarks(raid);
    const inTime = raid.endReason === 'done';
    const stars = starsFor(marks, raid.hpMax, inTime);
    const now = Date.now();
    const before = run.kind === 'raid' ? this.progress.realms[run.realm as RealmId].unlocked : 0;
    if (run.kind === 'raid') {
      this.progress = applyRaid(this.progress, run.realm as RealmId, run.chapter, stars, marks, raid.answers, now);
    } else {
      this.progress = applyMock(this.progress, stars, marks, raid.answers, now);
    }
    this.recordSession(run.kind, run.realm, run.chapter, run.startedAtMs, raid.answers, stars);
    void this.persist();
    const won = stars >= CLEAR_STARS;
    if (won) this.stage.defeat();
    playSfx(won ? 'victory' : 'defeat');

    const guardian = run.kind === 'mock' ? MOCK_COPY.name : capitalise(REALM_COPY[run.realm as RealmId].boss);
    const after = run.kind === 'raid' ? this.progress.realms[run.realm as RealmId].unlocked : 0;
    const body = [
      inTime ? COPY.allAnswered : COPY.hourglassOut,
      COPY.marksLine(marks, raid.hpMax),
      `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}  ${COPY.xpLine(xpFor(marks, stars))}`,
      ...(after > before ? [COPY.unlocked(after)] : []),
    ];
    const buttons = [];
    if (run.kind === 'raid' && won && run.chapter < CHAPTERS) {
      const realm = run.realm as RealmId;
      buttons.push({ label: COPY.nextChapter, kind: 'primary' as const, onClick: () => this.startRaid(realm, run.chapter + 1) });
    }
    buttons.push({
      label: COPY.tryAgain,
      kind: buttons.length ? ('ghost' as const) : ('primary' as const),
      onClick: () => (run.kind === 'mock' ? this.startMock() : this.startRaid(run.realm as RealmId, run.chapter)),
    });
    buttons.push({ label: COPY.toKingdom, kind: 'ghost' as const, onClick: () => this.showHome() });
    this.ui.showCard({
      pill: COPY.resultPill,
      title: won ? `You beat ${guardian.replace(/^The /, 'the ')}!` : `${guardian} is still standing.`,
      body,
      buttons,
      note: COPY.practiceNote,
    });
  }

  // ---------------------------------------------------------------- the clock

  tick(deltaMs: number): void {
    const run = this.run;
    if (!run || run.phase !== 'question') return;
    const dt = Math.min(MAX_TICK_MS, Math.max(0, deltaMs));
    if (run.kind === 'trial') {
      run.questionMs += dt;
      if (run.limitMs !== null && run.questionMs >= run.limitMs) {
        this.answerTrial(run, null);
        return;
      }
    } else {
      run.raid = tick(run.raid, dt);
      if (run.raid.finished && run.raid.endReason === 'time') {
        this.finishBattle(run);
        return;
      }
    }
    this.updateHud();
  }

  private updateHud(): void {
    const run = this.run;
    if (!run) return;
    let view: HudView;
    if (run.kind === 'trial') {
      view = {
        progressText: `Question ${run.number}`,
        hp: null,
        hpMax: 0,
        timeLeftMs: run.limitMs === null ? null : Math.max(0, run.limitMs - run.questionMs),
        timeTotalMs: run.limitMs,
        owl: null,
        hero: 0,
        heroIcon: this.heroIcon(),
        stardust: null,
        canHint: false,
        canSlow: false,
        slowActive: false,
      };
    } else {
      const raid = run.raid;
      const pace = paceProgress(raid);
      const ahead = pace.hero - pace.owl;
      const paceText = raid.timeLimitMs === null ? '' : ahead > 0.02 ? COPY.paceAhead : ahead < -0.02 ? COPY.paceBehind : COPY.paceLevel;
      view = {
        // While feedback shows, count the question just answered, not the next one.
        progressText: `Question ${run.phase === 'feedback' ? raid.answers.length : Math.min(raid.index + 1, raid.items.length)} of ${raid.items.length}${paceText ? `  ·  ${paceText}` : ''}`,
        hp: raid.hp,
        hpMax: raid.hpMax,
        timeLeftMs: timeLeftMs(raid),
        timeTotalMs: raid.timeLimitMs,
        owl: raid.timeLimitMs === null ? null : pace.owl,
        hero: pace.hero,
        heroIcon: this.heroIcon(),
        stardust: run.kind === 'raid' ? raid.stardust : null,
        canHint: run.kind === 'raid' && run.phase === 'question' && canCast(raid, 'hint'),
        canSlow: run.kind === 'raid' && run.phase === 'question' && canCast(raid, 'slow'),
        slowActive: raid.slowLeftMs > 0,
      };
    }
    this.ui.updateHud(view);
  }
}
