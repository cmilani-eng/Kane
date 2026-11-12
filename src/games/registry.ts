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
    sceneKey: 'KaneBoot',
    dynamicImport: () => import('./kane/index.ts'),
  },
  {
    id: 'blob-evolution',
    title: 'Blob Evolution 3D',
    tagline: 'Eat. Evolve. Ascend.',
    description: 'Start as a tiny blob and eat your way up the chain to become the Angel.',
    status: 'experimental',
    sceneKey: 'BlobEvolution',
    dynamicImport: () => import('./blob-evolution/index.ts'),
  },
] as const;

/** Helper to find a game by id. */
export function getGameManifest(id: string): GameManifest | undefined {
  return GAME_REGISTRY.find((g) => g.id === id);
}