import { beforeEach, describe, expect, it } from 'vitest';
import { resetLocaleForTests, setLocale } from '../../i18n';
import { controlsHelpCopy } from './controlsHelpPanel';
import { memoryStorage } from '../../test/memoryStorage';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: memoryStorage(),
    configurable: true,
  });
  resetLocaleForTests();
});

describe('controls help copy', () => {
  it('translates the actions and keeps the key caps', () => {
    setLocale('es');
    const copy = controlsHelpCopy('brutes');
    expect(copy.title).toBe('Controles');
    expect(copy.gotIt).toBe('Entendido');
    expect(copy.body).toContain('Alto');
    expect(copy.body).toContain('Botón Atq');
    expect(copy.body).toContain('>A<');
    expect(copy.body).toContain('Q / W / E');
    expect(copy.body).not.toContain('Stop chip');
    expect(copy.body).toContain('Héroe y especie');
  });

  it('lists only the current species stance hotkey', () => {
    const brutes = controlsHelpCopy('brutes');
    expect(brutes.body).toContain('>R<');
    expect(brutes.body).toMatch(/Rage|Fúria|Furia/);
    expect(brutes.body).not.toContain('>F<');
    expect(brutes.body).not.toContain('>M<');

    const nobles = controlsHelpCopy('nobles');
    expect(nobles.body).toContain('>F<');
    expect(nobles.body).not.toContain('>R<');
    expect(nobles.body).not.toContain('>M<');

    const weirdos = controlsHelpCopy('weirdos');
    expect(weirdos.body).toContain('>M<');
    expect(weirdos.body).not.toContain('>F<');
    expect(weirdos.body).not.toContain('>R<');
  });

  it('lists the Tab cycle tip for mixed selections in every locale', () => {
    setLocale('en-GB');
    const en = controlsHelpCopy('brutes');
    expect(en.body).toContain('Tab-cycle unit types');
    expect(en.body).toContain('Tab · Shift+Tab · all → one type → all');

    setLocale('pt-BR');
    const pt = controlsHelpCopy('brutes');
    expect(pt.body).toContain('Tab: tipos na seleção');
    expect(pt.body).toContain('Tab · Shift+Tab · todos → um tipo → todos');

    setLocale('es');
    const es = controlsHelpCopy('brutes');
    expect(es.body).toContain('Tab: tipos en la selección');
    expect(es.body).toContain('Tab · Shift+Tab · todos → un tipo → todos');
  });

  it('lists the hold-to-ping tip under touch controls in every locale', () => {
    setLocale('en-GB');
    const en = controlsHelpCopy('nobles');
    expect(en.body).toContain('Attention mark');
    expect(en.body).toContain(
      'Hold minimap (cooldown) · Double-tap recenters',
    );

    setLocale('pt-BR');
    const pt = controlsHelpCopy('nobles');
    expect(pt.body).toContain('Marca de atenção');
    expect(pt.body).toContain(
      'Segure o minimapa (recarga) · Toque duplo recentra',
    );

    setLocale('es');
    const es = controlsHelpCopy('nobles');
    expect(es.body).toContain('Marca de atención');
    expect(es.body).toContain(
      'Mantén el minimapa (enfriamiento) · Doble toque recentra',
    );
  });
});


