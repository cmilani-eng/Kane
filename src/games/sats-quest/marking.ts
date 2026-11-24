/**
 * Marks one response against its item. Numeric answers accept any equivalent value
 * (3/4 = 6/8 = 0.75), as STA arithmetic mark schemes generally do; an answer that cannot be
 * read as a number is "unreadable" so the game asks again instead of marking a typo wrong.
 *
 * Called by: satsController.ts. Tested by: marking.test.ts
 */
import { eq, parseAnswer } from './rational';
import type { Item, ItemResponse } from './satsTypes';

export type MarkResult =
  | { readonly status: 'marked'; readonly correct: boolean; readonly marks: number }
  | { readonly status: 'unreadable' };

/** Strip a leading £ and a trailing unit (cm, m², minutes…) that the child may have typed. */
export function stripUnits(text: string, unitAfter?: string): string {
  let t = text.trim().replace(/^£\s*/, '');
  if (unitAfter && t.toLowerCase().endsWith(unitAfter.toLowerCase())) t = t.slice(0, -unitAfter.length);
  return t.replace(/\s*(cm|mm|km|m|kg|g|ml|l|minutes|mins|min|drops|p)?[²³]?$/i, '').trim();
}

export function normaliseSpelling(text: string): string {
  return text.trim().toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ');
}

export function markResponse(item: Item, response: ItemResponse): MarkResult {
  const marked = (correct: boolean): MarkResult => ({ status: 'marked', correct, marks: correct ? item.marks : 0 });

  switch (item.kind) {
    case 'number': {
      if (response.kind !== 'number') return { status: 'unreadable' };
      const value = parseAnswer(stripUnits(response.text, item.unitAfter));
      if (!value) return { status: 'unreadable' };
      return marked(eq(value, item.answer));
    }
    case 'choice':
      if (response.kind !== 'choice' || !Number.isInteger(response.index)) return { status: 'unreadable' };
      if (response.index < 0 || response.index >= item.options.length) return { status: 'unreadable' };
      return marked(response.index === item.answer);
    case 'tapWord':
      if (response.kind !== 'tapWord' || !Number.isInteger(response.index)) return { status: 'unreadable' };
      if (response.index < 0 || response.index >= item.tokens.length) return { status: 'unreadable' };
      return marked(response.index === item.answer);
    case 'spell': {
      if (response.kind !== 'spell') return { status: 'unreadable' };
      const typed = normaliseSpelling(response.text);
      if (!typed) return { status: 'unreadable' };
      return marked(typed === normaliseSpelling(item.word));
    }
  }
}

/** The correct answer as text, for feedback. */
export function correctAnswerText(item: Item): string {
  switch (item.kind) {
    case 'number':
      return item.display.startsWith('£') || !item.unitBefore ? item.display : `${item.unitBefore}${item.display}`;
    case 'choice':
      return item.options[item.answer]!;
    case 'tapWord':
      return item.tokens[item.answer]!.replace(/[.,!?;:]+$/, '');
    case 'spell':
      return item.word;
  }
}
