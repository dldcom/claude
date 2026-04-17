import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/core/GameState';
import { Grid } from '../../src/core/Grid';

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
