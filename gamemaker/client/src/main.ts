import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { LoginScene } from './scenes/LoginScene.js';
import { CharacterCreateScene } from './scenes/CharacterCreateScene.js';
import { HubScene } from './scenes/HubScene.js';
import { RegionScene } from './scenes/RegionScene.js';
import { ShopScene } from './scenes/ShopScene.js';

const config = createGameConfig([BootScene, LoginScene, CharacterCreateScene, HubScene, RegionScene, ShopScene]);
const game = new Phaser.Game(config);

// Suppress unused variable warning — game instance kept for lifecycle management
void game;
