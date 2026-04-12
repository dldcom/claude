import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config.js';
import { TouchControls } from '../ui/TouchControls.js';
import { HUD } from '../ui/HUD.js';
import { api } from '../api/client.js';
import { Student, Region } from '../types/index.js';

const PLAYER_SPEED = 120;

interface PortalZone {
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  region: Region | null;
  x: number;
  y: number;
}

interface ShopZone {
  body: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
}

export class HubScene extends Phaser.Scene {
  private student!: Student;
  private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private controls!: TouchControls;
  private hud!: HUD;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private portals: PortalZone[] = [];
  private shopZone!: ShopZone;
  private enterCooldown: boolean = false;

  constructor() {
    super({ key: 'Hub' });
  }

  init(data: { student: Student }): void {
    this.student = data.student;
    this.portals = [];
  }

  async create(): Promise<void> {
    // Background
    this.cameras.main.setBackgroundColor(0x3a7d44);

    // Tile grid
    this.drawTileGrid();

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '학습 마을', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(10);

    // Player
    const playerGfx = this.add.graphics();
    playerGfx.fillStyle(0xff6b6b);
    playerGfx.fillRect(0, 0, 24, 32);
    playerGfx.generateTexture('player_hub', 24, 32);
    playerGfx.destroy();

    this.player = this.physics.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'player_hub') as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(50);

    // Portals
    let regions: Region[] = [];
    try {
      regions = await api.getRegions();
    } catch {
      // continue with empty list
    }
    this.createPortals(regions);

    // Shop zone
    this.createShopZone();

    // HUD
    this.hud = new HUD(this);
    this.hud['container'].setDepth(800);
    this.hud.updateCoins(this.student.coins);

    // Touch controls
    this.controls = new TouchControls(this);

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  private drawTileGrid(): void {
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x2d6636, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
      gfx.moveTo(x, 0);
      gfx.lineTo(x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
      gfx.moveTo(0, y);
      gfx.lineTo(GAME_WIDTH, y);
    }
    gfx.strokePath();
    gfx.setDepth(1);
  }

  private createPortals(regions: Region[]): void {
    // 2 columns × 3 rows, left side of map
    const cols = 2;
    const rows = 3;
    const startX = 100;
    const startY = 120;
    const spacingX = 160;
    const spacingY = 140;
    const portalW = 80;
    const portalH = 60;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const px = startX + col * spacingX;
        const py = startY + row * spacingY;
        const region = regions[idx] ?? null;
        const isActive = region !== null;
        const color = isActive ? 0x4a90d9 : 0x888888;

        const body = this.add.rectangle(px, py, portalW, portalH, color)
          .setStrokeStyle(2, 0xffffff)
          .setDepth(10)
          .setInteractive({ useHandCursor: isActive });

        if (isActive) {
          body.on('pointerover', () => body.setFillStyle(0x5ba0e9));
          body.on('pointerout', () => body.setFillStyle(color));
          body.on('pointerdown', () => {
            if (!this.enterCooldown && region) {
              this.transitionTo('Region', { student: this.student, regionId: region.id });
            }
          });
        }

        const labelText = region ? region.name : `지역 ${idx + 1}`;
        const label = this.add.text(px, py, labelText, {
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: portalW - 10 },
        }).setOrigin(0.5, 0.5).setDepth(11);

        this.portals.push({ body, label, region, x: px, y: py });
      }
    }
  }

  private createShopZone(): void {
    const sx = GAME_WIDTH - 90;
    const sy = GAME_HEIGHT / 2;

    const body = this.add.rectangle(sx, sy, 80, 70, 0xd4a017)
      .setStrokeStyle(2, 0xffffff)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    body.on('pointerover', () => body.setFillStyle(0xe4b027));
    body.on('pointerout', () => body.setFillStyle(0xd4a017));
    body.on('pointerdown', () => {
      if (!this.enterCooldown) {
        this.transitionTo('Shop', { student: this.student });
      }
    });

    const label = this.add.text(sx, sy, '상점', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(11);

    this.shopZone = { body, label, x: sx, y: sy };
  }

  update(): void {
    if (!this.player || !this.controls) return;

    const touch = this.controls.getInput();
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || touch.left) vx = -PLAYER_SPEED;
    else if (this.cursors.right.isDown || touch.right) vx = PLAYER_SPEED;

    if (this.cursors.up.isDown || touch.up) vy = -PLAYER_SPEED;
    else if (this.cursors.down.isDown || touch.down) vy = PLAYER_SPEED;

    this.player.setVelocity(vx, vy);

    // Interaction: ENTER key or A button
    const aPressed = this.controls.isAJustPressed();
    const enterPressed = Phaser.Input.Keyboard.JustDown(this.enterKey);

    if ((aPressed || enterPressed) && !this.enterCooldown) {
      this.handleInteraction();
    }
  }

  private handleInteraction(): void {
    const px = this.player.x;
    const py = this.player.y;

    // Check portals
    for (const portal of this.portals) {
      const dist = Phaser.Math.Distance.Between(px, py, portal.x, portal.y);
      if (dist < 50 && portal.region) {
        this.transitionTo('Region', { student: this.student, regionId: portal.region.id });
        return;
      }
    }

    // Check shop
    const shopDist = Phaser.Math.Distance.Between(px, py, this.shopZone.x, this.shopZone.y);
    if (shopDist < 50) {
      this.transitionTo('Shop', { student: this.student });
    }
  }

  private transitionTo(sceneKey: string, data: object): void {
    this.enterCooldown = true;
    this.controls.destroy();
    this.hud.destroy();
    this.scene.start(sceneKey, data);
  }
}
