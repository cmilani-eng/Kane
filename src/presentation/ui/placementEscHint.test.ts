import { describe, expect, it } from 'vitest';
import { CATALOGS } from '../../i18n/messages';

describe('placement Esc cancel hints', () => {
  it('mentions Esc on the place cost strip and armed title', () => {
    for (const catalog of Object.values(CATALOGS)) {
      expect(catalog['hud.place'].toLowerCase()).toContain('esc');
      expect(catalog['sel.placeArmedTitle'].toLowerCase()).toContain('esc');
      expect(catalog['hud.hintPlace'].toLowerCase()).toContain('esc');
    }
  });
});
