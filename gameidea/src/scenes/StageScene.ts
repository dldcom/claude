// src/scenes/StageScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST, TILE_SIZE } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';
import { executeAction } from '../core/TurnEngine';
import type { Direction, Position } from '../core/types';
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

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.handleTap(p));
  }

  private rerender(): void {
    this.tileRenderer.render(this.state);
    this.playerRenderer.render(this.state);
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    const cell = this.pointerToCell(pointer);
    if (cell === null) return;
    this.tryTap(cell);
  }

  private pointerToCell(pointer: Phaser.Input.Pointer): Position | null {
    const localX = pointer.x - this.originX;
    const localY = pointer.y - this.originY;
    if (localX < 0 || localY < 0) return null;
    const x = Math.floor(localX / TILE_SIZE);
    const y = Math.floor(localY / TILE_SIZE);
    if (!this.state.grid.inBounds(x, y)) return null;
    return { x, y };
  }

  private tryTap(cell: Position): void {
    const p = this.state.player.position;
    const dx = cell.x - p.x;
    const dy = cell.y - p.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    const direction: Direction =
      dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
    const prev = this.state;
    const next = executeAction(prev, { kind: 'move', direction });
    if (next === prev) return;
    this.state = next;
    this.rerender();
  }
}
