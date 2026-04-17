// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload() {
    for (const id of LEVEL_PLAYLIST) {
      this.load.text(`level:${id}`, `levels/${id}.yaml`);
    }
  }

  create() {
    this.scene.start(SCENE_KEYS.Stage, { levelIndex: 0 });
  }
}
