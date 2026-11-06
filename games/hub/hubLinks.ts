/**
 * Relative play URL for a registry game.
 * Kane → `./kane/`; Blob Evolution → `./blob-evolution/`.
 */
export function gamePlayHref(id: string): string {
  return `./${id}/`;
}
