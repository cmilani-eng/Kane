/**
 * Picker-style dialog card, built in DOM with Tailwind. It copies the look of the Blob
 * Evolution game-over card and the games picker: a rounded navy card, a small pill tag,
 * a large title, a short body and a 3D primary button.
 */

export const PICKER_CARD_CLASSES = [
  'mx-auto w-[min(520px,calc(100%-32px))] rounded-[28px] border border-white/10',
  'bg-[linear-gradient(145deg,#12253c,#081221)] px-8 py-8 text-center text-[#f5f8ff]',
  'shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
].join(' ');

export const PICKER_TAG_CLASSES =
  'inline-block rounded-full bg-[rgb(120_180_255/0.13)] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#b9d8ff]';

export const PICKER_TITLE_CLASSES =
  'mt-3 text-[clamp(28px,6vw,40px)] font-black tracking-[-1px] text-[#f5f8ff]';

export const PICKER_BODY_CLASSES = 'mt-3 text-[16px] leading-normal text-[#bdcce0]';

export const PICKER_BUTTON_CLASSES = [
  'mt-6 inline-flex min-h-12 items-center justify-center rounded-[14px] bg-[#9dff6a] px-7 py-[13px]',
  'text-[15px] font-black uppercase text-[#06121f] shadow-[0_5px_0_#4a9a2c]',
  'hover:brightness-108 active:translate-y-0.5 active:shadow-[0_2px_0_#4a9a2c]',
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
].join(' ');

export interface PickerCardOptions {
  tag: string;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}

/** Builds the card. The caller attaches it to the page. */
export function buildPickerCard({ tag, title, body, action }: PickerCardOptions): HTMLDivElement {
  const card = document.createElement('div');
  card.className = PICKER_CARD_CLASSES;

  const pill = document.createElement('span');
  pill.className = PICKER_TAG_CLASSES;
  pill.textContent = tag;

  const heading = document.createElement('h2');
  heading.className = PICKER_TITLE_CLASSES;
  heading.textContent = title;

  const copy = document.createElement('p');
  copy.className = PICKER_BODY_CLASSES;
  copy.textContent = body;

  card.append(pill, heading, copy);

  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = PICKER_BUTTON_CLASSES;
    button.textContent = action.label;
    button.addEventListener('click', action.onClick);
    card.append(button);
  }
  return card;
}
