import Phaser from 'phaser';
import { RULES, getTransitionPopup, type WaterState } from '../config';

const STATE_TEXTURE: Record<WaterState, string> = {
  solid:  'ice_cube',
  liquid: 'water_body',
  gas:    'steam_body'
};

const STATE_LABEL: Record<WaterState, string> = {
  solid: '🧊 얼음',
  liquid: '💧 물',
  gas: '💨 수증기'
};

export class Cauldron {
  private readonly scene: Phaser.Scene;
  private readonly cauldron: Phaser.GameObjects.Image;
  private readonly contents: Phaser.GameObjects.Image;
  private readonly stateLabel: Phaser.GameObjects.Text;
  private isAnimating = false;

  constructor(scene: Phaser.Scene, x: number, y: number, initialState: WaterState) {
    this.scene = scene;
    this.cauldron = scene.add.image(x, y, 'cauldron').setScale(5.5); // 32×32 → ~176px
    this.contents = scene.add.image(x, y - 40, STATE_TEXTURE[initialState]).setScale(1.8); // 64×56 → ~115×100
    this.stateLabel = scene.add.text(x, y + 120, STATE_LABEL[initialState], {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  get animating(): boolean {
    return this.isAnimating;
  }

  setStateImmediate(state: WaterState): void {
    this.contents.setTexture(STATE_TEXTURE[state]);
    this.stateLabel.setText(STATE_LABEL[state]);
  }

  animateTransition(from: WaterState, to: WaterState, onComplete: () => void): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.scene.tweens.add({
      targets: this.contents,
      alpha: 0,
      duration: RULES.TRANSITION_MS / 2,
      onComplete: () => {
        this.contents.setTexture(STATE_TEXTURE[to]);
        this.stateLabel.setText(STATE_LABEL[to]);
        this.scene.tweens.add({
          targets: this.contents,
          alpha: 1,
          duration: RULES.TRANSITION_MS / 2,
          onComplete: () => {
            this.isAnimating = false;
            this.showPopup(from, to);
            onComplete();
          }
        });
      }
    });
  }

  private showPopup(from: WaterState, to: WaterState): void {
    const popup = getTransitionPopup(from, to);
    if (!popup) return;
    const x = this.cauldron.x;
    const y = this.cauldron.y - 160;
    const title = this.scene.add.text(x, y, `✨ ${popup.title}`, {
      fontSize: '32px', color: '#ffe66d', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);
    const sub = this.scene.add.text(x, y + 40, popup.subtitle, {
      fontSize: '22px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: [title, sub],
      alpha: 0,
      y: `-=30`,
      delay: 600,
      duration: 200,
      onComplete: () => { title.destroy(); sub.destroy(); }
    });
  }
}
