import Phaser from 'phaser';
import { TILE_SIZE } from '../config';
import type { GameState } from '../core/GameState';
import type { TankState } from '../core/types';
import { computeVolume, computeWeight, computeThreshold } from '../core/TankRules';

export class TankRenderer {
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
    for (const tank of state.tanks.values()) {
      this.drawTank(tank, state);
    }
  }

  private drawTank(tank: TankState, state: GameState): void {
    const x = tank.position.x * TILE_SIZE;
    const y = tank.position.y * TILE_SIZE;
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;
    const h = TILE_SIZE * 1.8;
    const w = TILE_SIZE * 0.8;

    // 유리 잔 배경
    const bg = this.scene.add.rectangle(cx, cy - h * 0.2, w, h, 0xcfd8dc, 0.4);
    bg.setStrokeStyle(2, 0xffffff);
    this.container.add(bg);

    // 부피 바
    const volume = computeVolume(tank);
    const maxVolume = 30;
    const fillRatio = Math.min(volume / maxVolume, 1);
    const barH = h * fillRatio;
    if (fillRatio > 0) {
      const color = tank.contentType === 'ice' ? 0xb8e1ea : 0x4a90d9;
      const barY = cy - h * 0.2 + h / 2 - barH / 2;
      const bar = this.scene.add.rectangle(cx, barY, w - 6, barH, color);
      this.container.add(bar);
    }

    // 빨간 선 (threshold)
    const threshold = computeThreshold(tank, state.turnCount);
    const lineRatio = Math.min(threshold / maxVolume, 1);
    const lineY = cy - h * 0.2 + h / 2 - h * lineRatio;
    const line = this.scene.add.rectangle(cx, lineY, w - 4, 2, 0xff5252);
    this.container.add(line);

    // 전광판 (부피/무게)
    const readout = this.scene.add.text(
      cx,
      y + TILE_SIZE + h * 0.7,
      `부피: ${volume}\n무게: ${computeWeight(tank)}`,
      {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        align: 'center',
      },
    );
    readout.setOrigin(0.5, 0);
    this.container.add(readout);
  }
}
