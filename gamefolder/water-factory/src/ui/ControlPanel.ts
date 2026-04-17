import Phaser from 'phaser';
import type { WaterState } from '../config';

export interface ControlPanelHandlers {
  onHeat: () => void;
  onCool: () => void;
  onShip: () => void;
}

export class ControlPanel {
  private readonly scene: Phaser.Scene;
  private readonly heatBtn: Phaser.GameObjects.Container;
  private readonly coolBtn: Phaser.GameObjects.Container;
  private readonly shipBtn: Phaser.GameObjects.Container;
  private allEnabled = true;

  constructor(scene: Phaser.Scene, centerX: number, y: number, handlers: ControlPanelHandlers) {
    this.scene = scene;
    this.heatBtn = this.makeButton(centerX - 160, y, 'btn_heat', '🔥', handlers.onHeat);
    this.coolBtn = this.makeButton(centerX,       y, 'btn_cool', '❄️', handlers.onCool);
    this.shipBtn = this.makeButton(centerX + 160, y, 'btn_ship', '📦', handlers.onShip);
  }

  private makeButton(x: number, y: number, texture: string, label: string, onTap: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.image(0, 0, texture)
      .setScale(3.5) // 32×32 Kenney tile → 112×112 button
      .setInteractive({ useHandCursor: true });
    const txt = this.scene.add.text(0, 0, label, { fontSize: '40px' }).setOrigin(0.5);
    const c = this.scene.add.container(x, y, [bg, txt]);
    bg.on('pointerdown', () => {
      if (!this.allEnabled) {
        this.shake(c);
        return;
      }
      if (c.getData('disabled')) {
        this.shake(c);
        return;
      }
      onTap();
    });
    return c;
  }

  private shake(c: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({
      targets: c,
      x: { from: c.x - 5, to: c.x },
      duration: 80,
      yoyo: true,
      repeat: 1
    });
  }

  setBoundariesForState(state: WaterState): void {
    this.setButtonDisabled(this.heatBtn, state === 'gas');
    this.setButtonDisabled(this.coolBtn, state === 'solid');
  }

  private setButtonDisabled(c: Phaser.GameObjects.Container, disabled: boolean): void {
    c.setData('disabled', disabled);
    c.setAlpha(disabled ? 0.4 : 1);
  }

  setAllEnabled(enabled: boolean): void {
    this.allEnabled = enabled;
    [this.heatBtn, this.coolBtn, this.shipBtn].forEach(c => {
      if (!enabled) c.setAlpha(0.4);
      else {
        const disabled = c.getData('disabled') === true;
        c.setAlpha(disabled ? 0.4 : 1);
      }
    });
  }
}
