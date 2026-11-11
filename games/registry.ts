import gamesJson from './games.json';

/**
 * `vite`: bundled from `games/<id>/index.html` (TypeScript, npm packages).
 * `static`: `games/<id>/` is copied to `dist/<id>/` untouched.
 */
export type GameBuild = 'vite' | 'static';

export type GameStatus = 'live' | 'experimental';

export interface GameEntry {
  /** Folder under `games/` and the URL path (`/<id>/`). */
  readonly id: string;
  readonly title: string;
  readonly tagline: string;
  readonly description: string;
  readonly build: GameBuild;
  readonly status: GameStatus;
  /** Artwork shown on the picker card, a file under `public/` (e.g. `/covers/x.jpg`). */
  readonly cover?: string;
}

export const GAMES: readonly GameEntry[] = gamesJson as GameEntry[];
