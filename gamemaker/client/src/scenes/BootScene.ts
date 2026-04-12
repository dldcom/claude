import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    const { width, height } = this.scale;

    // Loading bar background
    const barBg = this.add.rectangle(width / 2, height / 2, 320, 24, 0x333333);
    barBg.setOrigin(0.5, 0.5);

    // Loading bar fill
    const barFill = this.add.rectangle(
      width / 2 - 158,
      height / 2,
      0,
      20,
      0x44aa66
    );
    barFill.setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add
      .text(width / 2, height / 2 - 24, '로딩 중...', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    // Update bar on progress
    this.load.on('progress', (value: number) => {
      barFill.width = 316 * value;
      loadingText.setText(`로딩 중... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.setText('완료!');
    });

    // No assets to load yet — sprites will be added in later tasks
  }

  create(): void {
    this.scene.start('Login');
  }
}
