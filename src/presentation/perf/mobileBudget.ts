/**
 * Mid-range phone budgets — throttle expensive mid-match work.
 * Measurable: fewer fog rebuilds, fewer minimap/separation passes,
 * viewport-culled draws.
 */

export const MOBILE_PERF = {
  /** Rebuild fog vision at most this often. */
  fogMs: 100,
  /** Minimap redraw cadence. */
  minimapMs: 120,
  /** Soft unit separation cadence. */
  separateMs: 50,
  /** Extra world-space pad around camera for cull tests. */
  cullPad: 120,
} as const;

export interface ViewBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function viewBoundsFromCamera(
  scrollX: number,
  scrollY: number,
  viewW: number,
  viewH: number,
  pad: number = MOBILE_PERF.cullPad,
): ViewBounds {
  return {
    left: scrollX - pad,
    top: scrollY - pad,
    right: scrollX + viewW + pad,
    bottom: scrollY + viewH + pad,
  };
}

export function inView(b: ViewBounds, x: number, y: number): boolean {
  return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
}
