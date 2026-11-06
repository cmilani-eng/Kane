import { describe, expect, it } from 'vitest';
import { BRAND, brandDocumentTitle } from './brand';

describe('brandDocumentTitle', () => {
  it('includes the game name and tagline for the Kane tab', () => {
    expect(brandDocumentTitle()).toBe(`${BRAND.name} · ${BRAND.tagline}`);
    expect(brandDocumentTitle()).toContain('KANE');
    expect(brandDocumentTitle()).toContain('BUILD. COMMAND. CONQUER.');
  });
});
