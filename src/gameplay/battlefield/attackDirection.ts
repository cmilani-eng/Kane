/**
 * 8-way direction arrow from a reference point toward an under-attack hit.
 * World Y increases downward (Phaser), so +dy is south.
 */

const ARROWS = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'] as const;

/** Arrow (or center mark) pointing from (fromX, fromY) toward (toX, toY). */
export function attackDirectionArrow(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  deadzone = 96,
): string {
  const dx = toX - fromX;
  const dy = toY - fromY;
  if (dx * dx + dy * dy < deadzone * deadzone) return '•';
  const angle = Math.atan2(dy, dx);
  const oct = (((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  return ARROWS[oct]!;
}
