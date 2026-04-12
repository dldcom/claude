import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';
import { Student, ShopItem, OwnedItem } from '../types/index.js';

const ROW_H = 52;
const LIST_X = 60;
const LIST_Y_START = 130;
const VISIBLE_ROWS = 7;

export class ShopScene extends Phaser.Scene {
  private student!: Student;
  private items: ShopItem[] = [];
  private ownedIds: Set<number> = new Set();
  private coins: number = 0;
  private selectedIndex: number = 0;
  private rowObjects: Phaser.GameObjects.Container[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private messageTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'Shop' });
  }

  init(data: { student: Student }): void {
    this.student = data.student;
    this.coins = data.student.coins;
    this.items = [];
    this.ownedIds = new Set();
    this.selectedIndex = 0;
    this.rowObjects = [];
  }

  async create(): Promise<void> {
    // Background
    this.cameras.main.setBackgroundColor(0x1a1a2e);

    // Title
    this.add.text(GAME_WIDTH / 2, 24, '상점', {
      fontSize: '26px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(10);

    // Coin display
    this.coinText = this.add.text(GAME_WIDTH - 20, 24, `코인: ${this.coins}`, {
      fontSize: '16px',
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(10);

    // Divider
    this.add.rectangle(GAME_WIDTH / 2, 80, GAME_WIDTH - 40, 2, 0x444466)
      .setDepth(5);

    // Column headers
    this.add.text(LIST_X, 95, '이름', { fontSize: '13px', color: '#aaaaaa' }).setDepth(10);
    this.add.text(LIST_X + 240, 95, '종류', { fontSize: '13px', color: '#aaaaaa' }).setDepth(10);
    this.add.text(LIST_X + 360, 95, '가격', { fontSize: '13px', color: '#aaaaaa' }).setDepth(10);

    // Message area
    this.messageText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
      fontSize: '14px',
      color: '#ff4444',
    }).setOrigin(0.5, 1).setDepth(10);

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 52, '↑↓: 선택   ENTER: 구매   ESC: 뒤로', {
      fontSize: '12px',
      color: '#666688',
    }).setOrigin(0.5, 1).setDepth(10);

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    // Load data
    await this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const [shopItems, inventory] = await Promise.all([
        api.getShopItems(),
        api.getInventory(this.student.id),
      ]);
      this.items = shopItems as ShopItem[];
      const ownedList = inventory as OwnedItem[];
      this.ownedIds = new Set(ownedList.map(i => i.id));
    } catch {
      this.items = [];
      this.ownedIds = new Set();
    }

    this.renderList();
  }

  private renderList(): void {
    // Clear previous rows
    for (const row of this.rowObjects) {
      row.destroy();
    }
    this.rowObjects = [];

    if (this.items.length === 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '아이템이 없습니다.', {
        fontSize: '16px',
        color: '#aaaaaa',
      }).setOrigin(0.5, 0.5).setDepth(10);
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      this.createRow(i);
    }

    this.updateSelection();
  }

  private createRow(index: number): void {
    const item = this.items[index];
    const owned = this.ownedIds.has(item.id);
    const y = LIST_Y_START + index * ROW_H;

    const container = this.add.container(0, y);
    container.setDepth(10);

    // Row background
    const bg = this.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH - 40, ROW_H - 4, 0x2a2a4a)
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    bg.on('pointerdown', () => {
      this.selectedIndex = index;
      this.updateSelection();
    });

    bg.on('pointerover', () => {
      this.selectedIndex = index;
      this.updateSelection();
    });

    container.add(bg);

    // Name
    const nameColor = owned ? '#2ecc71' : '#ffffff';
    const nameText = this.add.text(LIST_X, ROW_H / 4, item.name, {
      fontSize: '14px',
      color: nameColor,
      fontStyle: owned ? 'bold' : 'normal',
    });
    container.add(nameText);

    // Owned checkmark
    if (owned) {
      const check = this.add.text(LIST_X + 200, ROW_H / 4, '✓', {
        fontSize: '14px',
        color: '#2ecc71',
        fontStyle: 'bold',
      });
      container.add(check);
    }

    // Category
    const categoryText = this.add.text(LIST_X + 240, ROW_H / 4, item.category, {
      fontSize: '13px',
      color: '#aaaacc',
    });
    container.add(categoryText);

    // Price
    const priceText = this.add.text(LIST_X + 360, ROW_H / 4, `${item.price} 코인`, {
      fontSize: '13px',
      color: '#f1c40f',
    });
    container.add(priceText);

    this.rowObjects.push(container);
  }

  private updateSelection(): void {
    for (let i = 0; i < this.rowObjects.length; i++) {
      const container = this.rowObjects[i];
      if (!container) continue;
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      if (i === this.selectedIndex) {
        bg.setFillStyle(0x3d3d7a);
        bg.setStrokeStyle(1, 0x4a90d9);
      } else {
        bg.setFillStyle(0x2a2a4a);
        bg.setStrokeStyle(0);
      }
    }
  }

  update(): void {
    // Navigation
    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (this.selectedIndex > 0) {
        this.selectedIndex -= 1;
        this.updateSelection();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.downKey) || Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      if (this.selectedIndex < this.items.length - 1) {
        this.selectedIndex += 1;
        this.updateSelection();
      }
    }

    // Buy
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      void this.buySelected();
    }

    // Back
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.returnToHub();
    }
  }

  private async buySelected(): Promise<void> {
    if (this.items.length === 0) return;
    const item = this.items[this.selectedIndex];
    if (!item) return;

    if (this.ownedIds.has(item.id)) {
      this.showMessage('이미 보유한 아이템입니다.', '#aaaaaa');
      return;
    }

    if (this.coins < item.price) {
      this.showMessage('코인이 부족합니다!', '#ff4444');
      return;
    }

    try {
      const result = await api.buyItem(this.student.id, item.id);
      this.coins = result.coins ?? (this.coins - item.price);
      this.ownedIds.add(item.id);
      this.coinText.setText(`코인: ${this.coins}`);
      this.showMessage(`"${item.name}" 구매 완료!`, '#2ecc71');
      // Re-render to show owned state
      this.renderList();
    } catch (err: any) {
      const msg = err?.message ?? '구매에 실패했습니다.';
      this.showMessage(msg, '#ff4444');
    }
  }

  private showMessage(text: string, color: string): void {
    this.messageText.setText(text);
    this.messageText.setColor(color);

    if (this.messageTimer) {
      this.messageTimer.remove();
    }
    this.messageTimer = this.time.delayedCall(2500, () => {
      this.messageText.setText('');
    });
  }

  private returnToHub(): void {
    this.scene.start('Hub', { student: { ...this.student, coins: this.coins } });
  }
}
