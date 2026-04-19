// src/scenes/StageScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST, TILE_SIZE } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';
import { executeAction } from '../core/TurnEngine';
import { UndoStack } from '../core/UndoStack';
import type { ActionKind, Direction, Position } from '../core/types';
import { DIRECTION_DELTA } from '../core/types';
import { TileRenderer } from '../entities/TileRenderer';
import { PlayerRenderer } from '../entities/PlayerRenderer';
import { TankRenderer } from '../entities/TankRenderer';
import { HUD, type PlayMode } from '../ui/HUD';
import { showStageClearModal, showEndingScreen } from '../ui/StageClearModal';

interface StageSceneData {
  levelIndex: number;
}

export class StageScene extends Phaser.Scene {
  private state!: GameState;
  private initialState!: GameState;
  private levelIndex!: number;
  private tileRenderer!: TileRenderer;
  private tankRenderer!: TankRenderer;
  private playerRenderer!: PlayerRenderer;
  private hud!: HUD;
  private undoStack = new UndoStack();
  private originX = 0;
  private originY = 0;
  private freezeArrows: Phaser.GameObjects.GameObject[] = [];
  private mode: PlayMode = 'play';

  constructor() {
    super(SCENE_KEYS.Stage);
  }

  init(data: StageSceneData) {
    this.levelIndex = data.levelIndex;
    this.undoStack = new UndoStack();
    this.freezeArrows = [];
    this.mode = 'play';
  }

  create() {
    const id = LEVEL_PLAYLIST[this.levelIndex];
    const yamlText = this.cache.text.get(`level:${id}`);
    this.state = loadLevelFromYaml(yamlText);
    this.initialState = this.state;

    const mapW = this.state.grid.width * TILE_SIZE;
    const mapH = this.state.grid.height * TILE_SIZE;
    this.originX = (Number(this.game.config.width) - mapW) / 2;
    this.originY = (Number(this.game.config.height) - mapH) / 2;

    this.tileRenderer = new TileRenderer(this, this.originX, this.originY);
    this.tankRenderer = new TankRenderer(this, this.originX, this.originY);
    this.playerRenderer = new PlayerRenderer(this, this.originX, this.originY);
    this.rerender();

    this.hud = new HUD(this, {
      onUndo: () => this.doUndo(),
      onRestart: () => this.doRestart(),
      onSelectMode: (m) => this.selectMode(m),
    });
    this.hud.setMode(this.mode);
    this.updateHUD();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.handleTap(p));
  }

  private rerender(): void {
    this.tileRenderer.render(this.state);
    this.tankRenderer.render(this.state);
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

    if (this.mode === 'play') {
      if (obj !== null && obj.type === 'water') {
        this.promptFreezeDirection(cell);
        return;
      }
      if (ground.type === 'spring') {
        this.promptPourDirection();
        return;
      }
    }

    if (this.mode === 'melt') {
      if (obj !== null && obj.type === 'ice') {
        this.applyAction({ kind: 'melt', target: cell });
        return;
      }
    }

    // fall through: try move
    const direction: Direction =
      dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
    this.applyAction({ kind: 'move', direction });
  }

  private promptPourDirection(): void {
    this.clearFreezeArrows();
    const p = this.state.player.position;
    for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
      const d = DIRECTION_DELTA[dir];
      const nx = p.x + d.dx;
      const ny = p.y + d.dy;
      if (!this.state.grid.inBounds(nx, ny)) continue;
      if (this.state.grid.getGround(nx, ny).type !== 'floor') continue;
      if (this.state.grid.getObject(nx, ny) !== null) continue;
      const px = this.originX + nx * TILE_SIZE + TILE_SIZE / 2;
      const py = this.originY + ny * TILE_SIZE + TILE_SIZE / 2;
      const marker = this.add.text(px, py, '💧', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffffff',
      });
      marker.setOrigin(0.5);
      marker.setInteractive({ useHandCursor: true });
      marker.on('pointerdown', (e: Phaser.Input.Pointer) => {
        e.event.stopPropagation();
        this.clearFreezeArrows();
        this.applyAction({ kind: 'pour', target: { x: nx, y: ny } });
      });
      this.freezeArrows.push(marker);
    }
  }

  private applyAction(action: ActionKind): void {
    const next = executeAction(this.state, action);
    if (next === this.state) return;
    this.undoStack.push(this.state);
    this.state = next;
    this.rerender();
    this.updateHUD();
    if (this.state.isWon) this.onStageCleared();
  }

  private doUndo(): void {
    const prev = this.undoStack.pop();
    if (prev === null) return;
    this.state = prev;
    this.rerender();
    this.updateHUD();
  }

  private doRestart(): void {
    this.undoStack.clear();
    this.state = this.initialState;
    this.mode = 'play';
    this.hud.setMode('play');
    this.clearFreezeArrows();
    this.rerender();
    this.updateHUD();
  }

  private selectMode(m: PlayMode): void {
    this.mode = m;
    this.hud.setMode(m);
    this.clearFreezeArrows();
  }

  private updateHUD(): void {
    const id = LEVEL_PLAYLIST[this.levelIndex];
    this.hud.update({
      levelId: id,
      turnCount: this.state.turnCount,
      flowersCollected: this.state.flowersCollected,
      flowersRequired: this.state.flowersRequired,
    });
  }

  private onStageCleared(): void {
    const isLast = this.levelIndex >= LEVEL_PLAYLIST.length - 1;
    showStageClearModal(this, {
      turnCount: this.state.turnCount,
      isLast,
      onNext: () => {
        if (isLast) {
          showEndingScreen(this);
        } else {
          this.scene.restart({ levelIndex: this.levelIndex + 1 });
        }
      },
    });
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
