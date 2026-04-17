import Phaser from 'phaser';
import type { Order } from '../config';

export class OrderBoard {
  private readonly scene: Phaser.Scene;
  private readonly card: Phaser.GameObjects.Image;
  private readonly emoji: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly caption: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.card = scene.add.image(x, y, 'order_card');
    this.caption = scene.add.text(x, y - 110, '오늘의 주문', {
      fontSize: '22px', color: '#4a3a10', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.emoji = scene.add.text(x, y - 30, '', {
      fontSize: '96px'
    }).setOrigin(0.5);
    this.title = scene.add.text(x, y + 80, '', {
      fontSize: '28px', color: '#333333', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5);
  }

  setOrder(order: Order | null): void {
    if (!order) {
      this.emoji.setText('');
      this.title.setText('');
      return;
    }
    this.emoji.setText(order.emoji);
    this.title.setText(order.name);
  }
}
