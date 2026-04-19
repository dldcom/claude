// src/entities/TileRenderer.ts
import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';
import type { GameState } from '../core/GameState';

export class TileRenderer {
  private readonly container: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene, originX: number, originY: number) {
    this.container = scene.add.container(originX, originY);
  }

  render(state: GameState): void {
    this.container.removeAll(true);
    for (let y = 0; y < state.grid.height; y++) {
      for (let x = 0; x < state.grid.width; x++) {
        this.drawGround(state, x, y);
        this.drawObject(state, x, y);
      }
    }
  }

  private drawGround(state: GameState, x: number, y: number): void {
    const g = state.grid.getGround(x, y);
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    let color: number;
    switch (g.type) {
      case 'wall': color = COLORS.wall; break;
      case 'floor': color = COLORS.floor; break;
      case 'spring': color = COLORS.spring; break;
      case 'bonfire': color = COLORS.bonfire; break;
      case 'exit': color = COLORS.exit; break;
      case 'tank': color = 0x7a99c2; break;  // 임시 placeholder, 실제 렌더는 Task 10 TankRenderer
      default: color = COLORS.floor; break;
    }
    const rect = this.scene.add.rectangle(
      px + TILE_SIZE / 2,
      py + TILE_SIZE / 2,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
      color,
    );
    this.container.add(rect);

    const label = labelForGround(g.type);
    if (label) {
      const txt = this.scene.add.text(
        px + TILE_SIZE / 2,
        py + TILE_SIZE / 2,
        label,
        { fontFamily: 'sans-serif', fontSize: '14px', color: '#000000' },
      );
      txt.setOrigin(0.5);
      this.container.add(txt);
    }
  }

  private drawObject(state: GameState, x: number, y: number): void {
    const o = state.grid.getObject(x, y);
    if (o === null) return;
    const px = x * TILE_SIZE + TILE_SIZE / 2;
    const py = y * TILE_SIZE + TILE_SIZE / 2;
    let color: number;
    let label = '';
    switch (o.type) {
      case 'water': color = COLORS.water; label = '~'; break;
      case 'ice': color = COLORS.ice; label = o.role === 'head' ? '❄' : '·'; break;
      case 'box': color = COLORS.box; label = '□'; break;
      case 'rock': color = COLORS.rock; label = '●'; break;
      case 'flower': color = o.required ? COLORS.flower : COLORS.flowerOptional; label = '✿'; break;
      default: color = COLORS.floor; break;
    }
    const shape = this.scene.add.rectangle(px, py, TILE_SIZE - 12, TILE_SIZE - 12, color);
    this.container.add(shape);
    if (label) {
      const txt = this.scene.add.text(px, py, label, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      });
      txt.setOrigin(0.5);
      this.container.add(txt);
    }
  }
}

function labelForGround(type: string): string {
  switch (type) {
    case 'spring': return 'S';
    case 'bonfire': return 'B';
    case 'exit': return 'E';
    default: return '';
  }
}
