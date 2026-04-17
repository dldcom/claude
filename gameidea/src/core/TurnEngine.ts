import { GameState } from './GameState';
import type { ActionKind, Direction, Position } from './types';
import { DIRECTION_DELTA } from './types';
import { Grid } from './Grid';

export function executeAction(state: GameState, action: ActionKind): GameState {
  switch (action.kind) {
    case 'move':
      return tryMove(state, action.direction);
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
