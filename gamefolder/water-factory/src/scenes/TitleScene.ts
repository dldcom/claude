import Phaser from 'phaser';
import { RANKS } from '../config';

interface Slide {
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    title: '신입 공장장!',
    body: '오늘부터 당신은 상태변화 공장의 신입 공장장!\n주문을 받아 물을 변환해 납품하자.'
  },
  {
    title: '조작 방법',
    body: '🔥 온도 올리기    ❄️ 온도 내리기    📦 출하\n가마솥 상태를 주문에 맞춰 바꾼 뒤 출하!'
  },
  {
    title: '목표',
    body: '목숨 5개!\n시간 내 올바른 상태로 납품하면 점수,\n틀리거나 늦으면 목숨이 줄어요.'
  }
];

export class TitleScene extends Phaser.Scene {
  private slideIdx = 0;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private startButton!: Phaser.GameObjects.Text;
  private skipButton!: Phaser.GameObjects.Text;
  private pageIndicator!: Phaser.GameObjects.Text;

  constructor() { super('TitleScene'); }

  create(): void {
    this.add.image(640, 360, 'bg_wall');
    this.add.text(640, 90, '워터 팩토리', {
      fontSize: '72px', color: '#ffe66d', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(640, 150, '— 물의 상태변화 공장 —', {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5);

    this.titleText = this.add.text(640, 260, '', {
      fontSize: '48px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.bodyText = this.add.text(640, 380, '', {
      fontSize: '28px', color: '#eeeeee', align: 'center', lineSpacing: 10
    }).setOrigin(0.5);
    this.pageIndicator = this.add.text(640, 500, '', {
      fontSize: '24px', color: '#bbbbbb'
    }).setOrigin(0.5);

    this.startButton = this.add.text(640, 600, '', {
      fontSize: '36px', color: '#222034',
      backgroundColor: '#3ad36d', padding: { x: 24, y: 12 }
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.advance());

    this.skipButton = this.add.text(1180, 40, '[건너뛰기]', {
      fontSize: '20px', color: '#ffffff'
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.startGame());

    const highScore = this.registry.get('highScore') as number;
    const bestRankIdx = this.registry.get('bestRankIdx') as number;
    const bestRank = RANKS[bestRankIdx];
    this.add.text(640, 680, `🏆 최고 점수: ${highScore}   |   ${bestRank.icon} ${bestRank.name}`, {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(0.5);

    this.renderSlide();

    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
  }

  private renderSlide(): void {
    const slide = SLIDES[this.slideIdx];
    this.titleText.setText(slide.title);
    this.bodyText.setText(slide.body);
    this.pageIndicator.setText(`${this.slideIdx + 1} / ${SLIDES.length}`);
    const isLast = this.slideIdx === SLIDES.length - 1;
    this.startButton.setText(isLast ? '▶ 시작' : '▶ 다음');
  }

  private advance(): void {
    if (this.slideIdx < SLIDES.length - 1) {
      this.slideIdx += 1;
      this.renderSlide();
    } else {
      this.startGame();
    }
  }

  private startGame(): void {
    this.scene.start('GameScene');
  }
}
