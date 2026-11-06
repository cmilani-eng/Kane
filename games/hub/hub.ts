import './hub.css';
import { GAMES, type GameEntry } from '../registry';

const PILL =
  'inline-block rounded-full px-[11px] py-1.5 text-xs font-extrabold uppercase tracking-[0.08em]';

function pill(text: string, tone: string): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = `${PILL} ${tone}`;
  el.textContent = text;
  return el;
}

function gameCard(game: GameEntry): HTMLLIElement {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = [
    'group flex h-full flex-col items-center rounded-3xl border border-white/16 p-[26px]',
    'bg-linear-145 from-panel-from to-panel-to text-center text-ink no-underline shadow-panel',
    'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent',
  ].join(' ');
  link.href = `./${game.id}/`;

  const pills = document.createElement('div');
  pills.className = 'flex flex-wrap justify-center gap-1.5';
  pills.append(pill(game.tagline, 'bg-pill-bg text-pill'));
  if (game.status === 'experimental') {
    pills.append(pill('Experimental', 'bg-gold-bg text-gold'));
  }

  const title = document.createElement('h2');
  title.className = 'mt-3 text-[clamp(28px,6vw,36px)] font-bold tracking-[-1.5px]';
  title.textContent = game.title;

  const description = document.createElement('p');
  description.className = 'mt-2 mb-[18px] leading-normal text-muted';
  description.textContent = game.description;

  const play = document.createElement('span');
  play.className = [
    'mt-auto inline-flex min-h-12 items-center justify-center rounded-[14px] px-7 py-[13px]',
    'bg-accent text-[15px] font-black uppercase text-ink-dark shadow-key',
    'group-hover:-translate-y-px group-hover:brightness-108',
    'group-active:translate-y-0.5 group-active:shadow-key-pressed',
  ].join(' ');
  play.textContent = 'Play';

  link.append(pills, title, description, play);
  item.append(link);
  return item;
}

const list = document.getElementById('game-list');
if (!list) {
  throw new Error('#game-list root missing');
}
list.append(...GAMES.map(gameCard));
