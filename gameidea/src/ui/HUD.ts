import Phaser from 'phaser';

export interface HUDCallbacks {
  onUndo: () => void;
  onRestart: () => void;
  onToggleMelt: () => void;
}

export class HUD {
  private turnText!: Phaser.GameObjects.Text;
  private flowerText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private meltBtn!: Phaser.GameObjects.Text;

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
    this.meltBtn = this.makeButton(w / 2 - 80, h - 100, '🔥 녹이기 OFF', () =>
      this.callbacks.onToggleMelt(),
    );
    this.makeButton(w - 140, h - 48, '↶ Undo', () => this.callbacks.onUndo());
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
    const btn = this.scene.add.text(x, y, label, {
      fontFamily: 'sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#444444',
      padding: { left: 16, right: 16, top: 10, bottom: 10 },
    });
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      onClick();
    });
    return btn;
  }

  setMeltMode(active: boolean): void {
    this.meltBtn.setText(active ? '🔥 녹이기 ON' : '🔥 녹이기 OFF');
    this.meltBtn.setStyle({
      color: active ? '#ffd166' : '#ffffff',
      backgroundColor: active ? '#9a3324' : '#444444',
    });
  }

  update(opts: { levelId: string; turnCount: number; flowersCollected: number; flowersRequired: number }): void {
    this.stageText.setText(opts.levelId);
    this.turnText.setText(`Turn: ${opts.turnCount}`);
    this.flowerText.setText(`🌸 ${opts.flowersCollected} / ${opts.flowersRequired}`);
  }
}
