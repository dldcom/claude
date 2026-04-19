import yaml from 'js-yaml';
import { Grid } from './Grid';
import { GameState } from './GameState';
import { createEmptyTank } from './TankRules';
import type { GroundType, ObjectCell, PlayerState, TankState } from './types';

interface RawTank {
  id: string;
  position: [number, number];
  threshold: number;
  thresholdPattern?: number[];
}

interface RawLevel {
  id: string;
  name: string;
  grid: string;
  required_flowers: number;
  tanks?: RawTank[];
}

const GROUND_CHARS: Record<string, GroundType> = {
  '#': 'wall',
  '.': 'floor',
  'S': 'spring',
  'B': 'bonfire',
  'E': 'exit',
  'T': 'tank',
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

  const tanks = new Map<string, TankState>();
  for (const rt of raw.tanks ?? []) {
    const tank = createEmptyTank({
      id: rt.id,
      position: { x: rt.position[0], y: rt.position[1] },
      threshold: rt.threshold,
      thresholdPattern: rt.thresholdPattern,
    });
    tanks.set(rt.id, tank);
  }

  return GameState.create({
    grid,
    player,
    flowersRequired: raw.required_flowers ?? 0,
    tanks,
  });
}
