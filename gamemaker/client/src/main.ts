import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';

const config = createGameConfig([BootScene]);
const game = new Phaser.Game(config);

// Suppress unused variable warning — game instance kept for lifecycle management
void game;
