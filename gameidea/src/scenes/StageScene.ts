// src/scenes/StageScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';

interface StageSceneData {
  levelIndex: number;
}

export class StageScene extends Phaser.Scene {
  private state!: GameState;
  private levelIndex!: number;

  constructor() {
    super(SCENE_KEYS.Stage);
  }

  init(data: StageSceneData) {
    this.levelIndex = data.levelIndex;
  }

  create() {
    const id = LEVEL_PLAYLIST[this.levelIndex];
    const yamlText = this.cache.text.get(`level:${id}`);
    this.state = loadLevelFromYaml(yamlText);

    this.add.text(16, 16, `Level ${id} loaded — ${this.state.grid.width}×${this.state.grid.height}`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.add.text(16, 40, `Player: (${this.state.player.position.x}, ${this.state.player.position.y})`, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#aaaaaa',
    });
  }
}
