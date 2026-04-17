# 워터 팩토리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초4-1학기 과학 2단원 "물의 상태 변화" 학습용 Phaser 웹게임을 MVP 수준으로 완성하고 OCI 서버 배포까지 가능한 상태로 만든다.

**Architecture:** Vite + TypeScript + Phaser 3 기반 싱글플레이 정적 웹게임. `GameState` 순수 로직 클래스에 게임 규칙을 격리하고 Phaser Scene은 렌더링·입력만 담당. 씬은 `BootScene → TitleScene → GameScene` 3단 구성, 게임오버는 GameScene 내부 오버레이. 에셋은 Kenney CC0 팩 기반.

**Tech Stack:** Phaser 3, TypeScript, Vite, vitest, Kenney CC0 스프라이트/사운드, nginx (서브경로 `/water-factory/`).

**Spec:** `docs/superpowers/specs/2026-04-17-water-factory-design.md`

**Project root:** `gamefolder/water-factory/` (기존 `gamefolder/물의상태변화_공장게임_브레인스토밍.txt`는 그대로 유지).

---

## 파일 구조 (최종 상태)

```
gamefolder/water-factory/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .gitignore
├── README.md                   # 빌드·배포 가이드
├── public/
│   └── assets/
│       ├── sprites/            # Kenney 발췌
│       ├── audio/              # Kenney 효과음
│       └── LICENSE.txt
├── src/
│   ├── main.ts                 # Phaser 부트스트랩
│   ├── config.ts               # 게임 상수 · 주문 6종 · 상태 타입
│   ├── scenes/
│   │   ├── BootScene.ts
│   │   ├── TitleScene.ts
│   │   └── GameScene.ts
│   ├── state/
│   │   └── GameState.ts        # 순수 로직 (테스트 대상)
│   ├── entities/
│   │   ├── Cauldron.ts         # 중앙 가마솥 + 변환 애니
│   │   └── OrderBoard.ts       # 좌측 주문판
│   └── ui/
│       ├── ControlPanel.ts     # 🔥/❄️/📦 버튼
│       ├── HUD.ts              # 점수·목숨·타이머·사운드 토글
│       └── GameOverOverlay.ts
└── tests/
    └── state/
        └── GameState.test.ts
```

**책임 분리 원칙**
- `GameState`: Phaser 의존성 0. 게임 규칙(점수·전이·판정·시간)만. 단위 테스트 대상.
- `entities/*`: Phaser `GameObject` 상속 또는 wrapping. 시각 표현 + 내부 애니메이션 상태.
- `ui/*`: 입력(버튼 탭) + 상태 표시 갱신.
- `scenes/GameScene`: 위 3개를 조립, `GameState` 호출, 이벤트 라우팅.

---

## Task 1: 프로젝트 초기화 (Vite + Phaser + TS + vitest)

**Files:**
- Create: `gamefolder/water-factory/package.json`
- Create: `gamefolder/water-factory/vite.config.ts`
- Create: `gamefolder/water-factory/tsconfig.json`
- Create: `gamefolder/water-factory/vitest.config.ts`
- Create: `gamefolder/water-factory/index.html`
- Create: `gamefolder/water-factory/.gitignore`
- Create: `gamefolder/water-factory/src/main.ts`

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "water-factory",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: vite.config.ts 작성 (서브경로 필수)**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/water-factory/',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
```

- [ ] **Step 3: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: vitest.config.ts 작성**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
});
```

- [ ] **Step 5: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>워터 팩토리</title>
    <style>
      html, body { margin: 0; padding: 0; background: #000; overflow: hidden; }
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
node_modules
dist
.DS_Store
*.log
```

- [ ] **Step 7: src/main.ts 최소 부팅**

```ts
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  pixelArt: true,
  backgroundColor: '#222034',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    {
      key: 'Empty',
      create(this: Phaser.Scene) {
        this.add.text(640, 360, '워터 팩토리', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
      }
    }
  ]
};

new Phaser.Game(config);
```

- [ ] **Step 8: 의존성 설치**

```bash
cd gamefolder/water-factory && npm install
```

Expected: `node_modules/` 생성, 에러 없음.

- [ ] **Step 9: dev 서버 기동 확인**

```bash
cd gamefolder/water-factory && npm run dev
```

Expected: `http://localhost:5173/water-factory/` 접속 시 검정 배경 위 "워터 팩토리" 텍스트. 서버는 Ctrl+C로 종료.

- [ ] **Step 10: 빌드 검증**

```bash
cd gamefolder/water-factory && npm run build
```

Expected: `dist/` 생성, 내부 `index.html`의 자산 경로가 `/water-factory/assets/...` 형태.

- [ ] **Step 11: 커밋**

```bash
git add gamefolder/water-factory/
git commit -m "feat(water-factory): Vite+Phaser+TS 프로젝트 초기화"
```

---

## Task 2: 게임 상수 및 주문 정의 (config.ts)

**Files:**
- Create: `gamefolder/water-factory/src/config.ts`

- [ ] **Step 1: config.ts 작성**

```ts
export type WaterState = 'solid' | 'liquid' | 'gas';

export interface Order {
  id: string;
  name: string;
  emoji: string;
  target: WaterState;
}

export const ORDERS: readonly Order[] = [
  { id: 'ice_cream',       name: '아이스크림',     emoji: '🍦', target: 'solid'  },
  { id: 'ice_cube',        name: '얼음 큐브',       emoji: '🧊', target: 'solid'  },
  { id: 'aquarium_water',  name: '수족관 물',       emoji: '🐟', target: 'liquid' },
  { id: 'cold_drink',      name: '시원한 음료수',   emoji: '🥤', target: 'liquid' },
  { id: 'humidifier_vapor',name: '가습기 수증기',   emoji: '💨', target: 'gas'    },
  { id: 'sauna_steam',     name: '찜질방 스팀',     emoji: '♨️', target: 'gas'    }
] as const;

export const RULES = {
  INITIAL_LIVES: 5,
  INITIAL_TIME_MS: 10_000,
  MIN_TIME_MS: 4_000,
  TIME_STEP_MS: 500,
  TIME_STEP_EVERY_SCORE: 200,
  BASE_CORRECT_POINTS: 100,
  TIME_BONUS_PER_SECOND: 10,
  TRANSITION_MS: 500
} as const;

export const STATE_ORDER: WaterState[] = ['solid', 'liquid', 'gas'];

export type TransitionName = '녹음' | '끓음' | '응결' | '얼음';

export interface TransitionPopup {
  title: string;
  subtitle: string;
}

export function getTransitionPopup(from: WaterState, to: WaterState): TransitionPopup | null {
  if (from === 'solid'  && to === 'liquid') return { title: '녹음 성공!',   subtitle: '얼음 → 물' };
  if (from === 'liquid' && to === 'gas')    return { title: '끓음 성공!',   subtitle: '물 → 수증기' };
  if (from === 'gas'    && to === 'liquid') return { title: '응결 성공!',   subtitle: '수증기 → 물' };
  if (from === 'liquid' && to === 'solid')  return { title: '얼음 완성!',   subtitle: '물이 얼었어요' };
  return null;
}
```

- [ ] **Step 2: 타입 체크**

```bash
cd gamefolder/water-factory && npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add gamefolder/water-factory/src/config.ts
git commit -m "feat(water-factory): 게임 상수 및 주문 6종 정의"
```

---

## Task 3: GameState 순수 로직 (TDD)

`GameState`는 Phaser 의존성 없이 게임 규칙만 구현. 모든 단위 테스트가 여기서 돌아감.

**Files:**
- Create: `gamefolder/water-factory/src/state/GameState.ts`
- Create: `gamefolder/water-factory/tests/state/GameState.test.ts`

### 3.1 초기화 테스트

- [ ] **Step 1: 실패 테스트 작성**

파일: `tests/state/GameState.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/state/GameState';
import { RULES } from '../../src/config';

describe('GameState 초기화', () => {
  it('기본 상태는 점수 0, 목숨 5, 활성 주문 없음', () => {
    const g = new GameState(() => 0);
    expect(g.score).toBe(0);
    expect(g.lives).toBe(RULES.INITIAL_LIVES);
    expect(g.currentOrder).toBeNull();
    expect(g.completedCount).toBe(0);
    expect(g.isGameOver()).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
cd gamefolder/water-factory && npm test
```

Expected: FAIL — `Cannot find module '../../src/state/GameState'`.

- [ ] **Step 3: 최소 구현**

파일: `src/state/GameState.ts`

```ts
import { RULES, type Order, type WaterState } from '../config';

export type RandomFn = () => number;

export class GameState {
  score = 0;
  lives = RULES.INITIAL_LIVES;
  currentOrder: Order | null = null;
  currentCauldronState: WaterState = 'liquid';
  remainingMs = RULES.INITIAL_TIME_MS;
  completedCount = 0;
  private readonly rng: RandomFn;

  constructor(rng: RandomFn = Math.random) {
    this.rng = rng;
  }

  isGameOver(): boolean {
    return this.lives <= 0;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
cd gamefolder/water-factory && npm test
```

Expected: PASS.

### 3.2 주문 생성 테스트

- [ ] **Step 5: 실패 테스트 추가**

`tests/state/GameState.test.ts`에 추가:

```ts
import { ORDERS, STATE_ORDER } from '../../src/config';

describe('startNewOrder', () => {
  it('RNG 0이면 ORDERS[0], 가마솥 상태는 STATE_ORDER[0]', () => {
    const rng = sequence(0, 0);
    const g = new GameState(rng);
    g.startNewOrder();
    expect(g.currentOrder).toEqual(ORDERS[0]);
    expect(g.currentCauldronState).toBe(STATE_ORDER[0]);
    expect(g.remainingMs).toBe(10_000);
  });

  it('RNG 0.99면 마지막 주문, 마지막 상태', () => {
    const rng = sequence(0.99, 0.99);
    const g = new GameState(rng);
    g.startNewOrder();
    expect(g.currentOrder).toEqual(ORDERS[ORDERS.length - 1]);
    expect(g.currentCauldronState).toBe(STATE_ORDER[STATE_ORDER.length - 1]);
  });
});

function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}
```

- [ ] **Step 6: 실패 확인**

```bash
npm test
```

Expected: FAIL.

- [ ] **Step 7: 구현**

`src/state/GameState.ts`에 추가 및 수정:

```ts
import { ORDERS, RULES, STATE_ORDER, type Order, type WaterState } from '../config';

export class GameState {
  // ... (기존)

  startNewOrder(): void {
    const orderIdx = Math.floor(this.rng() * ORDERS.length);
    const stateIdx = Math.floor(this.rng() * STATE_ORDER.length);
    this.currentOrder = ORDERS[orderIdx];
    this.currentCauldronState = STATE_ORDER[stateIdx];
    this.remainingMs = this.computeTimeLimit();
  }

  private computeTimeLimit(): number {
    const steps = Math.floor(this.score / RULES.TIME_STEP_EVERY_SCORE);
    const reduced = RULES.INITIAL_TIME_MS - steps * RULES.TIME_STEP_MS;
    return Math.max(RULES.MIN_TIME_MS, reduced);
  }
}
```

- [ ] **Step 8: 통과 확인**

```bash
npm test
```

Expected: PASS.

### 3.3 상태 전이 테스트

- [ ] **Step 9: 실패 테스트**

```ts
describe('applyHeat / applyCool', () => {
  it('applyHeat: solid → liquid → gas, gas에서 멈춤', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = 'solid';
    expect(g.applyHeat()).toEqual({ from: 'solid', to: 'liquid' });
    expect(g.currentCauldronState).toBe('liquid');
    expect(g.applyHeat()).toEqual({ from: 'liquid', to: 'gas' });
    expect(g.applyHeat()).toBeNull();
    expect(g.currentCauldronState).toBe('gas');
  });

  it('applyCool: gas → liquid → solid, solid에서 멈춤', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = 'gas';
    expect(g.applyCool()).toEqual({ from: 'gas', to: 'liquid' });
    expect(g.applyCool()).toEqual({ from: 'liquid', to: 'solid' });
    expect(g.applyCool()).toBeNull();
  });
});
```

- [ ] **Step 10: 실패 확인 + 구현 + 통과 확인**

`src/state/GameState.ts`에 추가:

```ts
export interface Transition {
  from: WaterState;
  to: WaterState;
}

// 안에:
applyHeat(): Transition | null {
  return this.shiftState(+1);
}

applyCool(): Transition | null {
  return this.shiftState(-1);
}

private shiftState(delta: number): Transition | null {
  const from = this.currentCauldronState;
  const idx = STATE_ORDER.indexOf(from);
  const next = idx + delta;
  if (next < 0 || next >= STATE_ORDER.length) return null;
  const to = STATE_ORDER[next];
  this.currentCauldronState = to;
  return { from, to };
}
```

Run `npm test`, expect PASS.

### 3.4 출하 판정 테스트

- [ ] **Step 11: 실패 테스트**

```ts
describe('ship', () => {
  it('정답: 기본 100 + 남은 초 * 10, 완수 카운트 증가', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = g.currentOrder!.target;
    g.remainingMs = 7_300; // 남은 7.3초
    const result = g.ship();
    expect(result.correct).toBe(true);
    expect(result.points).toBe(100 + 7 * 10);
    expect(g.score).toBe(170);
    expect(g.completedCount).toBe(1);
    expect(g.lives).toBe(5);
  });

  it('오답: 목숨 -1, 점수 변화 없음', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.currentCauldronState = 'solid';
    const orderTarget = g.currentOrder!.target;
    if (orderTarget === 'solid') g.currentCauldronState = 'gas';
    const result = g.ship();
    expect(result.correct).toBe(false);
    expect(result.points).toBe(0);
    expect(g.lives).toBe(4);
  });
});
```

- [ ] **Step 12: 실패 확인 + 구현 + 통과**

`src/state/GameState.ts`:

```ts
export interface ShipResult {
  correct: boolean;
  points: number;
  targetState: WaterState;
  actualState: WaterState;
}

ship(): ShipResult {
  if (!this.currentOrder) throw new Error('No active order');
  const target = this.currentOrder.target;
  const actual = this.currentCauldronState;
  const correct = target === actual;
  let points = 0;
  if (correct) {
    const remainingSec = Math.floor(this.remainingMs / 1000);
    points = RULES.BASE_CORRECT_POINTS + remainingSec * RULES.TIME_BONUS_PER_SECOND;
    this.score += points;
    this.completedCount += 1;
  } else {
    this.lives -= 1;
  }
  return { correct, points, targetState: target, actualState: actual };
}
```

Run `npm test`, expect PASS.

### 3.5 Tick 시간 감소 & 시간초과

- [ ] **Step 13: 실패 테스트**

```ts
describe('tick / 시간초과', () => {
  it('tick(1000)은 remainingMs를 1000 감소', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.tick(1000);
    expect(g.remainingMs).toBe(9_000);
  });

  it('remainingMs가 0 이하로 가면 timedOut=true, 목숨 -1', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    const result = g.tick(11_000);
    expect(result.timedOut).toBe(true);
    expect(g.lives).toBe(4);
    expect(g.remainingMs).toBe(0);
  });

  it('timedOut이 한 번 발생 후 다시 tick해도 목숨 더 안 줄어듦', () => {
    const g = new GameState(() => 0);
    g.startNewOrder();
    g.tick(11_000);
    g.tick(5_000);
    expect(g.lives).toBe(4);
  });
});
```

- [ ] **Step 14: 구현 + 통과**

```ts
export interface TickResult {
  timedOut: boolean;
}

tick(deltaMs: number): TickResult {
  if (this.remainingMs <= 0) return { timedOut: false };
  this.remainingMs -= deltaMs;
  if (this.remainingMs <= 0) {
    this.remainingMs = 0;
    this.lives -= 1;
    return { timedOut: true };
  }
  return { timedOut: false };
}
```

### 3.6 난이도 상승 (시간 감소)

- [ ] **Step 15: 테스트**

```ts
describe('난이도 상승', () => {
  it('점수 200점 넘기면 다음 주문 제한시간 9.5초', () => {
    const g = new GameState(() => 0);
    g.score = 200;
    g.startNewOrder();
    expect(g.remainingMs).toBe(9_500);
  });

  it('점수 2000점이어도 최소 4초는 보장', () => {
    const g = new GameState(() => 0);
    g.score = 99_999;
    g.startNewOrder();
    expect(g.remainingMs).toBe(4_000);
  });
});
```

- [ ] **Step 16: 확인**

Run `npm test`. Expected: PASS (이미 Step 7에서 `computeTimeLimit()` 구현됨).

- [ ] **Step 17: 커밋**

```bash
cd gamefolder/water-factory
git add src/state/GameState.ts tests/state/GameState.test.ts src/config.ts
git commit -m "feat(water-factory): GameState 순수 로직 + 단위 테스트"
```

---

## Task 4: BootScene + 플레이스홀더 에셋

에셋은 Kenney 다운로드 전까지 단색 사각형/텍스트로 대체. 먼저 구조를 만들고 Task 13에서 실제 스프라이트로 교체.

**Files:**
- Create: `gamefolder/water-factory/src/scenes/BootScene.ts`
- Modify: `gamefolder/water-factory/src/main.ts`

- [ ] **Step 1: BootScene 작성**

```ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload(): void {
    this.createPlaceholderTextures();
  }

  create(): void {
    const highScore = Number(localStorage.getItem('waterFactory.highScore') ?? 0);
    this.registry.set('highScore', highScore);
    this.registry.set('soundEnabled', false);
    this.scene.start('TitleScene');
  }

  private createPlaceholderTextures(): void {
    const gfx = this.make.graphics({ x: 0, y: 0 }, false);
    const rect = (key: string, w: number, h: number, color: number) => {
      gfx.clear();
      gfx.fillStyle(color, 1);
      gfx.fillRect(0, 0, w, h);
      gfx.generateTexture(key, w, h);
    };
    rect('bg_wall',    1280, 720, 0x3c3c4a);
    rect('cauldron',    200, 180, 0x8a8a9a);
    rect('ice_cube',    120, 100, 0xa0e4ff);
    rect('water_body',  120, 100, 0x3a7bd5);
    rect('steam_body',  120, 100, 0xe6e6ff);
    rect('btn_heat',    120,  80, 0xd33a3a);
    rect('btn_cool',    120,  80, 0x3a8dd3);
    rect('btn_ship',    120,  80, 0x3ad36d);
    rect('order_card',  240, 280, 0xf7e7b8);
    gfx.destroy();
  }
}
```

- [ ] **Step 2: main.ts 수정**

```ts
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  pixelArt: true,
  backgroundColor: '#222034',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene]
};

new Phaser.Game(config);
```

- [ ] **Step 3: dev 서버 확인**

```bash
npm run dev
```

Expected: `TitleScene`이 아직 없어서 콘솔에 "Scene not found" 경고. 다음 Task에서 추가.

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/BootScene.ts src/main.ts
git commit -m "feat(water-factory): BootScene + 플레이스홀더 텍스처"
```

---

## Task 5: TitleScene (3슬라이드 + 시작)

**Files:**
- Create: `gamefolder/water-factory/src/scenes/TitleScene.ts`
- Modify: `gamefolder/water-factory/src/main.ts` (scene 배열에 추가)

- [ ] **Step 1: TitleScene 작성**

```ts
import Phaser from 'phaser';

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
    this.add.text(640, 680, `🏆 최고 점수: ${highScore}`, {
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
```

- [ ] **Step 2: main.ts에 TitleScene 등록**

```ts
import { TitleScene } from './scenes/TitleScene';

// scene 배열에:
scene: [BootScene, TitleScene]
```

- [ ] **Step 3: dev 서버에서 수동 확인**

```bash
npm run dev
```

브라우저에서:
- [ ] 타이틀 3슬라이드가 보임
- [ ] [▶ 다음]/[▶ 시작] 버튼이 슬라이드 순서대로 변함
- [ ] [건너뛰기] 탭 시 GameScene 로드 시도 (아직 씬 없음 → 콘솔 경고 OK)
- [ ] 최고 점수 0 표시됨

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/TitleScene.ts src/main.ts
git commit -m "feat(water-factory): TitleScene 3슬라이드 + 최고점수 표시"
```

---

## Task 6: Cauldron 엔티티 + 상태 변환 팝업

**Files:**
- Create: `gamefolder/water-factory/src/entities/Cauldron.ts`

- [ ] **Step 1: Cauldron 클래스 작성**

```ts
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
    this.cauldron = scene.add.image(x, y, 'cauldron');
    this.contents = scene.add.image(x, y - 40, STATE_TEXTURE[initialState]);
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
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/entities/Cauldron.ts
git commit -m "feat(water-factory): Cauldron 엔티티 + 상태변화 팝업"
```

---

## Task 7: OrderBoard 엔티티

**Files:**
- Create: `gamefolder/water-factory/src/entities/OrderBoard.ts`

- [ ] **Step 1: OrderBoard 작성**

```ts
import Phaser from 'phaser';
import type { Order } from '../config';

export class OrderBoard {
  private readonly scene: Phaser.Scene;
  private readonly card: Phaser.GameObjects.Image;
  private readonly emoji: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly caption: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.card = scene.add.image(x, y, 'order_card');
    this.caption = scene.add.text(x, y - 110, '오늘의 주문', {
      fontSize: '22px', color: '#4a3a10', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.emoji = scene.add.text(x, y - 30, '', {
      fontSize: '96px'
    }).setOrigin(0.5);
    this.title = scene.add.text(x, y + 80, '', {
      fontSize: '28px', color: '#333333', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5);
  }

  setOrder(order: Order | null): void {
    if (!order) {
      this.emoji.setText('');
      this.title.setText('');
      return;
    }
    this.emoji.setText(order.emoji);
    this.title.setText(order.name);
  }
}
```

- [ ] **Step 2: 타입 체크 + 커밋**

```bash
npx tsc --noEmit
git add src/entities/OrderBoard.ts
git commit -m "feat(water-factory): OrderBoard 엔티티"
```

---

## Task 8: ControlPanel UI (버튼 3개)

**Files:**
- Create: `gamefolder/water-factory/src/ui/ControlPanel.ts`

- [ ] **Step 1: ControlPanel 작성**

```ts
import Phaser from 'phaser';
import type { WaterState } from '../config';

export interface ControlPanelHandlers {
  onHeat: () => void;
  onCool: () => void;
  onShip: () => void;
}

export class ControlPanel {
  private readonly scene: Phaser.Scene;
  private readonly heatBtn: Phaser.GameObjects.Container;
  private readonly coolBtn: Phaser.GameObjects.Container;
  private readonly shipBtn: Phaser.GameObjects.Container;
  private allEnabled = true;

  constructor(scene: Phaser.Scene, centerX: number, y: number, handlers: ControlPanelHandlers) {
    this.scene = scene;
    this.heatBtn = this.makeButton(centerX - 160, y, 'btn_heat', '🔥', handlers.onHeat);
    this.coolBtn = this.makeButton(centerX,       y, 'btn_cool', '❄️', handlers.onCool);
    this.shipBtn = this.makeButton(centerX + 160, y, 'btn_ship', '📦', handlers.onShip);
  }

  private makeButton(x: number, y: number, texture: string, label: string, onTap: () => void): Phaser.GameObjects.Container {
    const bg = this.scene.add.image(0, 0, texture);
    const txt = this.scene.add.text(0, 0, label, { fontSize: '40px' }).setOrigin(0.5);
    const c = this.scene.add.container(x, y, [bg, txt]).setSize(bg.width, bg.height);
    c.setInteractive(new Phaser.Geom.Rectangle(-bg.width / 2, -bg.height / 2, bg.width, bg.height), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => {
      if (!this.allEnabled) {
        this.shake(c);
        return;
      }
      if (c.getData('disabled')) {
        this.shake(c);
        return;
      }
      onTap();
    });
    return c;
  }

  private shake(c: Phaser.GameObjects.Container): void {
    this.scene.tweens.add({
      targets: c,
      x: { from: c.x - 5, to: c.x },
      duration: 80,
      yoyo: true,
      repeat: 1
    });
  }

  setBoundariesForState(state: WaterState): void {
    this.setButtonDisabled(this.heatBtn, state === 'gas');
    this.setButtonDisabled(this.coolBtn, state === 'solid');
  }

  private setButtonDisabled(c: Phaser.GameObjects.Container, disabled: boolean): void {
    c.setData('disabled', disabled);
    c.setAlpha(disabled ? 0.4 : 1);
  }

  setAllEnabled(enabled: boolean): void {
    this.allEnabled = enabled;
    [this.heatBtn, this.coolBtn, this.shipBtn].forEach(c => {
      if (!enabled) c.setAlpha(0.4);
      else {
        const disabled = c.getData('disabled') === true;
        c.setAlpha(disabled ? 0.4 : 1);
      }
    });
  }
}
```

- [ ] **Step 2: 타입 체크 + 커밋**

```bash
npx tsc --noEmit
git add src/ui/ControlPanel.ts
git commit -m "feat(water-factory): ControlPanel 버튼 UI (경계 비활성 + 흔들림)"
```

---

## Task 9: HUD UI (점수/목숨/타이머/사운드)

**Files:**
- Create: `gamefolder/water-factory/src/ui/HUD.ts`

- [ ] **Step 1: HUD 작성**

```ts
import Phaser from 'phaser';

export class HUD {
  private readonly scene: Phaser.Scene;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly livesText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly soundBtn: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onToggleSound: () => void) {
    this.scene = scene;
    this.scoreText = scene.add.text(40, 30, '점수: 0', {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    });
    this.livesText = scene.add.text(640, 30, '❤️❤️❤️❤️❤️', {
      fontSize: '32px'
    }).setOrigin(0.5, 0);
    this.timerText = scene.add.text(1240, 30, '⏱ 10.0s', {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.soundBtn = scene.add.text(1240, 70, '🔇', {
      fontSize: '28px'
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', onToggleSound);
  }

  update(score: number, lives: number, remainingMs: number, soundEnabled: boolean): void {
    this.scoreText.setText(`점수: ${score}`);
    this.livesText.setText('❤️'.repeat(Math.max(0, lives)));
    this.timerText.setText(`⏱ ${(remainingMs / 1000).toFixed(1)}s`);
    const warning = remainingMs < 3000;
    this.timerText.setColor(warning ? '#ff5050' : '#ffffff');
    this.soundBtn.setText(soundEnabled ? '🔊' : '🔇');
  }
}
```

- [ ] **Step 2: 타입 체크 + 커밋**

```bash
npx tsc --noEmit
git add src/ui/HUD.ts
git commit -m "feat(water-factory): HUD 점수·목숨·타이머·사운드 토글"
```

---

## Task 10: GameScene 통합 루프

**Files:**
- Create: `gamefolder/water-factory/src/scenes/GameScene.ts`
- Modify: `gamefolder/water-factory/src/main.ts`

- [ ] **Step 1: GameScene 작성**

```ts
import Phaser from 'phaser';
import { GameState } from '../state/GameState';
import { Cauldron } from '../entities/Cauldron';
import { OrderBoard } from '../entities/OrderBoard';
import { ControlPanel } from '../ui/ControlPanel';
import { HUD } from '../ui/HUD';

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
    // Task 11에서 구현
    console.log('GAME OVER', { score: this.gameState.score, completed: this.gameState.completedCount });
  }

  private refreshOrderView(): void {
    this.orderBoard.setOrder(this.gameState.currentOrder);
  }

  private refreshControlsBoundaries(): void {
    this.controls.setBoundariesForState(this.gameState.currentCauldronState);
  }

  private toggleSound(): void {
    const cur = this.registry.get('soundEnabled') as boolean;
    this.registry.set('soundEnabled', !cur);
  }
}
```

- [ ] **Step 2: main.ts 업데이트**

`scene` 배열에 추가:

```ts
import { GameScene } from './scenes/GameScene';
// ...
scene: [BootScene, TitleScene, GameScene]
```

- [ ] **Step 3: 수동 테스트**

```bash
npm run dev
```

브라우저에서:
- [ ] 타이틀 → 게임 진입
- [ ] 주문 카드 좌측 표시, 가마솥 중앙 표시
- [ ] 🔥/❄️ 버튼으로 상태 변환, 경계(고체+❄️ / 기체+🔥) 시 비활성 + 흔들림
- [ ] 📦 버튼으로 출하: 정답 시 점수 상승, 오답 시 목숨 감소
- [ ] 타이머가 10초에서 감소, 만료 시 목숨 감소
- [ ] 목숨 0 → 콘솔에 `GAME OVER` 로그 + 버튼 비활성
- [ ] 상태 변화 시 "녹음/끓음/응결/얼음" 팝업 노출

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/GameScene.ts src/main.ts
git commit -m "feat(water-factory): GameScene 플레이 루프 통합"
```

---

## Task 11: GameOverOverlay + 알람 연출

**Files:**
- Create: `gamefolder/water-factory/src/ui/GameOverOverlay.ts`
- Modify: `gamefolder/water-factory/src/scenes/GameScene.ts` (triggerGameOver 채우기)

- [ ] **Step 1: GameOverOverlay 작성**

```ts
import Phaser from 'phaser';

export interface GameOverData {
  score: number;
  completedCount: number;
  highScore: number;
  newRecord: boolean;
}

export class GameOverOverlay {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, data: GameOverData, onRestart: () => void) {
    this.scene = scene;
    const bg = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.75);
    const panel = scene.add.rectangle(640, 360, 600, 480, 0x2b2b3a)
      .setStrokeStyle(4, 0xffe66d);

    const title = scene.add.text(640, 170, 'GAME OVER', {
      fontSize: '56px', color: '#ff5050', fontStyle: 'bold'
    }).setOrigin(0.5);

    const scoreText = scene.add.text(640, 260, `최종 점수: ${data.score}`, {
      fontSize: '36px', color: '#ffffff'
    }).setOrigin(0.5);
    const completedText = scene.add.text(640, 310, `완수 주문: ${data.completedCount}건`, {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5);

    const highScoreText = scene.add.text(640, 390, `🏆 최고 점수: ${data.highScore}`, {
      fontSize: '28px', color: '#ffe66d'
    }).setOrigin(0.5);

    const items: Phaser.GameObjects.GameObject[] = [bg, panel, title, scoreText, completedText, highScoreText];

    if (data.newRecord) {
      const rec = scene.add.text(640, 440, '🎉 NEW RECORD! 🎉', {
        fontSize: '32px', color: '#3ad36d', fontStyle: 'bold'
      }).setOrigin(0.5);
      items.push(rec);
    }

    const restart = scene.add.text(640, 540, '🔁 다시하기', {
      fontSize: '36px', color: '#222034',
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
```

- [ ] **Step 2: GameScene.triggerGameOver 구현 (교체)**

`src/scenes/GameScene.ts`의 `triggerGameOver()` 본문을 교체:

```ts
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

  new GameOverOverlay(this, {
    score: this.gameState.score,
    completedCount: this.gameState.completedCount,
    highScore: newHigh,
    newRecord: isNewRecord
  }, () => this.scene.restart());
}
```

상단에 import 추가:

```ts
import { GameOverOverlay } from '../ui/GameOverOverlay';
```

- [ ] **Step 3: 수동 테스트**

```bash
npm run dev
```

- [ ] 목숨 5번 잃고 GAME OVER 도달
- [ ] 붉은 화면 깜빡임 (1초) 후 오버레이 노출
- [ ] 점수/완수 주문/최고 점수 표시
- [ ] 기존 최고 점수 초과 시 NEW RECORD 뱃지
- [ ] [🔁 다시하기] 탭 → 점수/목숨 초기화되어 재시작
- [ ] 페이지 새로고침 후 타이틀 최고 점수 유지

- [ ] **Step 4: 커밋**

```bash
git add src/ui/GameOverOverlay.ts src/scenes/GameScene.ts
git commit -m "feat(water-factory): 게임오버 알람 연출 + 오버레이 + localStorage"
```

---

## Task 12: 세로모드 안내

**Files:**
- Modify: `gamefolder/water-factory/src/main.ts`
- Create: `gamefolder/water-factory/src/ui/OrientationGuard.ts`

- [ ] **Step 1: OrientationGuard 작성**

```ts
export function mountOrientationGuard(): void {
  const guard = document.createElement('div');
  guard.id = 'orientation-guard';
  guard.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: #1a1a2a; color: #fff;
    display: none;
    flex-direction: column; align-items: center; justify-content: center;
    font-family: sans-serif; text-align: center; padding: 40px;
  `;
  guard.innerHTML = `
    <div style="font-size: 72px; margin-bottom: 20px;">📱 ↻</div>
    <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">가로로 돌려주세요</div>
    <div style="font-size: 18px; color: #bbb;">이 게임은 가로 모드에서만 즐길 수 있어요.</div>
  `;
  document.body.appendChild(guard);

  const evaluate = () => {
    const portrait = window.innerHeight > window.innerWidth;
    guard.style.display = portrait ? 'flex' : 'none';
  };
  evaluate();
  window.addEventListener('resize', evaluate);
  window.addEventListener('orientationchange', evaluate);
}
```

- [ ] **Step 2: main.ts에서 호출**

```ts
import { mountOrientationGuard } from './ui/OrientationGuard';

mountOrientationGuard();
new Phaser.Game(config);
```

- [ ] **Step 3: 수동 테스트**

- [ ] 브라우저 창을 세로로 좁히면 안내 화면 표시
- [ ] 다시 넓히면 게임으로 돌아옴
- [ ] 모바일 DevTools에서 세로/가로 전환 확인

- [ ] **Step 4: 커밋**

```bash
git add src/ui/OrientationGuard.ts src/main.ts
git commit -m "feat(water-factory): 세로모드 진입 시 가로 전환 안내"
```

---

## Task 13: Kenney 에셋 통합

이 Task는 **사용자(선생님) 승인이 필요한 지점**이 있음. 후보 팩 제시 → 승인 → 다운로드 순으로 진행.

**Files:**
- Modify: `gamefolder/water-factory/public/assets/sprites/*` (새 파일들)
- Modify: `gamefolder/water-factory/public/assets/LICENSE.txt`
- Modify: `gamefolder/water-factory/src/scenes/BootScene.ts` (실제 이미지 로드)
- Modify: `gamefolder/water-factory/src/entities/Cauldron.ts` (텍스처 키 교체 시)

- [ ] **Step 1: Kenney 팩 후보 2~3개를 선생님께 제시**

대화 예시:
```
다음 Kenney 팩들이 워터 팩토리에 적합해 보입니다:
1. https://kenney.nl/assets/pixel-platformer-industrial (공장/기계/파이프)
2. https://kenney.nl/assets/ui-pack-rpg-expansion (UI 버튼)
3. https://kenney.nl/assets/interface-sounds (효과음)

링크 확인하시고 사용 승인 부탁드려요.
```

- [ ] **Step 2: 승인 후 zip 다운로드 (예시 URL — 실제 Kenney 페이지에서 확인한 URL로 대체)**

```bash
mkdir -p gamefolder/water-factory/public/assets/_downloads
cd gamefolder/water-factory/public/assets/_downloads
curl -L -o pixel-platformer-industrial.zip "<Kenney 페이지에서 확인한 직링크>"
curl -L -o ui-pack-rpg-expansion.zip "<직링크>"
curl -L -o interface-sounds.zip "<직링크>"
```

- [ ] **Step 3: 압축 해제 & 필요한 것만 추출**

```bash
cd gamefolder/water-factory/public/assets/_downloads
unzip -q pixel-platformer-industrial.zip -d pixel-platformer-industrial
unzip -q ui-pack-rpg-expansion.zip -d ui-pack-rpg-expansion
unzip -q interface-sounds.zip -d interface-sounds
```

사용할 스프라이트를 `public/assets/sprites/`로 복사:
- `bg_wall.png` — 공장 벽/바닥 타일
- `cauldron.png` — 가마솥 대체품(드럼통/통)
- `ice.png`, `water.png`, `steam.png` — 상태별 내용물
- `btn_heat.png`, `btn_cool.png`, `btn_ship.png` — UI 버튼
- `order_card.png` — 주문판 배경

(구체 파일명은 팩 내용에 따라 달라짐. 개발자가 미리보기 보고 적절히 선택.)

- [ ] **Step 4: LICENSE.txt 작성**

```
Water Factory - Asset License Credits

Sprites and sounds sourced from Kenney.nl (https://kenney.nl).
License: Creative Commons Zero (CC0 1.0 Universal)
  https://creativecommons.org/publicdomain/zero/1.0/

Packs used:
- Pixel Platformer — Industrial Expansion
- UI Pack — RPG Expansion
- Interface Sounds

Attribution optional but appreciated: "Kenney.nl"
```

- [ ] **Step 5: BootScene에서 실제 이미지 로드하도록 교체**

`src/scenes/BootScene.ts` `preload()` 본문 교체:

```ts
preload(): void {
  this.load.image('bg_wall',   'assets/sprites/bg_wall.png');
  this.load.image('cauldron',  'assets/sprites/cauldron.png');
  this.load.image('ice_cube',  'assets/sprites/ice.png');
  this.load.image('water_body','assets/sprites/water.png');
  this.load.image('steam_body','assets/sprites/steam.png');
  this.load.image('btn_heat',  'assets/sprites/btn_heat.png');
  this.load.image('btn_cool',  'assets/sprites/btn_cool.png');
  this.load.image('btn_ship',  'assets/sprites/btn_ship.png');
  this.load.image('order_card','assets/sprites/order_card.png');
}
```

`createPlaceholderTextures` 메서드와 호출을 삭제.

- [ ] **Step 6: _downloads 폴더는 git에서 제외**

`.gitignore`에 추가:

```
public/assets/_downloads/
```

- [ ] **Step 7: 수동 확인**

```bash
npm run dev
```

- [ ] 플레이스홀더 대신 실제 픽셀아트 이미지 표시
- [ ] 레이아웃이 무너지지 않음 (이미지 크기가 이전과 유사)
- [ ] 확연히 어긋나는 요소는 Cauldron / OrderBoard의 좌표·origin 미세 조정

- [ ] **Step 8: 커밋**

```bash
git add public/assets/sprites/ public/assets/LICENSE.txt src/scenes/BootScene.ts .gitignore
git commit -m "feat(water-factory): Kenney CC0 에셋 통합"
```

---

## Task 14: 효과음 통합

**Files:**
- Modify: `gamefolder/water-factory/public/assets/audio/*` (새 파일)
- Modify: `gamefolder/water-factory/src/scenes/BootScene.ts`
- Modify: `gamefolder/water-factory/src/scenes/GameScene.ts`

- [ ] **Step 1: Kenney Interface Sounds 팩에서 효과음 선정**

`public/assets/audio/`에 복사:
- `sfx_tap.ogg` — 버튼 탭
- `sfx_transition.ogg` — 상태 변환 성공
- `sfx_ship_ok.ogg` — 출하 정답
- `sfx_ship_fail.ogg` — 출하 오답/시간초과 알람
- `sfx_game_over.ogg` — 게임오버

- [ ] **Step 2: BootScene preload에 추가**

```ts
this.load.audio('sfx_tap',         'assets/audio/sfx_tap.ogg');
this.load.audio('sfx_transition',  'assets/audio/sfx_transition.ogg');
this.load.audio('sfx_ship_ok',     'assets/audio/sfx_ship_ok.ogg');
this.load.audio('sfx_ship_fail',   'assets/audio/sfx_ship_fail.ogg');
this.load.audio('sfx_game_over',   'assets/audio/sfx_game_over.ogg');
```

- [ ] **Step 3: GameScene에 사운드 헬퍼 추가**

`src/scenes/GameScene.ts`에 추가:

```ts
private playSfx(key: string): void {
  if (!(this.registry.get('soundEnabled') as boolean)) return;
  this.sound.play(key, { volume: 0.6 });
}
```

효과음 호출 포인트:
- `handleHeat()`, `handleCool()`: `this.playSfx('sfx_tap');` (맨 앞)
- 상태 변환 애니메이션 완료 후: `this.playSfx('sfx_transition');`
- `handleShip()` 분기:
  - 정답: `this.playSfx('sfx_ship_ok');`
  - 오답: `this.playSfx('sfx_ship_fail');`
- `tick` timedOut 시: `this.playSfx('sfx_ship_fail');`
- `triggerGameOver()` 첫 줄: `this.playSfx('sfx_game_over');`

- [ ] **Step 4: 수동 확인**

- [ ] 기본 상태: 🔇, 아무 소리 없음
- [ ] 🔊 토글 후: 버튼/변환/출하/게임오버 효과음 재생
- [ ] 페이지 새로고침 시 음소거 초기화됨 (Registry는 세션 한정, 이는 의도된 동작)

- [ ] **Step 5: 커밋**

```bash
git add public/assets/audio/ src/scenes/BootScene.ts src/scenes/GameScene.ts
git commit -m "feat(water-factory): 효과음 통합 + 🔊 토글"
```

---

## Task 15: 빌드 & 서브경로 검증

**Files:**
- (변경 없음, 검증 Task)

- [ ] **Step 1: 프로덕션 빌드**

```bash
cd gamefolder/water-factory && npm run build
```

Expected: `dist/` 생성.

- [ ] **Step 2: dist/index.html 경로 확인**

```bash
grep -o '/water-factory/[^"]*' dist/index.html | head -20
```

Expected: 모든 자산 경로가 `/water-factory/` 프리픽스.

- [ ] **Step 3: preview로 실제 배포 URL 시뮬레이션**

```bash
npm run preview
```

브라우저: `http://localhost:4173/water-factory/`
- [ ] 정상 로드
- [ ] 에셋 404 없음

- [ ] **Step 4: 커밋 (변경 없음, 검증만)**

(변경 사항 없으면 건너뜀.)

---

## Task 16: README (빌드·배포 가이드)

**Files:**
- Create: `gamefolder/water-factory/README.md`

- [ ] **Step 1: README 작성**

```markdown
# 워터 팩토리

초4-1학기 과학 2단원 "물의 상태 변화" 학습용 웹게임.

## 개발 환경

```bash
cd gamefolder/water-factory
npm install
npm run dev        # http://localhost:5173/water-factory/
npm test           # 단위 테스트 (GameState)
```

## 빌드

```bash
npm run build      # dist/ 생성
npm run preview    # http://localhost:4173/water-factory/
```

## OCI 서버 배포 (nginx 서브경로)

1. 서버 내 배포 디렉터리 준비:
   ```bash
   sudo mkdir -p /var/www/water-factory
   sudo chown $USER:$USER /var/www/water-factory
   ```

2. 로컬에서 빌드 후 업로드:
   ```bash
   npm run build
   rsync -av --delete dist/ user@oci-server:/var/www/water-factory/
   ```
   (`user@oci-server`는 실제 OCI 접속 정보로 대체)

3. nginx 설정 (`/etc/nginx/sites-available/<도메인>` 또는 기존 server 블록에 추가):
   ```nginx
   location /water-factory/ {
       alias /var/www/water-factory/;
       try_files $uri $uri/ /water-factory/index.html;
   }
   ```

4. 설정 검증 후 reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. 브라우저에서 `https://<도메인>/water-factory/` 접속 확인.

## 프로젝트 구조

```
src/
├── main.ts              Phaser 부트스트랩 + 세로모드 가드
├── config.ts            게임 상수 · 주문 6종 · 상태 전이 메타데이터
├── scenes/              BootScene → TitleScene → GameScene
├── state/GameState.ts   순수 로직 (테스트 대상)
├── entities/            Cauldron, OrderBoard
└── ui/                  ControlPanel, HUD, GameOverOverlay, OrientationGuard
tests/state/             GameState 단위 테스트 (vitest)
public/assets/           Kenney CC0 스프라이트·효과음
```

## 학습 내용

- 물의 세 가지 상태: 고체(얼음)·액체(물)·기체(수증기)
- 교과서 용어 기반 상태 변화:
  - 녹음(고→액), 얼음(액→고)
  - 끓음(액→기), 응결(기→액)
- "응고/융해/기화/액화"는 중학교 용어이므로 사용하지 않음.

## 라이선스

게임 소스: MIT (또는 선생님 선호에 따라).
에셋: Kenney.nl CC0 — `public/assets/LICENSE.txt` 참고.
```

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs(water-factory): 빌드·배포·구조 README"
```

---

## Task 17: 수동 테스트 체크리스트 수행

**Files:**
- (변경 없음, 검증 Task)

- [ ] **Step 1: PC Chrome에서 스펙 9.2 체크리스트 전체 확인**

```bash
npm run dev
```

- [ ] 타이틀 3슬라이드 이동 + [건너뛰기] 동작
- [ ] 버튼 탭 반응 0.1초 이내
- [ ] 가마솥 변환 애니메이션 4종(녹음/얼음/끓음/응결) 정상 재생
- [ ] 변환 중 버튼 비활성 (연타 무효)
- [ ] 경계 상태 (고체+❄️ / 기체+🔥) 비활성 + 흔들림 피드백
- [ ] 시간 초과 / 오답 출하 시 목숨 -1
- [ ] 알람 연출 (붉은 깜빡임) 재생
- [ ] 게임오버 → [🔁 다시하기] → 점수/목숨 초기화
- [ ] 새로고침 후 최고 점수 유지 (localStorage)
- [ ] NEW RECORD 뱃지 정확히 표시
- [ ] 세로모드 시 "가로로 돌려주세요" 안내
- [ ] 🔊 토글 ON 상태에서 효과음 재생 (기본은 🔇)

- [ ] **Step 2: 갤럭시탭 Chrome에서 배포 URL 또는 로컬 네트워크 주소로 동일 체크**

선생님 태블릿에서:
- PC의 로컬 IP로 `http://<PC_IP>:5173/water-factory/` 접속 또는
- OCI 배포 후 실제 URL 접속

동일 체크리스트 재수행. 특히 **터치 반응 속도**, **텍스트/버튼 크기 가독성**, **세로모드 감지** 중점 확인.

- [ ] **Step 3: 이슈 로그**

문제 발견 시 `docs/superpowers/plans/2026-04-17-water-factory-issues.md`에 기록 (파일명 선택). 가벼운 것은 이 세션에서 즉시 수정, 큰 것은 별도 세션에서 처리.

---

## 최종 완료 조건

- [ ] `npm test` 모든 테스트 통과 (GameState)
- [ ] `npm run build` 에러 없음
- [ ] PC Chrome + 갤럭시탭 Chrome에서 체크리스트 전 항목 통과
- [ ] OCI 서버에 `https://<도메인>/water-factory/` 로 접속 가능
- [ ] 선생님이 교실에서 시범 플레이 가능

---

## 주의 사항

- 에셋 다운로드 단계(Task 13)에서 반드시 **실제 Kenney 페이지의 공식 다운로드 URL을 확인**하고 사용. 추측 URL 사용 금지.
- 빌드 시 `tsc --noEmit`을 포함해 타입 에러가 빌드를 막도록 설정되어 있음.
- `base: '/water-factory/'`를 vite.config.ts에서 제거하거나 바꾸면 배포 시 자산 404가 난다. 서브도메인 배포로 바꾸려면 이 값을 `/`로 변경.
- `Scale.FIT` 모드이므로 게임 내부 좌표는 항상 1280×720 기준. 브라우저 창 크기와 무관하게 이 좌표계로 작업.
