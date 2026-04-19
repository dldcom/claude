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

describe('TurnEngine.freeze — basic expansion', () => {
  it('freezes water into ice head + tail', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setObject(2, 2, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 2 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 2 },
      direction: 'right',
    });
    expect(s2.grid.getObject(2, 2)).toMatchObject({ type: 'ice', role: 'head' });
    expect(s2.grid.getObject(3, 2)).toMatchObject({ type: 'ice', role: 'tail' });
    const head = s2.grid.getObject(2, 2) as { groupId: number };
    const tail = s2.grid.getObject(3, 2) as { groupId: number };
    expect(head.groupId).toBe(tail.groupId);
    expect(s2.turnCount).toBe(1);
    expect(s2.nextIceGroupId).toBe(2);
  });

  it('fails when target is not water', () => {
    const grid = Grid.createEmpty(5, 5);
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 2 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 2 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when player not adjacent to target water', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setObject(2, 2, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 4, y: 4 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 2 },
      direction: 'right',
    });
    expect(s2.grid.getObject(2, 2)).toEqual({ type: 'water' });
    expect(s2.turnCount).toBe(0);
  });
});

describe('TurnEngine.freeze — edge cases', () => {
  it('pushes a box one cell when freezing into box', () => {
    const grid = Grid.createEmpty(6, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setObject(3, 1, { type: 'box' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.grid.getObject(2, 1)).toMatchObject({ type: 'ice', role: 'head' });
    expect(s2.grid.getObject(3, 1)).toMatchObject({ type: 'ice', role: 'tail' });
    expect(s2.grid.getObject(4, 1)).toEqual({ type: 'box' });
  });

  it('fails to push box into wall', () => {
    const grid = Grid.createEmpty(4, 3);
    grid.setObject(1, 1, { type: 'water' });
    grid.setObject(2, 1, { type: 'box' });
    grid.setGround(3, 1, { type: 'wall' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 0, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 1, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
    expect(s2.grid.getObject(1, 1)).toEqual({ type: 'water' });
  });

  it('fails when expansion direction has rock', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setObject(3, 1, { type: 'rock' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when expansion direction has spring', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setGround(3, 1, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when expansion direction has player', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 3, y: 1 }, facing: 'left' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when expansion direction has another water', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setObject(3, 1, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });
});

describe('TurnEngine.melt', () => {
  function makeFrozenState(): GameState {
    const grid = Grid.createEmpty(6, 3);
    grid.setObject(2, 1, { type: 'ice', groupId: 7, role: 'head' });
    grid.setObject(3, 1, { type: 'ice', groupId: 7, role: 'tail' });
    return GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      nextIceGroupId: 8,
    });
  }

  it('melting head turns head into water and tail into empty', () => {
    const s1 = makeFrozenState();
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 2, y: 1 } });
    expect(s2.grid.getObject(2, 1)).toEqual({ type: 'water' });
    expect(s2.grid.getObject(3, 1)).toBeNull();
    expect(s2.turnCount).toBe(1);
  });

  it('melting tail also turns head into water and tail into empty', () => {
    const s1 = makeFrozenState().withPatch({
      player: { position: { x: 4, y: 1 }, facing: 'left' },
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 3, y: 1 } });
    expect(s2.grid.getObject(2, 1)).toEqual({ type: 'water' });
    expect(s2.grid.getObject(3, 1)).toBeNull();
  });

  it('fails when not adjacent', () => {
    const s1 = makeFrozenState().withPatch({
      player: { position: { x: 5, y: 1 }, facing: 'left' },
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 2, y: 1 } });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when target is not ice', () => {
    const s1 = makeFrozenState();
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 0, y: 1 } });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when player is standing on the ice being melted', () => {
    const s1 = makeFrozenState().withPatch({
      player: { position: { x: 2, y: 1 }, facing: 'right' },
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 2, y: 1 } });
    expect(s2.turnCount).toBe(0);
    expect(s2.grid.getObject(2, 1)).toMatchObject({ type: 'ice' });
  });
});

describe('TurnEngine.bonfire auto-melt', () => {
  it('melts ice adjacent to bonfire after any action', () => {
    const grid = Grid.createEmpty(6, 3);
    grid.setGround(4, 1, { type: 'bonfire' });
    grid.setObject(2, 1, { type: 'ice', groupId: 1, role: 'head' });
    grid.setObject(3, 1, { type: 'ice', groupId: 1, role: 'tail' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 0, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      nextIceGroupId: 2,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.grid.getObject(2, 1)).toEqual({ type: 'water' });
    expect(s2.grid.getObject(3, 1)).toBeNull();
  });

  it('does not melt ice that player stands on', () => {
    const grid = Grid.createEmpty(6, 3);
    grid.setGround(3, 1, { type: 'bonfire' });
    grid.setObject(2, 1, { type: 'ice', groupId: 1, role: 'head' });
    grid.setObject(1, 1, { type: 'ice', groupId: 2, role: 'head' });
    grid.setObject(0, 1, { type: 'ice', groupId: 2, role: 'tail' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 1 }, facing: 'down' },
      flowersRequired: 0,
      nextIceGroupId: 3,
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 1, y: 1 } });
    expect(s2.grid.getObject(2, 1)).toMatchObject({ type: 'ice' });
  });
});

describe('TurnEngine — flower collection', () => {
  it('collects flower when moving onto it', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'flower', required: true, collected: false });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 1,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
    expect(s2.grid.getObject(2, 1)).toBeNull();
    expect(s2.flowersCollected).toBe(1);
  });
});

describe('TurnEngine — win condition', () => {
  it('wins when player reaches exit with all required flowers', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setGround(3, 1, { type: 'exit' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 1 }, facing: 'right' },
      flowersRequired: 1,
      flowersCollected: 1,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.isWon).toBe(true);
  });

  it('does not win when reaching exit without all flowers', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setGround(3, 1, { type: 'exit' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 1 }, facing: 'right' },
      flowersRequired: 1,
      flowersCollected: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.isWon).toBe(false);
  });
});

describe('TurnEngine.move — tank rejection', () => {
  it('cannot move onto tank ground', () => {
    const grid = Grid.createEmpty(4, 3);
    grid.setGround(2, 1, { type: 'tank' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 1, y: 1 });
    expect(s2.turnCount).toBe(0);
  });
});

describe('TurnEngine.move — gates', () => {
  it('cannot pass through closed gate (sensor inactive)', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, {
      type: 'gate',
      id: 'g1',
      linkedTankIds: ['t1'],
    });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      tanks: new Map([
        ['t1', {
          id: 't1',
          position: { x: 4, y: 1 },
          contentType: 'water',
          drops: 1,
          threshold: 12,
        }],
      ]),
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 1, y: 1 });
    expect(s2.turnCount).toBe(0);
  });

  it('can pass through open gate (sensor active)', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, {
      type: 'gate',
      id: 'g1',
      linkedTankIds: ['t1'],
    });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      tanks: new Map([
        ['t1', {
          id: 't1',
          position: { x: 4, y: 1 },
          contentType: 'ice',
          drops: 1,
          threshold: 12,
        }],
      ]),
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
  });

  it('AND logic: all linked tanks must be active', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, {
      type: 'gate',
      id: 'g1',
      linkedTankIds: ['t1', 't2'],
    });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      tanks: new Map([
        ['t1', {
          id: 't1', position: { x: 4, y: 1 },
          contentType: 'ice', drops: 1, threshold: 12,
        }],
        ['t2', {
          id: 't2', position: { x: 4, y: 2 },
          contentType: 'water', drops: 1, threshold: 12,
        }],
      ]),
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 1, y: 1 });
  });
});
