/**
 * Relative play URL for a registry game.
 * Kane → `./kane/`; Blob Evolution → `./blob-evolution/`.
 */
export function gamePlayHref(id: string): string {
  return `./${id}/`;
}

/** Hub footer legal pages — site-root paths matching games/PATHS.md. */
export type HubLegalPage = 'privacy' | 'terms';

export function hubLegalHref(page: HubLegalPage): string {
  return `/${page}.html`;
}
