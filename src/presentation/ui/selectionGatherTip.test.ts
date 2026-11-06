import { describe, expect, it } from 'vitest';
import { GATHER } from '../../gameplay/battlefield/battlefieldEconomy';
import { createBattlefieldWorld } from '../../gameplay/battlefield/battlefieldWorld';
import { buildSelectionView } from './selectionPanel';

describe('selection resource gather tip', () => {
  it('shows per-trip amount when a node is inspected', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    const node = world.nodes.find((n) => n.remaining > 0);
    expect(node).toBeTruthy();
    const view = buildSelectionView(world, null, [], false, false, node!);
    expect(view.kind).toBe('resource');
    if (view.kind !== 'resource') return;
    expect(view.gatherTip).toContain(String(GATHER.amountPerTrip));
    expect(view.gatherTip.toLowerCase()).toMatch(/trip|viaje|viagem/);
  });

  it('counts player workers assigned to the node', () => {
    const world = createBattlefieldWorld('nobles', 'normal');
    const node = world.nodes.find((n) => n.remaining > 0)!;
    const workers = world.units.filter(
      (u) => u.team === 'player' && u.canGather && u.hp > 0,
    );
    expect(workers.length).toBeGreaterThan(0);
    for (const w of workers.slice(0, 2)) {
      w.gatherNodeId = node.id;
    }
    const view = buildSelectionView(world, null, [], false, false, node);
    expect(view.kind).toBe('resource');
    if (view.kind !== 'resource') return;
    expect(view.gatherTip).toMatch(/2/);
    expect(view.gatherTip).toContain(String(GATHER.amountPerTrip));
  });
});
