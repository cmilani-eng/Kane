import { describe, expect, it } from 'vitest';
import { typeCountLine } from './selectionPanel';
import type { BattlefieldUnit } from '../../gameplay/battlefield/battlefieldWorld';

function stub(
  typeId: string,
  name: string,
  n = 1,
): BattlefieldUnit[] {
  return Array.from({ length: n }, (_, i) =>
    ({
      hp: 10,
      typeId,
      name,
      id: i,
    }) as BattlefieldUnit,
  );
}

describe('multi-select type counts', () => {
  it('lists Name ×n parts sorted by count', () => {
    const units = [
      ...stub('scavenger', 'Scavenger', 3),
      ...stub('bonker', 'Bonker', 1),
    ];
    const line = typeCountLine(units);
    expect(line).toContain('Scavenger ×3');
    expect(line).toContain('Bonker ×1');
    expect(line.indexOf('Scavenger')).toBeLessThan(line.indexOf('Bonker'));
  });

  it('caps listed types with overflow', () => {
    const units = [
      ...stub('a', 'A', 1),
      ...stub('b', 'B', 1),
      ...stub('c', 'C', 1),
      ...stub('d', 'D', 1),
    ];
    const line = typeCountLine(units, 2);
    expect(line).toMatch(/\+2/);
  });
});
