// src/entities/GateRenderer.ts
import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import type { GameState } from '../core/GameState';
import type { GateObject } from '../core/types';
import { computeVolume, computeThreshold } from '../core/TankRules';

export class GateRenderer {
  private container!: Phaser.GameObjects.Container;
  private rendered = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly originX: number,
    private readonly originY: number,
  ) {}

  render(state: GameState): void {
    if (!this.rendered) {
      this.container = this.scene.add.container(this.originX, this.originY);
      this.rendered = true;
    }
    this.container.removeAll(true);
    for (let y = 0; y < state.grid.height; y++) {
      for (let x = 0; x < state.grid.width; x++) {
        const obj = state.grid.getObject(x, y);
        if (obj === null || obj.type !== 'gate') continue;
        this.drawGate(obj, x, y, state);
      }
    }
  }

  private drawGate(gate: GateObject, x: number, y: number, state: GameState): void {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    const open = isGateOpen(gate, state);
    const color = open ? 0x5ea94d : 0x6b3a1e;
    const alpha = open ? 0.4 : 1;

    const rect = this.scene.add.rectangle(
      px + TILE_SIZE / 2,
      py + TILE_SIZE / 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4,
      color,
      alpha,
    );
    rect.setStrokeStyle(2, 0x000000);
    this.container.add(rect);

    const label = this.scene.add.text(
      px + TILE_SIZE / 2,
      py + TILE_SIZE / 2,
      open ? '열림' : '🔒',
      {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      },
    );
    label.setOrigin(0.5);
    this.container.add(label);
  }
}

function isGateOpen(gate: GateObject, state: GameState): boolean {
  return gate.linkedTankIds.every(tankId => {
    const tank = state.tanks.get(tankId);
    if (!tank) return false;
    return computeVolume(tank) >= computeThreshold(tank, state.turnCount);
  });
}
