// src/scenes/StageScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST, TILE_SIZE } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';
import { TileRenderer } from '../entities/TileRenderer';
import { PlayerRenderer } from '../entities/PlayerRenderer';

interface StageSceneData {
  levelIndex: number;
}

export class StageScene extends Phaser.Scene {
  private state!: GameState;
  private levelIndex!: number;
  private tileRenderer!: TileRenderer;
  private playerRenderer!: PlayerRenderer;
  private originX = 0;
  private originY = 0;

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

    const mapW = this.state.grid.width * TILE_SIZE;
    const mapH = this.state.grid.height * TILE_SIZE;
    this.originX = (Number(this.game.config.width) - mapW) / 2;
    this.originY = (Number(this.game.config.height) - mapH) / 2;

    this.tileRenderer = new TileRenderer(this, this.originX, this.originY);
    this.playerRenderer = new PlayerRenderer(this, this.originX, this.originY);
    this.rerender();
  }

  private rerender(): void {
    this.tileRenderer.render(this.state);
    this.playerRenderer.render(this.state);
  }
}
