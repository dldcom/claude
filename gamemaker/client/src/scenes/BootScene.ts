import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    const { width, height } = this.scale;

    // Loading bar background
    const barBg = this.add.rectangle(width / 2, height / 2, 320, 24, 0x333333);
    barBg.setOrigin(0.5, 0.5);

    // Loading bar fill
    const barFill = this.add.rectangle(
      width / 2 - 158,
      height / 2,
      0,
      20,
      0x44aa66
    );
    barFill.setOrigin(0, 0.5);

    // Loading text
    const loadingText = this.add
      .text(width / 2, height / 2 - 24, '로딩 중...', {
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    // Update bar on progress
    this.load.on('progress', (value: number) => {
      barFill.width = 316 * value;
      loadingText.setText(`로딩 중... ${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.setText('완료!');
    });

    // LPC character spritesheets (walk animations, 576×256, 9 cols × 4 rows, 64×64 each)
    // Row layout: 0=up, 1=left, 2=down, 3=right
    const SPRITE_FRAME = { frameWidth: 64, frameHeight: 64 };

    // Body
    this.load.spritesheet('lpc_body_child_light', 'assets/sprites/body_child_light.png', SPRITE_FRAME);

    // Hair
    this.load.spritesheet('lpc_hair_short_brown', 'assets/sprites/hair_short_brown.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_hair_short_black', 'assets/sprites/hair_short_black.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_hair_long_brown', 'assets/sprites/hair_long_brown.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_hair_curly_black', 'assets/sprites/hair_curly_black.png', SPRITE_FRAME);

    // Torso
    this.load.spritesheet('lpc_torso_shirt_blue', 'assets/sprites/torso_shirt_blue.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_torso_shirt_red', 'assets/sprites/torso_shirt_red.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_torso_vest_green', 'assets/sprites/torso_vest_green.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_torso_shirt_white', 'assets/sprites/torso_shirt_white.png', SPRITE_FRAME);

    // Legs
    this.load.spritesheet('lpc_legs_pants_dark', 'assets/sprites/legs_pants_dark.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_legs_pants_brown', 'assets/sprites/legs_pants_brown.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_legs_shorts_black', 'assets/sprites/legs_shorts_black.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_legs_skirt_blue', 'assets/sprites/legs_skirt_blue.png', SPRITE_FRAME);

    // Feet
    this.load.spritesheet('lpc_feet_shoes_brown', 'assets/sprites/feet_shoes_brown.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_feet_shoes_black', 'assets/sprites/feet_shoes_black.png', SPRITE_FRAME);
    this.load.spritesheet('lpc_feet_shoes_white', 'assets/sprites/feet_shoes_white.png', SPRITE_FRAME);
  }

  create(): void {
    this.scene.start('Login');
  }
}
