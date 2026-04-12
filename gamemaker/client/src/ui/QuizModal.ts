import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { QuizContent } from '../types/index.js';

const MODAL_W = 680;
const MODAL_H = 400;
const MODAL_X = (GAME_WIDTH - MODAL_W) / 2;
const MODAL_Y = (GAME_HEIGHT - MODAL_H) / 2;

export class QuizModal {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(950);
    this.container.setScrollFactor(0);

    // Full-screen overlay
    const overlay = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setOrigin(0, 0);
    this.container.add(overlay);

    // Modal box
    const modal = scene.add.rectangle(MODAL_X, MODAL_Y, MODAL_W, MODAL_H, 0x1a1a2e, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x4a90e2);
    this.container.add(modal);

    this.container.setVisible(false);
  }

  show(content: QuizContent, onAnswer: (answer: string) => void): void {
    // Remove previous dynamic children
    for (const obj of this.dynamicObjects) {
      obj.destroy();
    }
    this.dynamicObjects = [];

    this.container.setVisible(true);

    switch (content.type) {
      case 'blank_fill':
        this.renderBlankFill(content, onAnswer);
        break;
      case 'multiple_choice':
        this.renderMultipleChoice(content, onAnswer);
        break;
      case 'matching':
        this.renderMatching(content, onAnswer);
        break;
      case 'ox':
        this.renderOX(content, onAnswer);
        break;
    }
  }

  private addText(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle): Phaser.GameObjects.Text {
    const t = this.scene.add.text(x, y, text, style);
    this.container.add(t);
    this.dynamicObjects.push(t);
    return t;
  }

  private addButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    width = 260
  ): Phaser.GameObjects.Text {
    const btn = this.scene.add
      .text(x, y, label, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#2c3e50',
        padding: { x: 10, y: 8 },
        wordWrap: { width: width - 20 },
        fixedWidth: width,
        align: 'center',
      })
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#3498db' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#2c3e50' }));
    btn.on('pointerdown', onClick);

    this.container.add(btn);
    this.dynamicObjects.push(btn);
    return btn;
  }

  private renderBlankFill(
    content: { type: 'blank_fill'; sentence: string; options: string[] },
    onAnswer: (a: string) => void
  ): void {
    const mx = MODAL_X + 20;
    const my = MODAL_Y + 20;

    this.addText(mx, my, '빈칸 채우기', { fontSize: '16px', color: '#f1c40f', fontStyle: 'bold' });
    this.addText(mx, my + 34, content.sentence, {
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: MODAL_W - 40 },
    });

    const btnW = 300;
    const cols = 2;
    content.options.forEach((opt, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = mx + col * (btnW + 20);
      const by = my + 100 + row * 60;
      this.addButton(bx, by, `${i + 1}. ${opt}`, () => {
        this.hide();
        onAnswer(opt);
      }, btnW);
    });
  }

  private renderMultipleChoice(
    content: { type: 'multiple_choice'; question: string; options: string[] },
    onAnswer: (a: string) => void
  ): void {
    const mx = MODAL_X + 20;
    const my = MODAL_Y + 20;

    this.addText(mx, my, '객관식', { fontSize: '16px', color: '#f1c40f', fontStyle: 'bold' });
    this.addText(mx, my + 34, content.question, {
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: MODAL_W - 40 },
    });

    const btnW = 300;
    const cols = 2;
    content.options.forEach((opt, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = mx + col * (btnW + 20);
      const by = my + 110 + row * 60;
      this.addButton(bx, by, `${i + 1}. ${opt}`, () => {
        this.hide();
        onAnswer(opt);
      }, btnW);
    });
  }

  private renderMatching(
    content: { type: 'matching'; pairs: { left: string; right: string }[] },
    onAnswer: (a: string) => void
  ): void {
    const mx = MODAL_X + 20;
    const my = MODAL_Y + 20;

    this.addText(mx, my, '연결하기 (순서대로 오른쪽 항목 선택)', {
      fontSize: '15px', color: '#f1c40f', fontStyle: 'bold',
    });

    const leftItems = content.pairs.map((p) => p.left);
    const rightItems = content.pairs.map((p) => p.right).sort(() => Math.random() - 0.5);

    const selectedRight: string[] = [];
    let currentStep = 0;
    const rightButtons: Phaser.GameObjects.Text[] = [];

    const stepIndicator = this.addText(mx, my + 32, '', {
      fontSize: '13px', color: '#aaaaaa',
    });

    const updateStepIndicator = () => {
      if (currentStep < leftItems.length) {
        stepIndicator.setText(`"${leftItems[currentStep]}"와 연결할 항목을 선택하세요`);
      }
    };
    updateStepIndicator();

    // Left column (fixed)
    leftItems.forEach((item, i) => {
      this.addText(mx, my + 65 + i * 50, `${i + 1}. ${item}`, {
        fontSize: '14px',
        color: '#cce5ff',
        backgroundColor: '#1a3a5c',
        padding: { x: 8, y: 6 },
        fixedWidth: 260,
      });
    });

    // Right column (tappable)
    rightItems.forEach((item) => {
      const idx = rightItems.indexOf(item);
      const btn = this.addButton(mx + 320, my + 65 + idx * 50, item, () => {
        if (currentStep >= leftItems.length) return;
        selectedRight.push(item);
        btn.setStyle({ backgroundColor: '#27ae60', color: '#ffffff' });
        btn.disableInteractive();
        currentStep += 1;

        if (currentStep >= leftItems.length) {
          const answer = selectedRight.join('|');
          this.scene.time.delayedCall(400, () => {
            this.hide();
            onAnswer(answer);
          });
        } else {
          updateStepIndicator();
        }
      }, 260) as Phaser.GameObjects.Text;
      rightButtons.push(btn);
    });
  }

  private renderOX(
    content: { type: 'ox'; statement: string },
    onAnswer: (a: string) => void
  ): void {
    const mx = MODAL_X + 20;
    const my = MODAL_Y + 20;

    this.addText(mx, my, 'O / X 문제', { fontSize: '16px', color: '#f1c40f', fontStyle: 'bold' });
    this.addText(mx, my + 40, content.statement, {
      fontSize: '15px',
      color: '#ffffff',
      wordWrap: { width: MODAL_W - 40 },
    });

    const btnY = my + 180;

    // O button
    const oBtn = this.scene.add
      .text(MODAL_X + MODAL_W / 2 - 140, btnY, 'O', {
        fontSize: '56px',
        color: '#ffffff',
        backgroundColor: '#e74c3c',
        padding: { x: 24, y: 12 },
      })
      .setInteractive({ useHandCursor: true });
    oBtn.on('pointerover', () => oBtn.setStyle({ backgroundColor: '#c0392b' }));
    oBtn.on('pointerout', () => oBtn.setStyle({ backgroundColor: '#e74c3c' }));
    oBtn.on('pointerdown', () => { this.hide(); onAnswer('O'); });
    this.container.add(oBtn);
    this.dynamicObjects.push(oBtn);

    // X button
    const xBtn = this.scene.add
      .text(MODAL_X + MODAL_W / 2 + 40, btnY, 'X', {
        fontSize: '56px',
        color: '#ffffff',
        backgroundColor: '#3498db',
        padding: { x: 24, y: 12 },
      })
      .setInteractive({ useHandCursor: true });
    xBtn.on('pointerover', () => xBtn.setStyle({ backgroundColor: '#2980b9' }));
    xBtn.on('pointerout', () => xBtn.setStyle({ backgroundColor: '#3498db' }));
    xBtn.on('pointerdown', () => { this.hide(); onAnswer('X'); });
    this.container.add(xBtn);
    this.dynamicObjects.push(xBtn);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  destroy(): void {
    this.container.destroy();
  }
}
