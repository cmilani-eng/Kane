import './hub.css';
import { GAMES, type GameEntry } from '../registry';

function gameCard(game: GameEntry): HTMLLIElement {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.className = 'game-card';
  link.href = `./${game.id}/`;

  const title = document.createElement('h2');
  title.textContent = game.title;
  if (game.status === 'experimental') {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'Experimental';
    title.append(' ', badge);
  }

  const tagline = document.createElement('p');
  tagline.className = 'tagline';
  tagline.textContent = game.tagline;

  const description = document.createElement('p');
  description.textContent = game.description;

  const play = document.createElement('span');
  play.className = 'play';
  play.textContent = 'Play';

  link.append(title, tagline, description, play);
  item.append(link);
  return item;
}

const list = document.getElementById('game-list');
if (!list) {
  throw new Error('#game-list root missing');
}
list.append(...GAMES.map(gameCard));
