import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { LoginScene } from './scenes/LoginScene.js';
import { CharacterCreateScene } from './scenes/CharacterCreateScene.js';

const config = createGameConfig([BootScene, LoginScene, CharacterCreateScene]);
const game = new Phaser.Game(config);

// Suppress unused variable warning — game instance kept for lifecycle management
void game;
