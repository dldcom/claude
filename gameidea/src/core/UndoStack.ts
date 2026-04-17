import { GameState } from './GameState';

export class UndoStack {
  private readonly stack: GameState[] = [];

  push(state: GameState): void {
    this.stack.push(state.clone());
  }

  pop(): GameState | null {
    return this.stack.pop() ?? null;
  }

  canUndo(): boolean {
    return this.stack.length > 0;
  }

  clear(): void {
    this.stack.length = 0;
  }
}
