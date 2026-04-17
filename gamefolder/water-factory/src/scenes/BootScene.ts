import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    this.createPlaceholderTextures();
  }

  create(): void {
    const highScore = Number(localStorage.getItem('waterFactory.highScore') ?? 0);
    this.registry.set('highScore', highScore);
    const bestRankIdx = Number(localStorage.getItem('waterFactory.bestRankIdx') ?? 0);
    this.registry.set('bestRankIdx', bestRankIdx);
    this.registry.set('soundEnabled', false);
    this.scene.start('TitleScene');
  }

  private createPlaceholderTextures(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 }, false);
    const rect = (key: string, w: number, h: number, color: number) => {
      gfx.clear();
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, w, h);
      gfx.generateTexture(key, w, h);
    };
    rect('bg_wall',    1280, 720, 0x3c3c4a);
    rect('cauldron',    200, 180, 0x8a8a9a);
    rect('ice_cube',    120, 100, 0xa0e4ff);
    rect('water_body',  120, 100, 0x3a7bd5);
    rect('steam_body',  120, 100, 0xe6e6ff);
    rect('btn_heat',    120,  80, 0xd33a3a);
    rect('btn_cool',    120,  80, 0x3a8dd3);
    rect('btn_ship',    120,  80, 0x3ad36d);
    rect('order_card',  240, 280, 0xf7e7b8);
    gfx.destroy();
  }
}
