import Phaser from 'phaser';
import { AvatarConfig } from '../types/index.js';

// 아바타 설정에서 오는 레이어
const AVATAR_LAYERS: (keyof AvatarConfig)[] = ['body', 'legs', 'feet', 'torso', 'hair'];

// 고정 레이어 (항상 표시, 아바타 설정 불필요)
const FIXED_LAYERS: { key: string; textureKey: string }[] = [
  { key: 'head', textureKey: 'lpc_head_child' },
  { key: 'eyes', textureKey: 'lpc_eyes_child' },
  { key: 'nose', textureKey: 'lpc_nose_button' },
];

// LPC walk.png layout: 4 rows (up=0, left=1, down=2, right=3), 9 frames each, 64×64
const WALK_ROWS: Record<string, number> = {
  up: 0,
  left: 1,
  down: 2,
  right: 3,
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

    // 아바타 설정 레이어 (body, legs, feet, torso)
    for (const layer of AVATAR_LAYERS) {
      if (layer === 'hair') continue; // hair는 얼굴 위에 올려야 하므로 나중에
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

    // 고정 레이어 (머리 윤곽, 눈, 코)
    for (const fixed of FIXED_LAYERS) {
      if (!scene.textures.exists(fixed.textureKey)) continue;

      const sprite = scene.add.sprite(0, 0, fixed.textureKey);
      sprite.setOrigin(0.5, 0.75);
      this.ensureAnimations(scene, fixed.textureKey);
      this.sprites.set(fixed.key, sprite);
      this.container.add(sprite);
    }

    // 머리카락은 얼굴 위에
    const hairValue = avatarConfig.hair;
    if (hairValue) {
      const hairKey = `lpc_hair_${hairValue.replace(/\//g, '_')}`;
      if (scene.textures.exists(hairKey)) {
        const sprite = scene.add.sprite(0, 0, hairKey);
        sprite.setOrigin(0.5, 0.75);
        this.ensureAnimations(scene, hairKey);
        this.sprites.set('hair', sprite);
        this.container.add(sprite);
      }
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
    for (const [, sprite] of this.sprites) {
      const animKey = `${sprite.texture.key}_walk_${direction}`;
      if (this.scene.anims.exists(animKey)) {
        sprite.play(animKey, true);
      }
    }
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
