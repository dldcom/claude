import Phaser from 'phaser';
import type { Order, Customer } from '../config';

export class OrderBoard {
  private readonly scene: Phaser.Scene;
  private readonly cardX: number;
  private readonly cardY: number;
  private readonly customerEmoji: Phaser.GameObjects.Text;
  private readonly customerName: Phaser.GameObjects.Text;
  private readonly greetingText: Phaser.GameObjects.Text;
  private readonly orderEmoji: Phaser.GameObjects.Text;
  private readonly orderTitle: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.cardX = x;
    this.cardY = y;
    scene.add.image(x, y, 'order_card');
    // 고객 영역 (상단)
    this.customerEmoji = scene.add.text(x, y - 100, '', { fontSize: '48px' }).setOrigin(0.5);
    this.customerName = scene.add.text(x, y - 60, '', {
      fontSize: '16px', color: '#4a3a10', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.greetingText = scene.add.text(x, y - 30, '', {
      fontSize: '14px', color: '#333333', align: 'center',
      wordWrap: { width: 210 }, fontStyle: 'italic'
    }).setOrigin(0.5);
    // 주문 영역 (하단)
    this.orderEmoji = scene.add.text(x, y + 30, '', { fontSize: '56px' }).setOrigin(0.5);
    this.orderTitle = scene.add.text(x, y + 90, '', {
      fontSize: '22px', color: '#222222', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 210 }
    }).setOrigin(0.5);
  }

  setOrder(order: Order | null, customer: Customer | null = null, greeting: string = ''): void {
    if (!order) {
      this.customerEmoji.setText('');
      this.customerName.setText('');
      this.greetingText.setText('');
      this.orderEmoji.setText('');
      this.orderTitle.setText('');
      return;
    }
    if (customer) {
      this.customerEmoji.setText(customer.emoji);
      this.customerName.setText(customer.name);
      this.greetingText.setText(`"${greeting}"`);
    }
    this.orderEmoji.setText(order.emoji);
    this.orderTitle.setText(order.name);
  }

  showReaction(success: boolean): void {
    const emoji = success ? '😊' : '😡';
    const reaction = this.scene.add.text(this.cardX, this.cardY - 100, emoji, {
      fontSize: '72px'
    }).setOrigin(0.5);
    const ring = this.scene.add.circle(this.cardX, this.cardY - 100, 50, 0xffffff, 0)
      .setStrokeStyle(4, success ? 0x3ad36d : 0xff5050);
    this.scene.tweens.add({
      targets: [reaction, ring],
      alpha: 0,
      y: `-=30`,
      scale: 1.4,
      delay: 400,
      duration: 300,
      onComplete: () => { reaction.destroy(); ring.destroy(); }
    });
  }
}
