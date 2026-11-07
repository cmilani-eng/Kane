/** Locked KANE brand — see docs/kane-brand.md in the project store. */
export const BRAND = {
  name: 'KANE',
  /** Idiomatic prose / package identifiers. */
  nameProse: 'Kane',
  tagline: 'BUILD. COMMAND. CONQUER.',
  genre: 'Fantasy Real-Time Strategy Game',
} as const;

/** Browser / install tab title: name · tagline. */
export function brandDocumentTitle(): string {
  return `${BRAND.name} · ${BRAND.tagline}`;
}

/** Short meta description for the Kane entry page. */
export function brandMetaDescription(): string {
  return `${BRAND.name} · ${BRAND.tagline} — ${BRAND.genre}`;
}
