import { GameState } from './GameState';
import type { ActionKind, Direction, Position } from './types';
import { DIRECTION_DELTA } from './types';
import { computeVolume, computeThreshold, withContentType } from './TankRules';

export function executeAction(state: GameState, action: ActionKind): GameState {
  let next: GameState;
  switch (action.kind) {
    case 'move': next = tryMove(state, action.direction); break;
    case 'pour': next = tryPour(state, action.target); break;
    case 'freeze': next = tryFreeze(state, action.target, action.direction); break;
    case 'melt': next = tryMelt(state, action.target); break;
    case 'pourTank': next = tryPourTank(state, action.target); break;
    case 'freezeTank': next = tryFreezeTank(state, action.target); break;
    case 'meltTank': next = tryMeltTank(state, action.target); break;
    case 'drainTank': next = tryDrainTank(state, action.target); break;
    default: return state;
  }
  if (next.turnCount === state.turnCount) return state;

  next = collectFlowerAtPlayer(next);
  next = applyBonfireAutoMelt(next);
  next = checkWin(next);
  return next;
}

function tryMove(state: GameState, direction: Direction): GameState {
  let cur = state.player.position;
  let moved = false;
  while (true) {
    const next = addDelta(cur, direction);
    if (!canEnter(state, next)) break;
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

function isGateOpen(
  gate: { readonly linkedTankIds: readonly string[] },
  state: GameState,
): boolean {
  return gate.linkedTankIds.every(tankId => {
    const tank = state.tanks.get(tankId);
    if (!tank) return false;
    return computeVolume(tank) >= computeThreshold(tank, state.turnCount);
  });
}

function canEnter(state: GameState, pos: Position): boolean {
  if (!state.grid.inBounds(pos.x, pos.y)) return false;
  const ground = state.grid.getGround(pos.x, pos.y);
  if (
    ground.type === 'wall' ||
    ground.type === 'spring' ||
    ground.type === 'bonfire' ||
    ground.type === 'tank'
  ) {
    return false;
  }
  const obj = state.grid.getObject(pos.x, pos.y);
  if (obj === null) return true;
  if (obj.type === 'ice' || obj.type === 'flower') return true;
  if (obj.type === 'gate') return isGateOpen(obj, state);
  return false;
}

function addDelta(p: Position, dir: Direction): Position {
  const d = DIRECTION_DELTA[dir];
  return { x: p.x + d.dx, y: p.y + d.dy };
}

function tryFreeze(state: GameState, target: Position, direction: Direction): GameState {
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  const targetObj = state.grid.getObject(target.x, target.y);
  if (targetObj === null || targetObj.type !== 'water') return state;

  const d = DIRECTION_DELTA[direction];
  const tailPos: Position = { x: target.x + d.dx, y: target.y + d.dy };

  const newGrid = state.grid.clone();
  const boxPush = tryPlanBoxPush(state, tailPos, direction);
  if (boxPush === 'reject') return state;
  if (boxPush === 'none') {
    if (!canExpandInto(state, tailPos)) return state;
  } else {
    const boxDest: Position = { x: tailPos.x + d.dx, y: tailPos.y + d.dy };
    newGrid.setObject(boxDest.x, boxDest.y, { type: 'box' });
    newGrid.setObject(tailPos.x, tailPos.y, null);
  }

  const groupId = state.nextIceGroupId;
  newGrid.setObject(target.x, target.y, { type: 'ice', groupId, role: 'head' });
  newGrid.setObject(tailPos.x, tailPos.y, { type: 'ice', groupId, role: 'tail' });

  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
    nextIceGroupId: groupId + 1,
  });
}

type BoxPushResult = 'none' | 'push' | 'reject';

function tryPlanBoxPush(state: GameState, tailPos: Position, direction: Direction): BoxPushResult {
  if (!state.grid.inBounds(tailPos.x, tailPos.y)) return 'reject';
  const obj = state.grid.getObject(tailPos.x, tailPos.y);
  if (obj === null || obj.type !== 'box') return 'none';
  const d = DIRECTION_DELTA[direction];
  const dest: Position = { x: tailPos.x + d.dx, y: tailPos.y + d.dy };
  if (!state.grid.inBounds(dest.x, dest.y)) return 'reject';
  const destGround = state.grid.getGround(dest.x, dest.y);
  if (destGround.type !== 'floor') return 'reject';
  const destObj = state.grid.getObject(dest.x, dest.y);
  if (destObj !== null) return 'reject';
  if (state.player.position.x === dest.x && state.player.position.y === dest.y) return 'reject';
  return 'push';
}

function canExpandInto(state: GameState, pos: Position): boolean {
  if (!state.grid.inBounds(pos.x, pos.y)) return false;
  const ground = state.grid.getGround(pos.x, pos.y);
  if (ground.type !== 'floor' && ground.type !== 'exit') return false;
  if (state.player.position.x === pos.x && state.player.position.y === pos.y) return false;
  const obj = state.grid.getObject(pos.x, pos.y);
  return obj === null;
}

function tryMelt(state: GameState, target: Position): GameState {
  if (!state.grid.inBounds(target.x, target.y)) return state;
  if (!isAdjacent(state.player.position, target)) return state;
  const obj = state.grid.getObject(target.x, target.y);
  if (obj === null || obj.type !== 'ice') return state;
  if (state.player.position.x === target.x && state.player.position.y === target.y) return state;

  const groupId = obj.groupId;
  const { headPos, tailPos } = findIceGroup(state, groupId);
  if (!headPos || !tailPos) return state;

  const pp = state.player.position;
  if (pp.x === headPos.x && pp.y === headPos.y) return state;
  if (pp.x === tailPos.x && pp.y === tailPos.y) return state;

  const newGrid = state.grid.clone();
  newGrid.setObject(headPos.x, headPos.y, { type: 'water' });
  newGrid.setObject(tailPos.x, tailPos.y, null);
  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
  });
}

function findIceGroup(
  state: GameState,
  groupId: number,
): { headPos: Position | null; tailPos: Position | null } {
  let headPos: Position | null = null;
  let tailPos: Position | null = null;
  for (let y = 0; y < state.grid.height; y++) {
    for (let x = 0; x < state.grid.width; x++) {
      const o = state.grid.getObject(x, y);
      if (o !== null && o.type === 'ice' && o.groupId === groupId) {
        if (o.role === 'head') headPos = { x, y };
        else tailPos = { x, y };
      }
    }
  }
  return { headPos, tailPos };
}

function collectFlowerAtPlayer(state: GameState): GameState {
  const { x, y } = state.player.position;
  const obj = state.grid.getObject(x, y);
  if (obj === null || obj.type !== 'flower' || obj.collected) return state;
  const newGrid = state.grid.clone();
  newGrid.setObject(x, y, null);
  let collected = state.flowersCollected;
  if (obj.required) collected += 1;
  return state.withPatch({ grid: newGrid, flowersCollected: collected });
}

function applyBonfireAutoMelt(state: GameState): GameState {
  // Pass 1: grid ice groups
  const iceGroupsToMelt = new Set<number>();
  // Pass 2: tanks
  const tanksToMelt: string[] = [];

  for (let y = 0; y < state.grid.height; y++) {
    for (let x = 0; x < state.grid.width; x++) {
      if (state.grid.getGround(x, y).type !== 'bonfire') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!state.grid.inBounds(nx, ny)) continue;
        // Grid ice
        const o = state.grid.getObject(nx, ny);
        if (o !== null && o.type === 'ice') {
          if (state.player.position.x === nx && state.player.position.y === ny) continue;
          iceGroupsToMelt.add(o.groupId);
        }
        // Tank ice
        if (state.grid.getGround(nx, ny).type === 'tank') {
          const tankId = findTankIdAt(state, { x: nx, y: ny });
          if (tankId !== null) {
            const tank = state.tanks.get(tankId)!;
            if (tank.contentType === 'ice') {
              tanksToMelt.push(tankId);
            }
          }
        }
      }
    }
  }

  let newState = state;

  if (iceGroupsToMelt.size > 0) {
    const newGrid = state.grid.clone();
    for (const gid of iceGroupsToMelt) {
      const { headPos, tailPos } = findIceGroup(state, gid);
      if (!headPos || !tailPos) continue;
      const pp = state.player.position;
      if (pp.x === headPos.x && pp.y === headPos.y) continue;
      if (pp.x === tailPos.x && pp.y === tailPos.y) continue;
      newGrid.setObject(headPos.x, headPos.y, { type: 'water' });
      newGrid.setObject(tailPos.x, tailPos.y, null);
    }
    newState = newState.withPatch({ grid: newGrid });
  }

  if (tanksToMelt.length > 0) {
    const newTanks = new Map(newState.tanks);
    for (const tid of tanksToMelt) {
      const tank = newTanks.get(tid)!;
      newTanks.set(tid, withContentType(tank, 'water', tank.drops));
    }
    newState = newState.withPatch({ tanks: newTanks });
  }

  return newState;
}

function checkWin(state: GameState): GameState {
  const { x, y } = state.player.position;
  if (state.grid.getGround(x, y).type !== 'exit') return state;
  if (state.flowersCollected < state.flowersRequired) return state;
  return state.withPatch({ isWon: true });
}

function findTankIdAt(state: GameState, pos: Position): string | null {
  for (const [id, tank] of state.tanks) {
    if (tank.position.x === pos.x && tank.position.y === pos.y) return id;
  }
  return null;
}

function tryPourTank(state: GameState, target: Position): GameState {
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  if (state.grid.getGround(target.x, target.y).type !== 'tank') return state;
  const tankId = findTankIdAt(state, target);
  if (tankId === null) return state;
  const tank = state.tanks.get(tankId)!;
  if (tank.contentType !== 'empty') return state;
  if (!hasAdjacentSpring(state)) return state;

  const newTanks = new Map(state.tanks);
  newTanks.set(tankId, withContentType(tank, 'water', 1));
  return state.withPatch({
    tanks: newTanks,
    turnCount: state.turnCount + 1,
  });
}

function tryFreezeTank(state: GameState, target: Position): GameState {
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  if (state.grid.getGround(target.x, target.y).type !== 'tank') return state;
  const tankId = findTankIdAt(state, target);
  if (tankId === null) return state;
  const tank = state.tanks.get(tankId)!;
  if (tank.contentType !== 'water') return state;

  const newTanks = new Map(state.tanks);
  newTanks.set(tankId, withContentType(tank, 'ice', tank.drops));
  return state.withPatch({
    tanks: newTanks,
    turnCount: state.turnCount + 1,
  });
}

function tryMeltTank(state: GameState, target: Position): GameState {
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  if (state.grid.getGround(target.x, target.y).type !== 'tank') return state;
  const tankId = findTankIdAt(state, target);
  if (tankId === null) return state;
  const tank = state.tanks.get(tankId)!;
  if (tank.contentType !== 'ice') return state;

  const newTanks = new Map(state.tanks);
  newTanks.set(tankId, withContentType(tank, 'water', tank.drops));
  return state.withPatch({
    tanks: newTanks,
    turnCount: state.turnCount + 1,
  });
}

function tryDrainTank(state: GameState, target: Position): GameState {
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  if (state.grid.getGround(target.x, target.y).type !== 'tank') return state;
  const tankId = findTankIdAt(state, target);
  if (tankId === null) return state;
  const tank = state.tanks.get(tankId)!;
  if (tank.contentType !== 'water') return state;

  const newTanks = new Map(state.tanks);
  newTanks.set(tankId, withContentType(tank, 'empty', 0));
  return state.withPatch({
    tanks: newTanks,
    turnCount: state.turnCount + 1,
  });
}
