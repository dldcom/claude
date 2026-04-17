import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    // Kenney CC0 pixel-art sprites
    // bg_wall: 128×72 procedural pixel art (scale ×10 in GameScene → 1280×720)
    this.load.image('bg_wall',    'assets/sprites/bg_wall.png');
    // cauldron: Kenney UI Pack - Pixel Adventure, 32×32 (scale ×5.5 → ~176px)
    this.load.image('cauldron',   'assets/sprites/cauldron.png');
    // water states: 64×56–72 procedural pixel art (scale ×1.8 → ~115×100)
    this.load.image('ice_cube',   'assets/sprites/ice.png');
    this.load.image('water_body', 'assets/sprites/water.png');
    this.load.image('steam_body', 'assets/sprites/steam.png');
    // buttons: Kenney UI Pack - Pixel Adventure, 32×32 (scale ×3.5 → 112×112)
    this.load.image('btn_heat',   'assets/sprites/btn_heat.png');
    this.load.image('btn_cool',   'assets/sprites/btn_cool.png');
    this.load.image('btn_ship',   'assets/sprites/btn_ship.png');
    // order card: Kenney UI Pack - Pixel Adventure, 32×32 (scale ×8 → 256×256)
    this.load.image('order_card', 'assets/sprites/order_card.png');
  }

  create(): void {
    const highScore = Number(localStorage.getItem('waterFactory.highScore') ?? 0);
    this.registry.set('highScore', highScore);
    const bestRankIdx = Number(localStorage.getItem('waterFactory.bestRankIdx') ?? 0);
    this.registry.set('bestRankIdx', bestRankIdx);
    this.registry.set('soundEnabled', false);
    this.scene.start('TitleScene');
  }
}
