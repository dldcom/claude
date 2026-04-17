// src/config.ts
export const TILE_SIZE = 64;
export const GRID_PADDING = 32;

export const COLORS = {
  bg: 0x1a2530,
  wall: 0x2a3441,
  floor: 0xe8d5b7,
  water: 0x4a90d9,
  ice: 0xb8e1ea,
  spring: 0x2d7a99,
  bonfire: 0xd9572a,
  exit: 0xf5d547,
  box: 0x8b5a2b,
  rock: 0x5a5a5a,
  flower: 0xff8fa3,
  flowerOptional: 0xd9a8c8,
  player: 0xffeaa7,
  hint: 0x555555,
};

export const SCENE_KEYS = {
  Boot: 'BootScene',
  Stage: 'StageScene',
} as const;

export const LEVEL_PLAYLIST = [
  'test-01',
  'test-02',
  'test-03',
  'test-04',
  'test-05',
];
