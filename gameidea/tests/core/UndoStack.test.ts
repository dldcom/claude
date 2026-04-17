import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/core/Grid';
import { GameState } from '../../src/core/GameState';
import { UndoStack } from '../../src/core/UndoStack';
import { executeAction } from '../../src/core/TurnEngine';

describe('UndoStack', () => {
  function initialState(): GameState {
    return GameState.create({
      grid: Grid.createEmpty(5, 3),
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
  }

  it('starts empty and returns null on pop', () => {
    const s = new UndoStack();
    expect(s.canUndo()).toBe(false);
    expect(s.pop()).toBeNull();
  });

  it('push + pop restores state', () => {
    const stack = new UndoStack();
    const s0 = initialState();
    stack.push(s0);
    const s1 = executeAction(s0, { kind: 'move', direction: 'right' });
    expect(stack.canUndo()).toBe(true);
    const restored = stack.pop();
    expect(restored).not.toBeNull();
    expect(restored!.player.position).toEqual({ x: 1, y: 1 });
    expect(s1.player.position).toEqual({ x: 2, y: 1 });
  });

  it('multiple pushes pop in LIFO order', () => {
    const stack = new UndoStack();
    const s0 = initialState();
    stack.push(s0);
    const s1 = executeAction(s0, { kind: 'move', direction: 'right' });
    stack.push(s1);
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    stack.push(s2);
    expect(stack.pop()!.player.position).toEqual({ x: 3, y: 1 });
    expect(stack.pop()!.player.position).toEqual({ x: 2, y: 1 });
    expect(stack.pop()!.player.position).toEqual({ x: 1, y: 1 });
    expect(stack.pop()).toBeNull();
  });

  it('clear empties the stack', () => {
    const stack = new UndoStack();
    stack.push(initialState());
    stack.clear();
    expect(stack.canUndo()).toBe(false);
  });
});
