import { Grid } from './Grid';
import type { PlayerState } from './types';

interface GameStateInit {
  grid: Grid;
  player: PlayerState;
  flowersRequired: number;
  flowersCollected?: number;
  turnCount?: number;
  nextIceGroupId?: number;
  isWon?: boolean;
}

export class GameState {
  private constructor(
    public readonly grid: Grid,
    public readonly player: PlayerState,
    public readonly flowersRequired: number,
    public readonly flowersCollected: number,
    public readonly turnCount: number,
    public readonly nextIceGroupId: number,
    public readonly isWon: boolean,
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
    });
  }
}
