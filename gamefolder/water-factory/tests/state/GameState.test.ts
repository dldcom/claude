import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/state/GameState';
import { RULES, ORDERS, STATE_ORDER } from '../../src/config';

describe('GameState 초기화', () => {
  it('기본 상태는 점수 0, 목숨 5, 활성 주문 없음', () => {
    const g = new GameState(() => 0);
    expect(g.score).toBe(0);
    expect(g.lives).toBe(RULES.INITIAL_LIVES);
    expect(g.currentOrder).toBeNull();
    expect(g.completedCount).toBe(0);
    expect(g.isGameOver()).toBe(false);
  });
});

describe('startNewOrder', () => {
  it('RNG 0이면 ORDERS[0], 가마솥 상태는 STATE_ORDER[0]', () => {
    const rng = sequence(0, 0);
    const g = new GameState(rng);
    g.startNewOrder();
    expect(g.currentOrder).toEqual(ORDERS[0]);
    expect(g.currentCauldronState).toBe(STATE_ORDER[0]);
    expect(g.remainingMs).toBe(10_000);
  });

  it('RNG 0.99면 마지막 주문, 마지막 상태', () => {
    const rng = sequence(0.99, 0.99);
    const g = new GameState(rng);
    g.startNewOrder();
    expect(g.currentOrder).toEqual(ORDERS[ORDERS.length - 1]);
    expect(g.currentCauldronState).toBe(STATE_ORDER[STATE_ORDER.length - 1]);
  });
});

function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('난이도 상승', () => {
  it('점수 200점 넘기면 다음 주문 제한시간 9.5초', () => {
    const g = new GameState(() => 0);
    g.score = 200;
    g.startNewOrder();
    expect(g.remainingMs).toBe(9_500);
  });

  it('점수 2000점이어도 최소 4초는 보장', () => {
    const g = new GameState(() => 0);
    g.score = 99_999;
    g.startNewOrder();
    expect(g.remainingMs).toBe(4_000);
  });
});

describe('tick / 시간초과', () => {
  it('tick(1000)은 remainingMs를 1000 감소', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.tick(1000);
    expect(g.remainingMs).toBe(9_000);
  });

  it('remainingMs가 0 이하로 가면 timedOut=true, 목숨 -1', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    const result = g.tick(11_000);
    expect(result.timedOut).toBe(true);
    expect(g.lives).toBe(4);
    expect(g.remainingMs).toBe(0);
  });

  it('timedOut이 한 번 발생 후 다시 tick해도 목숨 더 안 줄어듦', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.tick(11_000);
    g.tick(5_000);
    expect(g.lives).toBe(4);
  });

  it('lives가 0이 되면 isGameOver() true', () => {
    const g = new GameState(() => 0);
    g.lives = 1;
    g.startNewOrder();
    g.tick(11_000);
    expect(g.isGameOver()).toBe(true);
  });
});

describe('ship', () => {
  it('정답: 기본 100 + 남은 초 * 10, 완수 카운트 증가', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = g.currentOrder!.target;
    g.remainingMs = 7_300; // 남은 7.3초
    const result = g.ship();
    expect(result.correct).toBe(true);
    expect(result.points).toBe(100 + 7 * 10);
    expect(g.score).toBe(170);
    expect(g.completedCount).toBe(1);
    expect(g.lives).toBe(5);
  });

  it('오답: 목숨 -1, 점수 변화 없음', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = 'solid';
    const orderTarget = g.currentOrder!.target;
    if (orderTarget === 'solid') g.currentCauldronState = 'gas';
    const result = g.ship();
    expect(result.correct).toBe(false);
    expect(result.points).toBe(0);
    expect(g.lives).toBe(4);
  });
});

describe('applyHeat / applyCool', () => {
  it('applyHeat: solid → liquid → gas, gas에서 멈춤', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = 'solid';
    expect(g.applyHeat()).toEqual({ from: 'solid', to: 'liquid' });
    expect(g.currentCauldronState).toBe('liquid');
    expect(g.applyHeat()).toEqual({ from: 'liquid', to: 'gas' });
    expect(g.applyHeat()).toBeNull();
    expect(g.currentCauldronState).toBe('gas');
  });

  it('applyCool: gas → liquid → solid, solid에서 멈춤', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = 'gas';
    expect(g.applyCool()).toEqual({ from: 'gas', to: 'liquid' });
    expect(g.applyCool()).toEqual({ from: 'liquid', to: 'solid' });
    expect(g.applyCool()).toBeNull();
  });
});
