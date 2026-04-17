import yaml from 'js-yaml';
import { Grid } from './Grid';
import { GameState } from './GameState';
import type {
  GroundType,
  ObjectCell,
  PlayerState,
} from './types';

interface RawLevel {
  id: string;
  name: string;
  grid: string;
  required_flowers: number;
}

const GROUND_CHARS: Record<string, GroundType> = {
  '#': 'wall',
  '.': 'floor',
  'S': 'spring',
  'B': 'bonfire',
  'E': 'exit',
  'P': 'floor',
  'W': 'floor',
  'X': 'floor',
  'R': 'floor',
  'F': 'floor',
  'f': 'floor',
};

function parseObjectChar(ch: string): ObjectCell | null {
  switch (ch) {
    case 'W':
      return { type: 'water' };
    case 'X':
      return { type: 'box' };
    case 'R':
      return { type: 'rock' };
    case 'F':
      return { type: 'flower', required: true, collected: false };
    case 'f':
      return { type: 'flower', required: false, collected: false };
    default:
      return null;
  }
}

export function loadLevelFromYaml(text: string): GameState {
  const raw = yaml.load(text) as RawLevel;
  if (!raw || typeof raw.grid !== 'string') {
    throw new Error('Invalid level: missing grid');
  }
  const lines = raw.grid.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) throw new Error('Invalid level: empty grid');
  const width = Math.max(...lines.map(l => l.length));
  const height = lines.length;

  const grid = Grid.createEmpty(width, height);
  let player: PlayerState | null = null;

  for (let y = 0; y < height; y++) {
    const line = lines[y].padEnd(width, '#');
    for (let x = 0; x < width; x++) {
      const ch = line[x];
      const groundType = GROUND_CHARS[ch];
      if (!groundType) {
        throw new Error(`Unknown level char '${ch}' at (${x}, ${y})`);
      }
      grid.setGround(x, y, { type: groundType });
      if (ch === 'P') {
        player = { position: { x, y }, facing: 'down' };
      } else {
        const obj = parseObjectChar(ch);
        if (obj !== null) {
          grid.setObject(x, y, obj);
        }
      }
    }
  }

  if (player === null) {
    throw new Error('Invalid level: no player (P) found');
  }

  return GameState.create({
    grid,
    player,
    flowersRequired: raw.required_flowers ?? 0,
  });
}
