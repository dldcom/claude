import { ORDERS, RULES, STATE_ORDER, type Order, type WaterState } from '../config';

export type RandomFn = () => number;

export class GameState {
  score = 0;
  lives = RULES.INITIAL_LIVES;
  currentOrder: Order | null = null;
  currentCauldronState: WaterState = 'liquid';
  remainingMs = RULES.INITIAL_TIME_MS;
  completedCount = 0;
  private readonly rng: RandomFn;

  constructor(rng: RandomFn = Math.random) {
    this.rng = rng;
  }

  isGameOver(): boolean {
    return this.lives <= 0;
  }

  startNewOrder(): void {
    const orderIdx = Math.floor(this.rng() * ORDERS.length);
    const stateIdx = Math.floor(this.rng() * STATE_ORDER.length);
    this.currentOrder = ORDERS[orderIdx];
    this.currentCauldronState = STATE_ORDER[stateIdx];
    this.remainingMs = this.computeTimeLimit();
  }

  private computeTimeLimit(): number {
    const steps = Math.floor(this.score / RULES.TIME_STEP_EVERY_SCORE);
    const reduced = RULES.INITIAL_TIME_MS - steps * RULES.TIME_STEP_MS;
    return Math.max(RULES.MIN_TIME_MS, reduced);
  }

  tick(deltaMs: number): TickResult {
    if (this.remainingMs <= 0) return { timedOut: false };
    this.remainingMs -= deltaMs;
    if (this.remainingMs <= 0) {
      this.remainingMs = 0;
      this.lives -= 1;
      return { timedOut: true };
    }
    return { timedOut: false };
  }

  ship(): ShipResult {
    if (!this.currentOrder) throw new Error('No active order');
    const target = this.currentOrder.target;
    const actual = this.currentCauldronState;
    const correct = target === actual;
    let points = 0;
    if (correct) {
      const remainingSec = Math.floor(this.remainingMs / 1000);
      points = RULES.BASE_CORRECT_POINTS + remainingSec * RULES.TIME_BONUS_PER_SECOND;
      this.score += points;
      this.completedCount += 1;
    } else {
      this.lives -= 1;
    }
    return { correct, points, targetState: target, actualState: actual };
  }

  applyHeat(): Transition | null {
    return this.shiftState(+1);
  }

  applyCool(): Transition | null {
    return this.shiftState(-1);
  }

  private shiftState(delta: number): Transition | null {
    const from = this.currentCauldronState;
    const idx = STATE_ORDER.indexOf(from);
    const next = idx + delta;
    if (next < 0 || next >= STATE_ORDER.length) return null;
    const to = STATE_ORDER[next];
    this.currentCauldronState = to;
    return { from, to };
  }
}

export interface Transition {
  from: WaterState;
  to: WaterState;
}

export interface ShipResult {
  correct: boolean;
  points: number;
  targetState: WaterState;
  actualState: WaterState;
}

export interface TickResult {
  timedOut: boolean;
}
