# 얼음왕국의 균열 — Phase 0+1: Core Engine + Playable MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5개 테스트 스테이지를 태블릿 브라우저에서 실제로 플레이할 수 있는 MVP 프로토타입을 완성한다. 모든 핵심 메커닉(이동·미끄러짐·물 붓기·얼리기·녹이기·모닥불 자동녹임·꽃 수집·Undo)이 동작하고, core 로직은 Phaser 독립적이며 유닛 테스트로 완전 검증된다.

**Architecture:** 순수 TypeScript로 작성한 불변 `GameState` 모델 + 순수 함수 `executeAction(state, action) → newState` 로 상태 전이를 관리. Phaser는 상태를 받아 렌더링하는 얇은 뷰 레이어만 담당. Undo는 매 턴 상태 스냅샷 푸시. 레벨은 YAML 파일로 정의해 Claude가 대량 생성 가능.

**Tech Stack:** Vite + Phaser 3 + TypeScript + vitest + js-yaml

**Spec:** `gameidea/docs/superpowers/specs/2026-04-17-ice-kingdom-cracks-design.md`

**Scope (이번 플랜에 포함)**
- 프로젝트 부트스트랩 (Vite + Phaser + TS + vitest)
- Core: Grid · GameState · TurnEngine · UndoStack · WeightRules (스텁) · LevelLoader
- 렌더링: 색 도형 기반 플레이스홀더 스프라이트 (실제 아트는 Phase 2)
- 씬: BootScene + StageScene만
- HUD: Undo/재시작 버튼, 꽃 카운터, 스테이지 번호
- 테스트 레벨 5개 (각 핵심 메커닉 데모)
- 스테이지 클리어 → 다음 스테이지 모달

**Out of Scope (후속 플랜에서)**
- 저울 메커니즘 (Ch2+, Phase 3 플랜)
- 실제 아트 · 컷신 · 사운드 (Phase 4 플랜)
- 타이틀/챕터 선택 씬 (Phase 2 플랜)
- Ch1~4 실제 38개 스테이지 (Phase 2~3 플랜)

---

## 파일 구조 (이번 플랜에서 생성될 파일)

```
gameidea/
├── package.json                          # Task 1
├── tsconfig.json                         # Task 1
├── vite.config.ts                        # Task 1
├── vitest.config.ts                      # Task 1
├── index.html                            # Task 1
├── .gitignore                            # Task 1
├── src/
│   ├── main.ts                           # Task 1, 확장 Task 14
│   ├── config.ts                         # Task 14
│   ├── core/
│   │   ├── types.ts                      # Task 2
│   │   ├── Grid.ts                       # Task 3
│   │   ├── GameState.ts                  # Task 4
│   │   ├── TurnEngine.ts                 # Task 5, 확장 6-11
│   │   ├── UndoStack.ts                  # Task 12
│   │   └── LevelLoader.ts                # Task 13
│   ├── scenes/
│   │   ├── BootScene.ts                  # Task 14
│   │   └── StageScene.ts                 # Task 15, 확장 16-19
│   ├── entities/
│   │   ├── TileRenderer.ts               # Task 15
│   │   └── PlayerRenderer.ts             # Task 15
│   ├── ui/
│   │   └── HUD.ts                        # Task 18
│   └── assets/
│       └── levels/
│           ├── test-01.yaml              # Task 13 (샘플), Task 20에서 5개로 확장
│           ├── test-02.yaml              # Task 20
│           ├── test-03.yaml              # Task 20
│           ├── test-04.yaml              # Task 20
│           └── test-05.yaml              # Task 20
└── tests/
    └── core/
        ├── Grid.test.ts                  # Task 3
        ├── GameState.test.ts             # Task 4
        ├── TurnEngine.test.ts            # Task 5, 확장 6-11
        ├── UndoStack.test.ts             # Task 12
        └── LevelLoader.test.ts           # Task 13
```

---

## Task 1: 프로젝트 부트스트랩

**Files:**
- Create: `gameidea/package.json`
- Create: `gameidea/tsconfig.json`
- Create: `gameidea/vite.config.ts`
- Create: `gameidea/vitest.config.ts`
- Create: `gameidea/index.html`
- Create: `gameidea/.gitignore`
- Create: `gameidea/src/main.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "ice-kingdom-cracks",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "typescript": "^5.4.5",
    "vite": "^5.2.0",
    "vitest": "^1.5.0"
  },
  "dependencies": {
    "js-yaml": "^4.1.0",
    "phaser": "^3.80.1"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "lib": ["ES2022", "DOM"],
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: vite.config.ts 작성**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
  server: {
    port: 5173,
    host: true,
  },
  assetsInclude: ['**/*.yaml'],
});
```

- [ ] **Step 4: vitest.config.ts 작성**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>얼음왕국의 균열</title>
    <style>
      html, body { margin: 0; padding: 0; background: #1a2530; overflow: hidden; }
      #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    </style>
  </head>
  <body>
    <div id="game"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: .gitignore 작성**

```
node_modules/
dist/
.vite/
.DS_Store
*.log
```

- [ ] **Step 7: 최소 src/main.ts (임시 Hello Phaser)**

```typescript
import Phaser from 'phaser';

class HelloScene extends Phaser.Scene {
  constructor() {
    super('HelloScene');
  }
  create() {
    this.add.text(100, 100, '얼음왕국의 균열 — 부트 성공', {
      fontFamily: 'sans-serif',
      fontSize: '24px',
      color: '#ffffff',
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 768,
  backgroundColor: '#1a2530',
  scene: [HelloScene],
});
```

- [ ] **Step 8: 의존성 설치 및 개발 서버 실행 검증**

Run in `gameidea/`:
```bash
npm install
npm run dev
```
Expected: 브라우저 http://localhost:5173 에 "얼음왕국의 균열 — 부트 성공" 텍스트 표시.

- [ ] **Step 9: 테스트 실행 검증 (테스트 없어도 성공 반환)**

Run: `npm test`
Expected: `No test files found` 또는 `0 tests passed` 식의 결과.

- [ ] **Step 10: Commit**

```bash
cd /c/Users/dldco/Downloads/claude
git add gameidea/package.json gameidea/tsconfig.json gameidea/vite.config.ts gameidea/vitest.config.ts gameidea/index.html gameidea/.gitignore gameidea/src/main.ts
git commit -m "feat(ice-kingdom): project bootstrap with Vite + Phaser + vitest"
```

---

## Task 2: Core 타입 정의

**Files:**
- Create: `gameidea/src/core/types.ts`

이 단계는 타입만 정의하므로 테스트는 다음 태스크에서 함께 작성한다.

- [ ] **Step 1: types.ts 작성**

```typescript
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  readonly x: number;
  readonly y: number;
}

export type GroundType =
  | 'floor'
  | 'wall'
  | 'spring'
  | 'bonfire'
  | 'exit';

export interface GroundCell {
  type: GroundType;
}

export type ObjectType =
  | 'water'
  | 'ice'
  | 'box'
  | 'rock'
  | 'flower';

export interface WaterObject {
  type: 'water';
}

export interface IceObject {
  type: 'ice';
  groupId: number;
  role: 'head' | 'tail';
}

export interface BoxObject {
  type: 'box';
}

export interface RockObject {
  type: 'rock';
}

export interface FlowerObject {
  type: 'flower';
  required: boolean;
  collected: boolean;
}

export type ObjectCell =
  | WaterObject
  | IceObject
  | BoxObject
  | RockObject
  | FlowerObject;

export type ActionKind =
  | { kind: 'move'; direction: Direction }
  | { kind: 'pour'; target: Position }
  | { kind: 'freeze'; target: Position; direction: Direction }
  | { kind: 'melt'; target: Position };

export interface PlayerState {
  position: Position;
  facing: Direction;
}

export const DIRECTION_DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};
```

- [ ] **Step 2: Commit**

```bash
git add gameidea/src/core/types.ts
git commit -m "feat(ice-kingdom): core type definitions"
```

---

## Task 3: Grid 클래스

**Files:**
- Create: `gameidea/src/core/Grid.ts`
- Test: `gameidea/tests/core/Grid.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```typescript
// tests/core/Grid.test.ts
import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/core/Grid';
import type { GroundCell } from '../../src/core/types';

describe('Grid', () => {
  it('creates a grid of given dimensions filled with floor', () => {
    const g = Grid.createEmpty(3, 2);
    expect(g.width).toBe(3);
    expect(g.height).toBe(2);
    expect(g.getGround(0, 0)).toEqual({ type: 'floor' });
    expect(g.getGround(2, 1)).toEqual({ type: 'floor' });
  });

  it('set/get ground cell', () => {
    const g = Grid.createEmpty(3, 3);
    g.setGround(1, 1, { type: 'wall' });
    expect(g.getGround(1, 1)).toEqual({ type: 'wall' });
    expect(g.getGround(0, 0)).toEqual({ type: 'floor' });
  });

  it('set/get object cell', () => {
    const g = Grid.createEmpty(3, 3);
    g.setObject(0, 0, { type: 'water' });
    expect(g.getObject(0, 0)).toEqual({ type: 'water' });
    expect(g.getObject(1, 1)).toBeNull();
  });

  it('clone produces an independent copy', () => {
    const a = Grid.createEmpty(2, 2);
    a.setGround(0, 0, { type: 'wall' });
    a.setObject(1, 1, { type: 'box' });
    const b = a.clone();
    b.setGround(0, 0, { type: 'floor' });
    b.setObject(1, 1, null);
    expect(a.getGround(0, 0)).toEqual({ type: 'wall' });
    expect(a.getObject(1, 1)).toEqual({ type: 'box' });
  });

  it('inBounds rejects out-of-range', () => {
    const g = Grid.createEmpty(3, 3);
    expect(g.inBounds(0, 0)).toBe(true);
    expect(g.inBounds(2, 2)).toBe(true);
    expect(g.inBounds(-1, 0)).toBe(false);
    expect(g.inBounds(3, 0)).toBe(false);
    expect(g.inBounds(0, 3)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL with `Grid` not found.

- [ ] **Step 3: Grid.ts 구현**

```typescript
// src/core/Grid.ts
import type { GroundCell, ObjectCell } from './types';

export class Grid {
  private readonly _ground: GroundCell[][];
  private readonly _objects: (ObjectCell | null)[][];

  constructor(
    public readonly width: number,
    public readonly height: number,
    ground: GroundCell[][],
    objects: (ObjectCell | null)[][],
  ) {
    this._ground = ground;
    this._objects = objects;
  }

  static createEmpty(width: number, height: number): Grid {
    const ground: GroundCell[][] = [];
    const objects: (ObjectCell | null)[][] = [];
    for (let y = 0; y < height; y++) {
      const groundRow: GroundCell[] = [];
      const objectRow: (ObjectCell | null)[] = [];
      for (let x = 0; x < width; x++) {
        groundRow.push({ type: 'floor' });
        objectRow.push(null);
      }
      ground.push(groundRow);
      objects.push(objectRow);
    }
    return new Grid(width, height, ground, objects);
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getGround(x: number, y: number): GroundCell {
    return this._ground[y][x];
  }

  setGround(x: number, y: number, cell: GroundCell): void {
    this._ground[y][x] = cell;
  }

  getObject(x: number, y: number): ObjectCell | null {
    return this._objects[y][x];
  }

  setObject(x: number, y: number, cell: ObjectCell | null): void {
    this._objects[y][x] = cell;
  }

  clone(): Grid {
    const ground = this._ground.map(row => row.map(cell => ({ ...cell })));
    const objects = this._objects.map(row =>
      row.map(cell => (cell === null ? null : { ...cell } as ObjectCell)),
    );
    return new Grid(this.width, this.height, ground, objects);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: `Grid` 5 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/Grid.ts gameidea/tests/core/Grid.test.ts
git commit -m "feat(ice-kingdom): Grid class with ground+object layers"
```

---

## Task 4: GameState 구조

**Files:**
- Create: `gameidea/src/core/GameState.ts`
- Test: `gameidea/tests/core/GameState.test.ts`

`GameState`는 한 순간의 게임 전체 상태를 담는 불변 컨테이너. TurnEngine이 이 상태를 받아 새 상태를 반환한다.

- [ ] **Step 1: 실패 테스트 작성**

```typescript
// tests/core/GameState.test.ts
import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/core/GameState';
import { Grid } from '../../src/core/Grid';

describe('GameState', () => {
  it('creates with default values', () => {
    const grid = Grid.createEmpty(5, 5);
    const s = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'down' },
      flowersRequired: 2,
    });
    expect(s.grid).toBe(grid);
    expect(s.player.position).toEqual({ x: 1, y: 1 });
    expect(s.flowersRequired).toBe(2);
    expect(s.flowersCollected).toBe(0);
    expect(s.turnCount).toBe(0);
    expect(s.nextIceGroupId).toBe(1);
    expect(s.isWon).toBe(false);
  });

  it('clone produces deep copy', () => {
    const grid = Grid.createEmpty(3, 3);
    const s = GameState.create({
      grid,
      player: { position: { x: 0, y: 0 }, facing: 'down' },
      flowersRequired: 1,
    });
    const s2 = s.clone();
    expect(s2.grid).not.toBe(s.grid);
    expect(s2.player).not.toBe(s.player);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL with `GameState` not found.

- [ ] **Step 3: GameState.ts 구현**

```typescript
// src/core/GameState.ts
import { Grid } from './Grid';
import type { PlayerState } from './types';

interface GameStateInit {
  grid: Grid;
  player: PlayerState;
  flowersRequired: number;
  flowersCollected?: number;
  turnCount?: number;
  nextIceGroupId?: number;
  isWon?: boolean;
}

export class GameState {
  private constructor(
    public readonly grid: Grid,
    public readonly player: PlayerState,
    public readonly flowersRequired: number,
    public readonly flowersCollected: number,
    public readonly turnCount: number,
    public readonly nextIceGroupId: number,
    public readonly isWon: boolean,
  ) {}

  static create(init: GameStateInit): GameState {
    return new GameState(
      init.grid,
      init.player,
      init.flowersRequired,
      init.flowersCollected ?? 0,
      init.turnCount ?? 0,
      init.nextIceGroupId ?? 1,
      init.isWon ?? false,
    );
  }

  clone(): GameState {
    return new GameState(
      this.grid.clone(),
      { position: { ...this.player.position }, facing: this.player.facing },
      this.flowersRequired,
      this.flowersCollected,
      this.turnCount,
      this.nextIceGroupId,
      this.isWon,
    );
  }

  withPatch(patch: Partial<GameStateInit>): GameState {
    return GameState.create({
      grid: patch.grid ?? this.grid,
      player: patch.player ?? this.player,
      flowersRequired: patch.flowersRequired ?? this.flowersRequired,
      flowersCollected: patch.flowersCollected ?? this.flowersCollected,
      turnCount: patch.turnCount ?? this.turnCount,
      nextIceGroupId: patch.nextIceGroupId ?? this.nextIceGroupId,
      isWon: patch.isWon ?? this.isWon,
    });
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: `GameState` 2 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/GameState.ts gameidea/tests/core/GameState.test.ts
git commit -m "feat(ice-kingdom): GameState immutable container"
```

---

## Task 5: TurnEngine — 기본 이동 (미끄러짐 X)

**Files:**
- Create: `gameidea/src/core/TurnEngine.ts`
- Test: `gameidea/tests/core/TurnEngine.test.ts`

먼저 얼음 없이 단순 이동만. 미끄러짐은 Task 6에서 추가.

- [ ] **Step 1: 실패 테스트 작성**

```typescript
// tests/core/TurnEngine.test.ts
import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/core/Grid';
import { GameState } from '../../src/core/GameState';
import { executeAction } from '../../src/core/TurnEngine';

function makeState(width = 5, height = 5): GameState {
  const grid = Grid.createEmpty(width, height);
  return GameState.create({
    grid,
    player: { position: { x: 2, y: 2 }, facing: 'down' },
    flowersRequired: 0,
  });
}

describe('TurnEngine.move', () => {
  it('moves to adjacent floor cell', () => {
    const s1 = makeState();
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 3, y: 2 });
    expect(s2.turnCount).toBe(1);
    expect(s2.player.facing).toBe('right');
  });

  it('does not move when blocked by wall', () => {
    const s1 = makeState();
    s1.grid.setGround(3, 2, { type: 'wall' });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 2 });
    expect(s2.turnCount).toBe(0);
  });

  it('does not move when blocked by water', () => {
    const s1 = makeState();
    s1.grid.setObject(3, 2, { type: 'water' });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 2 });
  });

  it('does not move when blocked by box', () => {
    const s1 = makeState();
    s1.grid.setObject(3, 2, { type: 'box' });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 2 });
  });

  it('does not move out of bounds', () => {
    const s1 = makeState(3, 3);
    s1.player.position.x; // placeholder access
    const s2 = executeAction(
      GameState.create({
        grid: Grid.createEmpty(3, 3),
        player: { position: { x: 2, y: 1 }, facing: 'right' },
        flowersRequired: 0,
      }),
      { kind: 'move', direction: 'right' },
    );
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL with `TurnEngine` not found.

- [ ] **Step 3: TurnEngine.ts 기본 구현**

```typescript
// src/core/TurnEngine.ts
import { GameState } from './GameState';
import type { ActionKind, Direction, Position } from './types';
import { DIRECTION_DELTA } from './types';
import { Grid } from './Grid';

export function executeAction(state: GameState, action: ActionKind): GameState {
  switch (action.kind) {
    case 'move':
      return tryMove(state, action.direction);
    default:
      return state;
  }
}

function tryMove(state: GameState, direction: Direction): GameState {
  const next = addDelta(state.player.position, direction);
  if (!canEnter(state.grid, next)) {
    return state; // 무효 행동, 턴 소비도 없음
  }
  return state.withPatch({
    player: { position: next, facing: direction },
    turnCount: state.turnCount + 1,
  });
}

function canEnter(grid: Grid, pos: Position): boolean {
  if (!grid.inBounds(pos.x, pos.y)) return false;
  const ground = grid.getGround(pos.x, pos.y);
  if (ground.type === 'wall' || ground.type === 'spring' || ground.type === 'bonfire') {
    return false;
  }
  const obj = grid.getObject(pos.x, pos.y);
  if (obj === null) return true;
  // 주인공이 들어갈 수 있는 오브젝트: ice, flower(수집하면서 진입)
  return obj.type === 'ice' || obj.type === 'flower';
}

function addDelta(p: Position, dir: Direction): Position {
  const d = DIRECTION_DELTA[dir];
  return { x: p.x + d.dx, y: p.y + d.dy };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: `TurnEngine.move` 5 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): TurnEngine basic move action"
```

---

## Task 6: TurnEngine — 얼음 미끄러짐

주인공이 얼음 위로 이동하면 같은 방향으로 계속 미끄러진다. 비-얼음 floor에 닿으면 그 위에서 멈추고, 벽/물체에 막히면 직전 위치에서 멈춘다.

**Files:**
- Modify: `gameidea/src/core/TurnEngine.ts`
- Modify: `gameidea/tests/core/TurnEngine.test.ts`

- [ ] **Step 1: 미끄러짐 테스트 추가**

```typescript
// tests/core/TurnEngine.test.ts 에 추가
describe('TurnEngine.move — ice sliding', () => {
  it('slides through consecutive ice cells', () => {
    const grid = Grid.createEmpty(7, 3);
    // 주인공 (1,1) 에서 오른쪽으로 이동. (2,1)(3,1)(4,1) 이 얼음, (5,1) 은 빈 floor.
    for (const x of [2, 3, 4]) {
      grid.setObject(x, 1, { type: 'ice', groupId: 0, role: 'head' });
    }
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    // 얼음 3칸 지나서 비-얼음 floor (5,1) 에서 정지
    expect(s2.player.position).toEqual({ x: 5, y: 1 });
  });

  it('stops on last ice when next cell is wall', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'ice', groupId: 0, role: 'head' });
    grid.setObject(3, 1, { type: 'ice', groupId: 0, role: 'tail' });
    grid.setGround(4, 1, { type: 'wall' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    // (2,1)로 이동, (3,1) 얼음 있음 → 계속, (4,1) 벽 → (3,1) 에서 정지
    expect(s2.player.position).toEqual({ x: 3, y: 1 });
  });

  it('does not slide if first step lands on floor', () => {
    const grid = Grid.createEmpty(5, 3);
    // 얼음 없음
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: `slides through consecutive ice cells` FAIL (한 칸만 움직임).

- [ ] **Step 3: TurnEngine.tryMove 업데이트**

```typescript
// src/core/TurnEngine.ts — tryMove 함수 교체
function tryMove(state: GameState, direction: Direction): GameState {
  let cur = state.player.position;
  let moved = false;
  while (true) {
    const next = addDelta(cur, direction);
    if (!canEnter(state.grid, next)) break;
    cur = next;
    moved = true;
    const obj = state.grid.getObject(cur.x, cur.y);
    // 얼음 위에 도착했으면 같은 방향으로 미끄러짐 계속
    if (obj === null || obj.type !== 'ice') break;
  }
  if (!moved) return state;
  return state.withPatch({
    player: { position: cur, facing: direction },
    turnCount: state.turnCount + 1,
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 미끄러짐 3 테스트 + 기본 이동 5 테스트 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): ice sliding movement"
```

---

## Task 7: TurnEngine — 물 붓기

물샘(spring) 인접 칸에 있을 때, 인접한 빈 floor 칸에 물을 부을 수 있다.

**Files:**
- Modify: `gameidea/src/core/TurnEngine.ts`
- Modify: `gameidea/tests/core/TurnEngine.test.ts`

- [ ] **Step 1: 물 붓기 테스트 추가**

```typescript
// tests/core/TurnEngine.test.ts 에 추가
describe('TurnEngine.pour', () => {
  it('pours water on empty floor adjacent to player, when player adjacent to spring', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(1, 2, { type: 'spring' }); // 물샘
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 2 }, facing: 'down' }, // 물샘 옆
      flowersRequired: 0,
    });
    // 주인공 인접 (3,2) 에 붓기
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 3, y: 2 } });
    expect(s2.grid.getObject(3, 2)).toEqual({ type: 'water' });
    expect(s2.turnCount).toBe(1);
  });

  it('fails when player not adjacent to spring', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(0, 0, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 3, y: 3 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 4, y: 3 } });
    expect(s2.grid.getObject(4, 3)).toBeNull();
    expect(s2.turnCount).toBe(0);
  });

  it('fails when target is not adjacent to player', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(1, 2, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 2 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 4, y: 2 } });
    expect(s2.grid.getObject(4, 2)).toBeNull();
  });

  it('fails when target is not empty floor', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setGround(1, 2, { type: 'spring' });
    grid.setGround(3, 2, { type: 'wall' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 2 }, facing: 'down' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, { kind: 'pour', target: { x: 3, y: 2 } });
    expect(s2.grid.getGround(3, 2)).toEqual({ type: 'wall' });
    expect(s2.turnCount).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: `TurnEngine.pour` 테스트들 FAIL.

- [ ] **Step 3: pour 액션 구현**

```typescript
// src/core/TurnEngine.ts 에 추가
export function executeAction(state: GameState, action: ActionKind): GameState {
  switch (action.kind) {
    case 'move':
      return tryMove(state, action.direction);
    case 'pour':
      return tryPour(state, action.target);
    default:
      return state;
  }
}

function tryPour(state: GameState, target: Position): GameState {
  // 1) 주인공이 물샘과 인접한가?
  if (!hasAdjacentSpring(state)) return state;
  // 2) 타겟이 주인공과 인접한가?
  if (!isAdjacent(state.player.position, target)) return state;
  // 3) 타겟이 빈 floor인가?
  if (!state.grid.inBounds(target.x, target.y)) return state;
  const ground = state.grid.getGround(target.x, target.y);
  if (ground.type !== 'floor') return state;
  const obj = state.grid.getObject(target.x, target.y);
  if (obj !== null) return state;

  const newGrid = state.grid.clone();
  newGrid.setObject(target.x, target.y, { type: 'water' });
  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
  });
}

function hasAdjacentSpring(state: GameState): boolean {
  const { x, y } = state.player.position;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (state.grid.inBounds(nx, ny) && state.grid.getGround(nx, ny).type === 'spring') {
      return true;
    }
  }
  return false;
}

function isAdjacent(a: Position, b: Position): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: pour 4 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): pour water action"
```

---

## Task 8: TurnEngine — 얼리기 (기본 팽창)

물 1칸을 지정된 방향으로 얼려 얼음 2칸(head + tail)으로 만든다. 팽창 방향에 빈 floor가 있어야 성공.

**Files:**
- Modify: `gameidea/src/core/TurnEngine.ts`
- Modify: `gameidea/tests/core/TurnEngine.test.ts`

- [ ] **Step 1: 얼리기 기본 테스트 추가**

```typescript
describe('TurnEngine.freeze — basic expansion', () => {
  it('freezes water into ice head + tail', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setObject(2, 2, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 2 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 2 },
      direction: 'right',
    });
    expect(s2.grid.getObject(2, 2)).toMatchObject({ type: 'ice', role: 'head' });
    expect(s2.grid.getObject(3, 2)).toMatchObject({ type: 'ice', role: 'tail' });
    const head = s2.grid.getObject(2, 2) as any;
    const tail = s2.grid.getObject(3, 2) as any;
    expect(head.groupId).toBe(tail.groupId);
    expect(s2.turnCount).toBe(1);
    expect(s2.nextIceGroupId).toBe(2);
  });

  it('fails when target is not water', () => {
    const grid = Grid.createEmpty(5, 5);
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 2 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 2 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when player not adjacent to target water', () => {
    const grid = Grid.createEmpty(5, 5);
    grid.setObject(2, 2, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 4, y: 4 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 2 },
      direction: 'right',
    });
    expect(s2.grid.getObject(2, 2)).toEqual({ type: 'water' });
    expect(s2.turnCount).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: freeze 테스트 FAIL.

- [ ] **Step 3: freeze 액션 구현**

```typescript
// src/core/TurnEngine.ts 에 추가

export function executeAction(state: GameState, action: ActionKind): GameState {
  switch (action.kind) {
    case 'move':
      return tryMove(state, action.direction);
    case 'pour':
      return tryPour(state, action.target);
    case 'freeze':
      return tryFreeze(state, action.target, action.direction);
    default:
      return state;
  }
}

function tryFreeze(state: GameState, target: Position, direction: Direction): GameState {
  // 1) 주인공이 타겟과 인접한가?
  if (!isAdjacent(state.player.position, target)) return state;
  // 2) 타겟이 물인가?
  if (!state.grid.inBounds(target.x, target.y)) return state;
  const targetObj = state.grid.getObject(target.x, target.y);
  if (targetObj === null || targetObj.type !== 'water') return state;
  // 3) 팽창 목적지 계산
  const d = DIRECTION_DELTA[direction];
  const tailPos: Position = { x: target.x + d.dx, y: target.y + d.dy };
  // 4) 팽창 가능성 확인
  if (!canExpandInto(state, tailPos)) return state;

  // 5) 적용
  const newGrid = state.grid.clone();
  const groupId = state.nextIceGroupId;
  newGrid.setObject(target.x, target.y, { type: 'ice', groupId, role: 'head' });
  newGrid.setObject(tailPos.x, tailPos.y, { type: 'ice', groupId, role: 'tail' });
  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
    nextIceGroupId: groupId + 1,
  });
}

function canExpandInto(state: GameState, pos: Position): boolean {
  if (!state.grid.inBounds(pos.x, pos.y)) return false;
  const ground = state.grid.getGround(pos.x, pos.y);
  if (ground.type !== 'floor' && ground.type !== 'exit') return false;
  // 주인공이 그 자리에 있으면 실패
  if (state.player.position.x === pos.x && state.player.position.y === pos.y) return false;
  const obj = state.grid.getObject(pos.x, pos.y);
  return obj === null;
  // (Task 9에서 박스 밀기 예외 추가)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: freeze 3 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): freeze action with directional expansion"
```

---

## Task 9: TurnEngine — 얼리기 상자 밀기 + 실패 케이스

**Files:**
- Modify: `gameidea/src/core/TurnEngine.ts`
- Modify: `gameidea/tests/core/TurnEngine.test.ts`

- [ ] **Step 1: 박스 밀기 및 실패 케이스 테스트 추가**

```typescript
describe('TurnEngine.freeze — edge cases', () => {
  it('pushes a box one cell when freezing into box', () => {
    const grid = Grid.createEmpty(6, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setObject(3, 1, { type: 'box' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.grid.getObject(2, 1)).toMatchObject({ type: 'ice', role: 'head' });
    expect(s2.grid.getObject(3, 1)).toMatchObject({ type: 'ice', role: 'tail' });
    expect(s2.grid.getObject(4, 1)).toEqual({ type: 'box' });
  });

  it('fails to push box into wall', () => {
    const grid = Grid.createEmpty(4, 3);
    grid.setObject(1, 1, { type: 'water' });
    grid.setObject(2, 1, { type: 'box' });
    grid.setGround(3, 1, { type: 'wall' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 0, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 1, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
    expect(s2.grid.getObject(1, 1)).toEqual({ type: 'water' });
  });

  it('fails when expansion direction has rock', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setObject(3, 1, { type: 'rock' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when expansion direction has spring', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setGround(3, 1, { type: 'spring' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when expansion direction has player', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 3, y: 1 }, facing: 'left' }, // 팽창 방향에 주인공
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when expansion direction has another water', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'water' });
    grid.setObject(3, 1, { type: 'water' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
    const s2 = executeAction(s1, {
      kind: 'freeze',
      target: { x: 2, y: 1 },
      direction: 'right',
    });
    expect(s2.turnCount).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: 박스 밀기 테스트 FAIL (spring 실패 케이스는 기존 canExpandInto 로 이미 PASS할 수도 있음).

- [ ] **Step 3: canExpandInto + 박스 밀기 로직 추가**

```typescript
// src/core/TurnEngine.ts — tryFreeze, canExpandInto 교체

function tryFreeze(state: GameState, target: Position, direction: Direction): GameState {
  if (!isAdjacent(state.player.position, target)) return state;
  if (!state.grid.inBounds(target.x, target.y)) return state;
  const targetObj = state.grid.getObject(target.x, target.y);
  if (targetObj === null || targetObj.type !== 'water') return state;

  const d = DIRECTION_DELTA[direction];
  const tailPos: Position = { x: target.x + d.dx, y: target.y + d.dy };

  const newGrid = state.grid.clone();
  const boxPush = tryPlanBoxPush(state, tailPos, direction);
  if (boxPush === 'reject') return state;
  if (boxPush === 'none') {
    if (!canExpandInto(state, tailPos)) return state;
  } else {
    // boxPush === 'push'
    // 박스를 tailPos+dir 로 이동
    const boxDest: Position = { x: tailPos.x + d.dx, y: tailPos.y + d.dy };
    newGrid.setObject(boxDest.x, boxDest.y, { type: 'box' });
    newGrid.setObject(tailPos.x, tailPos.y, null);
  }

  const groupId = state.nextIceGroupId;
  newGrid.setObject(target.x, target.y, { type: 'ice', groupId, role: 'head' });
  newGrid.setObject(tailPos.x, tailPos.y, { type: 'ice', groupId, role: 'tail' });

  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
    nextIceGroupId: groupId + 1,
  });
}

type BoxPushResult = 'none' | 'push' | 'reject';

function tryPlanBoxPush(state: GameState, tailPos: Position, direction: Direction): BoxPushResult {
  if (!state.grid.inBounds(tailPos.x, tailPos.y)) return 'reject';
  const obj = state.grid.getObject(tailPos.x, tailPos.y);
  if (obj === null || obj.type !== 'box') return 'none';
  // 박스가 있음 → 한 칸 더 밀 수 있나?
  const d = DIRECTION_DELTA[direction];
  const dest: Position = { x: tailPos.x + d.dx, y: tailPos.y + d.dy };
  if (!state.grid.inBounds(dest.x, dest.y)) return 'reject';
  const destGround = state.grid.getGround(dest.x, dest.y);
  if (destGround.type !== 'floor') return 'reject';
  const destObj = state.grid.getObject(dest.x, dest.y);
  if (destObj !== null) return 'reject';
  if (state.player.position.x === dest.x && state.player.position.y === dest.y) return 'reject';
  return 'push';
}

function canExpandInto(state: GameState, pos: Position): boolean {
  if (!state.grid.inBounds(pos.x, pos.y)) return false;
  const ground = state.grid.getGround(pos.x, pos.y);
  if (ground.type !== 'floor' && ground.type !== 'exit') return false;
  if (state.player.position.x === pos.x && state.player.position.y === pos.y) return false;
  const obj = state.grid.getObject(pos.x, pos.y);
  return obj === null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: freeze 엣지 케이스 6 테스트 모두 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): freeze box push + failure cases"
```

---

## Task 10: TurnEngine — 녹이기

얼음(head 또는 tail 어느 셀이든) 탭 시, 해당 ice group의 head는 물로, tail은 빈 floor로 바뀐다. 주인공이 밟고 있는 얼음은 녹이기 불가.

**Files:**
- Modify: `gameidea/src/core/TurnEngine.ts`
- Modify: `gameidea/tests/core/TurnEngine.test.ts`

- [ ] **Step 1: 녹이기 테스트 추가**

```typescript
describe('TurnEngine.melt', () => {
  function makeFrozenState(): GameState {
    // (2,1) water → (2,1) ice-head + (3,1) ice-tail
    const grid = Grid.createEmpty(6, 3);
    grid.setObject(2, 1, { type: 'ice', groupId: 7, role: 'head' });
    grid.setObject(3, 1, { type: 'ice', groupId: 7, role: 'tail' });
    return GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      nextIceGroupId: 8,
    });
  }

  it('melting head turns head into water and tail into empty', () => {
    const s1 = makeFrozenState();
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 2, y: 1 } });
    expect(s2.grid.getObject(2, 1)).toEqual({ type: 'water' });
    expect(s2.grid.getObject(3, 1)).toBeNull();
    expect(s2.turnCount).toBe(1);
  });

  it('melting tail also turns head into water and tail into empty', () => {
    // player adjacent to tail (3,1) but needs to be adjacent — move player
    const s1 = makeFrozenState().withPatch({
      player: { position: { x: 4, y: 1 }, facing: 'left' },
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 3, y: 1 } });
    expect(s2.grid.getObject(2, 1)).toEqual({ type: 'water' });
    expect(s2.grid.getObject(3, 1)).toBeNull();
  });

  it('fails when not adjacent', () => {
    const s1 = makeFrozenState().withPatch({
      player: { position: { x: 5, y: 1 }, facing: 'left' },
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 2, y: 1 } });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when target is not ice', () => {
    const s1 = makeFrozenState();
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 0, y: 1 } });
    expect(s2.turnCount).toBe(0);
  });

  it('fails when player is standing on the ice being melted', () => {
    const s1 = makeFrozenState().withPatch({
      player: { position: { x: 2, y: 1 }, facing: 'right' }, // 주인공이 head 위에
    });
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 2, y: 1 } });
    expect(s2.turnCount).toBe(0);
    expect(s2.grid.getObject(2, 1)).toMatchObject({ type: 'ice' });
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: melt 테스트 FAIL.

- [ ] **Step 3: melt 액션 구현**

```typescript
// src/core/TurnEngine.ts — executeAction 확장 + tryMelt 추가

export function executeAction(state: GameState, action: ActionKind): GameState {
  switch (action.kind) {
    case 'move':
      return tryMove(state, action.direction);
    case 'pour':
      return tryPour(state, action.target);
    case 'freeze':
      return tryFreeze(state, action.target, action.direction);
    case 'melt':
      return tryMelt(state, action.target);
    default:
      return state;
  }
}

function tryMelt(state: GameState, target: Position): GameState {
  if (!state.grid.inBounds(target.x, target.y)) return state;
  if (!isAdjacent(state.player.position, target)) return state;
  const obj = state.grid.getObject(target.x, target.y);
  if (obj === null || obj.type !== 'ice') return state;
  // 주인공이 밟고 있는 얼음 타겟이면 실패 (인접 조건에서 거의 걸러지지만 방어)
  if (state.player.position.x === target.x && state.player.position.y === target.y) return state;

  const groupId = obj.groupId;
  const { headPos, tailPos } = findIceGroup(state, groupId);
  if (!headPos || !tailPos) return state;

  // 주인공이 head 또는 tail 위에 있으면 실패 (인접은 통과했지만 본인 발밑 예외)
  if (state.player.position.x === headPos.x && state.player.position.y === headPos.y) return state;
  if (state.player.position.x === tailPos.x && state.player.position.y === tailPos.y) return state;

  const newGrid = state.grid.clone();
  newGrid.setObject(headPos.x, headPos.y, { type: 'water' });
  newGrid.setObject(tailPos.x, tailPos.y, null);
  return state.withPatch({
    grid: newGrid,
    turnCount: state.turnCount + 1,
  });
}

function findIceGroup(
  state: GameState,
  groupId: number,
): { headPos: Position | null; tailPos: Position | null } {
  let headPos: Position | null = null;
  let tailPos: Position | null = null;
  for (let y = 0; y < state.grid.height; y++) {
    for (let x = 0; x < state.grid.width; x++) {
      const o = state.grid.getObject(x, y);
      if (o !== null && o.type === 'ice' && o.groupId === groupId) {
        if (o.role === 'head') headPos = { x, y };
        else tailPos = { x, y };
      }
    }
  }
  return { headPos, tailPos };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: melt 5 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): melt action with group tracking"
```

---

## Task 11: TurnEngine — 모닥불 자동 녹임 + 꽃 수집 + 승리 조건

행동 후 모닥불 인접 얼음은 자동으로 녹는다(주인공이 밟은 얼음 제외). 주인공이 꽃 오브젝트로 이동하면 꽃 수집. 필수 꽃을 다 모은 후 exit 타일 도달 시 승리.

**Files:**
- Modify: `gameidea/src/core/TurnEngine.ts`
- Modify: `gameidea/tests/core/TurnEngine.test.ts`

- [ ] **Step 1: 모닥불 + 꽃 + 승리 조건 테스트 추가**

```typescript
describe('TurnEngine.bonfire auto-melt', () => {
  it('melts ice adjacent to bonfire after any action', () => {
    const grid = Grid.createEmpty(6, 3);
    grid.setGround(4, 1, { type: 'bonfire' });
    grid.setObject(2, 1, { type: 'ice', groupId: 1, role: 'head' });
    grid.setObject(3, 1, { type: 'ice', groupId: 1, role: 'tail' }); // 모닥불과 인접한 tail
    const s1 = GameState.create({
      grid,
      player: { position: { x: 0, y: 1 }, facing: 'right' },
      flowersRequired: 0,
      nextIceGroupId: 2,
    });
    // 주인공이 이동 행동만 해도 턴이 진행되며 자동 녹임 적용
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.grid.getObject(2, 1)).toEqual({ type: 'water' });
    expect(s2.grid.getObject(3, 1)).toBeNull();
  });

  it('does not melt ice that player stands on', () => {
    const grid = Grid.createEmpty(6, 3);
    grid.setGround(3, 1, { type: 'bonfire' });
    grid.setObject(2, 1, { type: 'ice', groupId: 1, role: 'head' }); // 주인공 자리
    grid.setObject(1, 1, { type: 'ice', groupId: 2, role: 'head' });
    grid.setObject(0, 1, { type: 'ice', groupId: 2, role: 'tail' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 1 }, facing: 'down' },
      flowersRequired: 0,
      nextIceGroupId: 3,
    });
    // 주인공이 아래로 이동 시도 → 막힘(벽이라 가정, 안 막혀도 OK) — 대신 무의미 이동 후 자동녹임 트리거 X
    // 대신 의미있는 행동: 물 붓기 or 다른 행동. 여기선 단순 녹이기 행동.
    const s2 = executeAction(s1, { kind: 'melt', target: { x: 1, y: 1 } });
    // 주인공 밟은 (2,1) 얼음은 모닥불 인접이어도 안 녹아야 함
    expect(s2.grid.getObject(2, 1)).toMatchObject({ type: 'ice' });
  });
});

describe('TurnEngine — flower collection', () => {
  it('collects flower when moving onto it', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setObject(2, 1, { type: 'flower', required: true, collected: false });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 1,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.player.position).toEqual({ x: 2, y: 1 });
    expect(s2.grid.getObject(2, 1)).toBeNull();
    expect(s2.flowersCollected).toBe(1);
  });
});

describe('TurnEngine — win condition', () => {
  it('wins when player reaches exit with all required flowers', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setGround(3, 1, { type: 'exit' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 1 }, facing: 'right' },
      flowersRequired: 1,
      flowersCollected: 1,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.isWon).toBe(true);
  });

  it('does not win when reaching exit without all flowers', () => {
    const grid = Grid.createEmpty(5, 3);
    grid.setGround(3, 1, { type: 'exit' });
    const s1 = GameState.create({
      grid,
      player: { position: { x: 2, y: 1 }, facing: 'right' },
      flowersRequired: 1,
      flowersCollected: 0,
    });
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    expect(s2.isWon).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: bonfire + flower + win 테스트 FAIL.

- [ ] **Step 3: 환경 효과 + 수집 + 승리 로직 추가**

```typescript
// src/core/TurnEngine.ts 교체 + 추가

export function executeAction(state: GameState, action: ActionKind): GameState {
  let next: GameState;
  switch (action.kind) {
    case 'move':
      next = tryMove(state, action.direction);
      break;
    case 'pour':
      next = tryPour(state, action.target);
      break;
    case 'freeze':
      next = tryFreeze(state, action.target, action.direction);
      break;
    case 'melt':
      next = tryMelt(state, action.target);
      break;
    default:
      return state;
  }
  // 행동이 턴을 소비한 경우에만 후처리
  if (next.turnCount === state.turnCount) return state;

  next = collectFlowerAtPlayer(next);
  next = applyBonfireAutoMelt(next);
  next = checkWin(next);
  return next;
}

function collectFlowerAtPlayer(state: GameState): GameState {
  const { x, y } = state.player.position;
  const obj = state.grid.getObject(x, y);
  if (obj === null || obj.type !== 'flower' || obj.collected) return state;
  const newGrid = state.grid.clone();
  newGrid.setObject(x, y, null);
  let collected = state.flowersCollected;
  if (obj.required) collected += 1;
  return state.withPatch({ grid: newGrid, flowersCollected: collected });
}

function applyBonfireAutoMelt(state: GameState): GameState {
  const iceGroupsToMelt = new Set<number>();
  for (let y = 0; y < state.grid.height; y++) {
    for (let x = 0; x < state.grid.width; x++) {
      if (state.grid.getGround(x, y).type !== 'bonfire') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (!state.grid.inBounds(nx, ny)) continue;
        const o = state.grid.getObject(nx, ny);
        if (o !== null && o.type === 'ice') {
          // 주인공이 그 얼음 위라면 제외
          if (state.player.position.x === nx && state.player.position.y === ny) continue;
          iceGroupsToMelt.add(o.groupId);
        }
      }
    }
  }
  if (iceGroupsToMelt.size === 0) return state;
  const newGrid = state.grid.clone();
  for (const gid of iceGroupsToMelt) {
    const { headPos, tailPos } = findIceGroup(state, gid);
    if (!headPos || !tailPos) continue;
    // 주인공이 head/tail 어느 한 쪽이라도 밟고 있으면 이 그룹은 스킵
    const pp = state.player.position;
    if (pp.x === headPos.x && pp.y === headPos.y) continue;
    if (pp.x === tailPos.x && pp.y === tailPos.y) continue;
    newGrid.setObject(headPos.x, headPos.y, { type: 'water' });
    newGrid.setObject(tailPos.x, tailPos.y, null);
  }
  return state.withPatch({ grid: newGrid });
}

function checkWin(state: GameState): GameState {
  const { x, y } = state.player.position;
  if (state.grid.getGround(x, y).type !== 'exit') return state;
  if (state.flowersCollected < state.flowersRequired) return state;
  return state.withPatch({ isWon: true });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: 모든 TurnEngine 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/TurnEngine.ts gameidea/tests/core/TurnEngine.test.ts
git commit -m "feat(ice-kingdom): bonfire auto-melt, flower pickup, win condition"
```

---

## Task 12: UndoStack

매 턴 전 GameState 스냅샷을 저장하고 Undo 시 이전 상태 복원.

**Files:**
- Create: `gameidea/src/core/UndoStack.ts`
- Test: `gameidea/tests/core/UndoStack.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```typescript
// tests/core/UndoStack.test.ts
import { describe, it, expect } from 'vitest';
import { Grid } from '../../src/core/Grid';
import { GameState } from '../../src/core/GameState';
import { UndoStack } from '../../src/core/UndoStack';
import { executeAction } from '../../src/core/TurnEngine';

describe('UndoStack', () => {
  function initialState(): GameState {
    return GameState.create({
      grid: Grid.createEmpty(5, 3),
      player: { position: { x: 1, y: 1 }, facing: 'right' },
      flowersRequired: 0,
    });
  }

  it('starts empty and returns null on pop', () => {
    const s = new UndoStack();
    expect(s.canUndo()).toBe(false);
    expect(s.pop()).toBeNull();
  });

  it('push + pop restores state', () => {
    const stack = new UndoStack();
    const s0 = initialState();
    stack.push(s0);
    const s1 = executeAction(s0, { kind: 'move', direction: 'right' });
    expect(stack.canUndo()).toBe(true);
    const restored = stack.pop();
    expect(restored).not.toBeNull();
    expect(restored!.player.position).toEqual({ x: 1, y: 1 });
    // s1 은 달라야 함
    expect(s1.player.position).toEqual({ x: 2, y: 1 });
  });

  it('multiple pushes pop in LIFO order', () => {
    const stack = new UndoStack();
    const s0 = initialState();
    stack.push(s0);
    const s1 = executeAction(s0, { kind: 'move', direction: 'right' });
    stack.push(s1);
    const s2 = executeAction(s1, { kind: 'move', direction: 'right' });
    stack.push(s2);
    expect(stack.pop()!.player.position).toEqual({ x: 3, y: 1 });
    expect(stack.pop()!.player.position).toEqual({ x: 2, y: 1 });
    expect(stack.pop()!.player.position).toEqual({ x: 1, y: 1 });
    expect(stack.pop()).toBeNull();
  });

  it('clear empties the stack', () => {
    const stack = new UndoStack();
    stack.push(initialState());
    stack.clear();
    expect(stack.canUndo()).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL with `UndoStack` not found.

- [ ] **Step 3: UndoStack.ts 구현**

```typescript
// src/core/UndoStack.ts
import { GameState } from './GameState';

export class UndoStack {
  private readonly stack: GameState[] = [];

  push(state: GameState): void {
    this.stack.push(state.clone());
  }

  pop(): GameState | null {
    return this.stack.pop() ?? null;
  }

  canUndo(): boolean {
    return this.stack.length > 0;
  }

  clear(): void {
    this.stack.length = 0;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: UndoStack 4 테스트 PASS.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/core/UndoStack.ts gameidea/tests/core/UndoStack.test.ts
git commit -m "feat(ice-kingdom): UndoStack with state snapshots"
```

---

## Task 13: LevelLoader — YAML 파서

YAML 텍스트를 받아 GameState로 변환. 그리드는 ASCII 문자 매핑.

**Files:**
- Create: `gameidea/src/core/LevelLoader.ts`
- Test: `gameidea/tests/core/LevelLoader.test.ts`
- Create: `gameidea/src/assets/levels/test-01.yaml` (기본 레벨 샘플, 나머지 4개는 Task 20에서 추가)

### 레벨 YAML 포맷

```yaml
id: "test-01"
name: "첫 걸음"
grid: |
  #####
  #P.E#
  #####
required_flowers: 0
```

ASCII 매핑:
- `#` = wall 지형
- `.` = floor 지형
- `S` = spring 지형
- `B` = bonfire 지형
- `E` = exit 지형
- `P` = 주인공 시작 위치 (지형은 floor)
- `W` = 물 오브젝트 (지형 floor)
- `X` = 나무상자 오브젝트 (지형 floor)
- `R` = 바위 오브젝트 (지형 floor)
- `F` = 필수 얼음꽃 (지형 floor)
- `f` = 선택 얼음꽃 (지형 floor)

얼음은 초기 상태에 등장하지 않으므로 매핑 기호 없음 (필요 시 향후 추가).

- [ ] **Step 1: 실패 테스트 작성**

```typescript
// tests/core/LevelLoader.test.ts
import { describe, it, expect } from 'vitest';
import { loadLevelFromYaml } from '../../src/core/LevelLoader';

describe('LevelLoader', () => {
  it('parses a minimal level', () => {
    const yaml = `
id: "t"
name: "test"
grid: |
  #####
  #P.E#
  #####
required_flowers: 0
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.width).toBe(5);
    expect(s.grid.height).toBe(3);
    expect(s.grid.getGround(0, 0)).toEqual({ type: 'wall' });
    expect(s.grid.getGround(1, 1)).toEqual({ type: 'floor' }); // P 자리도 floor
    expect(s.grid.getGround(3, 1)).toEqual({ type: 'exit' });
    expect(s.player.position).toEqual({ x: 1, y: 1 });
    expect(s.flowersRequired).toBe(0);
  });

  it('parses water, box, flower', () => {
    const yaml = `
id: "t2"
name: "test2"
grid: |
  #######
  #P.WXF#
  #######
required_flowers: 1
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.getObject(3, 1)).toEqual({ type: 'water' });
    expect(s.grid.getObject(4, 1)).toEqual({ type: 'box' });
    expect(s.grid.getObject(5, 1)).toEqual({
      type: 'flower',
      required: true,
      collected: false,
    });
  });

  it('parses spring and bonfire ground', () => {
    const yaml = `
id: "t3"
name: "test3"
grid: |
  #####
  #PSB#
  #####
required_flowers: 0
`;
    const s = loadLevelFromYaml(yaml);
    expect(s.grid.getGround(2, 1)).toEqual({ type: 'spring' });
    expect(s.grid.getGround(3, 1)).toEqual({ type: 'bonfire' });
  });

  it('throws on missing player', () => {
    const yaml = `
id: "t4"
name: "no player"
grid: |
  ###
  #.#
  ###
required_flowers: 0
`;
    expect(() => loadLevelFromYaml(yaml)).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL with `loadLevelFromYaml` not found.

- [ ] **Step 3: LevelLoader.ts 구현**

```typescript
// src/core/LevelLoader.ts
import yaml from 'js-yaml';
import { Grid } from './Grid';
import { GameState } from './GameState';
import type {
  GroundType,
  ObjectCell,
  PlayerState,
} from './types';

interface RawLevel {
  id: string;
  name: string;
  grid: string;
  required_flowers: number;
}

const GROUND_CHARS: Record<string, GroundType> = {
  '#': 'wall',
  '.': 'floor',
  'S': 'spring',
  'B': 'bonfire',
  'E': 'exit',
  'P': 'floor',
  'W': 'floor',
  'X': 'floor',
  'R': 'floor',
  'F': 'floor',
  'f': 'floor',
};

function parseObjectChar(ch: string): ObjectCell | null {
  switch (ch) {
    case 'W':
      return { type: 'water' };
    case 'X':
      return { type: 'box' };
    case 'R':
      return { type: 'rock' };
    case 'F':
      return { type: 'flower', required: true, collected: false };
    case 'f':
      return { type: 'flower', required: false, collected: false };
    default:
      return null;
  }
}

export function loadLevelFromYaml(text: string): GameState {
  const raw = yaml.load(text) as RawLevel;
  if (!raw || typeof raw.grid !== 'string') {
    throw new Error('Invalid level: missing grid');
  }
  const lines = raw.grid.split('\n').filter(l => l.length > 0);
  if (lines.length === 0) throw new Error('Invalid level: empty grid');
  const width = Math.max(...lines.map(l => l.length));
  const height = lines.length;

  const grid = Grid.createEmpty(width, height);
  let player: PlayerState | null = null;

  for (let y = 0; y < height; y++) {
    const line = lines[y].padEnd(width, '#');
    for (let x = 0; x < width; x++) {
      const ch = line[x];
      const groundType = GROUND_CHARS[ch];
      if (!groundType) {
        throw new Error(`Unknown level char '${ch}' at (${x}, ${y})`);
      }
      grid.setGround(x, y, { type: groundType });
      if (ch === 'P') {
        player = { position: { x, y }, facing: 'down' };
      } else {
        const obj = parseObjectChar(ch);
        if (obj !== null) {
          grid.setObject(x, y, obj);
        }
      }
    }
  }

  if (player === null) {
    throw new Error('Invalid level: no player (P) found');
  }

  return GameState.create({
    grid,
    player,
    flowersRequired: raw.required_flowers ?? 0,
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: LevelLoader 4 테스트 PASS.

- [ ] **Step 5: 샘플 레벨 YAML 파일 생성**

```yaml
# gameidea/src/assets/levels/test-01.yaml
id: "test-01"
name: "첫 걸음"
grid: |
  #####
  #P.E#
  #####
required_flowers: 0
```

- [ ] **Step 6: Commit**

```bash
git add gameidea/src/core/LevelLoader.ts gameidea/tests/core/LevelLoader.test.ts gameidea/src/assets/levels/test-01.yaml
git commit -m "feat(ice-kingdom): LevelLoader YAML parser + sample level"
```

---

## Task 14: Phaser 부트 — BootScene + 레벨 로딩 배선

Phaser 씬 구조 셋업. BootScene에서 레벨 YAML 로드 후 StageScene으로 전환.

**Files:**
- Create: `gameidea/src/config.ts`
- Modify: `gameidea/src/main.ts`
- Create: `gameidea/src/scenes/BootScene.ts`
- Create: `gameidea/src/scenes/StageScene.ts` (껍데기만, Task 15에서 채움)

- [ ] **Step 1: config.ts 작성**

```typescript
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
```

- [ ] **Step 2: main.ts 업데이트**

```typescript
// src/main.ts
import Phaser from 'phaser';
import { SCENE_KEYS } from './config';
import { BootScene } from './scenes/BootScene';
import { StageScene } from './scenes/StageScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1024,
  height: 768,
  backgroundColor: '#1a2530',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, StageScene],
});

void SCENE_KEYS; // keep import used
```

- [ ] **Step 3: BootScene 작성**

```typescript
// src/scenes/BootScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.Boot);
  }

  preload() {
    // 레벨 YAML 파일들을 텍스트로 프리로드
    for (const id of LEVEL_PLAYLIST) {
      this.load.text(`level:${id}`, `src/assets/levels/${id}.yaml`);
    }
  }

  create() {
    this.scene.start(SCENE_KEYS.Stage, { levelIndex: 0 });
  }
}
```

- [ ] **Step 4: StageScene 스텁 작성**

```typescript
// src/scenes/StageScene.ts
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';

interface StageSceneData {
  levelIndex: number;
}

export class StageScene extends Phaser.Scene {
  private state!: GameState;
  private levelIndex!: number;

  constructor() {
    super(SCENE_KEYS.Stage);
  }

  init(data: StageSceneData) {
    this.levelIndex = data.levelIndex;
  }

  create() {
    const id = LEVEL_PLAYLIST[this.levelIndex];
    const yamlText = this.cache.text.get(`level:${id}`);
    this.state = loadLevelFromYaml(yamlText);

    this.add.text(16, 16, `Level ${id} loaded — ${this.state.grid.width}×${this.state.grid.height}`, {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.add.text(16, 40, `Player: (${this.state.player.position.x}, ${this.state.player.position.y})`, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#aaaaaa',
    });
  }
}
```

- [ ] **Step 5: 개발 서버로 로드 검증**

Run: `npm run dev`
Expected: 브라우저에 "Level test-01 loaded — 5×3" + "Player: (1, 1)" 텍스트 표시.

- [ ] **Step 6: Commit**

```bash
git add gameidea/src/config.ts gameidea/src/main.ts gameidea/src/scenes/BootScene.ts gameidea/src/scenes/StageScene.ts
git commit -m "feat(ice-kingdom): Phaser boot + level YAML loading"
```

---

## Task 15: 렌더링 레이어 — TileRenderer + PlayerRenderer

GameState를 받아 격자를 Phaser 그래픽스로 그린다. Phase 0/1에서는 색 도형 플레이스홀더.

**Files:**
- Create: `gameidea/src/entities/TileRenderer.ts`
- Create: `gameidea/src/entities/PlayerRenderer.ts`
- Modify: `gameidea/src/scenes/StageScene.ts`

- [ ] **Step 1: TileRenderer 작성**

```typescript
// src/entities/TileRenderer.ts
import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';
import type { GameState } from '../core/GameState';

export class TileRenderer {
  private readonly container: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene, originX: number, originY: number) {
    this.container = scene.add.container(originX, originY);
  }

  render(state: GameState): void {
    this.container.removeAll(true);
    for (let y = 0; y < state.grid.height; y++) {
      for (let x = 0; x < state.grid.width; x++) {
        this.drawGround(state, x, y);
        this.drawObject(state, x, y);
      }
    }
  }

  private drawGround(state: GameState, x: number, y: number): void {
    const g = state.grid.getGround(x, y);
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;
    let color: number;
    switch (g.type) {
      case 'wall': color = COLORS.wall; break;
      case 'floor': color = COLORS.floor; break;
      case 'spring': color = COLORS.spring; break;
      case 'bonfire': color = COLORS.bonfire; break;
      case 'exit': color = COLORS.exit; break;
    }
    const rect = this.scene.add.rectangle(
      px + TILE_SIZE / 2,
      py + TILE_SIZE / 2,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
      color,
    );
    this.container.add(rect);

    // 지형 라벨 (임시 플레이스홀더)
    const label = labelForGround(g.type);
    if (label) {
      const txt = this.scene.add.text(
        px + TILE_SIZE / 2,
        py + TILE_SIZE / 2,
        label,
        { fontFamily: 'sans-serif', fontSize: '14px', color: '#000000' },
      );
      txt.setOrigin(0.5);
      this.container.add(txt);
    }
  }

  private drawObject(state: GameState, x: number, y: number): void {
    const o = state.grid.getObject(x, y);
    if (o === null) return;
    const px = x * TILE_SIZE + TILE_SIZE / 2;
    const py = y * TILE_SIZE + TILE_SIZE / 2;
    let color: number;
    let label = '';
    switch (o.type) {
      case 'water': color = COLORS.water; label = '~'; break;
      case 'ice': color = COLORS.ice; label = o.role === 'head' ? '❄' : '·'; break;
      case 'box': color = COLORS.box; label = '□'; break;
      case 'rock': color = COLORS.rock; label = '●'; break;
      case 'flower': color = o.required ? COLORS.flower : COLORS.flowerOptional; label = '✿'; break;
    }
    const circle = this.scene.add.rectangle(px, py, TILE_SIZE - 12, TILE_SIZE - 12, color);
    this.container.add(circle);
    if (label) {
      const txt = this.scene.add.text(px, py, label, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffffff',
      });
      txt.setOrigin(0.5);
      this.container.add(txt);
    }
  }
}

function labelForGround(type: string): string {
  switch (type) {
    case 'spring': return 'S';
    case 'bonfire': return 'B';
    case 'exit': return 'E';
    default: return '';
  }
}
```

- [ ] **Step 2: PlayerRenderer 작성**

```typescript
// src/entities/PlayerRenderer.ts
import Phaser from 'phaser';
import { COLORS, TILE_SIZE } from '../config';
import type { GameState } from '../core/GameState';

export class PlayerRenderer {
  private sprite: Phaser.GameObjects.Arc | null = null;

  constructor(private readonly scene: Phaser.Scene, private readonly originX: number, private readonly originY: number) {}

  render(state: GameState): void {
    const px = this.originX + state.player.position.x * TILE_SIZE + TILE_SIZE / 2;
    const py = this.originY + state.player.position.y * TILE_SIZE + TILE_SIZE / 2;
    if (this.sprite === null) {
      this.sprite = this.scene.add.circle(px, py, TILE_SIZE * 0.3, COLORS.player);
      this.sprite.setStrokeStyle(2, 0x000000);
    } else {
      this.scene.tweens.add({
        targets: this.sprite,
        x: px,
        y: py,
        duration: 150,
      });
    }
  }
}
```

- [ ] **Step 3: StageScene에 렌더러 통합**

```typescript
// src/scenes/StageScene.ts 업데이트
import Phaser from 'phaser';
import { SCENE_KEYS, LEVEL_PLAYLIST, GRID_PADDING, TILE_SIZE } from '../config';
import { loadLevelFromYaml } from '../core/LevelLoader';
import { GameState } from '../core/GameState';
import { TileRenderer } from '../entities/TileRenderer';
import { PlayerRenderer } from '../entities/PlayerRenderer';

interface StageSceneData {
  levelIndex: number;
}

export class StageScene extends Phaser.Scene {
  private state!: GameState;
  private levelIndex!: number;
  private tileRenderer!: TileRenderer;
  private playerRenderer!: PlayerRenderer;
  private originX = 0;
  private originY = 0;

  constructor() {
    super(SCENE_KEYS.Stage);
  }

  init(data: StageSceneData) {
    this.levelIndex = data.levelIndex;
  }

  create() {
    const id = LEVEL_PLAYLIST[this.levelIndex];
    const yamlText = this.cache.text.get(`level:${id}`);
    this.state = loadLevelFromYaml(yamlText);

    // 맵을 화면 중앙에 배치
    const mapW = this.state.grid.width * TILE_SIZE;
    const mapH = this.state.grid.height * TILE_SIZE;
    this.originX = (Number(this.game.config.width) - mapW) / 2;
    this.originY = (Number(this.game.config.height) - mapH) / 2;

    this.tileRenderer = new TileRenderer(this, this.originX, this.originY);
    this.playerRenderer = new PlayerRenderer(this, this.originX, this.originY);
    this.rerender();
  }

  private rerender(): void {
    this.tileRenderer.render(this.state);
    this.playerRenderer.render(this.state);
  }
}
```

- [ ] **Step 4: 개발 서버로 시각 검증**

Run: `npm run dev`
Expected: 5×3 격자가 화면 중앙에 표시. 벽은 어두운색, 바닥은 베이지, 출구는 노란색 E, 주인공은 노란 원.

- [ ] **Step 5: Commit**

```bash
git add gameidea/src/entities/TileRenderer.ts gameidea/src/entities/PlayerRenderer.ts gameidea/src/scenes/StageScene.ts
git commit -m "feat(ice-kingdom): placeholder rendering for tiles + player"
```

---

## Task 16: 입력 — 탭으로 이동 (기본)

태블릿 탭 → 행동 변환. 이 태스크는 이동만. 물 붓기/얼리기/녹이기는 Task 17에서.

**Files:**
- Modify: `gameidea/src/scenes/StageScene.ts`

- [ ] **Step 1: 탭 좌표 → 격자 좌표 헬퍼 작성**

`StageScene` 내부에 `pointerToCell(pointer): Position | null` 메서드 추가. 맵 영역 밖 탭은 null 반환.

- [ ] **Step 2: 탭 이벤트 바인딩 + 이동 실행**

```typescript
// src/scenes/StageScene.ts 에 메서드 추가
import { executeAction } from '../core/TurnEngine';
import type { Direction, Position } from '../core/types';

// create() 끝부분에 추가
this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.handleTap(p));

// 클래스에 추가
private handleTap(pointer: Phaser.Input.Pointer): void {
  const cell = this.pointerToCell(pointer);
  if (cell === null) return;
  this.tryTap(cell);
}

private pointerToCell(pointer: Phaser.Input.Pointer): Position | null {
  const localX = pointer.x - this.originX;
  const localY = pointer.y - this.originY;
  if (localX < 0 || localY < 0) return null;
  const x = Math.floor(localX / TILE_SIZE);
  const y = Math.floor(localY / TILE_SIZE);
  if (!this.state.grid.inBounds(x, y)) return null;
  return { x, y };
}

private tryTap(cell: Position): void {
  // 이번 태스크에서는 이동만: 주인공 인접 빈 칸/얼음/꽃 탭 → 이동
  const p = this.state.player.position;
  const dx = cell.x - p.x;
  const dy = cell.y - p.y;
  if (Math.abs(dx) + Math.abs(dy) !== 1) return; // 인접 아니면 무시
  const direction: Direction =
    dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
  const prev = this.state;
  const next = executeAction(prev, { kind: 'move', direction });
  if (next === prev) return; // 이동 실패
  this.state = next;
  this.rerender();
}
```

- [ ] **Step 3: 개발 서버로 플레이 검증**

Run: `npm run dev`
Expected: 주인공 인접 칸 탭하면 주인공이 그 칸으로 이동 (출구 이동 가능).

- [ ] **Step 4: Commit**

```bash
git add gameidea/src/scenes/StageScene.ts
git commit -m "feat(ice-kingdom): tap-to-move input"
```

---

## Task 17: 입력 — 물 붓기 / 얼리기 / 녹이기

탭 대상에 따라 자동으로 행동 선택:
- 빈 floor + 주인공 인접 + 주인공이 물샘 인접 → 물 붓기
- 물 칸 + 주인공 인접 → 얼리기 방향 선택 팝업
- 얼음 칸 + 주인공 인접 → 녹이기 확인(즉시 실행)

**Files:**
- Modify: `gameidea/src/scenes/StageScene.ts`

- [ ] **Step 1: tryTap 확장 — 행동 분기 로직**

```typescript
// StageScene.tryTap 교체
private tryTap(cell: Position): void {
  const p = this.state.player.position;
  if (cell.x === p.x && cell.y === p.y) return; // 자기 칸 탭 무시

  const dx = cell.x - p.x;
  const dy = cell.y - p.y;
  const isAdjacent = Math.abs(dx) + Math.abs(dy) === 1;
  if (!isAdjacent) return;

  const obj = this.state.grid.getObject(cell.x, cell.y);
  const ground = this.state.grid.getGround(cell.x, cell.y);

  // 물 칸 탭 → 얼리기 방향 선택
  if (obj !== null && obj.type === 'water') {
    this.promptFreezeDirection(cell);
    return;
  }
  // 얼음 칸 탭 → 녹이기
  if (obj !== null && obj.type === 'ice') {
    this.applyAction({ kind: 'melt', target: cell });
    return;
  }
  // 빈 floor + 주인공이 물샘 인접 → 물 붓기
  if (obj === null && ground.type === 'floor' && this.playerIsNearSpring()) {
    this.applyAction({ kind: 'pour', target: cell });
    return;
  }
  // 그 외: 이동 시도
  const direction: Direction =
    dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up';
  this.applyAction({ kind: 'move', direction });
}

private playerIsNearSpring(): boolean {
  const { x, y } = this.state.player.position;
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (this.state.grid.inBounds(nx, ny) && this.state.grid.getGround(nx, ny).type === 'spring') {
      return true;
    }
  }
  return false;
}

private applyAction(action: ActionKind): void {
  const next = executeAction(this.state, action);
  if (next === this.state) return;
  this.state = next;
  this.rerender();
}
```

(import ActionKind from '../core/types')

- [ ] **Step 2: 얼리기 방향 팝업 UI 구현**

```typescript
// StageScene에 추가
import { DIRECTION_DELTA } from '../core/types';

private freezeArrows: Phaser.GameObjects.GameObject[] = [];

private promptFreezeDirection(target: Position): void {
  this.clearFreezeArrows();
  for (const dir of ['up', 'down', 'left', 'right'] as Direction[]) {
    const d = DIRECTION_DELTA[dir];
    const nx = target.x + d.dx;
    const ny = target.y + d.dy;
    if (!this.state.grid.inBounds(nx, ny)) continue;
    const px = this.originX + nx * TILE_SIZE + TILE_SIZE / 2;
    const py = this.originY + ny * TILE_SIZE + TILE_SIZE / 2;
    const arrow = this.add.text(px, py, '▶', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      color: '#ffffff',
    });
    arrow.setOrigin(0.5);
    arrow.setAngle({ right: 0, down: 90, left: 180, up: -90 }[dir]);
    arrow.setInteractive({ useHandCursor: true });
    arrow.on('pointerdown', (e: Phaser.Input.Pointer) => {
      e.event.stopPropagation();
      this.clearFreezeArrows();
      this.applyAction({ kind: 'freeze', target, direction: dir });
    });
    this.freezeArrows.push(arrow);
  }
}

private clearFreezeArrows(): void {
  for (const a of this.freezeArrows) a.destroy();
  this.freezeArrows.length = 0;
}
```

주의: `handleTap` 시작 부분에 `this.clearFreezeArrows();` 호출해서 팝업 상태에서 다른 탭 시 자동 해제.

- [ ] **Step 3: 개발 서버로 전 메커닉 플레이 검증**

Run: `npm run dev`

test-01 레벨로는 이동만 테스트 가능. Task 20에서 test-02~05 추가되면 본격 검증. 지금은 다음을 확인:
- 이동 정상
- 얼리기 팝업 화살표가 맵 위에 뜸 (물 타일이 있는 레벨이 아직 없어 직접 검증은 Task 20 이후)

- [ ] **Step 4: Commit**

```bash
git add gameidea/src/scenes/StageScene.ts
git commit -m "feat(ice-kingdom): tap-based action dispatch (pour, freeze, melt)"
```

---

## Task 18: HUD — Undo/재시작 버튼 + 카운터

**Files:**
- Create: `gameidea/src/ui/HUD.ts`
- Modify: `gameidea/src/scenes/StageScene.ts`

- [ ] **Step 1: HUD 클래스 작성**

```typescript
// src/ui/HUD.ts
import Phaser from 'phaser';

export interface HUDCallbacks {
  onUndo: () => void;
  onRestart: () => void;
}

export class HUD {
  private turnText!: Phaser.GameObjects.Text;
  private flowerText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private undoBtn!: Phaser.GameObjects.Text;
  private restartBtn!: Phaser.GameObjects.Text;

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

    this.restartBtn = this.makeButton(24, h - 48, '🔄 재시작', () => this.callbacks.onRestart());
    this.undoBtn = this.makeButton(w - 140, h - 48, '↶ Undo', () => this.callbacks.onUndo());
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

  update(opts: { levelId: string; turnCount: number; flowersCollected: number; flowersRequired: number }): void {
    this.stageText.setText(opts.levelId);
    this.turnText.setText(`Turn: ${opts.turnCount}`);
    this.flowerText.setText(`🌸 ${opts.flowersCollected} / ${opts.flowersRequired}`);
  }
}
```

- [ ] **Step 2: StageScene에 HUD + UndoStack 통합**

```typescript
// src/scenes/StageScene.ts 에 추가
import { HUD } from '../ui/HUD';
import { UndoStack } from '../core/UndoStack';

// 클래스 필드
private hud!: HUD;
private undoStack = new UndoStack();
private initialState!: GameState;

// create() 끝부분에 추가
this.initialState = this.state;
this.hud = new HUD(this, {
  onUndo: () => this.doUndo(),
  onRestart: () => this.doRestart(),
});
this.updateHUD();

// applyAction 수정: 액션 적용 전 스냅샷 push
private applyAction(action: ActionKind): void {
  const next = executeAction(this.state, action);
  if (next === this.state) return;
  this.undoStack.push(this.state);
  this.state = next;
  this.rerender();
  this.updateHUD();
  if (this.state.isWon) this.onStageCleared();
}

private doUndo(): void {
  const prev = this.undoStack.pop();
  if (prev === null) return;
  this.state = prev;
  this.rerender();
  this.updateHUD();
}

private doRestart(): void {
  this.undoStack.clear();
  this.state = this.initialState;
  this.rerender();
  this.updateHUD();
}

private updateHUD(): void {
  const id = LEVEL_PLAYLIST[this.levelIndex];
  this.hud.update({
    levelId: id,
    turnCount: this.state.turnCount,
    flowersCollected: this.state.flowersCollected,
    flowersRequired: this.state.flowersRequired,
  });
}

// 플레이스홀더 (Task 19에서 대체)
private onStageCleared(): void {
  console.log('Stage cleared!');
}
```

- [ ] **Step 3: 개발 서버 검증**

Run: `npm run dev`
Expected:
- 좌상단에 스테이지 ID
- 우상단에 Turn 카운터
- 하단 중앙에 🌸 카운터
- 좌하단 "🔄 재시작" 버튼, 우하단 "↶ Undo" 버튼
- 이동 시 Turn 증가
- Undo 시 주인공 이전 위치로 복귀
- 재시작 시 초기 위치로 복귀

- [ ] **Step 4: Commit**

```bash
git add gameidea/src/ui/HUD.ts gameidea/src/scenes/StageScene.ts
git commit -m "feat(ice-kingdom): HUD with undo, restart, flower/turn counters"
```

---

## Task 19: 스테이지 클리어 모달 + 다음 스테이지

**Files:**
- Modify: `gameidea/src/scenes/StageScene.ts`

- [ ] **Step 1: 클리어 모달 구현 — onStageCleared 교체**

```typescript
private onStageCleared(): void {
  const w = Number(this.game.config.width);
  const h = Number(this.game.config.height);

  const overlay = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
  overlay.setInteractive();

  const title = this.add.text(w / 2, h / 2 - 60, '✨ 스테이지 클리어!', {
    fontFamily: 'sans-serif',
    fontSize: '36px',
    color: '#ffffff',
  });
  title.setOrigin(0.5);

  const turnInfo = this.add.text(w / 2, h / 2, `${this.state.turnCount} 턴`, {
    fontFamily: 'sans-serif',
    fontSize: '24px',
    color: '#ffeaa7',
  });
  turnInfo.setOrigin(0.5);

  const isLast = this.levelIndex >= LEVEL_PLAYLIST.length - 1;
  const btnLabel = isLast ? '🌈 엔딩 보기' : '➡ 다음 스테이지';
  const nextBtn = this.add.text(w / 2, h / 2 + 60, btnLabel, {
    fontFamily: 'sans-serif',
    fontSize: '24px',
    color: '#ffffff',
    backgroundColor: '#2d7a99',
    padding: { left: 24, right: 24, top: 12, bottom: 12 },
  });
  nextBtn.setOrigin(0.5);
  nextBtn.setInteractive({ useHandCursor: true });
  nextBtn.on('pointerdown', (e: Phaser.Input.Pointer) => {
    e.event.stopPropagation();
    if (isLast) {
      this.showEnding();
    } else {
      this.scene.restart({ levelIndex: this.levelIndex + 1 });
    }
  });
}

private showEnding(): void {
  const w = Number(this.game.config.width);
  const h = Number(this.game.config.height);
  this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.9);
  this.add.text(w / 2, h / 2, '얼음왕국에 색이 돌아왔다.\n\n— MVP 끝 —', {
    fontFamily: 'sans-serif',
    fontSize: '28px',
    color: '#ffffff',
    align: 'center',
  }).setOrigin(0.5);
}
```

- [ ] **Step 2: 개발 서버 검증**

Run: `npm run dev`

test-01 에서 주인공을 출구 E로 이동 → 클리어 모달 → "다음 스테이지" → test-02 로드 (아직 파일 없어서 에러. Task 20에서 추가).

- [ ] **Step 3: Commit**

```bash
git add gameidea/src/scenes/StageScene.ts
git commit -m "feat(ice-kingdom): stage clear modal + next stage transition"
```

---

## Task 20: 테스트 레벨 5개 작성 + 통합 검증

Phase 0+1 MVP의 "플레이 가능한 데모" 완성. 각 레벨이 각 메커닉을 1개씩 데모.

**Files:**
- Modify: `gameidea/src/assets/levels/test-01.yaml` (이미 존재, 그대로 둠)
- Create: `gameidea/src/assets/levels/test-02.yaml`
- Create: `gameidea/src/assets/levels/test-03.yaml`
- Create: `gameidea/src/assets/levels/test-04.yaml`
- Create: `gameidea/src/assets/levels/test-05.yaml`

- [ ] **Step 1: test-02 — 물 붓기 + 얼리기 기본**

```yaml
# gameidea/src/assets/levels/test-02.yaml
id: "test-02"
name: "물 한 방울"
grid: |
  #######
  #S....#
  #.P..E#
  #R....#
  #######
required_flowers: 0
```

플레이 의도: 주인공 P가 물샘 S 인접(위쪽)에 있음. 오른쪽에 물 붓기 → 얼리기(방향 오른쪽) → 얼음 위로 미끄러져 E 도달. (사실 R은 장식. 장애물 없어도 탭 물 붓기 + 얼리기 학습 목표)

- [ ] **Step 2: test-03 — 꽃 수집 + 상자 밀기**

```yaml
# gameidea/src/assets/levels/test-03.yaml
id: "test-03"
name: "상자를 밀어"
grid: |
  ########
  #S.....#
  #.P.XFE#
  #......#
  ########
required_flowers: 1
```

플레이 의도: 상자 X가 꽃 F와 출구 사이를 막음. 주인공은 P → 오른쪽 `.` → 물 부음 → 얼리기(오른쪽)로 상자를 오른쪽으로 민다. 꽃 수집 후 출구.

- [ ] **Step 3: test-04 — 미끄러짐 + 녹이기**

```yaml
# gameidea/src/assets/levels/test-04.yaml
id: "test-04"
name: "얼음 빙판"
grid: |
  ##########
  #S.......#
  #.P....F.#
  #........#
  #.......E#
  ##########
required_flowers: 1
```

플레이 의도: 물 붓기 연쇄로 얼음 다리 만들어 F까지 가고, 필요 시 Undo 사용. 미끄러짐 체험.

- [ ] **Step 4: test-05 — 모닥불**

```yaml
# gameidea/src/assets/levels/test-05.yaml
id: "test-05"
name: "따스한 불"
grid: |
  ##########
  #S.......#
  #.P.....E#
  #...B...#
  #.....F..#
  ##########
required_flowers: 1
```

플레이 의도: 모닥불 B 주변에 얼음을 만들면 다음 턴에 자동 녹음. 주인공이 밟고 있는 얼음은 안 녹는다는 규칙을 응용해 건넌다.

- [ ] **Step 5: 전체 플레이 세션 수동 검증**

Run: `npm run dev`

수동 체크리스트:
- [ ] test-01: 출구 E 탭 이동 → 클리어
- [ ] test-02: 물샘 옆에서 물 붓고 얼리기 성공, 얼음 위 미끄러짐 발생
- [ ] test-03: 상자를 얼음 팽창으로 밀기 성공, 꽃 수집 → 출구
- [ ] test-04: 얼음 다리 만들고 되돌리기(녹이기/Undo) 시도해봄
- [ ] test-05: 모닥불 인접 얼음이 다음 턴에 자동 녹음, 주인공 밟은 얼음 안 녹음 확인
- [ ] 각 레벨에서 Undo/재시작 정상
- [ ] 마지막 test-05 클리어 시 엔딩 화면 표시

- [ ] **Step 6: 유닛 테스트 전체 통과 확인**

Run: `npm test`
Expected: 모든 테스트 GREEN.

- [ ] **Step 7: Commit**

```bash
git add gameidea/src/assets/levels/test-02.yaml gameidea/src/assets/levels/test-03.yaml gameidea/src/assets/levels/test-04.yaml gameidea/src/assets/levels/test-05.yaml
git commit -m "feat(ice-kingdom): 5 MVP test levels demonstrating all mechanics"
```

---

## Task 21: 플레이테스트 — 실제 태블릿 검증 (사용자 확인)

**Files:** (수정 없음 — 검증만)

- [ ] **Step 1: 빌드 생성**

Run: `npm run build`
Expected: `dist/` 폴더 생성, 오류 없음.

- [ ] **Step 2: 프리뷰 실행**

Run: `npm run preview`
Expected: 로컬 프리뷰 서버 실행됨 (기본 4173 포트).

- [ ] **Step 3: 태블릿에서 접속 검증**

같은 Wi-Fi의 태블릿 브라우저(Chrome/Safari)에서 `http://<PC-IP>:4173` 접속.

수동 체크리스트 (실제 태블릿):
- [ ] 터치로 이동 반응성 OK (탭 인식 지연 500ms 이하)
- [ ] 팝업 화살표 터치 타겟이 손가락으로 누를 수 있음
- [ ] Undo/재시작 버튼 터치 타겟 크기 OK
- [ ] 화면 회전 시 레이아웃 깨지지 않음 (Phaser Scale.FIT 동작)
- [ ] 모든 5 레벨 클리어 가능

- [ ] **Step 4: 이슈 있으면 수정 (없으면 이 스텝 스킵)**

발견된 이슈는 별도 커밋으로 처리.

- [ ] **Step 5: 최종 Commit (이슈 있을 때만)**

```bash
git add <수정된 파일들>
git commit -m "fix(ice-kingdom): tablet usability tweaks from playtest"
```

---

## 자체 검토 (Self-Review) 결과

### 1. 스펙 커버리지

| 스펙 요구 | 커버 태스크 |
|----------|-----------|
| 격자 턴제 퍼즐 기본 구조 | Task 3-5 |
| 물↔얼음 2상태 | Task 7-10 |
| 턴당 1행동: 이동/물붓기/얼리기/녹이기 | Task 5-10 |
| 얼리기 팽창: 물 1 → 얼음 2, 방향 선택 | Task 8 |
| 팽창 엣지 케이스 (벽·물체·주인공·물) | Task 9 |
| 얼음 미끄러짐 | Task 6 |
| 녹이기: head 물 복원 + tail 빈 칸 | Task 10 |
| 모닥불 자동 녹임 + 주인공 예외 | Task 11 |
| Undo 무제한 | Task 12, 18 |
| 재시작 | Task 18 |
| 꽃 수집 + 출구 승리 조건 | Task 11, 15 |
| 스테이지 로드 (YAML) | Task 13 |
| Phaser 기반 렌더링 | Task 14-15 |
| 태블릿 터치 입력 | Task 16-17, 21 |
| HUD | Task 18 |
| 스테이지 클리어 모달 | Task 19 |
| 로직/렌더 분리 원칙 | 전체 (core/ 는 Phaser 의존 없음) |
| 유닛 테스트 커버리지 | Task 3, 4, 5, 12, 13 |

### 커버되지 않는 스펙 요구 (의도적, 후속 플랜)

- 저울 (양팔·게이트·시소) → Ch2+ 플랜
- 바위 갈라짐 연출 → Phase 2 플랜 (이번 플랜에선 바위를 "밀 수 없는 장애물"로만 사용)
- 힌트 시스템 (3분 후 활성) → Phase 4 플랜
- 튜토리얼 말풍선 → Phase 4 플랜
- 챕터 선택 월드맵 → Phase 2 플랜
- 컷신 · 사운드 · 진짜 아트 → Phase 2~4 플랜
- 색 복원 연출 → Phase 4 플랜
- 접근성 (색맹 패턴, 폰트 등) → Phase 4 플랜
- localStorage 저장 → Phase 2 플랜

### 2. 플레이스홀더 스캔

- "TBD" / "TODO" / "fill in later" / "나중에 구현" 없음 확인.
- "적절한 에러 처리" 같은 모호 지시 없음. 모든 실패 케이스는 구체 반환 규칙(무효 행동은 상태 변화 없음)으로 명세됨.

### 3. 타입 일관성

- `Position`, `Direction`, `GroundCell`, `ObjectCell`, `ActionKind`, `PlayerState` 타입명 전체 일관.
- `executeAction(state, action) → GameState` 시그니처가 Task 5부터 Task 11까지 단일 불변 계약 유지.
- `Grid.clone()`, `GameState.clone()`, `GameState.withPatch()` 메서드명 모든 태스크에서 동일.
- `findIceGroup` 헬퍼는 Task 10에서 도입, Task 11에서 재사용.

### 4. 모호성 재확인

- "주인공이 밟고 있는 얼음은 녹지 않는다" — Task 10(melt 액션)과 Task 11(bonfire 자동) 양쪽에서 명시적 구현.
- "얼리기 실패 시 턴 소비 없음" — executeAction이 new state와 old state를 `===` 비교해 동일성으로 판단 (Task 11).
- "얼음 미끄러짐은 얼음이 끝난 비-얼음 floor에서 정지" — Task 6 while 루프로 명시.
- "주인공이 꽃 위로 이동 = 수집" — Task 11의 `collectFlowerAtPlayer`에서 이동 후 후처리로 명시.

---

## 실행 옵션

Plan complete and saved to `docs/superpowers/plans/2026-04-17-ice-kingdom-phase-0-1-core-mvp.md`.

두 가지 실행 방식 중 선택:

**1. Subagent-Driven (추천)** — 태스크마다 독립 서브에이전트 디스패치, 태스크 사이에 리뷰 체크포인트. 빠른 반복.

**2. Inline Execution** — 이 세션에서 직접 실행, 배치 단위 체크포인트로 진행.

어떤 방식으로 할까?
