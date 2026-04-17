import { GameState } from './GameState';
import type { ActionKind, Direction, Position } from './types';
import { DIRECTION_DELTA } from './types';
import { Grid } from './Grid';

export function executeAction(state: GameState, action: ActionKind): GameState {
  switch (action.kind) {
    case 'move':
      return tryMove(state, action.direction);
    case 'pour':
      return tryPour(state, action.target);
    default:
      return state;
  }
}

function tryMove(state: GameState, direction: Direction): GameState {
  let cur = state.player.position;
  let moved = false;
  while (true) {
    const next = addDelta(cur, direction);
    if (!canEnter(state.grid, next)) break;
    cur = next;
    moved = true;
    const obj = state.grid.getObject(cur.x, cur.y);
    if (obj === null || obj.type !== 'ice') break;
  }
  if (!moved) return state;
  return state.withPatch({
    player: { position: cur, facing: direction },
    turnCount: state.turnCount + 1,
  });
}

function tryPour(state: GameState, target: Position): GameState {
  if (!hasAdjacentSpring(state)) return state;
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  const ground = state.grid.getGround(target.x, target.y);
  if (ground.type !== 'floor') return state;
  const obj = state.grid.getObject(target.x, target.y);
  if (obj !== null) return state;

  const newGrid = state.grid.clone();
  newGrid.setObject(target.x, target.y, { type: 'water' });
  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
  });
}

function hasAdjacentSpring(state: GameState): boolean {
  const { x, y } = state.player.position;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (state.grid.inBounds(nx, ny) && state.grid.getGround(nx, ny).type === 'spring') {
      return true;
    }
  }
  return false;
}

function isAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

function canEnter(grid: Grid, pos: Position): boolean {
  if (!grid.inBounds(pos.x, pos.y)) return false;
  const ground = grid.getGround(pos.x, pos.y);
  if (ground.type === 'wall' || ground.type === 'spring' || ground.type === 'bonfire') {
    return false;
  }
  const obj = grid.getObject(pos.x, pos.y);
  if (obj === null) return true;
  return obj.type === 'ice' || obj.type === 'flower';
}

function addDelta(p: Position, dir: Direction): Position {
  const d = DIRECTION_DELTA[dir];
  return { x: p.x + d.dx, y: p.y + d.dy };
}
