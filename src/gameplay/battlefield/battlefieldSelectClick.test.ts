import { describe, expect, it } from 'vitest';
import {
  selectsWholeType,
  type SelectTypeClick,
} from './battlefieldSelectClick';

const click = (over: Partial<SelectTypeClick> = {}): SelectTypeClick => ({
  additive: false,
  ctrlKey: false,
  metaKey: false,
  doubleTap: false,
  ...over,
});

describe('selectsWholeType', () => {
  it('leaves a plain click as a single select', () => {
    expect(selectsWholeType(click())).toBe(false);
  });

  it('selects the whole type on Ctrl+click, Cmd+click or a double-tap', () => {
    expect(selectsWholeType(click({ ctrlKey: true }))).toBe(true);
    expect(selectsWholeType(click({ metaKey: true }))).toBe(true);
    expect(selectsWholeType(click({ doubleTap: true }))).toBe(true);
  });

  it('lets Shift keep the add/toggle behaviour', () => {
    expect(
      selectsWholeType(click({ additive: true, ctrlKey: true, doubleTap: true })),
    ).toBe(false);
  });
});
