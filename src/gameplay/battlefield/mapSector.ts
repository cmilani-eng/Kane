import { MAP } from '../../config/balance';

/** 3×3 map sectors for scout / callout labels. */
export type MapSectorId =
  | 'NW'
  | 'N'
  | 'NE'
  | 'W'
  | 'C'
  | 'E'
  | 'SW'
  | 'S'
  | 'SE';

const SECTORS: readonly MapSectorId[] = [
  'NW',
  'N',
  'NE',
  'W',
  'C',
  'E',
  'SW',
  'S',
  'SE',
] as const;

/** Which 3×3 sector a world point sits in. */
export function mapSectorAt(
  x: number,
  y: number,
  width = MAP.width,
  height = MAP.height,
): MapSectorId {
  const col = x < width / 3 ? 0 : x < (2 * width) / 3 ? 1 : 2;
  const row = y < height / 3 ? 0 : y < (2 * height) / 3 ? 1 : 2;
  return SECTORS[row * 3 + col]!;
}
