/**
 * SATs Quest DOM overlay: every screen, question and control. DOM (not Phaser text) is used
 * for text and input so it reflows, works with screen readers and keyboards, can switch to an
 * easier-to-read font, and never pops a phone keyboard over the game for number answers.
 * All content is inserted with textContent — never innerHTML.
 *
 * Called by: satsController.ts
 */
import './satsQuest.css';
import { BAND_COPY, COLOUR_HEX, COPY, GAME_TITLE, HERO_COPY, MOCK_COPY, REALM_COPY, TIMER_COPY } from './satsCopy';
import { HERO_COLOURS, HEROES, type HeroColour, type HeroId } from './satsSave';
import { TIMER_MODES, type BandOrUnplaced, type Item, type ItemResponse, type Passage, type RealmId, type TimerMode } from './satsTypes';

type Child = Node | string | null | undefined | false;

interface ElProps {
  readonly class?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string>>;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: ElProps = {}, children: readonly Child[] = []): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [k, v] of Object.entries(props.attrs ?? {})) node.setAttribute(k, v);
  for (const child of children) if (child) node.append(child);
  return node;
}

function button(label: string, onClick: () => void, cls = 'sq-btn sq-ghost', attrs: Record<string, string> = {}): HTMLButtonElement {
  const b = el('button', { class: cls, text: label, attrs: { type: 'button', ...attrs } });
  b.addEventListener('click', onClick);
  return b;
}

/** Text with a/b fractions drawn stacked, the way they look on a test paper. */
export function mathNodes(text: string): Node[] {
  const out: Node[] = [];
  const re = /(\d+)\/(\d+)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(document.createTextNode(text.slice(last, m.index)));
    out.push(
      el('span', { class: 'sq-frac', attrs: { 'aria-hidden': 'true' } }, [el('span', { text: m[1]! }), el('span', { text: m[2]! })]),
      el('span', { class: 'sq-sr', text: `${m[1]}/${m[2]}` }),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Read aloud with an English (preferably British) voice, slowly, like a teacher would. */
export function speak(text: string): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-GB';
  utterance.rate = 0.85;
  const voices = synth.getVoices();
  const voice = voices.find((v) => v.lang === 'en-GB') ?? voices.find((v) => v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const starText = (stars: number): string => '★'.repeat(stars) + '☆'.repeat(3 - stars);

// ------------------------------------------------------------------ view models

export interface ButtonSpec {
  readonly label: string;
  readonly onClick: () => void;
  readonly kind?: 'primary' | 'ghost' | 'danger';
}

export interface CardSpec {
  readonly pill?: string;
  readonly title: string;
  readonly body?: readonly string[];
  readonly list?: readonly string[];
  readonly buttons: readonly ButtonSpec[];
  readonly note?: string;
}

export interface HomeRealmView {
  readonly id: RealmId;
  readonly band: BandOrUnplaced;
  readonly placed: boolean;
  readonly unlocked: number;
  readonly stars: readonly number[];
}

export interface HomeView {
  readonly hero: HeroId;
  readonly colour: HeroColour;
  readonly xp: number;
  readonly realms: readonly HomeRealmView[];
  readonly mockOpen: boolean;
  readonly mockBest: number;
  readonly trialLeft: number;
}

export interface HomeHandlers {
  readonly onTrial: () => void;
  readonly onRealmTrial: (realm: RealmId) => void;
  readonly onPlay: (realm: RealmId, chapter: number) => void;
  readonly onMock: () => void;
  readonly onSettings: () => void;
  readonly onAbout: () => void;
}

export interface QuestionView {
  readonly mode: 'trial' | 'raid' | 'mock';
  readonly title: string;
  readonly item: Item;
  readonly passage: Passage | null;
  readonly spellsAllowed: boolean;
}

export interface HudView {
  readonly progressText: string;
  readonly hp: number | null;
  readonly hpMax: number;
  readonly timeLeftMs: number | null;
  readonly timeTotalMs: number | null;
  readonly owl: number | null;
  readonly hero: number;
  readonly heroIcon: string;
  readonly stardust: number | null;
  readonly canHint: boolean;
  readonly canSlow: boolean;
  readonly slowActive: boolean;
}

export interface QuestionHandlers {
  readonly onSubmit: (response: ItemResponse) => void;
  readonly onSpell: (spell: 'hint' | 'slow') => void;
}

export interface OwlSteps {
  readonly steps: readonly string[];
  readonly tip: string;
}

export interface FeedbackView {
  readonly tone: 'good' | 'bad' | 'neutral';
  readonly heading: string;
  readonly lines: readonly string[];
  readonly steps: readonly string[];
  readonly askOwl?: () => Promise<OwlSteps | null>;
}

export interface SettingsView {
  readonly timer: TimerMode;
  readonly dyslexia: boolean;
  readonly reduce: boolean;
}

export interface SettingsHandlers {
  readonly onTimer: (timer: TimerMode) => void;
  readonly onDyslexia: (on: boolean) => void;
  readonly onReduce: (on: boolean) => void;
  readonly onDone: () => void;
}

// ------------------------------------------------------------------ the overlay

export class SatsUi {
  readonly root: HTMLDivElement;
  private readonly saveChip: HTMLDivElement;
  private card: HTMLDivElement | null = null;
  private observer: ResizeObserver | null = null;
  private hud: {
    timer?: HTMLDivElement;
    bar?: HTMLSpanElement;
    owl?: HTMLSpanElement;
    heroMark?: HTMLSpanElement;
    dust?: HTMLSpanElement;
    hint?: HTMLButtonElement;
    slow?: HTMLButtonElement;
    progress?: HTMLSpanElement;
  } = {};
  private inputs: (HTMLButtonElement | HTMLInputElement)[] = [];
  private choiceButtons: HTMLButtonElement[] = [];
  private notice: HTMLParagraphElement | null = null;
  private hintLine: HTMLParagraphElement | null = null;
  private feedbackHost: HTMLDivElement | null = null;
  private preferSpellChoices = false;

  constructor(
    private readonly onExit: () => void,
    private readonly onPanelHeight: (px: number) => void,
  ) {
    this.root = el('div', { class: 'sq-root', attrs: { 'data-sats-quest': '' } });
    const back = button(COPY.back, () => this.onExit(), 'sq-back', { 'aria-label': COPY.backAria });
    this.saveChip = el('div', { class: 'sq-save', attrs: { role: 'status', 'aria-live': 'polite' } });
    this.saveChip.hidden = true;
    this.root.append(back, this.saveChip);
    document.body.append(this.root);
  }

  setModes(dyslexia: boolean, reduce: boolean): void {
    this.root.classList.toggle('sq-dys', dyslexia);
    this.root.classList.toggle('sq-reduce', reduce);
  }

  setSaveNote(text: string | null): void {
    this.saveChip.hidden = !text;
    this.saveChip.textContent = text ?? '';
  }

  destroy(): void {
    stopSpeaking();
    this.observer?.disconnect();
    this.root.remove();
  }

  /** Forget the previous screen's controls. Call before building a new screen. */
  private reset(): void {
    stopSpeaking();
    this.hud = {};
    this.inputs = [];
    this.choiceButtons = [];
    this.notice = null;
    this.hintLine = null;
    this.feedbackHost = null;
  }

  /** Swap in a built screen. Must not touch the control references the builder just set. */
  private mount(card: HTMLDivElement, centre: boolean): void {
    this.observer?.disconnect();
    this.card?.remove();
    this.root.classList.toggle('sq-centre', centre);
    this.card = card;
    this.root.append(card);
    card.scrollTop = 0;
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.onPanelHeight(centre ? 0 : card.getBoundingClientRect().height));
      this.observer.observe(card);
    }
    this.onPanelHeight(centre ? 0 : card.getBoundingClientRect().height);
  }

  private focusFirst(selector = 'input, button.sq-primary, button.sq-btn'): void {
    const target = this.card?.querySelector<HTMLElement>(selector);
    target?.focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- simple cards

  showCard(spec: CardSpec): void {
    this.reset();
    const card = el('div', { class: 'sq-card', attrs: { role: 'dialog', 'aria-modal': 'false', 'aria-label': spec.title } }, [
      spec.pill && el('span', { class: 'sq-pill', text: spec.pill }),
      el('h2', { class: 'sq-title', text: spec.title }),
      ...(spec.body ?? []).map((p) => el('p', { class: 'sq-body', text: p })),
      spec.list && el('ul', { class: 'sq-list' }, spec.list.map((li) => el('li', { text: li }))),
      el(
        'div',
        { class: 'sq-row' },
        spec.buttons.map((b) => button(b.label, b.onClick, `sq-btn ${b.kind === 'primary' ? 'sq-primary' : b.kind === 'danger' ? 'sq-danger' : 'sq-ghost'}`)),
      ),
      spec.note && el('p', { class: 'sq-note', text: spec.note }),
    ]);
    this.mount(card, true);
    this.focusFirst('button.sq-primary, button.sq-danger, button.sq-btn');
  }

  showHeroPicker(hero: HeroId | null, colour: HeroColour, onDone: (hero: HeroId, colour: HeroColour) => void): void {
    this.reset();
    let picked: HeroId = hero ?? 'knight';
    let tint: HeroColour = colour;
    const heroButtons = HEROES.map((id) => {
      const copy = HERO_COPY[id];
      const b = el('button', { class: 'sq-btn sq-ghost sq-hero', attrs: { type: 'button', 'aria-pressed': String(id === picked) } }, [
        el('span', { class: 'sq-icon', text: copy.icon, attrs: { 'aria-hidden': 'true' } }),
        el('strong', { text: copy.name }),
        el('small', { text: copy.line }),
      ]);
      b.addEventListener('click', () => {
        picked = id;
        heroButtons.forEach((x, i) => x.setAttribute('aria-pressed', String(HEROES[i] === id)));
      });
      return b;
    });
    const colourButtons = HERO_COLOURS.map((c) => {
      const b = el('button', {
        class: 'sq-colour',
        attrs: { type: 'button', 'aria-label': c, 'aria-pressed': String(c === tint), style: `background:${COLOUR_HEX[c]}` },
      });
      b.addEventListener('click', () => {
        tint = c;
        colourButtons.forEach((x, i) => x.setAttribute('aria-pressed', String(HERO_COLOURS[i] === c)));
      });
      return b;
    });
    const card = el('div', { class: 'sq-card', attrs: { role: 'dialog', 'aria-label': COPY.heroTitle } }, [
      el('span', { class: 'sq-pill', text: GAME_TITLE }),
      el('h2', { class: 'sq-title', text: COPY.heroTitle }),
      el('p', { class: 'sq-body', text: COPY.heroBody }),
      el('div', { class: 'sq-heroes' }, heroButtons),
      el('div', { class: 'sq-colours', attrs: { role: 'group', 'aria-label': 'Colour' } }, colourButtons),
      el('div', { class: 'sq-row' }, [button(COPY.heroGo, () => onDone(picked, tint), 'sq-btn sq-primary')]),
    ]);
    this.mount(card, true);
    this.focusFirst('.sq-hero');
  }

  showHome(view: HomeView, handlers: HomeHandlers): void {
    this.reset();
    const hero = HERO_COPY[view.hero];
    const realmCards = view.realms.map((r) => {
      const copy = REALM_COPY[r.id];
      const band = BAND_COPY[r.band];
      const chapters = el(
        'div',
        { class: 'sq-chapters', attrs: { role: 'group', 'aria-label': `${copy.name} chapters` } },
        [1, 2, 3, 4, 5].map((c) => {
          const open = r.placed && c <= r.unlocked;
          const stars = r.stars[c - 1] ?? 0;
          const b = el('button', {
            class: `sq-btn ${open ? 'sq-primary' : 'sq-ghost'} sq-chapter`,
            attrs: {
              type: 'button',
              'aria-label': open ? `${COPY.chapter} ${c}, ${stars} of 3 stars` : `${COPY.chapter} ${c}, ${COPY.locked}`,
            },
          }, [el('div', { text: String(c) }), el('div', { class: 'sq-stars', text: open ? starText(stars) : '🔒', attrs: { 'aria-hidden': 'true' } })]);
          b.disabled = !open;
          b.addEventListener('click', () => handlers.onPlay(r.id, c));
          return b;
        }),
      );
      return el('section', { class: 'sq-realm', attrs: { 'aria-label': copy.name } }, [
        el('h3', { text: `${copy.icon} ${copy.name}` }),
        el('div', { class: 'sq-sub', text: copy.subject }),
        el('div', { class: 'sq-rank', text: band.rank }),
        el('div', { class: 'sq-sub', text: band.plain }),
        r.placed ? chapters : button(COPY.takeTrial, () => handlers.onRealmTrial(r.id), 'sq-btn sq-primary'),
        r.placed && button(COPY.retakeTrial, () => handlers.onRealmTrial(r.id), 'sq-btn sq-ghost'),
      ]);
    });
    const mock = el('section', { class: 'sq-realm', attrs: { 'aria-label': MOCK_COPY.name } }, [
      el('h3', { text: `${MOCK_COPY.icon} ${MOCK_COPY.name}` }),
      el('div', { class: 'sq-sub', text: MOCK_COPY.blurb }),
      view.mockOpen && el('div', { class: 'sq-stars', text: starText(view.mockBest), attrs: { 'aria-label': `${view.mockBest} of 3 stars` } }),
      view.mockOpen ? button(COPY.play, handlers.onMock, 'sq-btn sq-primary') : el('div', { class: 'sq-sub', text: `🔒 ${COPY.locked}` }),
    ]);
    const card = el('div', { class: 'sq-card', attrs: { role: 'region', 'aria-label': GAME_TITLE } }, [
      el('span', { class: 'sq-pill', text: COPY.homePill }),
      el('h2', { class: 'sq-title' }, [
        el('span', { text: `${hero.icon} `, attrs: { 'aria-hidden': 'true', style: `text-shadow:0 0 14px ${COLOUR_HEX[view.colour]}` } }),
        GAME_TITLE,
      ]),
      el('p', { class: 'sq-body', text: `${COPY.homeBody}  ·  ${view.xp} ${COPY.xp}` }),
      view.trialLeft > 0 &&
        el('div', { class: 'sq-row' }, [button(view.trialLeft === 5 ? COPY.trialCta : COPY.trialCtaMore, handlers.onTrial, 'sq-btn sq-primary')]),
      view.trialLeft > 0 && el('p', { class: 'sq-note', text: COPY.trialExplain }),
      el('div', { class: 'sq-realms' }, [...realmCards, mock]),
      el('div', { class: 'sq-row' }, [button(COPY.settings, handlers.onSettings), button(COPY.aboutData, handlers.onAbout)]),
      el('p', { class: 'sq-note', text: COPY.practiceNote }),
    ]);
    this.mount(card, false);
  }

  showSettings(view: SettingsView, handlers: SettingsHandlers): void {
    this.reset();
    const timerInputs = TIMER_MODES.map((mode) => {
      const input = el('input', { attrs: { type: 'radio', name: 'sq-timer', value: mode } });
      input.checked = mode === view.timer;
      input.addEventListener('change', () => input.checked && handlers.onTimer(mode));
      return el('label', {}, [input, el('span', {}, [TIMER_COPY[mode].label, el('small', { text: TIMER_COPY[mode].help })])]);
    });
    const check = (label: string, help: string, value: boolean, onChange: (on: boolean) => void) => {
      const input = el('input', { attrs: { type: 'checkbox' } });
      input.checked = value;
      input.addEventListener('change', () => onChange(input.checked));
      return el('label', {}, [input, el('span', {}, [label, el('small', { text: help })])]);
    };
    const card = el('div', { class: 'sq-card sq-settings', attrs: { role: 'dialog', 'aria-label': COPY.settingsTitle } }, [
      el('h2', { class: 'sq-title', text: COPY.settingsTitle }),
      el('fieldset', {}, [el('legend', { text: COPY.timerHeading }), ...timerInputs]),
      el('fieldset', {}, [
        check(COPY.dyslexiaFont, COPY.dyslexiaHelp, view.dyslexia, handlers.onDyslexia),
        check(COPY.reduceMotion, COPY.reduceMotionHelp, view.reduce, handlers.onReduce),
      ]),
      el('div', { class: 'sq-row' }, [button(COPY.done, handlers.onDone, 'sq-btn sq-primary')]),
    ]);
    this.mount(card, true);
    this.focusFirst('input');
  }

  // ---------------------------------------------------------------- questions

  showQuestion(view: QuestionView, handlers: QuestionHandlers): void {
    this.reset();
    const item = view.item;
    const timer = el('div', { class: 'sq-timer', attrs: { role: 'timer', 'aria-live': 'off' } });
    const progress = el('span');
    const bar = el('span', { attrs: { style: 'width:100%' } });
    const owl = el('span', { text: '🦉', attrs: { 'aria-hidden': 'true', style: 'left:4%' } });
    const heroMark = el('span', { attrs: { 'aria-hidden': 'true', style: 'left:4%' } });
    const dust = el('span');
    const hint = button(`✨ ${COPY.hintSpell} (2)`, () => handlers.onSpell('hint'), 'sq-btn sq-ghost sq-spell');
    const slow = button(`⏳ ${COPY.slowSpell} (3)`, () => handlers.onSpell('slow'), 'sq-btn sq-ghost sq-spell');
    const battle = view.mode !== 'trial';
    const hudBox = el('div', { class: 'sq-hud' }, [
      el('div', { class: 'sq-hud-title', text: view.title }),
      timer,
      battle && el('div', { class: 'sq-bar', attrs: { role: 'img', 'aria-label': COPY.bossHealth } }, [bar]),
      battle && el('div', { class: 'sq-track', attrs: { 'aria-hidden': 'true' } }, [owl, heroMark]),
      el('div', { class: 'sq-hud-meta' }, [progress, view.spellsAllowed && dust, view.spellsAllowed && hint, view.spellsAllowed && slow]),
    ]);
    this.hud = { timer, progress, bar, owl, heroMark, dust, hint, slow };

    this.notice = el('p', { class: 'sq-notice', attrs: { role: 'status', 'aria-live': 'polite' } });
    this.hintLine = el('p', { class: 'sq-body' });
    this.hintLine.hidden = true;
    this.feedbackHost = el('div');

    const card = el('div', { class: 'sq-card', attrs: { role: 'region', 'aria-label': view.title } }, [
      hudBox,
      view.passage && this.passageBox(view.passage),
      ...this.questionBody(item, handlers),
      this.hintLine,
      this.notice,
      this.feedbackHost,
    ]);
    this.mount(card, false);
    this.focusFirst(item.kind === 'number' || item.kind === 'spell' ? 'input, .sq-choice' : '.sq-choice, .sq-token');
  }

  private passageBox(passage: Passage): HTMLDetailsElement {
    const box = el('details', { class: 'sq-passage' }, [
      el('summary', { text: `${COPY.passage}: ${passage.title}` }),
      el('div', { class: 'sq-text', attrs: { tabindex: '0' } }, [
        el('h4', { text: passage.title }),
        ...passage.paragraphs.map((p) => el('p', { text: p })),
      ]),
    ]);
    box.open = true;
    return box;
  }

  private questionBody(item: Item, handlers: QuestionHandlers): Node[] {
    const lock = (): void => {
      for (const i of this.inputs) i.disabled = true;
    };
    switch (item.kind) {
      case 'number': {
        const prompt = el('div', { class: `sq-prompt${item.realm === 'reasoning' ? ' sq-words' : ''}` }, mathNodes(item.prompt));
        const input = el('input', {
          class: 'sq-input',
          attrs: { type: 'text', inputmode: 'none', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Your answer', maxlength: '16' },
        });
        input.addEventListener('input', () => {
          input.value = input.value.replace(/[^0-9.,/ \-−£]/g, '');
        });
        const submit = (): void => {
          lock();
          handlers.onSubmit({ kind: 'number', text: input.value });
        };
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        });
        const press = (text: string) => () => {
          if (text === '⌫') input.value = input.value.slice(0, -1);
          else if (input.value.length < 16) input.value += text;
          input.focus({ preventScroll: true });
        };
        const keys = ['7', '8', '9', '/', '⌫', '4', '5', '6', '.', '−', '1', '2', '3', '0', ' '];
        const keypad = el(
          'div',
          { class: 'sq-keypad', attrs: { role: 'group', 'aria-label': 'Number keys' } },
          keys.map((k) =>
            button(k === ' ' ? '␣' : k, press(k === '−' ? '-' : k), 'sq-btn sq-ghost', {
              'aria-label': k === '⌫' ? 'Delete' : k === ' ' ? 'Space (for mixed numbers like 1 1/2)' : k === '/' ? 'Fraction bar' : k === '−' ? 'Minus' : k,
            }),
          ),
        );
        const check = button(COPY.check, submit, 'sq-btn sq-primary sq-key-wide');
        keypad.append(check);
        this.inputs = [input, ...Array.from(keypad.querySelectorAll('button'))];
        return [
          prompt,
          el('div', { class: 'sq-answer' }, [
            item.unitBefore && el('span', { class: 'sq-unit', text: item.unitBefore }),
            input,
            item.unitAfter && el('span', { class: 'sq-unit', text: item.unitAfter }),
          ]),
          keypad,
          el('p', { class: 'sq-note', text: 'Fractions: use / (3/4). Mixed numbers: 1 ␣ 1/2.' }),
        ];
      }
      case 'choice': {
        const prompt = el('div', { class: 'sq-prompt sq-words' }, mathNodes(item.prompt));
        this.choiceButtons = item.options.map((option, index) =>
          button(option, () => {
            lock();
            handlers.onSubmit({ kind: 'choice', index });
          }, 'sq-btn sq-ghost sq-choice'),
        );
        this.inputs = [...this.choiceButtons];
        return [prompt, el('div', { class: 'sq-choices' }, this.choiceButtons)];
      }
      case 'tapWord': {
        const prompt = el('div', { class: 'sq-prompt sq-words', text: item.prompt });
        const tokens = item.tokens.map((token, index) =>
          button(token, () => {
            lock();
            handlers.onSubmit({ kind: 'tapWord', index });
          }, 'sq-btn sq-ghost sq-token'),
        );
        this.inputs = tokens;
        return [prompt, el('div', { class: 'sq-tokens', attrs: { role: 'group', 'aria-label': 'Words in the sentence' } }, tokens)];
      }
      case 'spell':
        return this.spellBody(item, handlers, lock);
    }
  }

  private spellBody(item: Extract<Item, { kind: 'spell' }>, handlers: QuestionHandlers, lock: () => void): Node[] {
    const host = el('div');
    const say = (): void => speak(`${item.word}. ${item.sentence} ${item.word}.`);
    const chooseMode = (): void => {
      // Once a child asks to choose, keep offering choices for the rest of this visit.
      this.preferSpellChoices = true;
      stopSpeaking();
      host.replaceChildren(
        el('p', { class: 'sq-note', text: canSpeak() ? COPY.chooseSpelling : COPY.noVoice }),
        el(
          'div',
          { class: 'sq-choices' },
          (this.choiceButtons = item.options.map((option) =>
            button(option, () => {
              lock();
              handlers.onSubmit({ kind: 'spell', text: option });
            }, 'sq-btn sq-ghost sq-choice'),
          )),
        ),
      );
      this.inputs = [...this.choiceButtons];
      this.choiceButtons[0]?.focus({ preventScroll: true });
    };
    if (!canSpeak() || this.preferSpellChoices) {
      chooseMode();
    } else {
      const input = el('input', {
        class: 'sq-input',
        attrs: {
          type: 'text',
          autocomplete: 'off',
          autocapitalize: 'none',
          autocorrect: 'off',
          spellcheck: 'false',
          'aria-label': COPY.typeWord,
          maxlength: '24',
        },
      });
      const submit = (): void => {
        lock();
        handlers.onSubmit({ kind: 'spell', text: input.value });
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
      const hear = button(`🔊 ${COPY.hearWord}`, say);
      const check = button(COPY.check, submit, 'sq-btn sq-primary');
      const cannot = button(COPY.cannotHear, chooseMode);
      this.inputs = [input, hear, check, cannot];
      host.append(el('div', { class: 'sq-answer' }, [input]), el('div', { class: 'sq-row' }, [hear, check, cannot]));
      // Read the word as soon as the question appears (this follows a button press).
      setTimeout(say, 150);
    }
    return [el('div', { class: 'sq-prompt sq-words', text: item.prompt }), el('p', { class: 'sq-gap', text: item.gapped }), host];
  }

  updateHud(view: HudView): void {
    const h = this.hud;
    if (!h.timer) return;
    if (view.timeLeftMs === null) {
      h.timer.textContent = COPY.noTimer;
      h.timer.classList.remove('sq-low');
    } else {
      h.timer.textContent = `⏳ ${clock(view.timeLeftMs)}`;
      h.timer.setAttribute('aria-label', `${COPY.timeLeft} ${clock(view.timeLeftMs)}`);
      const low = view.timeTotalMs !== null && view.timeLeftMs < Math.min(30_000, view.timeTotalMs * 0.2);
      h.timer.classList.toggle('sq-low', low);
    }
    h.progress!.textContent = view.progressText;
    if (view.hp !== null) {
      h.bar!.style.width = `${view.hpMax > 0 ? Math.max(0, (view.hp / view.hpMax) * 100) : 0}%`;
      h.bar!.parentElement?.setAttribute('aria-label', `${COPY.bossHealth}: ${view.hp} of ${view.hpMax}`);
    }
    if (view.owl !== null) h.owl!.style.left = `${4 + view.owl * 92}%`;
    else h.owl!.hidden = true;
    h.heroMark!.textContent = view.heroIcon;
    h.heroMark!.style.left = `${4 + view.hero * 92}%`;
    if (view.stardust !== null) h.dust!.textContent = `⭐ ${COPY.stardust}: ${view.stardust}`;
    h.hint!.disabled = !view.canHint;
    h.slow!.disabled = !view.canSlow;
    h.slow!.textContent = view.slowActive ? `⏳ ${COPY.slowSpell}…` : `⏳ ${COPY.slowSpell} (3)`;
  }

  /** Unlock the inputs and say why (e.g. an answer that could not be read). */
  showNotice(text: string): void {
    for (const i of this.inputs) i.disabled = false;
    if (this.notice) this.notice.textContent = text;
    this.card?.querySelector<HTMLInputElement>('input.sq-input')?.focus({ preventScroll: true });
  }

  /** A hint spell: cross out options, or show a first step. */
  showHint(text: string | null, crossOut: readonly number[] = []): void {
    crossOut.forEach((i) => {
      const b = this.choiceButtons[i];
      if (!b) return;
      b.disabled = true;
      b.classList.add('sq-out');
    });
    if (text && this.hintLine) {
      this.hintLine.hidden = false;
      this.hintLine.textContent = `✨ ${text}`;
    }
  }

  showFeedback(view: FeedbackView, nextLabel: string, onNext: () => void): void {
    if (!this.feedbackHost) return;
    for (const i of this.inputs) i.disabled = true;
    if (this.notice) this.notice.textContent = '';
    const steps = el('ol', {}, view.steps.map((s) => el('li', {}, mathNodes(s))));
    const owlBox = el('div');
    const box = el('div', { class: `sq-feedback sq-${view.tone}`, attrs: { role: 'status', 'aria-live': 'polite' } }, [
      el('h4', { text: view.heading }),
      ...view.lines.map((l) => el('p', { class: 'sq-body' }, mathNodes(l))),
      view.steps.length > 0 && el('p', { class: 'sq-note', text: COPY.howTo }),
      view.steps.length > 0 && steps,
      owlBox,
    ]);
    const row = el('div', { class: 'sq-row' });
    if (view.askOwl) {
      const ask = view.askOwl;
      const owlButton = button(`🦉 ${COPY.askOwl}`, () => {
        owlButton.disabled = true;
        owlBox.replaceChildren(el('p', { class: 'sq-note', text: COPY.owlThinking }));
        void ask().then((reply) => {
          owlBox.replaceChildren(
            reply
              ? el('div', {}, [
                  el('ol', {}, reply.steps.map((s) => el('li', {}, mathNodes(s)))),
                  reply.tip ? el('p', { class: 'sq-body', text: `🦉 ${reply.tip}` }) : null,
                ])
              : el('p', { class: 'sq-note', text: COPY.owlUnavailable }),
          );
        });
      });
      row.append(owlButton);
    }
    const next = button(nextLabel, onNext, 'sq-btn sq-primary');
    row.append(next);
    this.feedbackHost.replaceChildren(box, row);
    next.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest' });
  }
}
