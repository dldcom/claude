import { describe, it, expect } from 'vitest';
import {
  computeVolume,
  computeWeight,
  computeThreshold,
  isSensorActive,
  createEmptyTank,
  withContentType,
} from '../../src/core/TankRules';

describe('TankRules', () => {
  const baseTank = createEmptyTank({
    id: 't1',
    position: { x: 2, y: 2 },
    threshold: 12,
  });

  it('empty tank has volume 0 and weight 0', () => {
    expect(computeVolume(baseTank)).toBe(0);
    expect(computeWeight(baseTank)).toBe(0);
  });

  it('water tank: volume = drops * 10, weight = drops', () => {
    const t = { ...baseTank, contentType: 'water' as const, drops: 1 };
    expect(computeVolume(t)).toBe(10);
    expect(computeWeight(t)).toBe(1);
  });

  it('ice tank: volume = drops * 12 (20% 팽창), weight = drops', () => {
    const t = { ...baseTank, contentType: 'ice' as const, drops: 1 };
    expect(computeVolume(t)).toBe(12);
    expect(computeWeight(t)).toBe(1);
  });

  it('ice tank 2 drops: volume = 24, weight = 2', () => {
    const t = { ...baseTank, contentType: 'ice' as const, drops: 2 };
    expect(computeVolume(t)).toBe(24);
    expect(computeWeight(t)).toBe(2);
  });

  it('sensor activates when volume >= threshold', () => {
    const water = { ...baseTank, contentType: 'water' as const, drops: 1 };
    expect(isSensorActive(water, 0)).toBe(false);
    const ice = { ...baseTank, contentType: 'ice' as const, drops: 1 };
    expect(isSensorActive(ice, 0)).toBe(true);
  });

  it('computeThreshold falls back to fixed value if no pattern', () => {
    expect(computeThreshold(baseTank, 0)).toBe(12);
    expect(computeThreshold(baseTank, 5)).toBe(12);
  });

  it('computeThreshold cycles through pattern', () => {
    const t = { ...baseTank, thresholdPattern: [10, 15, 20] };
    expect(computeThreshold(t, 0)).toBe(10);
    expect(computeThreshold(t, 1)).toBe(15);
    expect(computeThreshold(t, 2)).toBe(20);
    expect(computeThreshold(t, 3)).toBe(10);
  });

  it('withContentType updates state immutably', () => {
    const water = withContentType(baseTank, 'water', 1);
    expect(water.contentType).toBe('water');
    expect(water.drops).toBe(1);
    expect(baseTank.contentType).toBe('empty');
  });
});
