import Phaser from 'phaser';

export type PlayMode = 'move' | 'freeze' | 'melt';

export interface HUDCallbacks {
  onUndo: () => void;
  onRestart: () => void;
  onSelectMode: (mode: PlayMode) => void;
}

const MODE_COLORS: Record<PlayMode, { fg: string; bg: string }> = {
  move: { fg: '#ffffff', bg: '#3a6b52' },
  freeze: { fg: '#ffffff', bg: '#3a6bb0' },
  melt: { fg: '#ffd166', bg: '#9a3324' },
};

const MODE_LABELS: Record<PlayMode, string> = {
  move: '👣 이동',
  freeze: '🧊 얼리기',
  melt: '🔥 녹이기',
};

const MODE_INACTIVE_BG = '#444444';

export class HUD {
  private turnText!: Phaser.GameObjects.Text;
  private flowerText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private modeBtns!: Record<PlayMode, Phaser.GameObjects.Text>;

  constructor(private readonly scene: Phaser.Scene, private readonly callbacks: HUDCallbacks) {
    this.build();
  }

  private build(): void {
    const w = Number(this.scene.game.config.width);
    const h = Number(this.scene.game.config.height);

    this.stageText = this.scene.add.text(24, 20, '', {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff',
    });

    this.turnText = this.scene.add.text(w - 24, 20, '', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#aaaaaa',
    });
    this.turnText.setOrigin(1, 0);

    this.flowerText = this.scene.add.text(w / 2, h - 40, '', {
      fontFamily: 'sans-serif',
      fontSize: '22px',
      color: '#ff8fa3',
    });
    this.flowerText.setOrigin(0.5);

    this.makeButton(24, h - 48, '🔄 재시작', () => this.callbacks.onRestart());
    this.makeButton(w - 140, h - 48, '↶ Undo', () => this.callbacks.onUndo());

    this.modeBtns = {
      move: this.makeButton(w / 2 - 220, h - 100, MODE_LABELS.move, () =>
        this.callbacks.onSelectMode('move'),
      ),
      freeze: this.makeButton(w / 2 - 60, h - 100, MODE_LABELS.freeze, () =>
        this.callbacks.onSelectMode('freeze'),
      ),
      melt: this.makeButton(w / 2 + 110, h - 100, MODE_LABELS.melt, () =>
        this.callbacks.onSelectMode('melt'),
      ),
    };
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.scene.add.text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: MODE_INACTIVE_BG,
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    });
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      onClick();
    });
    return btn;
  }

  setMode(active: PlayMode): void {
    for (const mode of ['move', 'freeze', 'melt'] as PlayMode[]) {
      const btn = this.modeBtns[mode];
      const isActive = mode === active;
      const palette = MODE_COLORS[mode];
      btn.setStyle({
        color: isActive ? palette.fg : '#cccccc',
        backgroundColor: isActive ? palette.bg : MODE_INACTIVE_BG,
      });
    }
  }

  update(opts: { levelId: string; turnCount: number; flowersCollected: number; flowersRequired: number }): void {
    this.stageText.setText(opts.levelId);
    this.turnText.setText(`Turn: ${opts.turnCount}`);
    this.flowerText.setText(`🌸 ${opts.flowersCollected} / ${opts.flowersRequired}`);
  }
}
