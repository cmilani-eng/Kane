/**
 * Left edge (canvas px) for the match title: just past the DOM "← Games" pill, so the
 * two never overlap. The pill's screen edge is converted through the canvas offset and
 * display scale. Falls back to `pad` when the pill is absent or off-screen.
 */
export function matchTitleLeftPx(
  pillRightScreen: number,
  canvasLeftScreen: number,
  displayScale: number,
  pad: number,
): number {
  if (pillRightScreen <= 0 || displayScale <= 0) return pad;
  const pillRightCanvas = (pillRightScreen - canvasLeftScreen) / displayScale;
  return Math.max(pad, Math.ceil(pillRightCanvas + pad));
}
