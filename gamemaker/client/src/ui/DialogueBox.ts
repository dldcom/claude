import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

const BOX_HEIGHT = 140;
const BOX_MARGIN = 10;
const BOX_Y = GAME_HEIGHT - BOX_HEIGHT - BOX_MARGIN;

export class DialogueBox {
  private container: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;

  private dialogues: string[] = [];
  private currentIndex: number = 0;
  private onComplete?: () => void;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.container = scene.add.container(BOX_MARGIN, BOX_Y);
    this.container.setDepth(900);
    this.container.setScrollFactor(0);

    const boxWidth = GAME_WIDTH - BOX_MARGIN * 2;

    // Background
    const bg = scene.add.rectangle(0, 0, boxWidth, BOX_HEIGHT, 0x000000, 0.82)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x888888);
    this.container.add(bg);

    // NPC name
    this.nameText = scene.add.text(14, 10, '', {
      fontSize: '14px',
      color: '#f1c40f',
      fontStyle: 'bold',
    });
    this.container.add(this.nameText);

    // Body text
    this.bodyText = scene.add.text(14, 34, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 28 },
    });
    this.container.add(this.bodyText);

    // Prompt indicator
    this.promptText = scene.add.text(boxWidth - 20, BOX_HEIGHT - 18, '▼', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(1, 1);
    this.container.add(this.promptText);

    this.container.setVisible(false);
  }

  show(npcName: string, dialogues: string[], onComplete?: () => void): void {
    this.dialogues = dialogues;
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.nameText.setText(npcName);
    this.container.setVisible(true);
    this.renderCurrent();
  }

  private renderCurrent(): void {
    const line = this.dialogues[this.currentIndex] ?? '';
    this.bodyText.setText(line);
    const isLast = this.currentIndex >= this.dialogues.length - 1;
    this.promptText.setText(isLast ? '▶' : '▼');
  }

  /** Advances to next line. Returns true when all lines are done. */
  advance(): boolean {
    this.currentIndex += 1;
    if (this.currentIndex >= this.dialogues.length) {
      this.hide();
      this.onComplete?.();
      return true;
    }
    this.renderCurrent();
    return false;
  }

  hide(): void {
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  destroy(): void {
    this.container.destroy();
  }
}
