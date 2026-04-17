import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/core/Grid';
import { GameState } from '../../src/core/GameState';
import { executeAction } from '../../src/core/TurnEngine';

function makeState(width = 5, height = 5): GameState {
  const grid = Grid.createEmpty(width, height);
  return GameState.create({
    grid,
    player: { position: { x: 2, y: 2 }, facing: 'down' },
    flowersRequired: 0,
  });
}

describe('TurnEngine.move', () => {
  it('moves to adjacent floor cell', () => {
    const s1 = makeState();
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 3, y: 2 });
    expect(s2.turnCount).toBe(1);
    expect(s2.player.facing).toBe('right');
  });

  it('does not move when blocked by wall', () => {
    const s1 = makeState();
    s1.grid.setGround(3, 2, { type: 'wall' });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 2 });
    expect(s2.turnCount).toBe(0);
  });

  it('does not move when blocked by water', () => {
    const s1 = makeState();
    s1.grid.setObject(3, 2, { type: 'water' });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 2 });
  });

  it('does not move when blocked by box', () => {
    const s1 = makeState();
    s1.grid.setObject(3, 2, { type: 'box' });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 2 });
  });

  it('does not move out of bounds', () => {
    const s2 = executeAction(
      GameState.create({
        grid: Grid.createEmpty(3, 3),
        player: { position: { x: 2, y: 1 }, facing: 'right' },
        flowersRequired: 0,
      }),
      { kind: 'move', direction: 'right' },
    );
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
  });
});

describe('TurnEngine.move — ice sliding', () => {
  it('slides through consecutive ice cells', () => {
    const grid = Grid.createEmpty(7, 3);
    for (const x of [2, 3, 4]) {
      grid.setObject(x, 1, { type: 'ice', groupId: 0, role: 'head' });
    }
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 5, y: 1 });
  });

  it('stops on last ice when next cell is wall', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'ice', groupId: 0, role: 'head' });
    grid.setObject(3, 1, { type: 'ice', groupId: 0, role: 'tail' });
    grid.setGround(4, 1, { type: 'wall' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 3, y: 1 });
  });

  it('does not slide if first step lands on floor', () => {
    const grid = Grid.createEmpty(5, 3);
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
  });
});

describe('TurnEngine.pour', () => {
  it('pours water on empty floor adjacent to player, when player adjacent to spring', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(1, 2, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 2 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 3, y: 2 } });
    expect(s2.grid.getObject(3, 2)).toEqual({ type: 'water' });
    expect(s2.turnCount).toBe(1);
  });

  it('fails when player not adjacent to spring', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(0, 0, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 3, y: 3 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 4, y: 3 } });
    expect(s2.grid.getObject(4, 3)).toBeNull();
    expect(s2.turnCount).toBe(0);
  });

  it('fails when target is not adjacent to player', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(1, 2, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 2 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 4, y: 2 } });
    expect(s2.grid.getObject(4, 2)).toBeNull();
  });

  it('fails when target is not empty floor', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(1, 2, { type: 'spring' });
    grid.setGround(3, 2, { type: 'wall' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 2 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 3, y: 2 } });
    expect(s2.grid.getGround(3, 2)).toEqual({ type: 'wall' });
    expect(s2.turnCount).toBe(0);
  });
});
