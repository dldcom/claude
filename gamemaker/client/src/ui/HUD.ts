import Phaser from 'phaser';
import { GAME_WIDTH } from '../config.js';

export class HUD {
  private container: Phaser.GameObjects.Container;
  private coinText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setDepth(800);
    this.container.setScrollFactor(0);

    // Gold background pill
    const bg = scene.add.rectangle(GAME_WIDTH - 10, 10, 130, 32, 0xf39c12, 1)
      .setOrigin(1, 0)
      .setStrokeStyle(1, 0xe67e22);
    this.container.add(bg);

    this.coinText = scene.add.text(GAME_WIDTH - 75, 26, '코인: 0', {
      fontSize: '14px',
      color: '#1a1a1a',
      fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    this.container.add(this.coinText);
  }

  updateCoins(amount: number): void {
    this.coinText.setText(`코인: ${amount}`);
  }

  destroy(): void {
    this.container.destroy();
  }
}
