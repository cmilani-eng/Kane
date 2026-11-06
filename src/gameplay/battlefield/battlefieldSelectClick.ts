/**
 * Decides when a left click on a player unit selects every unit of its type.
 * Pure (no Phaser) so the modifier rules are unit-tested.
 */
export interface SelectTypeClick {
  /** Shift is held: the click adds or toggles instead. */
  additive: boolean;
  ctrlKey: boolean;
  /** Cmd on macOS, which reports Ctrl+click as a right-click. */
  metaKey: boolean;
  /** Second click on the same unit inside the double-click window. */
  doubleTap: boolean;
}

export function selectsWholeType(c: SelectTypeClick): boolean {
  return !c.additive && (c.ctrlKey || c.metaKey || c.doubleTap);
}
