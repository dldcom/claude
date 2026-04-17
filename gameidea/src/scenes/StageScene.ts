// src/scenes/StageScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST, TILE_SIZE } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';
import { executeAction } from '../core/TurnEngine';
import type { ActionKind, Direction, Position } from '../core/types';
import { DIRECTION_DELTA } from '../core/types';
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
  private freezeArrows: Phaser.GameObjects.GameObject[] = [];

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
    this.clearFreezeArrows();
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
    if (cell.x === p.x && cell.y === p.y) return;

    const dx = cell.x - p.x;
    const dy = cell.y - p.y;
    const isAdjacent = Math.abs(dx) + Math.abs(dy) === 1;
    if (!isAdjacent) return;

    const obj = this.state.grid.getObject(cell.x, cell.y);
    const ground = this.state.grid.getGround(cell.x, cell.y);

    if (obj !== null && obj.type === 'water') {
      this.promptFreezeDirection(cell);
      return;
    }
    if (obj !== null && obj.type === 'ice') {
      this.applyAction({ kind: 'melt', target: cell });
      return;
    }
    if (obj === null && ground.type === 'floor' && this.playerIsNearSpring()) {
      this.applyAction({ kind: 'pour', target: cell });
      return;
    }
    const direction: Direction =
      dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
    this.applyAction({ kind: 'move', direction });
  }

  private playerIsNearSpring(): boolean {
    const { x, y } = this.state.player.position;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.state.grid.inBounds(nx, ny) && this.state.grid.getGround(nx, ny).type === 'spring') {
        return true;
      }
    }
    return false;
  }

  private applyAction(action: ActionKind): void {
    const next = executeAction(this.state, action);
    if (next === this.state) return;
    this.state = next;
    this.rerender();
  }

  private promptFreezeDirection(target: Position): void {
    this.clearFreezeArrows();
    const angleMap: Record<Direction, number> = { right: 0, down: 90, left: 180, up: -90 };
    for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
      const d = DIRECTION_DELTA[dir];
      const nx = target.x + d.dx;
      const ny = target.y + d.dy;
      if (!this.state.grid.inBounds(nx, ny)) continue;
      const px = this.originX + nx * TILE_SIZE + TILE_SIZE / 2;
      const py = this.originY + ny * TILE_SIZE + TILE_SIZE / 2;
      const arrow = this.add.text(px, py, '▶', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
      });
      arrow.setOrigin(0.5);
      arrow.setAngle(angleMap[dir]);
      arrow.setInteractive({ useHandCursor: true });
      arrow.on('pointerdown', (e: Phaser.Input.Pointer) => {
        e.event.stopPropagation();
        this.clearFreezeArrows();
        this.applyAction({ kind: 'freeze', target, direction: dir });
      });
      this.freezeArrows.push(arrow);
    }
  }

  private clearFreezeArrows(): void {
    for (const a of this.freezeArrows) a.destroy();
    this.freezeArrows.length = 0;
  }
}
