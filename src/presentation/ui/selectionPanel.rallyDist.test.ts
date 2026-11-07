import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import { rallyButtonLabel } from './selectionPanel';

describe('rallyButtonLabel', () => {
  it('appends tile distance on Set rally', () => {
    const line = rallyButtonLabel(false, 4);
    expect(line).toContain(t('sel.setRally'));
    expect(line).toContain(t('hud.rallyDist', { n: 4 }));
  });

  it('appends tile distance when rally is armed', () => {
    const line = rallyButtonLabel(true, 12);
    expect(line).toContain(t('sel.rallyArmed'));
    expect(line).toContain('12');
  });
});
