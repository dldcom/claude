import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';
import type { GameClass, Student } from '../types/index.js';

type LoginPhase = 'class' | 'student';

export class LoginScene extends Phaser.Scene {
  private phase: LoginPhase = 'class';

  private classes: GameClass[] = [];
  private students: Student[] = [];
  private selectedIndex: number = 0;
  private selectedClassId: number = 0;

  private titleText!: Phaser.GameObjects.Text;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private instructionText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'Login' });
  }

  create(): void {
    // Dark background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    // Title text
    this.titleText = this.add
      .text(GAME_WIDTH / 2, 60, '반을 선택하세요', {
        fontSize: '28px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0.5);

    // Status / loading text
    this.statusText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '불러오는 중...', {
        fontSize: '18px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5, 0.5);

    // Instruction text at bottom
    this.instructionText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '↑↓ 이동  A 선택', {
        fontSize: '14px',
        color: '#888888',
      })
      .setOrigin(0.5, 0.5);

    // Keyboard setup
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    // Load classes
    this.loadClasses();
  }

  private async loadClasses(): Promise<void> {
    try {
      const data = await api.getClasses();
      this.classes = Array.isArray(data) ? data : data.classes ?? [];
      this.phase = 'class';
      this.selectedIndex = 0;
      this.renderList();
    } catch (err) {
      this.statusText.setText('반 목록을 불러오지 못했습니다.');
      console.error('Failed to load classes', err);
    }
  }

  private async loadStudents(classId: number): Promise<void> {
    this.statusText.setText('불러오는 중...').setVisible(true);
    this.clearItemTexts();
    try {
      const data = await api.getStudentsByClass(classId);
      this.students = Array.isArray(data) ? data : data.students ?? [];
      this.phase = 'student';
      this.selectedIndex = 0;
      this.renderList();
    } catch (err) {
      this.statusText.setText('학생 목록을 불러오지 못했습니다.');
      console.error('Failed to load students', err);
    }
  }

  private renderList(): void {
    this.clearItemTexts();
    this.statusText.setVisible(false);

    const items: string[] =
      this.phase === 'class'
        ? this.classes.map((c) => c.name)
        : this.students.map((s) => s.name);

    if (items.length === 0) {
      this.statusText.setText('항목이 없습니다.').setVisible(true);
      return;
    }

    this.titleText.setText(this.phase === 'class' ? '반을 선택하세요' : '이름을 선택하세요');

    const startY = 130;
    const lineHeight = 44;
    const maxVisible = 9;
    const visibleItems = items.slice(0, maxVisible);

    visibleItems.forEach((label, i) => {
      const isSelected = i === this.selectedIndex;
      const text = this.add
        .text(GAME_WIDTH / 2, startY + i * lineHeight, label, {
          fontSize: '22px',
          color: isSelected ? '#ffdd57' : '#cccccc',
          fontStyle: isSelected ? 'bold' : 'normal',
        })
        .setOrigin(0.5, 0.5)
        .setInteractive({ useHandCursor: true });

      // Touch/click select
      text.on('pointerdown', () => {
        this.selectedIndex = i;
        this.confirmSelection();
      });

      // Hover highlight
      text.on('pointerover', () => {
        if (i !== this.selectedIndex) {
          text.setColor('#ffffff');
        }
      });
      text.on('pointerout', () => {
        if (i !== this.selectedIndex) {
          text.setColor('#cccccc');
        }
      });

      this.itemTexts.push(text);
    });

    this.updateHighlight();
  }

  private clearItemTexts(): void {
    this.itemTexts.forEach((t) => t.destroy());
    this.itemTexts = [];
  }

  private updateHighlight(): void {
    this.itemTexts.forEach((t, i) => {
      if (i === this.selectedIndex) {
        t.setColor('#ffdd57').setFontStyle('bold');
      } else {
        t.setColor('#cccccc').setFontStyle('normal');
      }
    });
  }

  private confirmSelection(): void {
    if (this.phase === 'class') {
      const cls = this.classes[this.selectedIndex];
      if (!cls) return;
      this.selectedClassId = cls.id;
      this.loadStudents(cls.id);
    } else {
      const student = this.students[this.selectedIndex];
      if (!student) return;
      const hasAvatar =
        student.avatar_config &&
        typeof student.avatar_config === 'object' &&
        Object.keys(student.avatar_config).length > 0;
      const nextScene = hasAvatar ? 'Hub' : 'CharacterCreate';
      this.scene.start(nextScene, { student });
    }
  }

  update(): void {
    if (!this.cursors) return;

    const items =
      this.phase === 'class' ? this.classes : this.students;
    const count = Math.min(items.length, 9);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (count > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + count) % count;
        this.updateHighlight();
      }
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      if (count > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % count;
        this.updateHighlight();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.confirmSelection();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      if (this.phase === 'student') {
        this.phase = 'class';
        this.selectedIndex = 0;
        this.renderList();
      }
    }
  }
}
