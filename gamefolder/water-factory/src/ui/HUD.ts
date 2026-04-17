import Phaser from 'phaser';

export class HUD {
  private readonly scene: Phaser.Scene;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly livesText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly soundBtn: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onToggleSound: () => void) {
    this.scene = scene;
    this.scoreText = scene.add.text(40, 30, '점수: 0', {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    });
    this.livesText = scene.add.text(640, 30, '❤️❤️❤️❤️❤️', {
      fontSize: '32px'
    }).setOrigin(0.5, 0);
    this.timerText = scene.add.text(1240, 30, '⏱ 10.0s', {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.soundBtn = scene.add.text(1240, 70, '🔇', {
      fontSize: '28px'
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onToggleSound);
  }

  update(score: number, lives: number, remainingMs: number, soundEnabled: boolean): void {
    this.scoreText.setText(`점수: ${score}`);
    this.livesText.setText('❤️'.repeat(Math.max(0, lives)));
    this.timerText.setText(`⏱ ${(remainingMs / 1000).toFixed(1)}s`);
    const warning = remainingMs < 3000;
    this.timerText.setColor(warning ? '#ff5050' : '#ffffff');
    this.soundBtn.setText(soundEnabled ? '🔊' : '🔇');
  }
}
