import { Grid } from './Grid';
import type { PlayerState, TankState } from './types';

interface GameStateInit {
  grid: Grid;
  player: PlayerState;
  flowersRequired: number;
  flowersCollected?: number;
  turnCount?: number;
  nextIceGroupId?: number;
  isWon?: boolean;
  tanks?: Map<string, TankState>;
}

export class GameState {
  /**
   * Immutable snapshot of a puzzle stage in progress.
   *
   * NOTE on `flowersCollected`: counts ONLY flowers marked required (`F` in YAML).
   * Optional flowers (`f`) are removed from the grid when the player walks over them
   * but are not tallied here. Win check uses `flowersCollected >= flowersRequired`.
   * (Bonus/star tracking for optional flowers is a Phase 2 concern.)
   */
  private constructor(
    public readonly grid: Grid,
    public readonly player: PlayerState,
    public readonly flowersRequired: number,
    public readonly flowersCollected: number,
    public readonly turnCount: number,
    public readonly nextIceGroupId: number,
    public readonly isWon: boolean,
    public readonly tanks: Map<string, TankState>,
  ) {}

  static create(init: GameStateInit): GameState {
    return new GameState(
      init.grid,
      init.player,
      init.flowersRequired,
      init.flowersCollected ?? 0,
      init.turnCount ?? 0,
      init.nextIceGroupId ?? 1,
      init.isWon ?? false,
      init.tanks ?? new Map(),
    );
  }

  clone(): GameState {
    return new GameState(
      this.grid.clone(),
      { position: { ...this.player.position }, facing: this.player.facing },
      this.flowersRequired,
      this.flowersCollected,
      this.turnCount,
      this.nextIceGroupId,
      this.isWon,
      new Map(this.tanks),
    );
  }

  withPatch(patch: Partial<GameStateInit>): GameState {
    return GameState.create({
      grid: patch.grid ?? this.grid,
      player: patch.player ?? this.player,
      flowersRequired: patch.flowersRequired ?? this.flowersRequired,
      flowersCollected: patch.flowersCollected ?? this.flowersCollected,
      turnCount: patch.turnCount ?? this.turnCount,
      nextIceGroupId: patch.nextIceGroupId ?? this.nextIceGroupId,
      isWon: patch.isWon ?? this.isWon,
      tanks: patch.tanks ?? this.tanks,
    });
  }
}
