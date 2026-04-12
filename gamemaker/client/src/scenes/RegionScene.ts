import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config.js';
import { TouchControls } from '../ui/TouchControls.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { QuizModal } from '../ui/QuizModal.js';
import { HUD } from '../ui/HUD.js';
import { api } from '../api/client.js';
import { Student, NPC, Question, StudentProgress, RegionDetailResponse } from '../types/index.js';

const PLAYER_SPEED = 200;
const NPC_INTERACT_DIST = 50;
const BONUS_COINS = 30;

interface NpcState {
  npc: NPC;
  question: Question | null;
  sprite: Phaser.GameObjects.Rectangle;
  nameLabel: Phaser.GameObjects.Text;
  checkmark: Phaser.GameObjects.Text;
  x: number;
  y: number;
  cleared: boolean;
  wrongCount: number;
}

type InteractionPhase =
  | 'idle'
  | 'dialogue_before'
  | 'quiz'
  | 'dialogue_correct'
  | 'dialogue_wrong'
  | 'dialogue_after'
  | 'epilogue';

export class RegionScene extends Phaser.Scene {
  private student!: Student;
  private regionId!: number;
  private player!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  private controls!: TouchControls;
  private dialogueBox!: DialogueBox;
  private quizModal!: QuizModal;
  private hud!: HUD;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private bKey!: Phaser.Input.Keyboard.Key;

  private npcStates: NpcState[] = [];
  private phase: InteractionPhase = 'idle';
  private activeNpc: NpcState | null = null;
  private coins: number = 0;
  private blocked: boolean = false;

  constructor() {
    super({ key: 'Region' });
  }

  init(data: { student: Student; regionId: number }): void {
    this.student = data.student;
    this.regionId = data.regionId;
    this.npcStates = [];
    this.phase = 'idle';
    this.activeNpc = null;
    this.coins = data.student.coins;
    this.blocked = false;
  }

  async create(): Promise<void> {
    this.cameras.main.setBackgroundColor(0x2d572c);

    // Tile grid
    this.drawTileGrid();

    // Player texture
    const playerGfx = this.add.graphics();
    playerGfx.fillStyle(0xff6b6b);
    playerGfx.fillRect(0, 0, 24, 32);
    playerGfx.generateTexture('player_region', 24, 32);
    playerGfx.destroy();

    this.player = this.physics.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'player_region') as Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(50);

    // UI components
    this.dialogueBox = new DialogueBox(this);
    this.quizModal = new QuizModal(this);
    this.hud = new HUD(this);
    this.hud.updateCoins(this.coins);
    this.controls = new TouchControls(this);

    // Keyboard
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.bKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    // Load data
    let regionDetail: RegionDetailResponse | null = null;
    let progress: StudentProgress[] = [];

    try {
      regionDetail = await api.getRegionDetail(this.regionId);
    } catch {
      this.showErrorAndReturn('지역 데이터를 불러올 수 없습니다.');
      return;
    }

    try {
      progress = await api.getProgress(this.student.id);
    } catch {
      progress = [];
    }

    const { region, npcs, questions } = regionDetail;

    // Title
    this.add.text(GAME_WIDTH / 2, 20, region.name, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(10);

    // NPC texture
    const npcGfx = this.add.graphics();
    npcGfx.fillStyle(0x6a5acd);
    npcGfx.fillRect(0, 0, 28, 36);
    npcGfx.generateTexture('npc_rect', 28, 36);
    npcGfx.destroy();

    // Build NPC states
    for (const npc of npcs) {
      const cleared = progress.some(p => p.npc_id === npc.id && p.is_cleared);
      const question = questions.find(q => q.npc_id === npc.id) ?? null;

      const nx = npc.position_x || (100 + (npcs.indexOf(npc) % 4) * 160);
      const ny = npc.position_y || (200 + Math.floor(npcs.indexOf(npc) / 4) * 140);

      const sprite = this.add.rectangle(nx, ny, 28, 36, 0x6a5acd)
        .setStrokeStyle(2, cleared ? 0x00ff00 : 0xffffff)
        .setDepth(20);

      const nameLabel = this.add.text(nx, ny + 26, npc.name, {
        fontSize: '11px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(21);

      const checkmark = this.add.text(nx + 18, ny - 20, '✓', {
        fontSize: '16px',
        color: '#00ff00',
        fontStyle: 'bold',
      }).setOrigin(0.5, 0.5).setDepth(22);
      checkmark.setVisible(cleared);

      this.npcStates.push({ npc, question, sprite, nameLabel, checkmark, x: nx, y: ny, cleared, wrongCount: 0 });
    }

    // Show intro dialogue (block movement during narration)
    if (region.intro_dialogue && region.intro_dialogue.length > 0) {
      this.blocked = true;
      this.controls.setVisible(false);
      this.dialogueBox.show('나레이션', region.intro_dialogue, () => {
        this.blocked = false;
        this.controls.setVisible(true);
        this.phase = 'idle';
      });
    }
  }

  private drawTileGrid(): void {
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x245c23, 0.4);
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

  update(): void {
    if (!this.player || !this.controls) return;

    // B key or B button: return to hub
    if (
      (Phaser.Input.Keyboard.JustDown(this.bKey) || this.controls.isBJustPressed()) &&
      this.phase === 'idle' &&
      !this.blocked
    ) {
      this.returnToHub();
      return;
    }

    // Movement blocked during dialogue/quiz
    if (this.blocked || this.dialogueBox.isVisible() || this.quizModal.isVisible()) {
      this.player.setVelocity(0, 0);

      // Advance dialogue with ENTER or A
      if (this.dialogueBox.isVisible()) {
        const aPressed = this.controls.isAJustPressed();
        const enterPressed = Phaser.Input.Keyboard.JustDown(this.enterKey);
        if (aPressed || enterPressed) {
          this.dialogueBox.advance();
        }
      }
      return;
    }

    // Movement
    const touch = this.controls.getInput();
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || touch.left) vx = -PLAYER_SPEED;
    else if (this.cursors.right.isDown || touch.right) vx = PLAYER_SPEED;

    if (this.cursors.up.isDown || touch.up) vy = -PLAYER_SPEED;
    else if (this.cursors.down.isDown || touch.down) vy = PLAYER_SPEED;

    this.player.setVelocity(vx, vy);

    // A / ENTER interaction
    const aPressed = this.controls.isAJustPressed();
    const enterPressed = Phaser.Input.Keyboard.JustDown(this.enterKey);
    if ((aPressed || enterPressed) && this.phase === 'idle') {
      this.tryInteractNpc();
    }
  }

  private tryInteractNpc(): void {
    const px = this.player.x;
    const py = this.player.y;

    for (const state of this.npcStates) {
      const dist = Phaser.Math.Distance.Between(px, py, state.x, state.y);
      if (dist < NPC_INTERACT_DIST) {
        this.startNpcInteraction(state);
        return;
      }
    }
  }

  private startNpcInteraction(state: NpcState): void {
    this.activeNpc = state;
    this.blocked = true;

    if (state.cleared) {
      // Already cleared: show dialogue_after
      this.phase = 'dialogue_after';
      this.dialogueBox.show(state.npc.name, state.npc.dialogue_after, () => {
        this.endInteraction();
      });
    } else {
      // Show dialogue_before then quiz
      this.phase = 'dialogue_before';
      this.dialogueBox.show(state.npc.name, state.npc.dialogue_before, () => {
        this.showQuiz();
      });
    }
  }

  private showQuiz(): void {
    const state = this.activeNpc!;
    if (!state.question) {
      this.endInteraction();
      return;
    }
    this.phase = 'quiz';
    this.quizModal.show(state.question.content, (answer) => {
      this.handleQuizAnswer(answer);
    });
  }

  private async handleQuizAnswer(answer: string): Promise<void> {
    const state = this.activeNpc!;
    if (!state.question) {
      this.endInteraction();
      return;
    }

    let isCorrect = false;
    try {
      const result = await api.submitQuiz(this.student.id, state.question.id, answer);
      isCorrect = result.is_correct ?? false;
      if (isCorrect && result.coins !== undefined) {
        this.coins = result.coins;
        this.hud.updateCoins(this.coins);
      }
    } catch {
      // Fallback: local check
      isCorrect = answer === state.question.correct_answer;
      if (isCorrect) {
        this.coins += state.question.coin_reward;
        this.hud.updateCoins(this.coins);
      }
    }

    if (isCorrect) {
      // Mark cleared
      state.cleared = true;
      state.checkmark.setVisible(true);
      state.sprite.setStrokeStyle(2, 0x00ff00);

      // Build dialogue lines
      const correctLines = [...state.npc.dialogue_correct];
      if (state.npc.next_npc_hint) {
        correctLines.push(state.npc.next_npc_hint);
      }

      this.phase = 'dialogue_correct';
      this.dialogueBox.show(state.npc.name, correctLines, () => {
        // Check if all NPCs cleared
        const allCleared = this.npcStates.every(s => s.cleared);
        if (allCleared) {
          this.showEpilogue();
        } else {
          this.endInteraction();
        }
      });
    } else {
      state.wrongCount += 1;

      if (state.wrongCount >= 2) {
        // Second wrong: show encouragement, return to free movement
        this.phase = 'dialogue_wrong';
        const encouragement = ['잘 생각해봐요! 다시 도전할 수 있어요.', '조금 더 공부하고 다시 와보세요!'];
        this.dialogueBox.show(state.npc.name, encouragement, () => {
          this.endInteraction();
        });
      } else {
        // First wrong: show wrong dialogue then show quiz again
        this.phase = 'dialogue_wrong';
        this.dialogueBox.show(state.npc.name, state.npc.dialogue_wrong, () => {
          this.showQuiz();
        });
      }
    }
  }

  private showEpilogue(): void {
    this.phase = 'epilogue';
    let epilogueLines: string[] = [];

    const fetchEpilogue = async () => {
      try {
        const detail: RegionDetailResponse = await api.getRegionDetail(this.regionId);
        epilogueLines = detail.region.epilogue_dialogue ?? [];
      } catch {
        epilogueLines = ['모든 NPC와 대화를 완료했습니다!', `보너스 코인 ${BONUS_COINS}개를 획득했습니다!`];
      }

      this.coins += BONUS_COINS;
      this.hud.updateCoins(this.coins);

      if (epilogueLines.length === 0) {
        epilogueLines = ['지역을 완료했습니다!', `보너스 코인 ${BONUS_COINS}개 획득!`];
      }

      this.dialogueBox.show('나레이션', epilogueLines, () => {
        this.returnToHub();
      });
    };

    void fetchEpilogue();
  }

  private endInteraction(): void {
    this.activeNpc = null;
    this.phase = 'idle';
    this.blocked = false;
  }

  private showErrorAndReturn(msg: string): void {
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, msg, {
      fontSize: '16px',
      color: '#ff4444',
    }).setOrigin(0.5, 0.5).setDepth(100);
    this.time.delayedCall(2000, () => this.returnToHub());
  }

  private returnToHub(): void {
    this.controls.destroy();
    this.hud.destroy();
    this.dialogueBox.destroy();
    this.quizModal.destroy();
    this.scene.start('Hub', { student: { ...this.student, coins: this.coins } });
  }
}
