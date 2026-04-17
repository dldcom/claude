import Phaser from 'phaser';
import type { Rank } from '../config';

export interface GameOverData {
  score: number;
  completedCount: number;
  highScore: number;
  newRecord: boolean;
  currentRank: Rank;
  nextRank: Rank | null;
  bestRank: Rank;
  newBestRank: boolean;
}

export class GameOverOverlay {
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, data: GameOverData, onRestart: () => void) {
    const bg = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75);
    const panel = scene.add.rectangle(640, 360, 640, 560, 0x2b2b3a)
      .setStrokeStyle(4, 0xffe66d);

    const title = scene.add.text(640, 130, 'GAME OVER', {
      fontSize: '52px', color: '#ff5050', fontStyle: 'bold'
    }).setOrigin(0.5);

    // 이번 판 등급
    const rankLabel = scene.add.text(640, 210, `${data.currentRank.icon} ${data.currentRank.name}`, {
      fontSize: '36px', color: '#ffe66d', fontStyle: 'bold'
    }).setOrigin(0.5);

    // 다음 등급 진행도
    const nextText = data.nextRank
      ? `다음: ${data.nextRank.icon} ${data.nextRank.name} (${data.nextRank.minScore - data.score}점 남음)`
      : '🏅 최고 등급 달성!';
    const next = scene.add.text(640, 260, nextText, {
      fontSize: '20px', color: '#cccccc'
    }).setOrigin(0.5);

    const scoreText = scene.add.text(640, 320, `최종 점수: ${data.score}`, {
      fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5);
    const completedText = scene.add.text(640, 365, `완수 주문: ${data.completedCount}건`, {
      fontSize: '26px', color: '#ffffff'
    }).setOrigin(0.5);

    const highScoreText = scene.add.text(640, 425, `🏆 최고 점수: ${data.highScore}  |  최고 등급: ${data.bestRank.icon} ${data.bestRank.name}`, {
      fontSize: '20px', color: '#ffe66d'
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, panel, title, rankLabel, next, scoreText, completedText, highScoreText];

    if (data.newRecord) {
      const rec = scene.add.text(640, 465, '🎉 NEW RECORD! 🎉', {
        fontSize: '26px', color: '#3ad36d', fontStyle: 'bold'
      }).setOrigin(0.5);
      items.push(rec);
    }
    if (data.newBestRank) {
      const rb = scene.add.text(640, 495, `⭐ 새 최고 등급! ⭐`, {
        fontSize: '24px', color: '#ff9eff', fontStyle: 'bold'
      }).setOrigin(0.5);
      items.push(rb);
    }

    const restart = scene.add.text(640, 570, '🔁 다시하기', {
      fontSize: '34px', color: '#222034',
      backgroundColor: '#ffe66d', padding: { x: 24, y: 12 }, fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onRestart);
    items.push(restart);

    this.container = scene.add.container(0, 0, items).setDepth(1000);
  }

  destroy(): void {
    this.container.destroy();
  }
}
