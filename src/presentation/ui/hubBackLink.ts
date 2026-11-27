/**
 * "← Games" link back to the games picker: the same top-left pill Blob Evolution shows.
 * It sits above the game canvas and follows the locale.
 */
import { subscribeLocale, t } from '../../i18n';

export function mountHubBackLink(parent: HTMLElement): HTMLAnchorElement {
  const link = document.createElement('a');
  link.id = 'hub-back';
  link.href = '/';
  link.className = [
    'pointer-events-auto fixed top-3 left-3 z-[60] rounded-full border border-white/16',
    'bg-[rgb(18_37_60/0.72)] px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.06em]',
    'text-[#b9d8ff]/90 no-underline shadow-[0_4px_14px_rgb(0_0_0/0.28)] hover:brightness-110',
  ].join(' ');
  const label = () => {
    link.textContent = t('hub.back');
    link.setAttribute('aria-label', t('hub.backAria'));
  };
  label();
  subscribeLocale(label);
  parent.append(link);
  return link;
}
