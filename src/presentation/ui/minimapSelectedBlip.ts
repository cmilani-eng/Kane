/**
 * Style for selected-unit minimap blips (drawn above other dots).
 * Gold/cream fill so selection reads at a glance on mobile.
 */

export type MinimapSelectedBlip = {
  fill: number;
  ring: number;
  /** Fill radius in minimap pixels. */
  r: number;
  /** Outer selection ring radius. */
  ringR: number;
};

/** Distinct selected blip — brighter than the idle green/red army dots. */
export function minimapSelectedUnitBlip(player: boolean): MinimapSelectedBlip {
  return {
    fill: player ? 0xfff0a8 : 0xffb0b0,
    ring: 0xfff8e8,
    r: 4.2,
    ringR: 7,
  };
}
