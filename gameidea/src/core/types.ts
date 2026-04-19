// gameidea/src/core/types.ts
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export type GroundType =
  | 'floor'
  | 'wall'
  | 'spring'
  | 'bonfire'
  | 'exit'
  | 'tank';

export interface GroundCell {
  type: GroundType;
}

export type ObjectType =
  | 'water'
  | 'ice'
  | 'box'
  | 'rock'
  | 'flower'
  | 'gate';

export interface WaterObject {
  type: 'water';
}

export interface IceObject {
  type: 'ice';
  groupId: number;
  role: 'head' | 'tail';
}

export interface BoxObject {
  type: 'box';
}

export interface RockObject {
  type: 'rock';
}

export interface FlowerObject {
  type: 'flower';
  required: boolean;
  collected: boolean;
}

export interface GateObject {
  type: 'gate';
  id: string;
  linkedTankIds: readonly string[];
}

export type ObjectCell =
  | WaterObject
  | IceObject
  | BoxObject
  | RockObject
  | FlowerObject
  | GateObject;

export type ActionKind =
  | { kind: 'move'; direction: Direction }
  | { kind: 'pour'; target: Position }
  | { kind: 'freeze'; target: Position; direction: Direction }
  | { kind: 'melt'; target: Position }
  | { kind: 'pourTank'; target: Position }
  | { kind: 'freezeTank'; target: Position }
  | { kind: 'meltTank'; target: Position }
  | { kind: 'drainTank'; target: Position };

export interface PlayerState {
  position: Position;
  facing: Direction;
}

export interface TankState {
  readonly id: string;
  readonly position: Position;
  readonly contentType: 'empty' | 'water' | 'ice';
  readonly drops: number;
  readonly threshold: number;
  readonly thresholdPattern?: readonly number[];
}

export const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
