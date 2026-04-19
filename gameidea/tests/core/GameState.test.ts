import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/core/GameState';
import { Grid } from '../../src/core/Grid';
import { createEmptyTank } from '../../src/core/TankRules';

describe('GameState', () => {
  it('creates with default values', () => {
    const grid = Grid.createEmpty(5, 5);
    const s = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'down' },
      flowersRequired: 2,
    });
    expect(s.grid).toBe(grid);
    expect(s.player.position).toEqual({ x: 1, y: 1 });
    expect(s.flowersRequired).toBe(2);
    expect(s.flowersCollected).toBe(0);
    expect(s.turnCount).toBe(0);
    expect(s.nextIceGroupId).toBe(1);
    expect(s.isWon).toBe(false);
  });

  it('clone produces deep copy', () => {
    const grid = Grid.createEmpty(3, 3);
    const s = GameState.create({
      grid,
      player: { position: { x: 0, y: 0 }, facing: 'down' },
      flowersRequired: 1,
    });
    const s2 = s.clone();
    expect(s2.grid).not.toBe(s.grid);
    expect(s2.player).not.toBe(s.player);
  });
});

describe('GameState — tanks', () => {
  it('initializes with empty tanks Map if not provided', () => {
    const s = GameState.create({
      grid: Grid.createEmpty(3, 3),
      player: { position: { x: 0, y: 0 }, facing: 'down' },
      flowersRequired: 0,
    });
    expect(s.tanks.size).toBe(0);
  });

  it('accepts tanks in initialization', () => {
    const tank = createEmptyTank({ id: 't1', position: { x: 1, y: 1 }, threshold: 10 });
    const s = GameState.create({
      grid: Grid.createEmpty(3, 3),
      player: { position: { x: 0, y: 0 }, facing: 'down' },
      flowersRequired: 0,
      tanks: new Map([['t1', tank]]),
    });
    expect(s.tanks.get('t1')?.threshold).toBe(10);
  });

  it('clone produces independent tanks Map', () => {
    const tank = createEmptyTank({ id: 't1', position: { x: 1, y: 1 }, threshold: 10 });
    const s = GameState.create({
      grid: Grid.createEmpty(3, 3),
      player: { position: { x: 0, y: 0 }, facing: 'down' },
      flowersRequired: 0,
      tanks: new Map([['t1', tank]]),
    });
    const s2 = s.clone();
    expect(s2.tanks).not.toBe(s.tanks);
    expect(s2.tanks.get('t1')?.id).toBe('t1');
  });

  it('withPatch can replace tanks', () => {
    const s = GameState.create({
      grid: Grid.createEmpty(3, 3),
      player: { position: { x: 0, y: 0 }, facing: 'down' },
      flowersRequired: 0,
    });
    const tank = createEmptyTank({ id: 't1', position: { x: 1, y: 1 }, threshold: 10 });
    const s2 = s.withPatch({ tanks: new Map([['t1', tank]]) });
    expect(s2.tanks.size).toBe(1);
    expect(s.tanks.size).toBe(0);
  });
});
