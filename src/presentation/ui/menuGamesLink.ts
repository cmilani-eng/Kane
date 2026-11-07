/**
 * Accessible Games (hub) control for the Kane title menu.
 * Phaser footer text stays the visible hit target; this DOM twin
 * carries aria-label for keyboard / screen-reader users.
 */
import { subscribeLocale, t } from '../../i18n';

export const MENU_GAMES_LINK_ID = 'kane-menu-games';

const SR_ONLY = [
  'pointer-events-auto fixed top-0 left-0 z-30 m-0 h-px w-px overflow-hidden',
  'border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]',
].join(' ');

let localeWatch: (() => void) | null = null;

export function menuGamesLinkCopy(): { text: string; ariaLabel: string } {
  return {
    text: t('menu.games'),
    ariaLabel: t('menu.gamesAria'),
  };
}

function applyLabels(link: HTMLAnchorElement): void {
  const copy = menuGamesLinkCopy();
  link.textContent = copy.text;
  link.setAttribute('aria-label', copy.ariaLabel);
}

export function showMenuGamesLink(): HTMLAnchorElement {
  let link = document.getElementById(MENU_GAMES_LINK_ID) as HTMLAnchorElement | null;
  if (!link) {
    link = document.createElement('a');
    link.id = MENU_GAMES_LINK_ID;
    link.href = '/';
    link.className = SR_ONLY;
    document.body.appendChild(link);
  }
  applyLabels(link);
  link.hidden = false;
  if (!localeWatch) {
    localeWatch = subscribeLocale(() => {
      const live = document.getElementById(MENU_GAMES_LINK_ID) as HTMLAnchorElement | null;
      if (live && !live.hidden) applyLabels(live);
    });
  }
  return link;
}

export function hideMenuGamesLink(): void {
  const link = document.getElementById(MENU_GAMES_LINK_ID);
  if (link) link.hidden = true;
}
