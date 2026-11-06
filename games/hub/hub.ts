import './hub.css';
import {
  applyDocumentLanguage,
  getLocale,
  LOCALE_CHOICES,
  setLocale,
  subscribeLocale,
} from '../../src/i18n';
import { GAMES, type GameEntry } from '../registry';
import { hubBlurb, hubChrome } from './hubCopy';
import { gamePlayHref, hubLegalHref } from './hubLinks';

const PILL =
  'inline-block rounded-full px-[11px] py-1.5 text-xs font-extrabold uppercase tracking-[0.08em]';

function pill(text: string, tone: string): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = `${PILL} ${tone}`;
  el.textContent = text;
  return el;
}

function statusPill(
  status: GameEntry['status'],
  live: string,
  softLaunch: string,
): HTMLSpanElement {
  if (status === 'live') {
    return pill(live, 'bg-[rgb(123_224_255/0.13)] text-accent');
  }
  return pill(softLaunch, 'bg-gold-bg text-gold');
}

function gameCard(
  game: GameEntry,
  playLabel: string,
  live: string,
  softLaunch: string,
): HTMLLIElement {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = [
    'hub-card group flex h-full flex-col items-center rounded-3xl border border-white/16 p-[26px]',
    'bg-linear-145 from-panel-from to-panel-to text-center text-ink no-underline shadow-panel',
  ].join(' ');
  link.href = gamePlayHref(game.id);

  const pills = document.createElement('div');
  pills.className = 'flex flex-wrap justify-center gap-1.5';
  pills.append(
    pill(game.tagline, 'bg-pill-bg text-pill'),
    statusPill(game.status, live, softLaunch),
  );

  const title = document.createElement('h2');
  title.className = 'mt-3 text-[clamp(28px,6vw,36px)] font-bold tracking-[-1.5px]';
  title.textContent = game.title;

  const description = document.createElement('p');
  description.className = 'mt-2 mb-[18px] leading-normal text-muted';
  description.textContent = hubBlurb(game.id, game.description);

  const play = document.createElement('span');
  play.className = [
    'mt-auto inline-flex min-h-12 items-center justify-center rounded-[14px] px-7 py-[13px]',
    'bg-accent text-[15px] font-black uppercase text-ink-dark shadow-key',
    'group-hover:-translate-y-px group-hover:brightness-108',
    'group-active:translate-y-0.5 group-active:shadow-key-pressed',
  ].join(' ');
  play.textContent = playLabel;

  link.append(pills, title, description, play);
  item.append(link);
  return item;
}

function renderLocale(root: HTMLElement): void {
  const current = getLocale();
  root.replaceChildren(
    ...LOCALE_CHOICES.map((choice) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice.short;
      button.setAttribute('aria-label', choice.label);
      button.setAttribute('aria-pressed', String(choice.id === current));
      button.className = [
        'inline-flex min-h-12 min-w-12 items-center justify-center rounded-xl px-3 text-sm font-extrabold',
        choice.id === current ? 'bg-gold text-ink-dark' : 'bg-white/10 text-ink',
      ].join(' ');
      button.addEventListener('click', () => setLocale(choice.id));
      return button;
    }),
  );
}

function text(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} root missing`);
  return el;
}

function render(): void {
  applyDocumentLanguage();
  const chrome = hubChrome();
  document.title = chrome.documentTitle;
  text('hub-meta').setAttribute('content', chrome.meta);
  text('hub-locale-label').textContent = chrome.language;
  text('hub-title').textContent = chrome.title;
  text('hub-subtitle').textContent = chrome.subtitle;
  const privacy = text('hub-privacy') as HTMLAnchorElement;
  const terms = text('hub-terms') as HTMLAnchorElement;
  privacy.textContent = chrome.privacy;
  terms.textContent = chrome.terms;
  privacy.href = hubLegalHref('privacy');
  terms.href = hubLegalHref('terms');
  renderLocale(text('hub-locale'));
  text('game-list').replaceChildren(
    ...GAMES.map((game) =>
      gameCard(game, chrome.play, chrome.live, chrome.experimental),
    ),
  );
}

render();
subscribeLocale(render);
