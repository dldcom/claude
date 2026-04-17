import { describe, it, expect } from 'vitest';
import { loadLevelFromYaml } from '../../src/core/LevelLoader';

describe('LevelLoader', () => {
  it('parses a minimal level', () => {
    const yaml = `
id: "t"
name: "test"
grid: |
  #####
  #P.E#
  #####
required_flowers: 0
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.width).toBe(5);
    expect(s.grid.height).toBe(3);
    expect(s.grid.getGround(0, 0)).toEqual({ type: 'wall' });
    expect(s.grid.getGround(1, 1)).toEqual({ type: 'floor' });
    expect(s.grid.getGround(3, 1)).toEqual({ type: 'exit' });
    expect(s.player.position).toEqual({ x: 1, y: 1 });
    expect(s.flowersRequired).toBe(0);
  });

  it('parses water, box, flower', () => {
    const yaml = `
id: "t2"
name: "test2"
grid: |
  #######
  #P.WXF#
  #######
required_flowers: 1
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.getObject(3, 1)).toEqual({ type: 'water' });
    expect(s.grid.getObject(4, 1)).toEqual({ type: 'box' });
    expect(s.grid.getObject(5, 1)).toEqual({
      type: 'flower',
      required: true,
      collected: false,
    });
  });

  it('parses spring and bonfire ground', () => {
    const yaml = `
id: "t3"
name: "test3"
grid: |
  #####
  #PSB#
  #####
required_flowers: 0
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.getGround(2, 1)).toEqual({ type: 'spring' });
    expect(s.grid.getGround(3, 1)).toEqual({ type: 'bonfire' });
  });

  it('throws on missing player', () => {
    const yaml = `
id: "t4"
name: "no player"
grid: |
  ###
  #.#
  ###
required_flowers: 0
`;
    expect(() => loadLevelFromYaml(yaml)).toThrow();
  });
});
