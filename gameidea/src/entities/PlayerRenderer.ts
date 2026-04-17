// src/entities/PlayerRenderer.ts
import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';
import type { GameState } from '../core/GameState';

export class PlayerRenderer {
  private sprite: Phaser.GameObjects.Arc | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly originX: number, private readonly originY: number) {}

  render(state: GameState): void {
    const px = this.originX + state.player.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = this.originY + state.player.position.y * TILE_SIZE + TILE_SIZE / 2;
    if (this.sprite === null) {
      this.sprite = this.scene.add.circle(px, py, TILE_SIZE * 0.3, COLORS.player);
      this.sprite.setStrokeStyle(2, 0x000000);
    } else {
      this.scene.tweens.add({
        targets: this.sprite,
        x: px,
        y: py,
        duration: 150,
      });
    }
  }
}
