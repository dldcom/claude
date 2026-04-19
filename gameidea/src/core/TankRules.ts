import type { TankState, Position } from './types';

const WATER_UNIT_VOLUME = 10;
const ICE_UNIT_VOLUME = 12;

export function createEmptyTank(params: {
  id: string;
  position: Position;
  threshold: number;
  thresholdPattern?: readonly number[];
}): TankState {
  return {
    id: params.id,
    position: params.position,
    contentType: 'empty',
    drops: 0,
    threshold: params.threshold,
    thresholdPattern: params.thresholdPattern,
  };
}

export function computeVolume(tank: TankState): number {
  if (tank.contentType === 'empty') return 0;
  const unit = tank.contentType === 'water' ? WATER_UNIT_VOLUME : ICE_UNIT_VOLUME;
  return tank.drops * unit;
}

export function computeWeight(tank: TankState): number {
  return tank.drops;
}

export function computeThreshold(tank: TankState, turnCount: number): number {
  if (tank.thresholdPattern && tank.thresholdPattern.length > 0) {
    return tank.thresholdPattern[turnCount % tank.thresholdPattern.length];
  }
  return tank.threshold;
}

export function isSensorActive(tank: TankState, turnCount: number): boolean {
  return computeVolume(tank) >= computeThreshold(tank, turnCount);
}

export function withContentType(
  tank: TankState,
  contentType: TankState['contentType'],
  drops: number,
): TankState {
  return { ...tank, contentType, drops };
}
