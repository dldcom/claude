import Phaser from 'phaser';
import { AvatarConfig } from '../types/index.js';

const LAYER_ORDER: (keyof AvatarConfig)[] = ['body', 'legs', 'feet', 'torso', 'hair'];

const WALK_ROWS: Record<string, number> = {
  up: 8,
  left: 9,
  down: 10,
  right: 11,
};

const FRAME_RATE = 10;
const WALK_FRAMES = 9;

export class CharacterSprite {
  private container: Phaser.GameObjects.Container;
  private sprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private currentDirection: string = 'down';
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number, y: number, avatarConfig: AvatarConfig) {
    this.scene = scene;
    this.container = scene.add.container(x, y);

    for (const layer of LAYER_ORDER) {
      const value = avatarConfig[layer];
      if (!value) continue;

      const textureKey = `lpc_${layer}_${value.replace(/\//g, '_')}`;
      if (!scene.textures.exists(textureKey)) continue;

      const sprite = scene.add.sprite(0, 0, textureKey);
      sprite.setOrigin(0.5, 0.75);

      this.ensureAnimations(scene, textureKey);
      this.sprites.set(layer, sprite);
      this.container.add(sprite);
    }

    this.playIdle();
  }

  private ensureAnimations(scene: Phaser.Scene, textureKey: string): void {
    for (const [direction, row] of Object.entries(WALK_ROWS)) {
      const animKey = `${textureKey}_walk_${direction}`;
      if (scene.anims.exists(animKey)) continue;

      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(textureKey, {
          start: row * WALK_FRAMES,
          end: row * WALK_FRAMES + WALK_FRAMES - 1,
        }),
        frameRate: FRAME_RATE,
        repeat: -1,
      });
    }
  }

  walk(direction: string): void {
    this.currentDirection = direction;
    for (const [layer, sprite] of this.sprites) {
      const textureKey = `lpc_${layer}_${this.getLayerValue(layer)}`;
      const animKey = `${textureKey}_walk_${direction}`;
      if (this.scene.anims.exists(animKey)) {
        sprite.play(animKey, true);
      }
    }
  }

  private getLayerValue(layer: string): string {
    // Derive the value from the existing texture key
    const sprite = this.sprites.get(layer);
    if (!sprite) return '';
    // textureKey format: lpc_{layer}_{value_with_underscores}
    const prefix = `lpc_${layer}_`;
    return sprite.texture.key.slice(prefix.length);
  }

  playIdle(): void {
    const row = WALK_ROWS[this.currentDirection] ?? WALK_ROWS['down'];
    const firstFrame = row * WALK_FRAMES;
    for (const sprite of this.sprites.values()) {
      sprite.stop();
      sprite.setFrame(firstFrame);
    }
  }

  setPosition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  destroy(): void {
    this.container.destroy();
  }
}
