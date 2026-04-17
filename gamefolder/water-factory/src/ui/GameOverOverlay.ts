import Phaser from 'phaser';

export interface GameOverData {
  score: number;
  completedCount: number;
  highScore: number;
  newRecord: boolean;
}

export class GameOverOverlay {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, data: GameOverData, onRestart: () => void) {
    this.scene = scene;
    const bg = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75);
    const panel = scene.add.rectangle(640, 360, 600, 480, 0x2b2b3a)
      .setStrokeStyle(4, 0xffe66d);

    const title = scene.add.text(640, 170, 'GAME OVER', {
      fontSize: '56px', color: '#ff5050', fontStyle: 'bold'
    }).setOrigin(0.5);

    const scoreText = scene.add.text(640, 260, `최종 점수: ${data.score}`, {
      fontSize: '36px', color: '#ffffff'
    }).setOrigin(0.5);
    const completedText = scene.add.text(640, 310, `완수 주문: ${data.completedCount}건`, {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5);

    const highScoreText = scene.add.text(640, 390, `🏆 최고 점수: ${data.highScore}`, {
      fontSize: '28px', color: '#ffe66d'
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, panel, title, scoreText, completedText, highScoreText];

    if (data.newRecord) {
      const rec = scene.add.text(640, 440, '🎉 NEW RECORD! 🎉', {
        fontSize: '32px', color: '#3ad36d', fontStyle: 'bold'
      }).setOrigin(0.5);
      items.push(rec);
    }

    const restart = scene.add.text(640, 540, '🔁 다시하기', {
      fontSize: '36px', color: '#222034',
      backgroundColor: '#ffe66d', padding: { x: 24, y: 12 }, fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onRestart);
    items.push(restart);

    this.container = scene.add.container(0, 0, items).setDepth(1000);
  }

  destroy(): void {
    this.container.destroy();
  }
}
