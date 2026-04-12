import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export interface TouchInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  a: boolean;
  b: boolean;
}

const BUTTON_RADIUS = 30;
const ALPHA_IDLE = 0.35;
const ALPHA_PRESSED = 0.7;

export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;

  private input: TouchInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
  };

  private aJustPressed: boolean = false;
  private bJustPressed: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0);

    this.createDpad();
    this.createActionButtons();
  }

  // ── D-pad ──────────────────────────────────────────────────────────────

  private createDpad(): void {
    const cx = 90;
    const cy = GAME_HEIGHT - 90;
    const offset = BUTTON_RADIUS * 2 + 4;

    this.createCircleButton(cx, cy - offset, '↑', () => { this.input.up = true; }, () => { this.input.up = false; });
    this.createCircleButton(cx - offset, cy, '←', () => { this.input.left = true; }, () => { this.input.left = false; });
    this.createCircleButton(cx + offset, cy, '→', () => { this.input.right = true; }, () => { this.input.right = false; });
    this.createCircleButton(cx, cy + offset, '↓', () => { this.input.down = true; }, () => { this.input.down = false; });
  }

  // ── Action buttons ────────────────────────────────────────────────────

  private createActionButtons(): void {
    const bx = GAME_WIDTH - 80;
    const by = GAME_HEIGHT - 90;
    const offset = BUTTON_RADIUS + 8;

    // A button (blue) — right
    this.createCircleButton(
      bx + offset,
      by,
      'A',
      () => { this.input.a = true; this.aJustPressed = true; },
      () => { this.input.a = false; },
      0x4a90d9,
    );

    // B button (red) — left
    this.createCircleButton(
      bx - offset,
      by,
      'B',
      () => { this.input.b = true; this.bJustPressed = true; },
      () => { this.input.b = false; },
      0xd94a4a,
    );
  }

  // ── Helper: build a single circle button ──────────────────────────────

  private createCircleButton(
    x: number,
    y: number,
    label: string,
    onDown: () => void,
    onUp: () => void,
    fillColor: number = 0x444444,
  ): void {
    const gfx = this.scene.add.graphics();

    const draw = (alpha: number) => {
      gfx.clear();
      gfx.fillStyle(fillColor, alpha);
      gfx.lineStyle(2, 0xffffff, 0.8);
      gfx.fillCircle(x, y, BUTTON_RADIUS);
      gfx.strokeCircle(x, y, BUTTON_RADIUS);
    };

    draw(ALPHA_IDLE);

    // Interactive hit area
    gfx.setInteractive(
      new Phaser.Geom.Circle(x, y, BUTTON_RADIUS),
      Phaser.Geom.Circle.Contains,
    );

    gfx.on('pointerdown', () => {
      draw(ALPHA_PRESSED);
      onDown();
    });
    gfx.on('pointerup', () => {
      draw(ALPHA_IDLE);
      onUp();
    });
    gfx.on('pointerout', () => {
      draw(ALPHA_IDLE);
      onUp();
    });

    const text = this.scene.add
      .text(x, y, label, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    this.container.add([gfx, text]);
  }

  // ── Public API ────────────────────────────────────────────────────────

  getInput(): TouchInput {
    return { ...this.input };
  }

  isAJustPressed(): boolean {
    if (this.aJustPressed) {
      this.aJustPressed = false;
      return true;
    }
    return false;
  }

  isBJustPressed(): boolean {
    if (this.bJustPressed) {
      this.bJustPressed = false;
      return true;
    }
    return false;
  }

  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  destroy(): void {
    this.container.destroy();
  }
}
