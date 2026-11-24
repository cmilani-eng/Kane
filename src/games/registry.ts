/**
 * Game Registry — Manifest-driven game registration.
 *
 * The picker (GamePickerScene) imports ONLY this file — no gameplay code.
 * Each game provides a `dynamicImport` that returns its Phaser scene module.
 * The picker calls `dynamicImport()` on user click, then starts the scene by key.
 */

export interface GameManifest {
  /** Unique id — used for URL path, asset prefixes, and scene keys. */
  readonly id: string;
  /** Display title. */
  readonly title: string;
  /** Short tagline. */
  readonly tagline: string;
  /** One-line description. */
  readonly description: string;
  /** Release status. */
  readonly status: 'live' | 'experimental';
  /** True when the game needs a tablet or computer; its card cannot start on a phone. */
  readonly bigScreenOnly?: boolean;
  /** Card picture: a file under `public/`, relative to the site root (e.g. `covers/kane.jpg`). */
  readonly cover?: string;
  /** Phaser scene key to start (the game's first scene). */
  readonly sceneKey: string;
  /** Lazy-load the game's scene module. */
  readonly dynamicImport: () => Promise<Record<string, unknown>>;
}

/**
 * Registry of all games. Imported by GamePickerScene.
 * Add new games here — no other config changes needed.
 */
export const GAME_REGISTRY: readonly GameManifest[] = [
  {
    id: 'kane',
    title: 'KANE',
    tagline: 'BUILD. COMMAND. CONQUER.',
    description: 'Fantasy real-time strategy. Pick a species, build a base and crush the enemy.',
    status: 'live',
    bigScreenOnly: true,
    cover: 'covers/kane.jpg',
    sceneKey: 'KaneBoot',
    dynamicImport: () => import('./kane/index.ts'),
  },
  {
    id: 'blob-evolution',
    title: 'Blob Evolution 3D',
    tagline: 'Eat. Evolve. Ascend.',
    description: 'Start as a tiny blob and eat your way up the chain to become the Angel.',
    status: 'experimental',
    cover: 'covers/blob-evolution.jpg',
    sceneKey: 'BlobEvolution',
    dynamicImport: () => import('./blob-evolution/index.ts'),
  },
  {
    id: 'skate-rush',
    title: 'Skate Rush 3',
    tagline: 'Skate. Flip. Survive.',
    description: 'Endless skating across four worlds. Collect coins, upgrade your deck, flip and survive.',
    status: 'experimental',
    cover: 'covers/skate-rush.jpg',
    sceneKey: 'SkateRush',
    dynamicImport: () => import('./skate-rush/index.ts'),
  },
  {
    id: 'sats-quest',
    title: 'SATs Quest',
    tagline: 'Learn. Quest. Beat the clock.',
    description: 'A fairy-tale quest that turns Year 6 SATs practice into boss battles against the clock.',
    status: 'experimental',
    cover: 'covers/sats-quest.svg',
    sceneKey: 'SatsQuest',
    dynamicImport: () => import('./sats-quest/index.ts'),
  },
] as const;

/** Helper to find a game by id. */
export function getGameManifest(id: string): GameManifest | undefined {
  return GAME_REGISTRY.find((g) => g.id === id);
}