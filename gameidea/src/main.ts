// src/main.ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { StageScene } from './scenes/StageScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 768,
  backgroundColor: '#1a2530',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, StageScene],
});
