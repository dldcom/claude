import Phaser from 'phaser';

class HelloScene extends Phaser.Scene {
  constructor() {
    super('HelloScene');
  }
  create() {
    this.add.text(100, 100, '얼음왕국의 균열 — 부트 성공', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 768,
  backgroundColor: '#1a2530',
  scene: [HelloScene],
});
