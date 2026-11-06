import { describe, expect, it } from 'vitest';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { clearSelection } from '../../gameplay/battlefield/battlefieldWorld';
import { buildSelectionView } from './selectionPanel';

describe('selection panel empty tip', () => {
  it('shows an empty tip when nothing is selected', () => {
    const world = createBattlefieldWorld('brutes', 'normal');
    clearSelection(world);
    const view = buildSelectionView(world, null, [], false);
    expect(view.kind).toBe('empty');
    if (view.kind !== 'empty') return;
    expect(view.title.length).toBeGreaterThan(0);
    expect(view.flavor.toLowerCase()).toMatch(/tap|toque|toca|army|tropa/i);
  });
});
