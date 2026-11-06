import { describe, expect, it } from 'vitest';
import { t } from '../../i18n';
import {
  sharedUnitRoleLabel,
  unitRole,
  unitRoleLabel,
} from './unitRole';

describe('unitRole', () => {
  it('classifies worker, combat, and hero from catalog flags', () => {
    expect(unitRole('scavenger')).toBe('worker');
    expect(unitRole('bonker')).toBe('combat');
    expect(unitRole('gruk')).toBe('hero');
    expect(unitRoleLabel('scavenger')).toBe(
      t('sel.roleTip', { role: t('sel.role.worker') }),
    );
    expect(unitRoleLabel('bonker')).toBe(
      t('sel.roleTip', { role: t('sel.role.combat') }),
    );
    expect(unitRoleLabel('gruk')).toBe(
      t('sel.roleTip', { role: t('sel.role.hero') }),
    );
  });

  it('shares a label only when every selected type has the same role', () => {
    expect(sharedUnitRoleLabel(['bonker', 'rock_thrower'])).toBe(
      t('sel.roleTip', { role: t('sel.role.combat') }),
    );
    expect(sharedUnitRoleLabel(['bonker', 'scavenger'])).toBeNull();
    expect(sharedUnitRoleLabel([])).toBeNull();
  });
});
