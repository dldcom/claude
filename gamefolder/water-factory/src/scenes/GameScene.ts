import Phaser from 'phaser';
import { getRank, getNextRank, getRankIndex, RANKS } from '../config';
import { GameState } from '../state/GameState';
import { Cauldron } from '../entities/Cauldron';
import { OrderBoard } from '../entities/OrderBoard';
import { ControlPanel } from '../ui/ControlPanel';
import { HUD } from '../ui/HUD';
import { GameOverOverlay } from '../ui/GameOverOverlay';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private cauldron!: Cauldron;
  private orderBoard!: OrderBoard;
  private controls!: ControlPanel;
  private hud!: HUD;
  private gameOverTriggered = false;

  constructor() { super('GameScene'); }

  create(): void {
    this.gameOverTriggered = false;
    this.add.image(640, 360, 'bg_wall');

    this.gameState = new GameState();
    this.gameState.startNewOrder();

    this.orderBoard = new OrderBoard(this, 180, 380);
    this.cauldron   = new Cauldron(this, 720, 400, this.gameState.currentCauldronState);
    this.controls   = new ControlPanel(this, 720, 620, {
      onHeat: () => this.handleHeat(),
      onCool: () => this.handleCool(),
      onShip: () => this.handleShip()
    });
    this.hud = new HUD(this, () => this.toggleSound());

    this.refreshOrderView();
    this.refreshControlsBoundaries();
  }

  update(_time: number, deltaMs: number): void {
    if (this.gameOverTriggered) return;
    const tick = this.gameState.tick(deltaMs);
    this.hud.update(
      this.gameState.score,
      this.gameState.lives,
      this.gameState.remainingMs,
      this.registry.get('soundEnabled') as boolean
    );
    if (tick.timedOut) {
      this.orderBoard.showReaction(false);
      this.onOrderFailed();
    }
  }

  private handleHeat(): void {
    if (this.cauldron.animating) return;
    const t = this.gameState.applyHeat();
    if (!t) return;
    this.controls.setAllEnabled(false);
    this.cauldron.animateTransition(t.from, t.to, () => {
      this.controls.setAllEnabled(true);
      this.refreshControlsBoundaries();
    });
  }

  private handleCool(): void {
    if (this.cauldron.animating) return;
    const t = this.gameState.applyCool();
    if (!t) return;
    this.controls.setAllEnabled(false);
    this.cauldron.animateTransition(t.from, t.to, () => {
      this.controls.setAllEnabled(true);
      this.refreshControlsBoundaries();
    });
  }

  private handleShip(): void {
    if (this.cauldron.animating) return;
    const result = this.gameState.ship();
    this.orderBoard.showReaction(result.correct);
    if (result.correct) {
      this.onOrderCompleted();
    } else {
      this.onOrderFailed();
    }
  }

  private onOrderCompleted(): void {
    if (this.checkGameOver()) return;
    this.gameState.startNewOrder();
    this.cauldron.setStateImmediate(this.gameState.currentCauldronState);
    this.refreshOrderView();
    this.refreshControlsBoundaries();
  }

  private onOrderFailed(): void {
    if (this.checkGameOver()) return;
    this.gameState.startNewOrder();
    this.cauldron.setStateImmediate(this.gameState.currentCauldronState);
    this.refreshOrderView();
    this.refreshControlsBoundaries();
  }

  private checkGameOver(): boolean {
    if (this.gameState.isGameOver()) {
      this.gameOverTriggered = true;
      this.controls.setAllEnabled(false);
      this.triggerGameOver();
      return true;
    }
    return false;
  }

  private triggerGameOver(): void {
    const redFlash = this.add.rectangle(640, 360, 1280, 720, 0xff0000, 0)
      .setDepth(999);
    this.tweens.add({
      targets: redFlash,
      alpha: { from: 0, to: 0.6 },
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        redFlash.destroy();
        this.showGameOverOverlay();
      }
    });
  }

  private showGameOverOverlay(): void {
    const prevHigh = this.registry.get('highScore') as number;
    const newHigh = Math.max(prevHigh, this.gameState.score);
    const isNewRecord = this.gameState.score > prevHigh;
    if (isNewRecord) {
      this.registry.set('highScore', newHigh);
      localStorage.setItem('waterFactory.highScore', String(newHigh));
    }

    const currentRank = getRank(this.gameState.score);
    const nextRank = getNextRank(this.gameState.score);
    const currentRankIdx = getRankIndex(currentRank);
    const prevBestIdx = this.registry.get('bestRankIdx') as number;
    const newBestRank = currentRankIdx > prevBestIdx;
    const bestRankIdx = Math.max(prevBestIdx, currentRankIdx);
    if (newBestRank) {
      this.registry.set('bestRankIdx', bestRankIdx);
      localStorage.setItem('waterFactory.bestRankIdx', String(bestRankIdx));
    }

    new GameOverOverlay(this, {
      score: this.gameState.score,
      completedCount: this.gameState.completedCount,
      highScore: newHigh,
      newRecord: isNewRecord,
      currentRank,
      nextRank,
      bestRank: RANKS[bestRankIdx],
      newBestRank
    }, () => this.scene.restart());
  }

  private refreshOrderView(): void {
    this.orderBoard.setOrder(this.gameState.currentOrder, this.gameState.currentCustomer, this.gameState.currentGreeting);
  }

  private refreshControlsBoundaries(): void {
    this.controls.setBoundariesForState(this.gameState.currentCauldronState);
  }

  private toggleSound(): void {
    const cur = this.registry.get('soundEnabled') as boolean;
    this.registry.set('soundEnabled', !cur);
  }
}
