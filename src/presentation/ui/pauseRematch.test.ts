import { describe, expect, it } from 'vitest';
import { CATALOGS, type MessageKey } from '../../i18n/messages';

describe('pause rematch copy', () => {
  it('exposes Rematch on the pause catalog in every locale', () => {
    const key = 'pause.rematch' as MessageKey;
    expect(CATALOGS['en-GB'][key].toLowerCase()).toContain('rematch');
    expect(CATALOGS['pt-BR'][key].length).toBeGreaterThan(0);
    expect(CATALOGS.es[key].length).toBeGreaterThan(0);
  });
});
