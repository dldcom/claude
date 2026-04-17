import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { loadLevelFromYaml } from '../../src/core/LevelLoader';

const LEVELS_DIR = resolve(process.cwd(), 'public/levels');

describe('LevelLoader — smoke: all public/levels parse', () => {
  const files = readdirSync(LEVELS_DIR).filter(f => f.endsWith('.yaml'));

  it('finds at least one level file', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`loads ${file} into a valid GameState`, () => {
      const text = readFileSync(resolve(LEVELS_DIR, file), 'utf8');
      const state = loadLevelFromYaml(text);
      expect(state.grid.width).toBeGreaterThan(0);
      expect(state.grid.height).toBeGreaterThan(0);
      expect(state.player.position.x).toBeGreaterThanOrEqual(0);
      expect(state.player.position.y).toBeGreaterThanOrEqual(0);
      expect(state.grid.inBounds(state.player.position.x, state.player.position.y)).toBe(true);
    });
  }
});
