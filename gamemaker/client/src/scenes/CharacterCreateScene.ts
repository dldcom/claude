import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';
import { Student, AvatarConfig } from '../types/index.js';
import { CharacterSprite } from '../sprites/CharacterSprite.js';

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

// 옵션 value는 BootScene에서 로드한 스프라이트 키와 일치해야 함
// 키 형식: lpc_{layer}_{value.replace('/', '_')}
const SLOTS: Omit<Slot, 'selectedIndex'>[] = [
  {
    key: 'hair',
    name: '머리',
    options: [
      { value: 'short/brown', label: '짧은 갈색 머리' },
      { value: 'short/black', label: '짧은 검은 머리' },
      { value: 'long/brown', label: '긴 갈색 머리' },
      { value: 'curly/black', label: '곱슬 검은 머리' },
    ],
  },
  {
    key: 'torso',
    name: '상의',
    options: [
      { value: 'shirt/blue', label: '파란 셔츠' },
      { value: 'shirt/red', label: '빨간 셔츠' },
      { value: 'vest/green', label: '초록 조끼' },
      { value: 'shirt/white', label: '흰 셔츠' },
    ],
  },
  {
    key: 'legs',
    name: '하의',
    options: [
      { value: 'pants/dark', label: '진청 바지' },
      { value: 'pants/brown', label: '갈색 바지' },
      { value: 'shorts/black', label: '검은 반바지' },
      { value: 'skirt/blue', label: '파란 치마' },
    ],
  },
  {
    key: 'feet',
    name: '신발',
    options: [
      { value: 'shoes/brown', label: '갈색 구두' },
      { value: 'shoes/black', label: '검은 구두' },
      { value: 'shoes/white', label: '흰 운동화' },
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
  private previewSprite: CharacterSprite | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private prevActiveSlot: number = -1;
  private prevOptionIndices: number[] = [];
  private previewDirection: string = 'down';
  private previewTimer: number = 0;

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
    this.add.text(560, 80, '미리보기', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0);

    // Preview background
    this.add.rectangle(560, 240, 160, 200, 0x111122, 0.6)
      .setStrokeStyle(1, 0x444466);

    this.rebuildPreview();

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
          this.rebuildPreview();
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
    this.rebuildPreview();
  }

  private rebuildPreview(): void {
    // Destroy old sprite
    if (this.previewSprite) {
      this.previewSprite.destroy();
      this.previewSprite = null;
    }

    const config = this.buildAvatarConfig();
    try {
      this.previewSprite = new CharacterSprite(this, 560, 250, config);
      this.previewSprite.setDepth(100);
      // Scale up for better visibility
      this.previewSprite.getContainer().setScale(2.5);
      // Start walking animation
      this.previewSprite.walk('down');
    } catch {
      this.previewSprite = null;
    }
  }

  private buildAvatarConfig(): AvatarConfig {
    return {
      body: FIXED_BODY,
      hair: this.slots[0].options[this.slots[0].selectedIndex].value,
      torso: this.slots[1].options[this.slots[1].selectedIndex].value,
      legs: this.slots[2].options[this.slots[2].selectedIndex].value,
      feet: this.slots[3].options[this.slots[3].selectedIndex].value,
    };
  }

  update(_time: number, delta: number): void {
    if (!this.cursors) return;

    // 미리보기 캐릭터 방향 자동 전환 (2초마다)
    if (this.previewSprite) {
      this.previewTimer += delta;
      if (this.previewTimer > 2000) {
        this.previewTimer = 0;
        const dirs = ['down', 'left', 'up', 'right'];
        const curIdx = dirs.indexOf(this.previewDirection);
        this.previewDirection = dirs[(curIdx + 1) % 4];
        this.previewSprite.walk(this.previewDirection);
      }
    }

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
    const avatarConfig = this.buildAvatarConfig();

    try {
      await api.updateAvatar(this.student.id, avatarConfig);
    } catch (e) {
      console.warn('Failed to save avatar:', e);
    }

    const updatedStudent = { ...this.student, avatar_config: avatarConfig };
    this.scene.start('Hub', { student: updatedStudent });
  }
}
