import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  pixelArt: true,
  backgroundColor: '#222034',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    {
      key: 'Empty',
      create(this: Phaser.Scene) {
        this.add.text(640, 360, '워터 팩토리', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
      }
    }
  ]
};

new Phaser.Game(config);
