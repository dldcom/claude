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

describe('LevelLoader — tanks', () => {
  it('parses tank tile + tank definition', () => {
    const yaml = `
id: "t"
name: "tank test"
grid: |
  ####
  #PT#
  ####
required_flowers: 0
tanks:
  - id: "t1"
    position: [2, 1]
    threshold: 12
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.getGround(2, 1)).toEqual({ type: 'tank' });
    expect(s.tanks.get('t1')?.threshold).toBe(12);
    expect(s.tanks.get('t1')?.contentType).toBe('empty');
  });

  it('parses tank with thresholdPattern', () => {
    const yaml = `
id: "t2"
name: "moving sensor"
grid: |
  ####
  #PT#
  ####
required_flowers: 0
tanks:
  - id: "t1"
    position: [2, 1]
    threshold: 10
    thresholdPattern: [10, 20, 15]
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.tanks.get('t1')?.thresholdPattern).toEqual([10, 20, 15]);
  });
});

describe('LevelLoader — gates', () => {
  it('parses gate object linked to tank', () => {
    const yaml = `
id: "g"
name: "gate test"
grid: |
  #####
  #PTG#
  #####
required_flowers: 0
tanks:
  - id: "t1"
    position: [2, 1]
    threshold: 10
gates:
  - id: "g1"
    position: [3, 1]
    linkedTankIds: ["t1"]
`;
    const s = loadLevelFromYaml(yaml);
    const gate = s.grid.getObject(3, 1);
    expect(gate?.type).toBe('gate');
    if (gate?.type === 'gate') {
      expect(gate.id).toBe('g1');
      expect(gate.linkedTankIds).toEqual(['t1']);
    }
  });
});
