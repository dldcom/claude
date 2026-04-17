import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/core/Grid';

describe('Grid', () => {
  it('creates a grid of given dimensions filled with floor', () => {
    const g = Grid.createEmpty(3, 2);
    expect(g.width).toBe(3);
    expect(g.height).toBe(2);
    expect(g.getGround(0, 0)).toEqual({ type: 'floor' });
    expect(g.getGround(2, 1)).toEqual({ type: 'floor' });
  });

  it('set/get ground cell', () => {
    const g = Grid.createEmpty(3, 3);
    g.setGround(1, 1, { type: 'wall' });
    expect(g.getGround(1, 1)).toEqual({ type: 'wall' });
    expect(g.getGround(0, 0)).toEqual({ type: 'floor' });
  });

  it('set/get object cell', () => {
    const g = Grid.createEmpty(3, 3);
    g.setObject(0, 0, { type: 'water' });
    expect(g.getObject(0, 0)).toEqual({ type: 'water' });
    expect(g.getObject(1, 1)).toBeNull();
  });

  it('clone produces an independent copy', () => {
    const a = Grid.createEmpty(2, 2);
    a.setGround(0, 0, { type: 'wall' });
    a.setObject(1, 1, { type: 'box' });
    const b = a.clone();
    b.setGround(0, 0, { type: 'floor' });
    b.setObject(1, 1, null);
    expect(a.getGround(0, 0)).toEqual({ type: 'wall' });
    expect(a.getObject(1, 1)).toEqual({ type: 'box' });
  });

  it('inBounds rejects out-of-range', () => {
    const g = Grid.createEmpty(3, 3);
    expect(g.inBounds(0, 0)).toBe(true);
    expect(g.inBounds(2, 2)).toBe(true);
    expect(g.inBounds(-1, 0)).toBe(false);
    expect(g.inBounds(3, 0)).toBe(false);
    expect(g.inBounds(0, 3)).toBe(false);
  });
});
