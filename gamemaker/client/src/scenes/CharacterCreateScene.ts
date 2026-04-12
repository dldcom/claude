import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';
import { Student, AvatarConfig } from '../types/index.js';

interface SlotOption {
  value: string;
  label: string;
}

interface Slot {
  key: keyof AvatarConfig;
  name: string;
  options: SlotOption[];
  selectedIndex: number;
}

const SLOTS: Omit<Slot, 'selectedIndex'>[] = [
  {
    key: 'hair',
    name: '머리',
    options: [
      { value: 'longhair/brown', label: '긴 갈색 머리' },
      { value: 'shorthair/black', label: '짧은 검은 머리' },
      { value: 'longhair/blonde', label: '긴 금발 머리' },
      { value: 'shorthair/red', label: '짧은 빨간 머리' },
    ],
  },
  {
    key: 'torso',
    name: '상의',
    options: [
      { value: 'shirt/blue', label: '파란 셔츠' },
      { value: 'shirt/red', label: '빨간 셔츠' },
      { value: 'armor/leather', label: '가죽 갑옷' },
      { value: 'shirt/green', label: '초록 셔츠' },
      { value: 'shirt/white', label: '흰 셔츠' },
    ],
  },
  {
    key: 'legs',
    name: '하의',
    options: [
      { value: 'pants/blue', label: '파란 바지' },
      { value: 'pants/brown', label: '갈색 바지' },
      { value: 'skirt/blue', label: '파란 치마' },
      { value: 'pants/black', label: '검은 바지' },
    ],
  },
  {
    key: 'feet',
    name: '신발',
    options: [
      { value: 'boots/brown', label: '갈색 부츠' },
      { value: 'shoes/black', label: '검은 운동화' },
      { value: 'boots/black', label: '검은 부츠' },
      { value: 'sandals/brown', label: '갈색 샌들' },
    ],
  },
];

const FIXED_BODY = 'child/light';

export class CharacterCreateScene extends Phaser.Scene {
  private student!: Student;
  private slots!: Slot[];
  private activeSlotIndex: number = 0;

  // UI elements
  private slotTexts: Phaser.GameObjects.Text[] = [];
  private optionTexts: Phaser.GameObjects.Text[][] = [];
  private previewText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private prevActiveSlot: number = -1;
  private prevOptionIndices: number[] = [];

  constructor() {
    super({ key: 'CharacterCreate' });
  }

  init(data: { student: Student }): void {
    this.student = data.student;
    this.slots = SLOTS.map((s) => ({ ...s, selectedIndex: 0 }));
    this.activeSlotIndex = 0;
  }

  create(): void {
    // Dark background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '캐릭터 만들기', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Left panel: slot list
    this.buildSlotUI();

    // Right panel: preview
    this.add.text(520, 80, '미리보기', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0);

    this.previewText = this.add.text(520, 110, '', {
      fontSize: '14px',
      color: '#ffffff',
      lineSpacing: 8,
    }).setOrigin(0.5, 0);

    this.updatePreview();

    // "완료" button
    const doneBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '✓ 완료', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });

    doneBtn.on('pointerover', () => doneBtn.setStyle({ color: '#d5f5e3' }));
    doneBtn.on('pointerout', () => doneBtn.setStyle({ color: '#ffffff' }));
    doneBtn.on('pointerdown', () => this.confirmSelection());

    // Keyboard
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    this.prevActiveSlot = this.activeSlotIndex;
    this.prevOptionIndices = this.slots.map((s) => s.selectedIndex);
  }

  private buildSlotUI(): void {
    this.slotTexts = [];
    this.optionTexts = [];

    const startY = 80;
    const slotSpacing = 120;

    for (let si = 0; si < this.slots.length; si++) {
      const slot = this.slots[si];
      const baseY = startY + si * slotSpacing;

      const slotLabel = this.add.text(20, baseY, slot.name, {
        fontSize: '16px',
        color: si === this.activeSlotIndex ? '#f1c40f' : '#aaaaaa',
        fontStyle: 'bold',
      });
      this.slotTexts.push(slotLabel);

      const optionRow: Phaser.GameObjects.Text[] = [];
      const optionsPerRow = Math.min(slot.options.length, 3);
      const colWidth = 140;

      for (let oi = 0; oi < slot.options.length; oi++) {
        const col = oi % optionsPerRow;
        const row = Math.floor(oi / optionsPerRow);
        const ox = 30 + col * colWidth;
        const oy = baseY + 25 + row * 28;

        const isSelected = slot.selectedIndex === oi;
        const optText = this.add
          .text(ox, oy, slot.options[oi].label, {
            fontSize: '13px',
            color: isSelected ? '#2ecc71' : '#cccccc',
            backgroundColor: isSelected ? '#1e5631' : undefined,
            padding: isSelected ? { x: 4, y: 2 } : undefined,
          })
          .setInteractive({ useHandCursor: true });

        const capturedSi = si;
        const capturedOi = oi;
        optText.on('pointerdown', () => {
          this.activeSlotIndex = capturedSi;
          this.slots[capturedSi].selectedIndex = capturedOi;
          this.refreshUI();
          this.updatePreview();
        });

        optionRow.push(optText);
      }
      this.optionTexts.push(optionRow);
    }
  }

  private refreshUI(): void {
    for (let si = 0; si < this.slots.length; si++) {
      const slot = this.slots[si];

      this.slotTexts[si].setStyle({
        color: si === this.activeSlotIndex ? '#f1c40f' : '#aaaaaa',
      });

      for (let oi = 0; oi < slot.options.length; oi++) {
        const isSelected = slot.selectedIndex === oi;
        const optText = this.optionTexts[si][oi];
        optText.setStyle({
          color: isSelected ? '#2ecc71' : '#cccccc',
          backgroundColor: isSelected ? '#1e5631' : undefined,
          padding: isSelected ? { x: 4, y: 2 } : undefined,
        });
      }
    }
    this.updatePreview();
  }

  private updatePreview(): void {
    const lines = [`몸: 어린이/밝은 피부 (고정)`];
    for (const slot of this.slots) {
      const opt = slot.options[slot.selectedIndex];
      lines.push(`${slot.name}: ${opt.label}`);
    }
    this.previewText?.setText(lines.join('\n'));
  }

  update(): void {
    if (!this.cursors) return;

    const upJust = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    const downJust = Phaser.Input.Keyboard.JustDown(this.cursors.down);
    const leftJust = Phaser.Input.Keyboard.JustDown(this.cursors.left);
    const rightJust = Phaser.Input.Keyboard.JustDown(this.cursors.right);
    const enterJust = Phaser.Input.Keyboard.JustDown(this.enterKey);

    if (upJust) {
      this.activeSlotIndex = (this.activeSlotIndex - 1 + this.slots.length) % this.slots.length;
      this.refreshUI();
    } else if (downJust) {
      this.activeSlotIndex = (this.activeSlotIndex + 1) % this.slots.length;
      this.refreshUI();
    } else if (leftJust) {
      const slot = this.slots[this.activeSlotIndex];
      slot.selectedIndex = (slot.selectedIndex - 1 + slot.options.length) % slot.options.length;
      this.refreshUI();
    } else if (rightJust) {
      const slot = this.slots[this.activeSlotIndex];
      slot.selectedIndex = (slot.selectedIndex + 1) % slot.options.length;
      this.refreshUI();
    } else if (enterJust) {
      this.confirmSelection();
    }
  }

  private async confirmSelection(): Promise<void> {
    const avatarConfig: AvatarConfig = {
      body: FIXED_BODY,
      hair: this.slots[0].options[this.slots[0].selectedIndex].value,
      torso: this.slots[1].options[this.slots[1].selectedIndex].value,
      legs: this.slots[2].options[this.slots[2].selectedIndex].value,
      feet: this.slots[3].options[this.slots[3].selectedIndex].value,
    };

    try {
      await api.updateAvatar(this.student.id, avatarConfig);
    } catch (e) {
      console.warn('Failed to save avatar:', e);
    }

    const updatedStudent = { ...this.student, avatar_config: avatarConfig };
    this.scene.start('Hub', { student: updatedStudent });
  }
}
