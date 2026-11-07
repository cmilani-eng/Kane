import { describe, expect, it } from 'vitest';
import { BRAND, brandDocumentTitle, brandMetaDescription } from './brand';

describe('brandDocumentTitle', () => {
  it('includes the game name and tagline for the Kane tab', () => {
    expect(brandDocumentTitle()).toBe(`${BRAND.name} · ${BRAND.tagline}`);
    expect(brandDocumentTitle()).toContain('KANE');
    expect(brandDocumentTitle()).toContain('BUILD. COMMAND. CONQUER.');
  });
});

describe('brandMetaDescription', () => {
  it('includes name, tagline, and genre for the Kane entry meta', () => {
    expect(brandMetaDescription()).toBe(
      `${BRAND.name} · ${BRAND.tagline} — ${BRAND.genre}`,
    );
    expect(brandMetaDescription()).toContain('Fantasy Real-Time Strategy Game');
  });
});
