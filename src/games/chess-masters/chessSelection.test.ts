/** Every way of tapping the board: choose, move, drag, promote and aim each power-up. */
import { describe, expect, it } from 'vitest';
import { startPosition, type Position } from './chessCore';
import { noChoice, pressBoard, releaseBoard, selectPiece, tapPower, type Choice, type TapResult } from './chessSelection';
import { describeAction, position, sq } from './chessTestkit.testkit';

/** Press on one square and lift on another (the same square for a tap). */
function tap(pos: Position, choice: Choice, from: string, to: string = from): TapResult {
  const down = pressBoard(pos, choice, sq(from));
  return releaseBoard(pos, down.choice, down.press, sq(to));
}

const played = (result: TapResult): string | undefined => result.action && describeAction(result.action);
const marked = (choice: Choice): number => choice.targets.size;

describe('moving', () => {
  const start = startPosition();

  it('chooses a piece, shows its moves, and moves on the next tap', () => {
    const chosen = tap(start, noChoice(), 'e2').choice;
    expect(chosen.selected).toBe(sq('e2'));
    expect([...chosen.targets.keys()].sort()).toEqual([sq('e3'), sq('e4')].sort());
    const moved = tap(start, chosen, 'e4');
    expect(played(moved)).toBe('e2e4');
    expect(moved.choice).toEqual(noChoice());
  });

  it('moves by dragging too', () => {
    expect(played(tap(start, noChoice(), 'g1', 'f3'))).toBe('g1f3');
  });

  it('lets go of the piece on a second tap, and switches to another', () => {
    const chosen = tap(start, noChoice(), 'e2').choice;
    expect(tap(start, chosen, 'e2').choice.selected).toBe(-1);
    expect(tap(start, chosen, 'd2').choice.selected).toBe(sq('d2'));
  });

  it('keeps the piece when a drag comes back to where it started', () => {
    expect(tap(start, noChoice(), 'e2', 'e2').choice.selected).toBe(sq('e2'));
  });

  it('describes a square that is not the player to move', () => {
    const result = tap(start, noChoice(), 'e7');
    expect(result.choice.selected).toBe(-1);
    expect(result.choice.about).toEqual({ square: sq('e7') });
    expect(result.action).toBeUndefined();
  });

  it('says why a piece cannot move', () => {
    expect(tap(start, noChoice(), 'a1').choice.problem).toBe('chess.noMoves');
    const iced = position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { frozen: ['a1'] });
    expect(selectPiece(iced, noChoice(), sq('a1')).problem).toBe('chess.frozenPiece');
  });

  it('asks for the promotion piece before moving', () => {
    const pos = position('8/P6k/8/8/8/8/8/K7 w - - 0 1');
    const result = tap(pos, tap(pos, noChoice(), 'a7').choice, 'a8');
    expect(result.action).toBeUndefined();
    expect(result.promotion).toEqual({ from: sq('a7'), to: sq('a8'), double: false });
  });
});

describe('power-ups', () => {
  const pos = position('4k3/8/8/2r5/8/8/8/R3K3 w - - 0 1', { held: [{ shield: 1, freeze: 1, double: 1, teleport: 1 }, {}] });

  it('aims Shield at your own pieces and plays it on a tap', () => {
    const aiming = tapPower(pos, noChoice(), 'shield', true);
    expect([...aiming.targets.keys()]).toEqual([sq('a1')]);
    expect(played(tap(pos, aiming, 'a1'))).toBe('shield:a1');
  });

  it('refuses a square it cannot use, and stays aimed', () => {
    const aiming = tapPower(pos, noChoice(), 'freeze', true);
    const result = tap(pos, aiming, 'e8');
    expect(result.action).toBeUndefined();
    expect(result.choice.problem).toBe('chess.badTarget');
    expect(played(tap(pos, result.choice, 'c5'))).toBe('freeze:c5');
  });

  it('ignores a drag while aiming', () => {
    const aiming = tapPower(pos, noChoice(), 'freeze', true);
    expect(tap(pos, aiming, 'c5', 'c4').action).toBeUndefined();
  });

  it('teleports in two taps: the piece, then the square', () => {
    const aiming = tapPower(pos, noChoice(), 'teleport', true);
    const chosen = tap(pos, aiming, 'a1').choice;
    expect(chosen.power).toEqual({ kind: 'teleport', from: sq('a1') });
    expect(marked(chosen)).toBeGreaterThan(30);
    expect(chosen.targets.has(sq('a8'))).toBe(false);
    expect(played(tap(pos, chosen, 'b3'))).toBe('teleport:a1b3');
  });

  it('makes the next move the first half of a Double Move, whichever piece is picked', () => {
    let choice = tapPower(pos, noChoice(), 'double', true);
    choice = tap(pos, choice, 'e1').choice;
    choice = tap(pos, choice, 'a1').choice;
    expect(choice.power?.kind).toBe('double');
    expect(played(tap(pos, choice, 'a2'))).toBe('double:a1a2');
  });

  it('keeps the Double Move on after letting go of a piece or reading another', () => {
    const aiming = tapPower(pos, noChoice(), 'double', true);
    const chosen = tap(pos, aiming, 'a1').choice;
    expect(tap(pos, chosen, 'a1').choice).toMatchObject({ selected: -1, power: { kind: 'double' } });
    expect(tap(pos, chosen, 'c5').choice.power?.kind).toBe('double');
  });

  it('puts a power-up away on a second tap of its button', () => {
    const aiming = tapPower(pos, noChoice(), 'shield', true);
    expect(tapPower(pos, aiming, 'shield', true)).toEqual(noChoice());
  });

  it('only explains a power-up that cannot be used now', () => {
    for (const choice of [
      tapPower(pos, noChoice(), 'shield', false),
      tapPower(position('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), noChoice(), 'shield', true),
    ]) {
      expect(choice.power).toBeNull();
      expect(choice.about).toEqual({ power: 'shield' });
    }
  });

  it('says when there is nothing to aim at', () => {
    const bare = position('4k3/8/8/8/8/8/8/4K3 w - - 0 1', { held: [{ shield: 1 }, {}] });
    expect(tapPower(bare, noChoice(), 'shield', true)).toMatchObject({ power: null, problem: 'chess.noTarget' });
  });
});
