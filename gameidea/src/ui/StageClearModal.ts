import Phaser from 'phaser';

export interface StageClearModalOpts {
  turnCount: number;
  isLast: boolean;
  onNext: () => void;
}

export function showStageClearModal(scene: Phaser.Scene, opts: StageClearModalOpts): void {
  const w = Number(scene.game.config.width);
  const h = Number(scene.game.config.height);

  const overlay = scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
  overlay.setInteractive();

  scene.add
    .text(w / 2, h / 2 - 60, '✨ 스테이지 클리어!', {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  scene.add
    .text(w / 2, h / 2, `${opts.turnCount} 턴`, {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffeaa7',
    })
    .setOrigin(0.5);

  const btnLabel = opts.isLast ? '🌈 엔딩 보기' : '➡ 다음 스테이지';
  const nextBtn = scene.add.text(w / 2, h / 2 + 60, btnLabel, {
    fontFamily: 'sans-serif',
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#2d7a99',
    padding: { left: 24, right: 24, top: 12, bottom: 12 },
  });
  nextBtn.setOrigin(0.5);
  nextBtn.setInteractive({ useHandCursor: true });

  let fired = false;
  nextBtn.on('pointerdown', (e: Phaser.Input.Pointer) => {
    e.event.stopPropagation();
    if (fired) return;
    fired = true;
    nextBtn.disableInteractive();
    opts.onNext();
  });
}

export function showEndingScreen(scene: Phaser.Scene): void {
  const w = Number(scene.game.config.width);
  const h = Number(scene.game.config.height);
  scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.9);
  scene.add
    .text(w / 2, h / 2, '얼음왕국에 색이 돌아왔다.\n\n— MVP 끝 —', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
    })
    .setOrigin(0.5);
}
