# LPC 교육용 RPG 게임 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 6학년 사회 1학기 교과 내용을 스토리 중심 2D RPG로 학습하는 웹 게임의 v1 수직 슬라이스 구현 (허브 월드 + 1개 지역)

**Architecture:** Phaser 3 (TypeScript) 프론트엔드 게임 + Node.js/Express 백엔드 API + PostgreSQL DB. 교사 대시보드는 별도 경량 SPA. 학생 태블릿 브라우저에서 플레이하며, 터치 오버레이 컨트롤 사용. WebSocket으로 교사 대시보드 실시간 갱신.

**Tech Stack:** Phaser 3, TypeScript, Vite, Node.js, Express, PostgreSQL (pg), ws (WebSocket), LPC 스프라이트

**Spec:** `docs/superpowers/specs/2026-04-12-lpc-education-rpg-design.md`

---

## File Structure

```
gamemaker/
├── client/
│   ├── src/
│   │   ├── main.ts                    # Phaser 게임 진입점
│   │   ├── config.ts                  # Phaser 설정 (해상도, 물리엔진 등)
│   │   ├── scenes/
│   │   │   ├── BootScene.ts           # 에셋 프리로드
│   │   │   ├── LoginScene.ts          # 반 선택 → 이름 선택
│   │   │   ├── CharacterCreateScene.ts # 4슬롯 캐릭터 생성
│   │   │   ├── HubScene.ts            # 허브 월드 (상점, 지역 입구)
│   │   │   ├── RegionScene.ts         # 지역 맵 (NPC 탐험)
│   │   │   └── ShopScene.ts           # 상점 UI
│   │   ├── ui/
│   │   │   ├── TouchControls.ts       # 반투명 ↑←↓→ + A/B 오버레이
│   │   │   ├── DialogueBox.ts         # NPC 대화창 (스토리 + 퀴즈 전환)
│   │   │   ├── QuizModal.ts           # 퀴즈 모달 (4가지 유형)
│   │   │   └── HUD.ts                 # 코인 표시, 진행도
│   │   ├── sprites/
│   │   │   └── CharacterSprite.ts     # LPC 레이어 합성 렌더러
│   │   ├── api/
│   │   │   └── client.ts             # REST API 호출 모듈
│   │   └── types/
│   │       └── index.ts               # 공유 타입 정의
│   ├── public/
│   │   ├── assets/
│   │   │   ├── sprites/               # LPC 스프라이트 PNG (복사)
│   │   │   ├── maps/                  # Tiled JSON 맵
│   │   │   └── ui/                    # UI 에셋 (버튼 등)
│   │   └── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── index.ts                   # Express + WebSocket 서버 진입점
│   │   ├── db/
│   │   │   ├── pool.ts                # pg 커넥션 풀
│   │   │   ├── schema.sql             # CREATE TABLE DDL
│   │   │   └── seed.sql               # 초기 데이터 (아이템, 테스트 교사/반)
│   │   ├── routes/
│   │   │   ├── auth.ts                # 교사 로그인
│   │   │   ├── classes.ts             # 반 CRUD + 학생 일괄 등록
│   │   │   ├── students.ts            # 학생 조회 + 아바타 저장
│   │   │   ├── regions.ts             # 지역/NPC/문제 조회
│   │   │   ├── progress.ts            # 진행도 조회/갱신
│   │   │   ├── quiz.ts                # 퀴즈 제출 + 코인 지급
│   │   │   └── shop.ts                # 아이템 목록 + 구매 + 착용
│   │   ├── websocket/
│   │   │   └── dashboard.ts           # 교사 대시보드 실시간 푸시
│   │   └── middleware/
│   │       └── auth.ts                # JWT 검증 미들웨어
│   ├── tests/
│   │   ├── setup.ts                   # 테스트 DB 설정/정리
│   │   ├── auth.test.ts
│   │   ├── classes.test.ts
│   │   ├── students.test.ts
│   │   ├── progress.test.ts
│   │   ├── quiz.test.ts
│   │   └── shop.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── teacher-dashboard/
│   ├── index.html                     # 교사 대시보드 SPA
│   ├── app.js                         # 대시보드 로직
│   └── styles.css
│
├── content/
│   └── 6-1-사회/
│       ├── 1-1_핵심개념.json
│       └── 1-1_story_config.json
│
└── tools/
    └── seed-content.ts                # content/ → DB 로드 스크립트
```

---

## Task 1: 프로젝트 초기 설정 (모노레포 + 의존성)

**Files:**
- Create: `client/package.json`
- Create: `client/tsconfig.json`
- Create: `client/vite.config.ts`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`
- Create: `.gitignore`

- [ ] **Step 1: 루트 .gitignore 생성**

```gitignore
node_modules/
dist/
.env
*.log
```

- [ ] **Step 2: 클라이언트 package.json 생성**

```json
{
  "name": "lpc-rpg-client",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "phaser": "^3.80.1"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 3: 클라이언트 tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Vite 설정 생성**

```typescript
// client/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

- [ ] **Step 5: 서버 package.json 생성**

```json
{
  "name": "lpc-rpg-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:init": "tsx src/db/init.ts",
    "db:seed": "tsx tools/seed-content.ts"
  },
  "dependencies": {
    "express": "^4.21.0",
    "pg": "^8.13.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "ws": "^8.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/pg": "^8.11.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/ws": "^8.5.12",
    "@types/cors": "^2.8.17",
    "typescript": "^5.4.0",
    "tsx": "^4.19.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 6: 서버 tsconfig.json 생성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src", "tools", "tests"]
}
```

- [ ] **Step 7: .env.example 생성**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lpc_rpg
JWT_SECRET=change-me-in-production
PORT=3000
```

- [ ] **Step 8: 의존성 설치**

Run: `cd client && npm install && cd ../server && npm install`
Expected: 두 폴더 모두 node_modules 생성, 에러 없음

- [ ] **Step 9: 커밋**

```bash
git add client/package.json client/tsconfig.json client/vite.config.ts \
        server/package.json server/tsconfig.json server/.env.example \
        .gitignore
git commit -m "chore: 프로젝트 초기 설정 (client + server)"
```

---

## Task 2: 공유 타입 정의

**Files:**
- Create: `client/src/types/index.ts`

- [ ] **Step 1: 전체 게임에서 사용할 타입 정의**

```typescript
// client/src/types/index.ts

// === DB 엔티티 ===

export interface Teacher {
  id: number;
  login_id: string;
  created_at: string;
}

export interface GameClass {
  id: number;
  teacher_id: number;
  name: string;
  school_year: string;
}

export interface Student {
  id: number;
  class_id: number;
  name: string;
  avatar_config: AvatarConfig;
  coins: number;
  created_at: string;
}

export interface AvatarConfig {
  body: string;    // 고정: "child/light"
  hair: string;    // "short/brown"
  torso: string;   // "shirt/blue"
  legs: string;    // "pants/dark"
  feet: string;    // "shoes/brown"
}

export interface Region {
  id: number;
  name: string;
  theme: string;
  intro_dialogue: string[];
  ending_dialogue: string[];
  epilogue_dialogue: string[];
  story_synopsis: string;
  sort_order: number;
}

export interface NPC {
  id: number;
  region_id: number;
  name: string;
  character_desc: string;
  story_phase: StoryPhase;
  dialogue_before: string[];
  dialogue_correct: string[];
  dialogue_wrong: string[];
  dialogue_after: string[];
  next_npc_hint: string;
  position_x: number;
  position_y: number;
  quiz_type: QuizType;
  quiz_difficulty: Difficulty;
  sort_order: number;
}

export type StoryPhase = 'intro' | 'develop' | 'crisis' | 'climax' | 'conclusion';
export type QuizType = 'blank_fill' | 'multiple_choice' | 'matching' | 'ox';
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Question {
  id: number;
  npc_id: number;
  content: QuizContent;
  correct_answer: string;
  coin_reward: number;
}

// 퀴즈 유형별 content 구조
export type QuizContent =
  | BlankFillContent
  | MultipleChoiceContent
  | MatchingContent
  | OXContent;

export interface BlankFillContent {
  type: 'blank_fill';
  sentence: string;        // "4.19혁명은 _____ 정권에 맞선 시민운동이다"
  options: string[];        // ["이승만", "박정희", "전두환", "노태우"]
}

export interface MultipleChoiceContent {
  type: 'multiple_choice';
  question: string;
  options: string[];        // 4개
  correct_index: number;    // 0-3
}

export interface MatchingContent {
  type: 'matching';
  pairs: { left: string; right: string }[];  // 3~4쌍
}

export interface OXContent {
  type: 'ox';
  statement: string;
  answer: boolean;          // true = O, false = X
}

// === 진행도 ===

export interface StudentProgress {
  npc_id: number;
  is_cleared: boolean;
  cleared_at: string | null;
}

export interface QuizAttempt {
  question_id: number;
  answer: string;
  is_correct: boolean;
  attempted_at: string;
}

// === 상점 ===

export type ItemCategory = 'hair' | 'torso' | 'legs' | 'feet' | 'hat' | 'cape' | 'weapon';

export interface ShopItem {
  id: number;
  name: string;
  category: ItemCategory;
  lpc_sprite_path: string;
  price: number;
}

export interface OwnedItem extends ShopItem {
  is_equipped: boolean;
  purchased_at: string;
}

// === API 응답 ===

export interface LoginResponse {
  token: string;
  teacher: Teacher;
}

export interface RegionDetailResponse {
  region: Region;
  npcs: NPC[];
  questions: Question[];
}

// === 대시보드 WebSocket ===

export interface DashboardUpdate {
  type: 'progress_update' | 'quiz_attempt';
  student_id: number;
  student_name: string;
  data: StudentProgress | QuizAttempt;
}
```

- [ ] **Step 2: 커밋**

```bash
git add client/src/types/index.ts
git commit -m "feat: 공유 타입 정의 (엔티티, 퀴즈, API 응답)"
```

---

## Task 3: PostgreSQL 스키마 + 커넥션 풀

**Files:**
- Create: `server/src/db/schema.sql`
- Create: `server/src/db/pool.ts`
- Create: `server/src/db/init.ts`
- Create: `server/.env`

- [ ] **Step 1: .env 파일 생성 (로컬 개발용)**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lpc_rpg
JWT_SECRET=dev-secret-change-in-production
PORT=3000
```

- [ ] **Step 2: schema.sql 생성**

```sql
-- server/src/db/schema.sql

CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    school_year VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    avatar_config JSONB DEFAULT '{}',
    coins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    theme VARCHAR(200),
    intro_dialogue JSONB DEFAULT '[]',
    ending_dialogue JSONB DEFAULT '[]',
    epilogue_dialogue JSONB DEFAULT '[]',
    story_synopsis TEXT,
    map_data JSONB,
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS npcs (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    character_desc TEXT,
    story_phase VARCHAR(20) NOT NULL,
    dialogue_before JSONB NOT NULL DEFAULT '[]',
    dialogue_correct JSONB NOT NULL DEFAULT '[]',
    dialogue_wrong JSONB NOT NULL DEFAULT '[]',
    dialogue_after JSONB NOT NULL DEFAULT '[]',
    next_npc_hint TEXT,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    quiz_type VARCHAR(30) NOT NULL,
    quiz_difficulty VARCHAR(10) NOT NULL DEFAULT 'normal',
    sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    npc_id INTEGER NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    content JSONB NOT NULL,
    correct_answer VARCHAR(200) NOT NULL,
    coin_reward INTEGER DEFAULT 10
);

CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    npc_id INTEGER NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
    is_cleared BOOLEAN DEFAULT FALSE,
    cleared_at TIMESTAMP,
    UNIQUE(student_id, npc_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer VARCHAR(200),
    is_correct BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    lpc_sprite_path VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS student_items (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    is_equipped BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, item_id)
);
```

- [ ] **Step 3: pg 커넥션 풀 생성**

```typescript
// server/src/db/pool.ts
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
```

- [ ] **Step 4: DB 초기화 스크립트 생성**

```typescript
// server/src/db/init.ts
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initDB() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await client.query(schema);

  console.log('Database schema initialized successfully.');
  await client.end();
}

initDB().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
```

- [ ] **Step 5: dotenv 의존성 추가**

Run: `cd server && npm install dotenv`

- [ ] **Step 6: PostgreSQL에 DB 생성 후 스키마 초기화**

Run: `createdb lpc_rpg && cd server && npx tsx src/db/init.ts`
Expected: "Database schema initialized successfully."

- [ ] **Step 7: 커밋**

```bash
git add server/src/db/ server/.env.example
git commit -m "feat: PostgreSQL 스키마 + 커넥션 풀 설정"
```

---

## Task 4: Express 서버 기본 뼈대 + 교사 인증

**Files:**
- Create: `server/src/index.ts`
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/routes/auth.ts`
- Create: `server/tests/setup.ts`
- Create: `server/tests/auth.test.ts`

- [ ] **Step 1: 테스트 셋업 (테스트 DB 풀)**

```typescript
// server/tests/setup.ts
import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 테스트용 DB (lpc_rpg_test) 사용
const TEST_DB_URL = process.env.DATABASE_URL?.replace('/lpc_rpg', '/lpc_rpg_test')
  || 'postgresql://postgres:postgres@localhost:5432/lpc_rpg_test';

export const testPool = new pg.Pool({ connectionString: TEST_DB_URL });

export async function setupTestDB() {
  const schema = readFileSync(join(__dirname, '../src/db/schema.sql'), 'utf-8');
  await testPool.query(schema);
}

export async function cleanTestDB() {
  await testPool.query(`
    TRUNCATE student_items, quiz_attempts, student_progress,
             questions, npcs, regions, items,
             students, classes, teachers
    CASCADE
  `);
}

export async function teardownTestDB() {
  await testPool.end();
}
```

- [ ] **Step 2: auth 라우트 테스트 작성**

```typescript
// server/tests/auth.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, testPool } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';

const app = express();
app.use(express.json());
app.use('/api/auth', createAuthRouter(testPool));

describe('POST /api/auth/register', () => {
  beforeAll(async () => { await setupTestDB(); });
  afterAll(async () => { await teardownTestDB(); });
  beforeEach(async () => { await cleanTestDB(); });

  it('should register a new teacher', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'pass1234' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.teacher.login_id).toBe('teacher1');
  });

  it('should reject duplicate login_id', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'pass1234' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'other' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => { await setupTestDB(); });
  afterAll(async () => { await teardownTestDB(); });
  beforeEach(async () => { await cleanTestDB(); });

  it('should login with correct credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'pass1234' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ login_id: 'teacher1', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject wrong password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'pass1234' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ login_id: 'teacher1', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: supertest 의존성 추가 + 테스트 실패 확인**

Run: `cd server && npm install -D supertest @types/supertest`
Run: `cd server && npx vitest run tests/auth.test.ts`
Expected: FAIL — `createAuthRouter` 모듈 없음

- [ ] **Step 4: JWT 미들웨어 구현**

```typescript
// server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
  teacherId?: number;
}

export function generateToken(teacherId: number): string {
  return jwt.sign({ teacherId }, JWT_SECRET, { expiresIn: '24h' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token required' });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { teacherId: number };
    req.teacherId = payload.teacherId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 5: auth 라우트 구현**

```typescript
// server/src/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { generateToken } from '../middleware/auth.js';

export function createAuthRouter(pool: Pool): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      res.status(400).json({ error: 'login_id and password required' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const result = await pool.query(
        'INSERT INTO teachers (login_id, password_hash) VALUES ($1, $2) RETURNING id, login_id, created_at',
        [login_id, passwordHash]
      );

      const teacher = result.rows[0];
      const token = generateToken(teacher.id);
      res.status(201).json({ token, teacher });
    } catch (err: any) {
      if (err.code === '23505') {
        res.status(409).json({ error: 'login_id already exists' });
        return;
      }
      throw err;
    }
  });

  router.post('/login', async (req, res) => {
    const { login_id, password } = req.body;

    if (!login_id || !password) {
      res.status(400).json({ error: 'login_id and password required' });
      return;
    }

    const result = await pool.query(
      'SELECT id, login_id, password_hash, created_at FROM teachers WHERE login_id = $1',
      [login_id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const teacher = result.rows[0];
    const valid = await bcrypt.compare(password, teacher.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken(teacher.id);
    res.status(200).json({
      token,
      teacher: { id: teacher.id, login_id: teacher.login_id, created_at: teacher.created_at }
    });
  });

  return router;
}
```

- [ ] **Step 6: 테스트 DB 생성 + 테스트 통과 확인**

Run: `createdb lpc_rpg_test`
Run: `cd server && npx vitest run tests/auth.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 7: Express 서버 진입점 생성**

```typescript
// server/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import pool from './db/pool.js';
import { createAuthRouter } from './routes/auth.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', createAuthRouter(pool));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server };
```

- [ ] **Step 8: 서버 시작 확인**

Run: `cd server && npx tsx src/index.ts`
Expected: "Server running on port 3000"
Run (별도 터미널): `curl http://localhost:3000/api/health`
Expected: `{"status":"ok"}`

- [ ] **Step 9: 커밋**

```bash
git add server/src/index.ts server/src/middleware/auth.ts \
        server/src/routes/auth.ts server/tests/
git commit -m "feat: Express 서버 + 교사 인증 API (register/login)"
```

---

## Task 5: 반/학생 관리 API

**Files:**
- Create: `server/src/routes/classes.ts`
- Create: `server/src/routes/students.ts`
- Create: `server/tests/classes.test.ts`
- Create: `server/tests/students.test.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: classes 테스트 작성**

```typescript
// server/tests/classes.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, testPool } from './setup.js';
import { createAuthRouter } from '../src/routes/auth.js';
import { createClassesRouter } from '../src/routes/classes.js';

const app = express();
app.use(express.json());
app.use('/api/auth', createAuthRouter(testPool));
app.use('/api/classes', createClassesRouter(testPool));

let token: string;

describe('Classes API', () => {
  beforeAll(async () => { await setupTestDB(); });
  afterAll(async () => { await teardownTestDB(); });
  beforeEach(async () => {
    await cleanTestDB();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ login_id: 'teacher1', password: 'pass1234' });
    token = res.body.token;
  });

  it('POST /api/classes - should create a class', async () => {
    const res = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '6학년 3반', school_year: '2026-1학기' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('6학년 3반');
  });

  it('GET /api/classes - should list teacher classes', async () => {
    await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '6학년 3반', school_year: '2026-1학기' });

    const res = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('POST /api/classes/:id/students/bulk - should create students from CSV-like array', async () => {
    const classRes = await request(app)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '6학년 3반', school_year: '2026-1학기' });

    const res = await request(app)
      .post(`/api/classes/${classRes.body.id}/students/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({ names: ['김민수', '이서연', '박지호'] });

    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].name).toBe('김민수');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd server && npx vitest run tests/classes.test.ts`
Expected: FAIL — `createClassesRouter` 없음

- [ ] **Step 3: classes 라우트 구현**

```typescript
// server/src/routes/classes.ts
import { Router } from 'express';
import { Pool } from 'pg';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

export function createClassesRouter(pool: Pool): Router {
  const router = Router();

  // 반 생성
  router.post('/', requireAuth, async (req: AuthRequest, res) => {
    const { name, school_year } = req.body;

    if (!name || !school_year) {
      res.status(400).json({ error: 'name and school_year required' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO classes (teacher_id, name, school_year) VALUES ($1, $2, $3) RETURNING *',
      [req.teacherId, name, school_year]
    );

    res.status(201).json(result.rows[0]);
  });

  // 교사의 반 목록
  router.get('/', requireAuth, async (req: AuthRequest, res) => {
    const result = await pool.query(
      'SELECT * FROM classes WHERE teacher_id = $1 ORDER BY name',
      [req.teacherId]
    );

    res.json(result.rows);
  });

  // 학생 일괄 등록
  router.post('/:id/students/bulk', requireAuth, async (req: AuthRequest, res) => {
    const classId = parseInt(req.params.id);
    const { names } = req.body;

    if (!Array.isArray(names) || names.length === 0) {
      res.status(400).json({ error: 'names array required' });
      return;
    }

    // 반이 해당 교사의 것인지 확인
    const classCheck = await pool.query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, req.teacherId]
    );

    if (classCheck.rows.length === 0) {
      res.status(404).json({ error: 'Class not found' });
      return;
    }

    const values = names.map((_: string, i: number) =>
      `($1, $${i + 2})`
    ).join(', ');
    const params = [classId, ...names];

    const result = await pool.query(
      `INSERT INTO students (class_id, name) VALUES ${values} RETURNING *`,
      params
    );

    res.status(201).json(result.rows);
  });

  return router;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd server && npx vitest run tests/classes.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 5: students 테스트 작성**

```typescript
// server/tests/students.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, testPool } from './setup.js';
import { createStudentsRouter } from '../src/routes/students.js';

const app = express();
app.use(express.json());
app.use('/api/students', createStudentsRouter(testPool));

describe('Students API', () => {
  beforeAll(async () => { await setupTestDB(); });
  afterAll(async () => { await teardownTestDB(); });
  beforeEach(async () => {
    await cleanTestDB();
    // 테스트용 교사, 반, 학생 생성
    await testPool.query(
      "INSERT INTO teachers (id, login_id, password_hash) VALUES (1, 'teacher1', 'hash')"
    );
    await testPool.query(
      "INSERT INTO classes (id, teacher_id, name, school_year) VALUES (1, 1, '6-3', '2026-1')"
    );
    await testPool.query(
      "INSERT INTO students (id, class_id, name) VALUES (1, 1, '김민수')"
    );
  });

  it('GET /api/students/class/:classId - should list students in class', async () => {
    const res = await request(app).get('/api/students/class/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('김민수');
  });

  it('GET /api/students/:id - should get student details', async () => {
    const res = await request(app).get('/api/students/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('김민수');
    expect(res.body.coins).toBe(0);
  });

  it('PATCH /api/students/:id/avatar - should update avatar config', async () => {
    const avatar = {
      body: 'child/light',
      hair: 'short/brown',
      torso: 'shirt/blue',
      legs: 'pants/dark',
      feet: 'shoes/brown'
    };

    const res = await request(app)
      .patch('/api/students/1/avatar')
      .send({ avatar_config: avatar });

    expect(res.status).toBe(200);
    expect(res.body.avatar_config).toEqual(avatar);
  });
});
```

- [ ] **Step 6: 테스트 실패 확인**

Run: `cd server && npx vitest run tests/students.test.ts`
Expected: FAIL

- [ ] **Step 7: students 라우트 구현**

```typescript
// server/src/routes/students.ts
import { Router } from 'express';
import { Pool } from 'pg';

export function createStudentsRouter(pool: Pool): Router {
  const router = Router();

  // 반별 학생 목록 (학생 로그인용 — 인증 불필요)
  router.get('/class/:classId', async (req, res) => {
    const classId = parseInt(req.params.classId);

    const result = await pool.query(
      'SELECT id, class_id, name, avatar_config, coins FROM students WHERE class_id = $1 ORDER BY name',
      [classId]
    );

    res.json(result.rows);
  });

  // 학생 상세 조회
  router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    const result = await pool.query(
      'SELECT id, class_id, name, avatar_config, coins, created_at FROM students WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json(result.rows[0]);
  });

  // 아바타 설정 저장
  router.patch('/:id/avatar', async (req, res) => {
    const id = parseInt(req.params.id);
    const { avatar_config } = req.body;

    if (!avatar_config) {
      res.status(400).json({ error: 'avatar_config required' });
      return;
    }

    const result = await pool.query(
      'UPDATE students SET avatar_config = $1 WHERE id = $2 RETURNING id, class_id, name, avatar_config, coins',
      [JSON.stringify(avatar_config), id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json(result.rows[0]);
  });

  return router;
}
```

- [ ] **Step 8: 테스트 통과 확인**

Run: `cd server && npx vitest run tests/students.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 9: index.ts에 라우트 등록**

```typescript
// server/src/index.ts — 기존 auth 라우트 아래에 추가
import { createClassesRouter } from './routes/classes.js';
import { createStudentsRouter } from './routes/students.js';

// 기존 라인: app.use('/api/auth', createAuthRouter(pool));
app.use('/api/classes', createClassesRouter(pool));
app.use('/api/students', createStudentsRouter(pool));
```

- [ ] **Step 10: 커밋**

```bash
git add server/src/routes/classes.ts server/src/routes/students.ts \
        server/tests/classes.test.ts server/tests/students.test.ts \
        server/src/index.ts
git commit -m "feat: 반/학생 관리 API (CRUD, 일괄 등록, 아바타)"
```

---

## Task 6: 게임 콘텐츠 API (지역/NPC/문제) + 진행도 + 퀴즈 제출

**Files:**
- Create: `server/src/routes/regions.ts`
- Create: `server/src/routes/progress.ts`
- Create: `server/src/routes/quiz.ts`
- Create: `server/tests/progress.test.ts`
- Create: `server/tests/quiz.test.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: regions 라우트 구현 (읽기 전용, 테스트는 통합에서)**

```typescript
// server/src/routes/regions.ts
import { Router } from 'express';
import { Pool } from 'pg';

export function createRegionsRouter(pool: Pool): Router {
  const router = Router();

  // 전체 지역 목록 (반 선택 후 학생에게 보여줌)
  router.get('/', async (_req, res) => {
    const result = await pool.query(
      'SELECT id, name, theme, sort_order FROM regions ORDER BY sort_order'
    );
    res.json(result.rows);
  });

  // 지역 상세 (NPC + 문제 포함)
  router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    const regionResult = await pool.query(
      'SELECT * FROM regions WHERE id = $1',
      [id]
    );

    if (regionResult.rows.length === 0) {
      res.status(404).json({ error: 'Region not found' });
      return;
    }

    const npcsResult = await pool.query(
      'SELECT * FROM npcs WHERE region_id = $1 ORDER BY sort_order',
      [id]
    );

    const npcIds = npcsResult.rows.map(n => n.id);
    let questions: any[] = [];

    if (npcIds.length > 0) {
      const questionsResult = await pool.query(
        'SELECT * FROM questions WHERE npc_id = ANY($1)',
        [npcIds]
      );
      questions = questionsResult.rows;
    }

    res.json({
      region: regionResult.rows[0],
      npcs: npcsResult.rows,
      questions,
    });
  });

  return router;
}
```

- [ ] **Step 2: quiz 테스트 작성**

```typescript
// server/tests/quiz.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, testPool } from './setup.js';
import { createQuizRouter } from '../src/routes/quiz.js';

const app = express();
app.use(express.json());
app.use('/api/quiz', createQuizRouter(testPool));

describe('Quiz API', () => {
  beforeAll(async () => { await setupTestDB(); });
  afterAll(async () => { await teardownTestDB(); });
  beforeEach(async () => {
    await cleanTestDB();
    await testPool.query("INSERT INTO teachers (id, login_id, password_hash) VALUES (1, 't', 'h')");
    await testPool.query("INSERT INTO classes (id, teacher_id, name, school_year) VALUES (1, 1, 'c', 'y')");
    await testPool.query("INSERT INTO students (id, class_id, name, coins) VALUES (1, 1, '김민수', 0)");
    await testPool.query("INSERT INTO regions (id, name, sort_order) VALUES (1, 'r1', 1)");
    await testPool.query(`
      INSERT INTO npcs (id, region_id, name, story_phase, dialogue_before, dialogue_correct, dialogue_wrong, dialogue_after,
                        position_x, position_y, quiz_type, quiz_difficulty, sort_order)
      VALUES (1, 1, 'npc1', 'intro', '[]', '[]', '[]', '[]', 0, 0, 'ox', 'easy', 1)
    `);
    await testPool.query(`
      INSERT INTO questions (id, npc_id, content, correct_answer, coin_reward)
      VALUES (1, 1, '{"type":"ox","statement":"test","answer":true}', 'O', 10)
    `);
  });

  it('POST /api/quiz/submit - correct answer gives coins', async () => {
    const res = await request(app)
      .post('/api/quiz/submit')
      .send({ student_id: 1, question_id: 1, answer: 'O' });

    expect(res.status).toBe(200);
    expect(res.body.is_correct).toBe(true);
    expect(res.body.coins_earned).toBe(10);

    // 학생 코인 확인
    const student = await testPool.query('SELECT coins FROM students WHERE id = 1');
    expect(student.rows[0].coins).toBe(10);
  });

  it('POST /api/quiz/submit - wrong answer gives no coins', async () => {
    const res = await request(app)
      .post('/api/quiz/submit')
      .send({ student_id: 1, question_id: 1, answer: 'X' });

    expect(res.status).toBe(200);
    expect(res.body.is_correct).toBe(false);
    expect(res.body.coins_earned).toBe(0);
  });

  it('POST /api/quiz/submit - second attempt gives reduced coins', async () => {
    // 1차 오답
    await request(app)
      .post('/api/quiz/submit')
      .send({ student_id: 1, question_id: 1, answer: 'X' });

    // 2차 정답
    const res = await request(app)
      .post('/api/quiz/submit')
      .send({ student_id: 1, question_id: 1, answer: 'O' });

    expect(res.body.is_correct).toBe(true);
    expect(res.body.coins_earned).toBe(5); // 재시도 감소
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `cd server && npx vitest run tests/quiz.test.ts`
Expected: FAIL

- [ ] **Step 4: quiz 라우트 구현**

```typescript
// server/src/routes/quiz.ts
import { Router } from 'express';
import { Pool } from 'pg';

export function createQuizRouter(pool: Pool): Router {
  const router = Router();

  router.post('/submit', async (req, res) => {
    const { student_id, question_id, answer } = req.body;

    if (!student_id || !question_id || answer === undefined) {
      res.status(400).json({ error: 'student_id, question_id, answer required' });
      return;
    }

    // 문제 정보 조회
    const qResult = await pool.query(
      'SELECT correct_answer, coin_reward, npc_id FROM questions WHERE id = $1',
      [question_id]
    );

    if (qResult.rows.length === 0) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    const question = qResult.rows[0];
    const isCorrect = answer === question.correct_answer;

    // 이전 시도 횟수 조회
    const attemptsResult = await pool.query(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE student_id = $1 AND question_id = $2',
      [student_id, question_id]
    );
    const attemptCount = parseInt(attemptsResult.rows[0].count);

    // 풀이 기록 저장
    await pool.query(
      'INSERT INTO quiz_attempts (student_id, question_id, answer, is_correct) VALUES ($1, $2, $3, $4)',
      [student_id, question_id, answer, isCorrect]
    );

    let coinsEarned = 0;

    if (isCorrect) {
      // 이미 정답 맞힌 적이 있으면 코인 0
      const prevCorrect = await pool.query(
        'SELECT id FROM quiz_attempts WHERE student_id = $1 AND question_id = $2 AND is_correct = true AND id != currval(pg_get_serial_sequence(\'quiz_attempts\', \'id\'))',
        [student_id, question_id]
      );

      if (prevCorrect.rows.length === 0) {
        // 첫 정답 — 시도 횟수에 따라 코인 차등
        if (attemptCount === 0) {
          coinsEarned = question.coin_reward;       // 첫 시도 정답: 10
        } else if (attemptCount === 1) {
          coinsEarned = Math.floor(question.coin_reward / 2); // 2회째: 5
        } else {
          coinsEarned = Math.floor(question.coin_reward / 5); // 3회+: 2
        }

        // 코인 지급
        await pool.query(
          'UPDATE students SET coins = coins + $1 WHERE id = $2',
          [coinsEarned, student_id]
        );

        // NPC 클리어 처리
        await pool.query(
          `INSERT INTO student_progress (student_id, npc_id, is_cleared, cleared_at)
           VALUES ($1, $2, true, NOW())
           ON CONFLICT (student_id, npc_id) DO UPDATE SET is_cleared = true, cleared_at = NOW()`,
          [student_id, question.npc_id]
        );
      }
    }

    res.json({ is_correct: isCorrect, coins_earned: coinsEarned });
  });

  return router;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd server && npx vitest run tests/quiz.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 6: progress 라우트 구현**

```typescript
// server/src/routes/progress.ts
import { Router } from 'express';
import { Pool } from 'pg';

export function createProgressRouter(pool: Pool): Router {
  const router = Router();

  // 학생의 전체 진행도
  router.get('/student/:studentId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);

    const result = await pool.query(
      `SELECT sp.npc_id, sp.is_cleared, sp.cleared_at, n.region_id
       FROM student_progress sp
       JOIN npcs n ON sp.npc_id = n.id
       WHERE sp.student_id = $1`,
      [studentId]
    );

    res.json(result.rows);
  });

  // 지역 클리어 여부 확인 (보너스 코인 지급용)
  router.get('/student/:studentId/region/:regionId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);
    const regionId = parseInt(req.params.regionId);

    // 지역 내 전체 NPC 수
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM npcs WHERE region_id = $1',
      [regionId]
    );

    // 클리어한 NPC 수
    const clearedResult = await pool.query(
      `SELECT COUNT(*) as cleared FROM student_progress sp
       JOIN npcs n ON sp.npc_id = n.id
       WHERE sp.student_id = $1 AND n.region_id = $2 AND sp.is_cleared = true`,
      [studentId, regionId]
    );

    const total = parseInt(totalResult.rows[0].total);
    const cleared = parseInt(clearedResult.rows[0].cleared);

    res.json({ total, cleared, is_complete: cleared >= total && total > 0 });
  });

  // 반 전체 진행도 (교사 대시보드용)
  router.get('/class/:classId', async (req, res) => {
    const classId = parseInt(req.params.classId);

    const result = await pool.query(
      `SELECT s.id as student_id, s.name as student_name,
              r.id as region_id, r.name as region_name,
              COUNT(sp.id) FILTER (WHERE sp.is_cleared = true) as cleared_npcs,
              COUNT(n.id) as total_npcs
       FROM students s
       CROSS JOIN regions r
       LEFT JOIN npcs n ON n.region_id = r.id
       LEFT JOIN student_progress sp ON sp.student_id = s.id AND sp.npc_id = n.id
       WHERE s.class_id = $1
       GROUP BY s.id, s.name, r.id, r.name
       ORDER BY s.name, r.sort_order`,
      [classId]
    );

    res.json(result.rows);
  });

  return router;
}
```

- [ ] **Step 7: index.ts에 라우트 등록**

`server/src/index.ts`에 추가:

```typescript
import { createRegionsRouter } from './routes/regions.js';
import { createProgressRouter } from './routes/progress.js';
import { createQuizRouter } from './routes/quiz.js';

app.use('/api/regions', createRegionsRouter(pool));
app.use('/api/progress', createProgressRouter(pool));
app.use('/api/quiz', createQuizRouter(pool));
```

- [ ] **Step 8: 전체 서버 테스트 통과 확인**

Run: `cd server && npx vitest run`
Expected: 모든 테스트 PASS

- [ ] **Step 9: 커밋**

```bash
git add server/src/routes/regions.ts server/src/routes/progress.ts \
        server/src/routes/quiz.ts server/tests/ server/src/index.ts
git commit -m "feat: 게임 콘텐츠 + 진행도 + 퀴즈 제출 API"
```

---

## Task 7: 상점 API

**Files:**
- Create: `server/src/routes/shop.ts`
- Create: `server/tests/shop.test.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: shop 테스트 작성**

```typescript
// server/tests/shop.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupTestDB, cleanTestDB, teardownTestDB, testPool } from './setup.js';
import { createShopRouter } from '../src/routes/shop.js';

const app = express();
app.use(express.json());
app.use('/api/shop', createShopRouter(testPool));

describe('Shop API', () => {
  beforeAll(async () => { await setupTestDB(); });
  afterAll(async () => { await teardownTestDB(); });
  beforeEach(async () => {
    await cleanTestDB();
    await testPool.query("INSERT INTO teachers (id, login_id, password_hash) VALUES (1, 't', 'h')");
    await testPool.query("INSERT INTO classes (id, teacher_id, name, school_year) VALUES (1, 1, 'c', 'y')");
    await testPool.query("INSERT INTO students (id, class_id, name, coins) VALUES (1, 1, '김민수', 50)");
    await testPool.query(`
      INSERT INTO items (id, name, category, lpc_sprite_path, price)
      VALUES (1, '금색 왕관', 'hat', 'hat/crown_gold.png', 30),
             (2, '마법사 망토', 'cape', 'cape/wizard.png', 80)
    `);
  });

  it('GET /api/shop/items - should list all items', async () => {
    const res = await request(app).get('/api/shop/items');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('POST /api/shop/buy - should purchase item with enough coins', async () => {
    const res = await request(app)
      .post('/api/shop/buy')
      .send({ student_id: 1, item_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body.remaining_coins).toBe(20);
  });

  it('POST /api/shop/buy - should reject if not enough coins', async () => {
    const res = await request(app)
      .post('/api/shop/buy')
      .send({ student_id: 1, item_id: 2 }); // 80 coins, has 50

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Not enough coins/);
  });

  it('PATCH /api/shop/equip - should toggle equip', async () => {
    // 먼저 구매
    await request(app)
      .post('/api/shop/buy')
      .send({ student_id: 1, item_id: 1 });

    const res = await request(app)
      .patch('/api/shop/equip')
      .send({ student_id: 1, item_id: 1, is_equipped: true });

    expect(res.status).toBe(200);
    expect(res.body.is_equipped).toBe(true);
  });

  it('GET /api/shop/inventory/:studentId - should list owned items', async () => {
    await request(app)
      .post('/api/shop/buy')
      .send({ student_id: 1, item_id: 1 });

    const res = await request(app).get('/api/shop/inventory/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('금색 왕관');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd server && npx vitest run tests/shop.test.ts`
Expected: FAIL

- [ ] **Step 3: shop 라우트 구현**

```typescript
// server/src/routes/shop.ts
import { Router } from 'express';
import { Pool } from 'pg';

export function createShopRouter(pool: Pool): Router {
  const router = Router();

  // 전체 아이템 목록
  router.get('/items', async (_req, res) => {
    const result = await pool.query(
      'SELECT * FROM items ORDER BY category, price'
    );
    res.json(result.rows);
  });

  // 아이템 구매
  router.post('/buy', async (req, res) => {
    const { student_id, item_id } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 학생 코인 조회 (FOR UPDATE — 동시 구매 방지)
      const studentResult = await client.query(
        'SELECT coins FROM students WHERE id = $1 FOR UPDATE',
        [student_id]
      );

      if (studentResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const currentCoins = studentResult.rows[0].coins;

      // 아이템 가격 조회
      const itemResult = await client.query(
        'SELECT price FROM items WHERE id = $1',
        [item_id]
      );

      if (itemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ error: 'Item not found' });
        return;
      }

      const price = itemResult.rows[0].price;

      if (currentCoins < price) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Not enough coins' });
        return;
      }

      // 이미 소유 확인
      const ownedResult = await client.query(
        'SELECT id FROM student_items WHERE student_id = $1 AND item_id = $2',
        [student_id, item_id]
      );

      if (ownedResult.rows.length > 0) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'Already owned' });
        return;
      }

      // 코인 차감
      await client.query(
        'UPDATE students SET coins = coins - $1 WHERE id = $2',
        [price, student_id]
      );

      // 아이템 추가
      await client.query(
        'INSERT INTO student_items (student_id, item_id) VALUES ($1, $2)',
        [student_id, item_id]
      );

      await client.query('COMMIT');

      res.json({ remaining_coins: currentCoins - price });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  });

  // 착용/해제
  router.patch('/equip', async (req, res) => {
    const { student_id, item_id, is_equipped } = req.body;

    const result = await pool.query(
      'UPDATE student_items SET is_equipped = $1 WHERE student_id = $2 AND item_id = $3 RETURNING *',
      [is_equipped, student_id, item_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Item not owned' });
      return;
    }

    res.json(result.rows[0]);
  });

  // 인벤토리 조회
  router.get('/inventory/:studentId', async (req, res) => {
    const studentId = parseInt(req.params.studentId);

    const result = await pool.query(
      `SELECT i.*, si.is_equipped, si.purchased_at
       FROM student_items si
       JOIN items i ON si.item_id = i.id
       WHERE si.student_id = $1
       ORDER BY si.purchased_at DESC`,
      [studentId]
    );

    res.json(result.rows);
  });

  return router;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd server && npx vitest run tests/shop.test.ts`
Expected: 모든 테스트 PASS

- [ ] **Step 5: index.ts에 라우트 등록**

`server/src/index.ts`에 추가:

```typescript
import { createShopRouter } from './routes/shop.js';

app.use('/api/shop', createShopRouter(pool));
```

- [ ] **Step 6: 전체 테스트 확인 + 커밋**

Run: `cd server && npx vitest run`
Expected: 모든 테스트 PASS

```bash
git add server/src/routes/shop.ts server/tests/shop.test.ts server/src/index.ts
git commit -m "feat: 상점 API (아이템 목록, 구매, 착용, 인벤토리)"
```

---

## Task 8: WebSocket 대시보드 + 교사 대시보드 SPA

**Files:**
- Create: `server/src/websocket/dashboard.ts`
- Modify: `server/src/index.ts`
- Modify: `server/src/routes/quiz.ts` (WebSocket 알림 추가)
- Create: `teacher-dashboard/index.html`
- Create: `teacher-dashboard/app.js`
- Create: `teacher-dashboard/styles.css`

- [ ] **Step 1: WebSocket 매니저 구현**

```typescript
// server/src/websocket/dashboard.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface DashboardClient {
  ws: WebSocket;
  classId: number;
}

const clients: DashboardClient[] = [];

export function setupDashboardWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/dashboard' });

  wss.on('connection', (ws) => {
    let registered = false;

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'register' && msg.class_id) {
          clients.push({ ws, classId: msg.class_id });
          registered = true;
        }
      } catch { /* ignore malformed messages */ }
    });

    ws.on('close', () => {
      const idx = clients.findIndex(c => c.ws === ws);
      if (idx !== -1) clients.splice(idx, 1);
    });
  });
}

export function broadcastToClass(classId: number, data: object) {
  const message = JSON.stringify(data);
  clients
    .filter(c => c.classId === classId && c.ws.readyState === WebSocket.OPEN)
    .forEach(c => c.ws.send(message));
}
```

- [ ] **Step 2: quiz.ts에 WebSocket 알림 연동**

`server/src/routes/quiz.ts`의 `createQuizRouter` 시그니처를 변경하고, 퀴즈 제출 성공 시 broadcastToClass 호출을 추가:

```typescript
// server/src/routes/quiz.ts — 수정
import { broadcastToClass } from '../websocket/dashboard.js';

// createQuizRouter 함수 내, 코인 지급 후 (또는 오답 시에도) 브로드캐스트 추가:
// res.json({ ... }) 직전에:

    // 학생의 class_id 조회 후 브로드캐스트
    const studentInfo = await pool.query(
      'SELECT s.class_id, s.name FROM students s WHERE s.id = $1',
      [student_id]
    );

    if (studentInfo.rows.length > 0) {
      broadcastToClass(studentInfo.rows[0].class_id, {
        type: isCorrect ? 'quiz_correct' : 'quiz_wrong',
        student_id,
        student_name: studentInfo.rows[0].name,
        question_id,
        npc_id: question.npc_id,
        coins_earned: coinsEarned,
      });
    }
```

- [ ] **Step 3: index.ts에 WebSocket 연결**

`server/src/index.ts`에 추가:

```typescript
import { setupDashboardWebSocket } from './websocket/dashboard.js';

// server.listen 이전에:
setupDashboardWebSocket(server);
```

- [ ] **Step 4: 교사 대시보드 HTML 생성**

```html
<!-- teacher-dashboard/index.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>교사 대시보드</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <div id="login-view">
      <h1>교사 로그인</h1>
      <input type="text" id="login-id" placeholder="아이디">
      <input type="password" id="login-pw" placeholder="비밀번호">
      <button id="login-btn">로그인</button>
      <button id="register-btn">회원가입</button>
    </div>

    <div id="dashboard-view" style="display:none">
      <header>
        <h1>학급 대시보드</h1>
        <select id="class-select"></select>
        <button id="manage-btn">학생 관리</button>
      </header>

      <div id="progress-grid"></div>

      <div id="stats-panel">
        <h2>문제별 통계</h2>
        <div id="question-stats"></div>
      </div>
    </div>

    <div id="manage-view" style="display:none">
      <h2>학생 관리</h2>
      <textarea id="student-names" placeholder="학생 이름 (한 줄에 하나씩)"></textarea>
      <button id="bulk-add-btn">일괄 등록</button>
      <div id="student-list"></div>
      <button id="back-btn">돌아가기</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 5: 대시보드 JS 구현**

```javascript
// teacher-dashboard/app.js
const API = 'http://localhost:3000/api';
let token = null;
let currentClassId = null;
let ws = null;

// === 인증 ===
document.getElementById('login-btn').onclick = async () => {
  const login_id = document.getElementById('login-id').value;
  const password = document.getElementById('login-pw').value;

  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id, password }),
  });

  if (res.ok) {
    const data = await res.json();
    token = data.token;
    showDashboard();
  } else {
    alert('로그인 실패');
  }
};

document.getElementById('register-btn').onclick = async () => {
  const login_id = document.getElementById('login-id').value;
  const password = document.getElementById('login-pw').value;

  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id, password }),
  });

  if (res.ok) {
    const data = await res.json();
    token = data.token;
    showDashboard();
  } else {
    alert('회원가입 실패');
  }
};

// === 대시보드 ===
async function showDashboard() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
  await loadClasses();
}

async function loadClasses() {
  const res = await fetch(`${API}/classes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const classes = await res.json();
  const select = document.getElementById('class-select');
  select.innerHTML = classes.map(c =>
    `<option value="${c.id}">${c.name} (${c.school_year})</option>`
  ).join('');

  if (classes.length > 0) {
    currentClassId = classes[0].id;
    select.onchange = () => {
      currentClassId = parseInt(select.value);
      loadProgress();
      connectWebSocket();
    };
    loadProgress();
    connectWebSocket();
  }
}

async function loadProgress() {
  if (!currentClassId) return;

  const res = await fetch(`${API}/progress/class/${currentClassId}`);
  const data = await res.json();

  // 학생×지역 그리드 생성
  const grid = document.getElementById('progress-grid');
  const students = [...new Set(data.map(d => d.student_name))];
  const regions = [...new Set(data.map(d => d.region_name))];

  let html = '<table><tr><th>학생</th>';
  regions.forEach(r => { html += `<th>${r}</th>`; });
  html += '</tr>';

  students.forEach(student => {
    html += `<tr><td>${student}</td>`;
    regions.forEach(region => {
      const entry = data.find(d => d.student_name === student && d.region_name === region);
      if (!entry) {
        html += '<td class="status-none">-</td>';
      } else if (parseInt(entry.cleared_npcs) >= parseInt(entry.total_npcs) && parseInt(entry.total_npcs) > 0) {
        html += '<td class="status-done">완료</td>';
      } else if (parseInt(entry.cleared_npcs) > 0) {
        html += `<td class="status-progress">${entry.cleared_npcs}/${entry.total_npcs}</td>`;
      } else {
        html += '<td class="status-none">미시작</td>';
      }
    });
    html += '</tr>';
  });

  html += '</table>';
  grid.innerHTML = html;
}

// === WebSocket ===
function connectWebSocket() {
  if (ws) ws.close();

  ws = new WebSocket(`ws://localhost:3000/ws/dashboard`);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register', class_id: currentClassId }));
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // 실시간 업데이트: 그리드 새로고침
    loadProgress();
  };
}

// === 학생 관리 ===
document.getElementById('manage-btn').onclick = () => {
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('manage-view').style.display = 'block';
  loadStudentList();
};

document.getElementById('back-btn').onclick = () => {
  document.getElementById('manage-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
};

document.getElementById('bulk-add-btn').onclick = async () => {
  const text = document.getElementById('student-names').value;
  const names = text.split('\n').map(n => n.trim()).filter(n => n);

  if (names.length === 0) return;

  await fetch(`${API}/classes/${currentClassId}/students/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ names }),
  });

  document.getElementById('student-names').value = '';
  loadStudentList();
};

async function loadStudentList() {
  const res = await fetch(`${API}/students/class/${currentClassId}`);
  const students = await res.json();
  const list = document.getElementById('student-list');
  list.innerHTML = '<ul>' +
    students.map(s => `<li>${s.name} (코인: ${s.coins})</li>`).join('') +
    '</ul>';
}
```

- [ ] **Step 6: 대시보드 CSS**

```css
/* teacher-dashboard/styles.css */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Pretendard', sans-serif; padding: 20px; background: #f5f5f5; }
h1 { margin-bottom: 16px; }
h2 { margin: 16px 0 8px; }
input, select, textarea, button {
  padding: 8px 12px; margin: 4px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px;
}
button { background: #4a90d9; color: white; border: none; cursor: pointer; }
button:hover { background: #357abd; }
textarea { width: 100%; height: 120px; }

table { width: 100%; border-collapse: collapse; margin-top: 16px; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
th { background: #4a90d9; color: white; }

.status-done { background: #c8e6c9; font-weight: bold; }
.status-progress { background: #fff9c4; }
.status-none { background: #f5f5f5; color: #999; }

#login-view { max-width: 300px; margin: 100px auto; text-align: center; }
#login-view input { display: block; width: 100%; margin-bottom: 8px; }
header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
```

- [ ] **Step 7: 서버에서 대시보드 정적 파일 서빙 추가**

`server/src/index.ts`에 추가:

```typescript
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 교사 대시보드 정적 파일 서빙
app.use('/dashboard', express.static(join(__dirname, '../../teacher-dashboard')));
```

- [ ] **Step 8: 수동 테스트**

Run: `cd server && npx tsx src/index.ts`
브라우저에서 `http://localhost:3000/dashboard/` 접속
Expected: 로그인 화면 표시, 회원가입 → 로그인 → 대시보드 표시

- [ ] **Step 9: 커밋**

```bash
git add server/src/websocket/ server/src/index.ts server/src/routes/quiz.ts \
        teacher-dashboard/
git commit -m "feat: WebSocket 실시간 대시보드 + 교사 SPA"
```

---

## Task 9: Phaser 3 클라이언트 기본 셋업 + 부트 씬

**Files:**
- Create: `client/public/index.html`
- Create: `client/src/main.ts`
- Create: `client/src/config.ts`
- Create: `client/src/scenes/BootScene.ts`
- Create: `client/src/api/client.ts`

- [ ] **Step 1: index.html 생성**

```html
<!-- client/public/index.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>LPC 교육 RPG</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; touch-action: none; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Phaser 설정**

```typescript
// client/src/config.ts
import Phaser from 'phaser';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 32;

export function createGameConfig(scenes: Phaser.Types.Scenes.SceneType[]): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: document.body,
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: scenes,
  };
}
```

- [ ] **Step 3: API 클라이언트 모듈**

```typescript
// client/src/api/client.ts
const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  // 학생 인증
  getClasses: () => request<any[]>('/students/class/all'),
  getStudentsByClass: (classId: number) => request<any[]>(`/students/class/${classId}`),
  getStudent: (id: number) => request<any>(`/students/${id}`),
  updateAvatar: (id: number, avatar_config: any) =>
    request<any>(`/students/${id}/avatar`, {
      method: 'PATCH',
      body: JSON.stringify({ avatar_config }),
    }),

  // 게임 콘텐츠
  getRegions: () => request<any[]>('/regions'),
  getRegionDetail: (id: number) => request<any>(`/regions/${id}`),

  // 진행도
  getProgress: (studentId: number) => request<any[]>(`/progress/student/${studentId}`),
  getRegionProgress: (studentId: number, regionId: number) =>
    request<any>(`/progress/student/${studentId}/region/${regionId}`),

  // 퀴즈
  submitQuiz: (student_id: number, question_id: number, answer: string) =>
    request<any>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ student_id, question_id, answer }),
    }),

  // 상점
  getShopItems: () => request<any[]>('/shop/items'),
  buyItem: (student_id: number, item_id: number) =>
    request<any>('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ student_id, item_id }),
    }),
  equipItem: (student_id: number, item_id: number, is_equipped: boolean) =>
    request<any>('/shop/equip', {
      method: 'PATCH',
      body: JSON.stringify({ student_id, item_id, is_equipped }),
    }),
  getInventory: (studentId: number) => request<any[]>(`/shop/inventory/${studentId}`),
};
```

- [ ] **Step 4: BootScene (에셋 로드)**

```typescript
// client/src/scenes/BootScene.ts
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // 로딩 바 표시
    const { width, height } = this.scale;
    const barW = width * 0.6;
    const barH = 30;
    const barX = (width - barW) / 2;
    const barY = height / 2;

    const bg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x333333);
    const bar = this.add.rectangle(barX, barY, 0, barH - 4, 0x4a90d9).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = barW * value;
    });

    const loadingText = this.add.text(width / 2, barY - 30, '로딩 중...', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // === 에셋 로드 ===
    // LPC 스프라이트시트 (child 체형)
    this.load.spritesheet('body_child', 'assets/sprites/body/child.png', {
      frameWidth: 64,
      frameHeight: 64,
    });

    // UI 에셋 (나중에 실제 파일로 교체 — 일단 placeholder)
    // this.load.image('btn_a', 'assets/ui/btn_a.png');
    // this.load.image('btn_b', 'assets/ui/btn_b.png');

    // 타일맵은 각 씬에서 필요할 때 로드
  }

  create() {
    this.scene.start('Login');
  }
}
```

- [ ] **Step 5: main.ts 진입점**

```typescript
// client/src/main.ts
import Phaser from 'phaser';
import { createGameConfig } from './config.js';
import { BootScene } from './scenes/BootScene.js';

// 나중에 추가될 씬들을 여기에 import
const config = createGameConfig([BootScene]);
const game = new Phaser.Game(config);
```

- [ ] **Step 6: 빌드 + 실행 확인**

Run: `cd client && npx vite`
Expected: 브라우저에서 `http://localhost:5173` 열면 로딩 바 표시 후 "Login" 씬으로 전환 시도 (아직 없으므로 콘솔에 경고)

- [ ] **Step 7: 커밋**

```bash
git add client/public/ client/src/main.ts client/src/config.ts \
        client/src/scenes/BootScene.ts client/src/api/client.ts
git commit -m "feat: Phaser 3 클라이언트 셋업 + BootScene + API 클라이언트"
```

---

## Task 10: 로그인 씬 (반 선택 → 이름 선택)

**Files:**
- Create: `client/src/scenes/LoginScene.ts`
- Modify: `client/src/main.ts`
- Modify: `server/src/routes/classes.ts` (공개 반 목록 API 추가)

- [ ] **Step 1: 서버에 공개 반 목록 API 추가**

`server/src/routes/classes.ts`에 인증 없는 라우트 추가:

```typescript
// 학생 로그인용 — 전체 반 목록 (인증 불필요)
router.get('/public', async (_req, res) => {
  const result = await pool.query(
    'SELECT id, name, school_year FROM classes ORDER BY name'
  );
  res.json(result.rows);
});
```

- [ ] **Step 2: API 클라이언트 업데이트**

`client/src/api/client.ts`의 `getClasses` 수정:

```typescript
getClasses: () => request<any[]>('/classes/public'),
```

- [ ] **Step 3: LoginScene 구현**

```typescript
// client/src/scenes/LoginScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';

export class LoginScene extends Phaser.Scene {
  private classes: any[] = [];
  private students: any[] = [];
  private selectedClassIndex = 0;
  private selectedStudentIndex = 0;
  private phase: 'class' | 'student' = 'class';

  private titleText!: Phaser.GameObjects.Text;
  private listTexts: Phaser.GameObjects.Text[] = [];
  private instructionText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Login' });
  }

  async create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    this.titleText = this.add.text(GAME_WIDTH / 2, 60, '반을 선택하세요', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '↑↓ 이동  A 선택', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    // 키보드 입력 (개발용 + 터치 컨트롤과 공존)
    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
    this.input.keyboard?.on('keydown-ESC', () => this.goBack());

    try {
      this.classes = await api.getClasses();
      this.showClassList();
    } catch (err) {
      this.titleText.setText('서버 연결 실패');
    }
  }

  private showClassList() {
    this.phase = 'class';
    this.selectedClassIndex = 0;
    this.titleText.setText('반을 선택하세요');
    this.clearList();

    this.classes.forEach((cls, i) => {
      const text = this.add.text(GAME_WIDTH / 2, 120 + i * 40, `${cls.name} (${cls.school_year})`, {
        fontSize: '18px',
        color: i === 0 ? '#ffdd57' : '#ffffff',
      }).setOrigin(0.5).setInteractive();

      text.on('pointerdown', () => {
        this.selectedClassIndex = i;
        this.confirmSelection();
      });

      this.listTexts.push(text);
    });
  }

  private async showStudentList() {
    this.phase = 'student';
    this.selectedStudentIndex = 0;
    const cls = this.classes[this.selectedClassIndex];
    this.titleText.setText(`${cls.name} — 이름을 선택하세요`);
    this.clearList();

    this.students = await api.getStudentsByClass(cls.id);

    this.students.forEach((student, i) => {
      const text = this.add.text(GAME_WIDTH / 2, 120 + i * 36, student.name, {
        fontSize: '18px',
        color: i === 0 ? '#ffdd57' : '#ffffff',
      }).setOrigin(0.5).setInteractive();

      text.on('pointerdown', () => {
        this.selectedStudentIndex = i;
        this.confirmSelection();
      });

      this.listTexts.push(text);
    });
  }

  private moveSelection(dir: number) {
    if (this.phase === 'class') {
      this.selectedClassIndex = Phaser.Math.Clamp(
        this.selectedClassIndex + dir, 0, this.classes.length - 1
      );
      this.updateHighlight(this.selectedClassIndex);
    } else {
      this.selectedStudentIndex = Phaser.Math.Clamp(
        this.selectedStudentIndex + dir, 0, this.students.length - 1
      );
      this.updateHighlight(this.selectedStudentIndex);
    }
  }

  private updateHighlight(activeIndex: number) {
    this.listTexts.forEach((t, i) => {
      t.setColor(i === activeIndex ? '#ffdd57' : '#ffffff');
    });
  }

  private confirmSelection() {
    if (this.phase === 'class') {
      this.showStudentList();
    } else {
      const student = this.students[this.selectedStudentIndex];
      // 아바타가 없으면 캐릭터 생성, 있으면 허브로
      const hasAvatar = student.avatar_config && Object.keys(student.avatar_config).length > 0;
      this.scene.start(hasAvatar ? 'Hub' : 'CharacterCreate', { student });
    }
  }

  private goBack() {
    if (this.phase === 'student') {
      this.showClassList();
    }
  }

  private clearList() {
    this.listTexts.forEach(t => t.destroy());
    this.listTexts = [];
  }
}
```

- [ ] **Step 4: main.ts에 LoginScene 등록**

```typescript
// client/src/main.ts
import { LoginScene } from './scenes/LoginScene.js';

const config = createGameConfig([BootScene, LoginScene]);
```

- [ ] **Step 5: 수동 테스트**

서버와 클라이언트 동시 실행:
Run (터미널 1): `cd server && npx tsx src/index.ts`
Run (터미널 2): `cd client && npx vite`

브라우저에서 `http://localhost:5173` 접속
Expected: "반을 선택하세요" 화면. (반이 없으면 빈 목록 — 교사 대시보드에서 반/학생 먼저 만들어야 함)

- [ ] **Step 6: 커밋**

```bash
git add client/src/scenes/LoginScene.ts client/src/main.ts \
        server/src/routes/classes.ts
git commit -m "feat: 로그인 씬 (반 선택 → 이름 드롭다운)"
```

---

## Task 11: 터치 컨트롤 오버레이

**Files:**
- Create: `client/src/ui/TouchControls.ts`

- [ ] **Step 1: 터치 컨트롤 구현**

```typescript
// client/src/ui/TouchControls.ts
import Phaser from 'phaser';

export interface TouchInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  a: boolean;
  b: boolean;
}

export class TouchControls {
  private scene: Phaser.Scene;
  private buttons: Map<string, Phaser.GameObjects.Container> = new Map();
  private input: TouchInput = { up: false, down: false, left: false, right: false, a: false, b: false };
  private aJustPressed = false;
  private bJustPressed = false;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(1000).setScrollFactor(0);
    this.createDpad();
    this.createActionButtons();
  }

  private createDpad() {
    const baseX = 90;
    const baseY = this.scene.scale.height - 90;
    const spacing = 52;
    const btnSize = 44;

    this.createButton('up', baseX, baseY - spacing, btnSize, '↑');
    this.createButton('down', baseX, baseY + spacing, btnSize, '↓');
    this.createButton('left', baseX - spacing, baseY, btnSize, '←');
    this.createButton('right', baseX + spacing, baseY, btnSize, '→');
  }

  private createActionButtons() {
    const baseX = this.scene.scale.width - 80;
    const baseY = this.scene.scale.height - 90;

    this.createButton('a', baseX, baseY + 30, 52, 'A', 0x4a90d9);
    this.createButton('b', baseX, baseY - 30, 44, 'B', 0xd94a4a);
  }

  private createButton(key: string, x: number, y: number, size: number, label: string, color = 0x555555) {
    const bg = this.scene.add.circle(0, 0, size / 2, color, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.5);
    const text = this.scene.add.text(0, 0, label, {
      fontSize: `${Math.floor(size * 0.45)}px`,
      color: '#ffffff',
    }).setOrigin(0.5);

    const container = this.scene.add.container(x, y, [bg, text]);
    bg.setInteractive();

    bg.on('pointerdown', () => {
      this.input[key as keyof TouchInput] = true;
      if (key === 'a') this.aJustPressed = true;
      if (key === 'b') this.bJustPressed = true;
      bg.setFillStyle(color, 0.7);
    });

    bg.on('pointerup', () => {
      this.input[key as keyof TouchInput] = false;
      bg.setFillStyle(color, 0.35);
    });

    bg.on('pointerout', () => {
      this.input[key as keyof TouchInput] = false;
      bg.setFillStyle(color, 0.35);
    });

    this.container.add(container);
    this.buttons.set(key, container);
  }

  getInput(): TouchInput {
    return { ...this.input };
  }

  isAJustPressed(): boolean {
    if (this.aJustPressed) {
      this.aJustPressed = false;
      return true;
    }
    return false;
  }

  isBJustPressed(): boolean {
    if (this.bJustPressed) {
      this.bJustPressed = false;
      return true;
    }
    return false;
  }

  setVisible(visible: boolean) {
    this.container.setVisible(visible);
  }

  destroy() {
    this.container.destroy();
  }
}
```

- [ ] **Step 2: 수동 테스트 — 아무 씬에서라도 import 하고 화면에 나타나는지 확인**

BootScene의 create()에 임시로 추가해서 확인:
```typescript
new TouchControls(this);
```
Expected: 좌하단 ↑←↓→ 버튼, 우하단 A/B 버튼 반투명 표시. 탭하면 색상 변화.

- [ ] **Step 3: 임시 코드 제거 + 커밋**

```bash
git add client/src/ui/TouchControls.ts
git commit -m "feat: 터치 컨트롤 오버레이 (↑←↓→ + A/B)"
```

---

## Task 12: LPC 스프라이트 렌더러 (레이어 합성)

**Files:**
- Create: `client/src/sprites/CharacterSprite.ts`

- [ ] **Step 1: LPC 레이어 합성 스프라이트 구현**

```typescript
// client/src/sprites/CharacterSprite.ts
import Phaser from 'phaser';
import type { AvatarConfig } from '../types/index.js';

// LPC 스프라이트시트 프레임 레이아웃 (ULPC 표준)
// 각 행: 특정 애니메이션, 각 열: 프레임
// Walk: 행 8-11 (상/좌/하/우), 각 9프레임
const DIRECTIONS = ['up', 'left', 'down', 'right'] as const;
type Direction = typeof DIRECTIONS[number];

const WALK_ROWS: Record<Direction, number> = {
  up: 8,
  left: 9,
  down: 10,
  right: 11,
};

const WALK_FRAMES = 9;
const FRAME_WIDTH = 64;
const FRAME_HEIGHT = 64;

// LPC 레이어 순서 (뒤→앞)
const LAYER_ORDER: (keyof AvatarConfig)[] = ['body', 'legs', 'feet', 'torso', 'hair'];

export class CharacterSprite {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private layers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private currentDirection: Direction = 'down';
  private isWalking = false;
  private avatarConfig: AvatarConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, avatarConfig: AvatarConfig) {
    this.scene = scene;
    this.avatarConfig = avatarConfig;
    this.container = scene.add.container(x, y);

    // 각 레이어에 대해 스프라이트 생성
    LAYER_ORDER.forEach(layer => {
      const key = avatarConfig[layer];
      if (!key) return;

      const textureKey = `lpc_${layer}_${key.replace('/', '_')}`;

      // 텍스처가 로드되어 있으면 스프라이트 생성
      if (scene.textures.exists(textureKey)) {
        const sprite = scene.add.sprite(0, 0, textureKey);
        sprite.setOrigin(0.5, 0.75); // LPC 발 위치 보정
        this.container.add(sprite);
        this.layers.set(layer, sprite);
      }
    });

    this.createAnimations();
    this.playIdle();
  }

  private createAnimations() {
    LAYER_ORDER.forEach(layer => {
      const key = this.avatarConfig[layer];
      if (!key) return;
      const textureKey = `lpc_${layer}_${key.replace('/', '_')}`;

      if (!this.scene.textures.exists(textureKey)) return;

      DIRECTIONS.forEach(dir => {
        const animKey = `${textureKey}_walk_${dir}`;

        if (!this.scene.anims.exists(animKey)) {
          const row = WALK_ROWS[dir];
          const frames: Phaser.Types.Animations.AnimationFrame[] = [];

          for (let i = 1; i < WALK_FRAMES; i++) { // 0은 idle 프레임
            frames.push({ key: textureKey, frame: row * 13 + i }); // 13 cols per row (ULPC)
          }

          this.scene.anims.create({
            key: animKey,
            frames,
            frameRate: 10,
            repeat: -1,
          });
        }
      });
    });
  }

  walk(direction: Direction) {
    this.currentDirection = direction;
    this.isWalking = true;

    this.layers.forEach((sprite, layer) => {
      const key = this.avatarConfig[layer as keyof AvatarConfig];
      const textureKey = `lpc_${layer}_${key?.replace('/', '_')}`;
      const animKey = `${textureKey}_walk_${direction}`;

      if (this.scene.anims.exists(animKey)) {
        sprite.play(animKey, true);
      }
    });
  }

  playIdle() {
    this.isWalking = false;

    this.layers.forEach((sprite, layer) => {
      sprite.stop();
      const row = WALK_ROWS[this.currentDirection];
      sprite.setFrame(row * 13); // idle = first frame of walk row
    });
  }

  setPosition(x: number, y: number) {
    this.container.setPosition(x, y);
  }

  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  getContainer(): Phaser.GameObjects.Container {
    return this.container;
  }

  setDepth(depth: number) {
    this.container.setDepth(depth);
  }

  destroy() {
    this.container.destroy();
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add client/src/sprites/CharacterSprite.ts
git commit -m "feat: LPC 스프라이트 레이어 합성 렌더러"
```

---

## Task 13: 캐릭터 생성 씬

**Files:**
- Create: `client/src/scenes/CharacterCreateScene.ts`
- Modify: `client/src/main.ts`

- [ ] **Step 1: CharacterCreateScene 구현**

```typescript
// client/src/scenes/CharacterCreateScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';
import type { AvatarConfig } from '../types/index.js';

interface SlotOption {
  label: string;
  value: string;
}

interface Slot {
  key: keyof AvatarConfig;
  label: string;
  options: SlotOption[];
}

const SLOTS: Slot[] = [
  {
    key: 'hair',
    label: '머리',
    options: [
      { label: '짧은 머리 (갈색)', value: 'short/brown' },
      { label: '짧은 머리 (검정)', value: 'short/black' },
      { label: '긴 머리 (갈색)', value: 'long/brown' },
      { label: '곱슬 (검정)', value: 'curly/black' },
    ],
  },
  {
    key: 'torso',
    label: '상의',
    options: [
      { label: '파란 셔츠', value: 'shirt/blue' },
      { label: '빨간 셔츠', value: 'shirt/red' },
      { label: '초록 조끼', value: 'vest/green' },
      { label: '흰 셔츠', value: 'shirt/white' },
    ],
  },
  {
    key: 'legs',
    label: '하의',
    options: [
      { label: '긴 바지 (진청)', value: 'pants/dark' },
      { label: '긴 바지 (갈색)', value: 'pants/brown' },
      { label: '반바지 (검정)', value: 'shorts/black' },
      { label: '치마 (파랑)', value: 'skirt/blue' },
    ],
  },
  {
    key: 'feet',
    label: '신발',
    options: [
      { label: '갈색 구두', value: 'shoes/brown' },
      { label: '검정 구두', value: 'shoes/black' },
      { label: '흰 운동화', value: 'shoes/white' },
    ],
  },
];

export class CharacterCreateScene extends Phaser.Scene {
  private student: any;
  private selectedOptions: number[] = [0, 0, 0, 0]; // 각 슬롯의 선택 인덱스
  private activeSlot = 0;
  private slotTexts: Phaser.GameObjects.Text[][] = [];
  private slotLabels: Phaser.GameObjects.Text[] = [];
  private previewText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CharacterCreate' });
  }

  init(data: { student: any }) {
    this.student = data.student;
  }

  create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    this.add.text(GAME_WIDTH / 2, 30, '캐릭터 만들기', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 좌측: 슬롯 선택 UI
    SLOTS.forEach((slot, si) => {
      const y = 90 + si * 120;

      const label = this.add.text(40, y, slot.label, {
        fontSize: '16px',
        color: si === 0 ? '#ffdd57' : '#aaaaaa',
        fontStyle: 'bold',
      });
      this.slotLabels.push(label);

      const optTexts: Phaser.GameObjects.Text[] = [];
      slot.options.forEach((opt, oi) => {
        const text = this.add.text(60, y + 24 + oi * 22, opt.label, {
          fontSize: '14px',
          color: oi === 0 ? '#ffdd57' : '#ffffff',
        }).setInteractive();

        text.on('pointerdown', () => {
          this.activeSlot = si;
          this.selectedOptions[si] = oi;
          this.updateDisplay();
        });

        optTexts.push(text);
      });
      this.slotTexts.push(optTexts);
    });

    // 우측: 미리보기 영역 (텍스트 placeholder — 실제 스프라이트는 에셋 준비 후)
    this.previewText = this.add.text(GAME_WIDTH - 200, 200, '[ 미리보기 ]', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // 하단: 완료 버튼
    const confirmBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '[ 완료 ]', {
      fontSize: '20px',
      color: '#4a90d9',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive();

    confirmBtn.on('pointerdown', () => this.confirmAvatar());

    // 키보드
    this.input.keyboard?.on('keydown-UP', () => this.navigate(-1, 'slot'));
    this.input.keyboard?.on('keydown-DOWN', () => this.navigate(1, 'slot'));
    this.input.keyboard?.on('keydown-LEFT', () => this.navigate(-1, 'option'));
    this.input.keyboard?.on('keydown-RIGHT', () => this.navigate(1, 'option'));
    this.input.keyboard?.on('keydown-ENTER', () => this.confirmAvatar());

    this.updateDisplay();
  }

  private navigate(dir: number, axis: 'slot' | 'option') {
    if (axis === 'slot') {
      this.activeSlot = Phaser.Math.Clamp(this.activeSlot + dir, 0, SLOTS.length - 1);
    } else {
      const maxOpt = SLOTS[this.activeSlot].options.length - 1;
      this.selectedOptions[this.activeSlot] = Phaser.Math.Clamp(
        this.selectedOptions[this.activeSlot] + dir, 0, maxOpt
      );
    }
    this.updateDisplay();
  }

  private updateDisplay() {
    // 슬롯 레이블 하이라이트
    this.slotLabels.forEach((label, si) => {
      label.setColor(si === this.activeSlot ? '#ffdd57' : '#aaaaaa');
    });

    // 옵션 하이라이트
    this.slotTexts.forEach((opts, si) => {
      opts.forEach((text, oi) => {
        if (si === this.activeSlot && oi === this.selectedOptions[si]) {
          text.setColor('#ffdd57');
        } else if (oi === this.selectedOptions[si]) {
          text.setColor('#88cc88');
        } else {
          text.setColor('#ffffff');
        }
      });
    });

    // 미리보기 텍스트 업데이트
    const config = this.buildAvatarConfig();
    this.previewText.setText(
      `머리: ${config.hair}\n상의: ${config.torso}\n하의: ${config.legs}\n신발: ${config.feet}`
    );
  }

  private buildAvatarConfig(): AvatarConfig {
    return {
      body: 'child/light',
      hair: SLOTS[0].options[this.selectedOptions[0]].value,
      torso: SLOTS[1].options[this.selectedOptions[1]].value,
      legs: SLOTS[2].options[this.selectedOptions[2]].value,
      feet: SLOTS[3].options[this.selectedOptions[3]].value,
    };
  }

  private async confirmAvatar() {
    const avatarConfig = this.buildAvatarConfig();

    try {
      await api.updateAvatar(this.student.id, avatarConfig);
      this.student.avatar_config = avatarConfig;
      this.scene.start('Hub', { student: this.student });
    } catch (err) {
      console.error('Failed to save avatar:', err);
    }
  }
}
```

- [ ] **Step 2: main.ts에 씬 등록**

```typescript
import { CharacterCreateScene } from './scenes/CharacterCreateScene.js';

const config = createGameConfig([BootScene, LoginScene, CharacterCreateScene]);
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/scenes/CharacterCreateScene.ts client/src/main.ts
git commit -m "feat: 캐릭터 생성 씬 (4슬롯 선택 UI)"
```

---

## Task 14: 대화 시스템 + 퀴즈 모달 UI

**Files:**
- Create: `client/src/ui/DialogueBox.ts`
- Create: `client/src/ui/QuizModal.ts`
- Create: `client/src/ui/HUD.ts`

- [ ] **Step 1: DialogueBox 구현 (NPC 스토리 대화)**

```typescript
// client/src/ui/DialogueBox.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private promptText: Phaser.GameObjects.Text;
  private dialogues: string[] = [];
  private currentIndex = 0;
  private onComplete?: () => void;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const boxY = GAME_HEIGHT - 160;
    const boxH = 140;
    const margin = 16;

    const bg = scene.add.rectangle(GAME_WIDTH / 2, boxY + boxH / 2, GAME_WIDTH - 20, boxH, 0x000000, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.6);

    this.nameText = scene.add.text(margin + 10, boxY + 8, '', {
      fontSize: '14px',
      color: '#ffdd57',
      fontStyle: 'bold',
    });

    this.bodyText = scene.add.text(margin + 10, boxY + 30, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: GAME_WIDTH - 60 },
      lineSpacing: 4,
    });

    this.promptText = scene.add.text(GAME_WIDTH - 30, boxY + boxH - 16, '▼', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    this.container = scene.add.container(0, 0, [bg, this.nameText, this.bodyText, this.promptText]);
    this.container.setDepth(900).setScrollFactor(0);
    this.container.setVisible(false);
  }

  show(npcName: string, dialogues: string[], onComplete?: () => void) {
    this.dialogues = dialogues;
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.nameText.setText(npcName);
    this.visible = true;
    this.container.setVisible(true);
    this.showCurrentLine();
  }

  private showCurrentLine() {
    if (this.currentIndex < this.dialogues.length) {
      this.bodyText.setText(this.dialogues[this.currentIndex]);
      const isLast = this.currentIndex === this.dialogues.length - 1;
      this.promptText.setText(isLast ? '▶' : '▼');
    }
  }

  advance(): boolean {
    if (!this.visible) return false;

    this.currentIndex++;
    if (this.currentIndex >= this.dialogues.length) {
      this.hide();
      this.onComplete?.();
      return true; // dialogue complete
    }

    this.showCurrentLine();
    return false;
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
  }

  isVisible(): boolean {
    return this.visible;
  }
}
```

- [ ] **Step 2: QuizModal 구현 (4가지 퀴즈 유형)**

```typescript
// client/src/ui/QuizModal.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import type { QuizContent, BlankFillContent, MultipleChoiceContent, MatchingContent, OXContent } from '../types/index.js';

export class QuizModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onAnswer?: (answer: string) => void;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(950).setScrollFactor(0);
    this.container.setVisible(false);
  }

  show(content: QuizContent, onAnswer: (answer: string) => void) {
    this.clear();
    this.onAnswer = onAnswer;
    this.visible = true;
    this.container.setVisible(true);

    // 반투명 배경
    const overlay = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);
    this.container.add(overlay);

    // 모달 박스
    const modalW = GAME_WIDTH - 80;
    const modalH = GAME_HEIGHT - 120;
    const modalBg = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, modalW, modalH, 0x1a1a2e, 0.95)
      .setStrokeStyle(2, 0x4a90d9);
    this.container.add(modalBg);

    switch (content.type) {
      case 'blank_fill': this.renderBlankFill(content); break;
      case 'multiple_choice': this.renderMultipleChoice(content); break;
      case 'matching': this.renderMatching(content); break;
      case 'ox': this.renderOX(content); break;
    }
  }

  private renderBlankFill(content: BlankFillContent) {
    const cx = GAME_WIDTH / 2;

    this.addText(cx, 160, content.sentence, 16, '#ffffff');

    content.options.forEach((opt, i) => {
      this.addButton(cx, 250 + i * 50, opt, () => {
        this.onAnswer?.(opt);
        this.hide();
      });
    });
  }

  private renderMultipleChoice(content: MultipleChoiceContent) {
    const cx = GAME_WIDTH / 2;

    this.addText(cx, 140, content.question, 16, '#ffffff');

    content.options.forEach((opt, i) => {
      this.addButton(cx, 230 + i * 50, `${i + 1}. ${opt}`, () => {
        this.onAnswer?.(String(i));
        this.hide();
      });
    });
  }

  private renderMatching(content: MatchingContent) {
    const cx = GAME_WIDTH / 2;
    this.addText(cx, 130, '왼쪽과 오른쪽을 짝지어 보세요', 16, '#ffffff');

    // 단순화 버전: 왼쪽은 고정, 오른쪽 옵션을 탭하여 순서대로 매칭
    const shuffledRight = [...content.pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
    const matched: string[] = [];
    let currentLeft = 0;

    const leftTexts: Phaser.GameObjects.Text[] = [];
    const rightButtons: Phaser.GameObjects.Text[] = [];

    content.pairs.forEach((pair, i) => {
      const lt = this.addText(180, 180 + i * 45, pair.left, 14, '#ffdd57');
      leftTexts.push(lt);
    });

    const updateDisplay = () => {
      leftTexts.forEach((lt, i) => {
        lt.setColor(i === currentLeft ? '#ffdd57' : (i < currentLeft ? '#88cc88' : '#ffffff'));
      });
    };

    shuffledRight.forEach((right, i) => {
      const btn = this.addButton(GAME_WIDTH - 200, 180 + i * 45, right, () => {
        matched.push(right);
        btn.setColor('#88cc88');
        btn.disableInteractive();
        currentLeft++;

        if (currentLeft >= content.pairs.length) {
          // 정답 확인: matched 순서가 원래 pairs의 right와 일치하는지
          const answer = matched.join('|');
          this.onAnswer?.(answer);
          this.hide();
        } else {
          updateDisplay();
        }
      });
      rightButtons.push(btn);
    });

    updateDisplay();
  }

  private renderOX(content: OXContent) {
    const cx = GAME_WIDTH / 2;

    this.addText(cx, 180, content.statement, 18, '#ffffff');

    this.addButton(cx - 80, 320, 'O', () => {
      this.onAnswer?.('O');
      this.hide();
    }, 60, 0x4a90d9);

    this.addButton(cx + 80, 320, 'X', () => {
      this.onAnswer?.('X');
      this.hide();
    }, 60, 0xd94a4a);
  }

  private addText(x: number, y: number, content: string, size: number, color: string): Phaser.GameObjects.Text {
    const text = this.scene.add.text(x, y, content, {
      fontSize: `${size}px`,
      color,
      wordWrap: { width: GAME_WIDTH - 120 },
      align: 'center',
    }).setOrigin(0.5);
    this.container.add(text);
    return text;
  }

  private addButton(x: number, y: number, label: string, onClick: () => void, width = 300, bgColor = 0x333355): Phaser.GameObjects.Text {
    const bg = this.scene.add.rectangle(x, y, width, 38, bgColor, 0.8)
      .setStrokeStyle(1, 0xffffff, 0.3)
      .setInteractive({ useHandCursor: true });

    const text = this.scene.add.text(x, y, label, {
      fontSize: '15px',
      color: '#ffffff',
    }).setOrigin(0.5);

    bg.on('pointerdown', onClick);
    bg.on('pointerover', () => bg.setFillStyle(bgColor, 1));
    bg.on('pointerout', () => bg.setFillStyle(bgColor, 0.8));

    this.container.add([bg, text]);
    return text;
  }

  hide() {
    this.visible = false;
    this.container.setVisible(false);
    this.clear();
  }

  private clear() {
    this.container.removeAll(true);
  }

  isVisible(): boolean {
    return this.visible;
  }
}
```

- [ ] **Step 3: HUD (코인 표시)**

```typescript
// client/src/ui/HUD.ts
import Phaser from 'phaser';
import { GAME_WIDTH } from '../config.js';

export class HUD {
  private scene: Phaser.Scene;
  private coinText: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, initialCoins: number) {
    this.scene = scene;

    const bg = scene.add.rectangle(GAME_WIDTH - 70, 25, 120, 30, 0x000000, 0.5)
      .setStrokeStyle(1, 0xffd700, 0.5);

    this.coinText = scene.add.text(GAME_WIDTH - 70, 25, `💰 ${initialCoins}`, {
      fontSize: '16px',
      color: '#ffd700',
    }).setOrigin(0.5);

    this.container = scene.add.container(0, 0, [bg, this.coinText]);
    this.container.setDepth(800).setScrollFactor(0);
  }

  updateCoins(coins: number) {
    this.coinText.setText(`💰 ${coins}`);
  }

  destroy() {
    this.container.destroy();
  }
}
```

- [ ] **Step 4: 커밋**

```bash
git add client/src/ui/DialogueBox.ts client/src/ui/QuizModal.ts client/src/ui/HUD.ts
git commit -m "feat: 대화창 + 퀴즈 모달 (4유형) + HUD"
```

---

## Task 15: 허브 월드 씬

**Files:**
- Create: `client/src/scenes/HubScene.ts`
- Modify: `client/src/main.ts`

- [ ] **Step 1: HubScene 구현**

```typescript
// client/src/scenes/HubScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config.js';
import { TouchControls } from '../ui/TouchControls.js';
import { HUD } from '../ui/HUD.js';
import { api } from '../api/client.js';

const PLAYER_SPEED = 120;

export class HubScene extends Phaser.Scene {
  private student: any;
  private controls!: TouchControls;
  private hud!: HUD;
  private player!: Phaser.GameObjects.Rectangle; // placeholder until sprite
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  // 지역 입구들
  private portals: { rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text; regionId: number; active: boolean }[] = [];
  private shopZone!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'Hub' });
  }

  init(data: { student: any }) {
    this.student = data.student;
  }

  async create() {
    // 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x3a7d44);

    // 바닥 타일 (간단한 그리드)
    for (let x = 0; x < GAME_WIDTH; x += TILE_SIZE) {
      for (let y = 0; y < GAME_HEIGHT; y += TILE_SIZE) {
        this.add.rectangle(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE - 1, TILE_SIZE - 1, 0x4a8c54, 0.3);
      }
    }

    // 허브 타이틀
    this.add.text(GAME_WIDTH / 2, 30, '🏘️ 학습 마을', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setDepth(100);

    // 지역 입구 포탈 (6개, v1은 1번만 활성)
    const regions = await api.getRegions().catch(() => []);
    const portalPositions = [
      { x: 200, y: 150 }, { x: 500, y: 150 }, { x: 200, y: 300 },
      { x: 500, y: 300 }, { x: 200, y: 450 }, { x: 500, y: 450 },
    ];

    for (let i = 0; i < 6; i++) {
      const pos = portalPositions[i];
      const region = regions[i];
      const active = !!region;
      const color = active ? 0x4a90d9 : 0x666666;

      const rect = this.add.rectangle(pos.x, pos.y, 80, 60, color, 0.7)
        .setStrokeStyle(2, active ? 0xffffff : 0x888888);

      const label = this.add.text(pos.x, pos.y, region?.name || `지역 ${i + 1}\n(준비중)`, {
        fontSize: '11px',
        color: active ? '#ffffff' : '#999999',
        align: 'center',
      }).setOrigin(0.5);

      this.portals.push({
        rect, label,
        regionId: region?.id || 0,
        active,
      });
    }

    // 상점
    this.shopZone = this.add.rectangle(GAME_WIDTH - 100, GAME_HEIGHT / 2, 70, 70, 0xd4a017, 0.7)
      .setStrokeStyle(2, 0xffd700);
    this.add.text(GAME_WIDTH - 100, GAME_HEIGHT / 2, '상점', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // 플레이어 (placeholder)
    this.player = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 24, 32, 0xff6b6b)
      .setDepth(500);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // 컨트롤
    this.controls = new TouchControls(this);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.hud = new HUD(this, this.student.coins);
  }

  update() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const touch = this.controls.getInput();

    // 이동
    let vx = 0, vy = 0;
    if (touch.left || this.cursors.left.isDown) vx = -PLAYER_SPEED;
    if (touch.right || this.cursors.right.isDown) vx = PLAYER_SPEED;
    if (touch.up || this.cursors.up.isDown) vy = -PLAYER_SPEED;
    if (touch.down || this.cursors.down.isDown) vy = PLAYER_SPEED;
    body.setVelocity(vx, vy);

    // A버튼 / Enter — 포탈 or 상점 진입
    const aPressed = this.controls.isAJustPressed() || Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ENTER'));
    if (aPressed) {
      this.checkPortalEnter();
      this.checkShopEnter();
    }
  }

  private checkPortalEnter() {
    const px = this.player.x;
    const py = this.player.y;

    for (const portal of this.portals) {
      if (!portal.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, portal.rect.x, portal.rect.y);
      if (dist < 50) {
        this.controls.destroy();
        this.hud.destroy();
        this.scene.start('Region', { student: this.student, regionId: portal.regionId });
        return;
      }
    }
  }

  private checkShopEnter() {
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shopZone.x, this.shopZone.y);
    if (dist < 50) {
      this.controls.destroy();
      this.hud.destroy();
      this.scene.start('Shop', { student: this.student });
    }
  }
}
```

- [ ] **Step 2: main.ts에 씬 등록**

```typescript
import { HubScene } from './scenes/HubScene.js';

const config = createGameConfig([BootScene, LoginScene, CharacterCreateScene, HubScene]);
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/scenes/HubScene.ts client/src/main.ts
git commit -m "feat: 허브 월드 씬 (포탈 6개 + 상점 + 이동)"
```

---

## Task 16: 지역 씬 (NPC 탐험 + 대화 + 퀴즈 통합)

**Files:**
- Create: `client/src/scenes/RegionScene.ts`
- Modify: `client/src/main.ts`

- [ ] **Step 1: RegionScene 구현 (핵심 게임 루프)**

```typescript
// client/src/scenes/RegionScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../config.js';
import { TouchControls } from '../ui/TouchControls.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { QuizModal } from '../ui/QuizModal.js';
import { HUD } from '../ui/HUD.js';
import { api } from '../api/client.js';
import type { NPC, Question, QuizContent } from '../types/index.js';

const PLAYER_SPEED = 120;

interface NPCSprite {
  npc: NPC;
  sprite: Phaser.GameObjects.Rectangle; // placeholder
  label: Phaser.GameObjects.Text;
  checkmark: Phaser.GameObjects.Text;
  cleared: boolean;
}

export class RegionScene extends Phaser.Scene {
  private student: any;
  private regionId!: number;
  private controls!: TouchControls;
  private dialogue!: DialogueBox;
  private quizModal!: QuizModal;
  private hud!: HUD;
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  private npcSprites: NPCSprite[] = [];
  private questions: Map<number, Question[]> = new Map(); // npc_id → questions
  private activeNPC: NPCSprite | null = null;
  private interactionPhase: 'none' | 'dialogue_before' | 'quiz' | 'dialogue_after' = 'none';

  constructor() {
    super({ key: 'Region' });
  }

  init(data: { student: any; regionId: number }) {
    this.student = data.student;
    this.regionId = data.regionId;
  }

  async create() {
    // 배경
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d572c);

    // 데이터 로드
    const regionData = await api.getRegionDetail(this.regionId);
    const progress = await api.getProgress(this.student.id);
    const clearedNpcIds = new Set(progress.filter(p => p.is_cleared).map(p => p.npc_id));

    // 지역 도입 나레이션
    this.dialogue = new DialogueBox(this);
    this.quizModal = new QuizModal(this);
    this.hud = new HUD(this, this.student.coins);
    this.controls = new TouchControls(this);
    this.cursors = this.input.keyboard!.createCursorKeys();

    // 질문 맵 구성
    regionData.questions.forEach((q: Question) => {
      if (!this.questions.has(q.npc_id)) {
        this.questions.set(q.npc_id, []);
      }
      this.questions.get(q.npc_id)!.push(q);
    });

    // NPC 배치
    regionData.npcs.forEach((npc: NPC) => {
      const sprite = this.add.rectangle(npc.position_x, npc.position_y, 28, 36, 0x6a5acd)
        .setDepth(400);

      const label = this.add.text(npc.position_x, npc.position_y - 28, npc.name, {
        fontSize: '11px',
        color: '#ffffff',
        backgroundColor: '#00000088',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(401);

      const cleared = clearedNpcIds.has(npc.id);
      const checkmark = this.add.text(npc.position_x + 16, npc.position_y - 20, '✓', {
        fontSize: '14px',
        color: '#4aff4a',
      }).setOrigin(0.5).setDepth(401).setVisible(cleared);

      this.npcSprites.push({ npc, sprite, label, checkmark, cleared });
    });

    // 플레이어
    this.player = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 80, 24, 32, 0xff6b6b)
      .setDepth(500);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    // 도입 나레이션 표시
    if (regionData.region.intro_dialogue?.length > 0) {
      this.controls.setVisible(false);
      this.dialogue.show('나레이션', regionData.region.intro_dialogue, () => {
        this.controls.setVisible(true);
      });
    }
  }

  update() {
    // 대화/퀴즈 중에는 이동 차단
    if (this.dialogue.isVisible() || this.quizModal.isVisible()) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);

      // A버튼으로 대화 진행
      const aPressed = this.controls.isAJustPressed() || Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ENTER'));
      if (aPressed && this.dialogue.isVisible()) {
        this.dialogue.advance();
      }

      // B버튼으로 허브 복귀 (대화 중이 아닐 때)
      return;
    }

    // 이동
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const touch = this.controls.getInput();
    let vx = 0, vy = 0;
    if (touch.left || this.cursors.left.isDown) vx = -PLAYER_SPEED;
    if (touch.right || this.cursors.right.isDown) vx = PLAYER_SPEED;
    if (touch.up || this.cursors.up.isDown) vy = -PLAYER_SPEED;
    if (touch.down || this.cursors.down.isDown) vy = PLAYER_SPEED;
    body.setVelocity(vx, vy);

    // A버튼 — NPC 대화 시작
    const aPressed = this.controls.isAJustPressed() || Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ENTER'));
    if (aPressed) {
      this.tryInteractNPC();
    }

    // B버튼 — 허브 복귀
    const bPressed = this.controls.isBJustPressed() || Phaser.Input.Keyboard.JustDown(this.input.keyboard!.addKey('ESC'));
    if (bPressed) {
      this.returnToHub();
    }
  }

  private tryInteractNPC() {
    for (const npcSprite of this.npcSprites) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        npcSprite.sprite.x, npcSprite.sprite.y
      );

      if (dist < 50) {
        this.startNPCInteraction(npcSprite);
        return;
      }
    }
  }

  private startNPCInteraction(npcSprite: NPCSprite) {
    this.activeNPC = npcSprite;
    this.controls.setVisible(false);
    const npc = npcSprite.npc;

    if (npcSprite.cleared) {
      // 이미 클리어 — dialogue_after만 표시
      this.dialogue.show(npc.name, npc.dialogue_after, () => {
        this.controls.setVisible(true);
        this.activeNPC = null;
      });
      return;
    }

    // Phase 1: 스토리 대화
    this.interactionPhase = 'dialogue_before';
    this.dialogue.show(npc.name, npc.dialogue_before, () => {
      // Phase 2: 퀴즈
      this.interactionPhase = 'quiz';
      const npcQuestions = this.questions.get(npc.id);
      if (!npcQuestions || npcQuestions.length === 0) {
        this.finishNPCInteraction(true);
        return;
      }

      const question = npcQuestions[0]; // 첫 번째 문제
      this.quizModal.show(question.content, async (answer) => {
        const result = await api.submitQuiz(this.student.id, question.id, answer);

        if (result.is_correct) {
          this.student.coins += result.coins_earned;
          this.hud.updateCoins(this.student.coins);

          // Phase 3: 정답 반응
          this.dialogue.show(npc.name, npc.dialogue_correct, () => {
            npcSprite.cleared = true;
            npcSprite.checkmark.setVisible(true);

            // 다음 NPC 힌트
            if (npc.next_npc_hint) {
              this.dialogue.show(npc.name, [npc.next_npc_hint], () => {
                this.finishNPCInteraction(true);
              });
            } else {
              this.finishNPCInteraction(true);
            }
          });
        } else {
          // 오답 — 힌트 대사 후 재도전
          this.dialogue.show(npc.name, npc.dialogue_wrong, () => {
            // 다시 퀴즈 표시
            this.quizModal.show(question.content, async (retryAnswer) => {
              const retryResult = await api.submitQuiz(this.student.id, question.id, retryAnswer);
              if (retryResult.is_correct) {
                this.student.coins += retryResult.coins_earned;
                this.hud.updateCoins(this.student.coins);
                this.dialogue.show(npc.name, npc.dialogue_correct, () => {
                  npcSprite.cleared = true;
                  npcSprite.checkmark.setVisible(true);
                  this.finishNPCInteraction(true);
                });
              } else {
                // 계속 재도전 — 간단히 재귀 대신 정답 표시
                this.dialogue.show(npc.name, ['다시 한번 잘 생각해보렴...'], () => {
                  this.finishNPCInteraction(false);
                });
              }
            });
          });
        }
      });
    });
  }

  private async finishNPCInteraction(checkCompletion: boolean) {
    this.controls.setVisible(true);
    this.activeNPC = null;
    this.interactionPhase = 'none';

    if (checkCompletion) {
      // 전체 클리어 확인
      const allCleared = this.npcSprites.every(ns => ns.cleared);
      if (allCleared) {
        // 에필로그 + 보너스 코인
        this.student.coins += 30;
        this.hud.updateCoins(this.student.coins);
        this.controls.setVisible(false);

        this.dialogue.show('나레이션', ['축하합니다! 이 지역을 모두 탐험했어요! 🎉', '보너스 코인 30개를 획득했습니다!'], () => {
          this.returnToHub();
        });
      }
    }
  }

  private returnToHub() {
    this.controls.destroy();
    this.hud.destroy();
    this.scene.start('Hub', { student: this.student });
  }
}
```

- [ ] **Step 2: main.ts에 씬 등록**

```typescript
import { RegionScene } from './scenes/RegionScene.js';

const config = createGameConfig([BootScene, LoginScene, CharacterCreateScene, HubScene, RegionScene]);
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/scenes/RegionScene.ts client/src/main.ts
git commit -m "feat: 지역 씬 (NPC 대화 → 퀴즈 → 진행도 통합)"
```

---

## Task 17: 상점 씬

**Files:**
- Create: `client/src/scenes/ShopScene.ts`
- Modify: `client/src/main.ts`

- [ ] **Step 1: ShopScene 구현**

```typescript
// client/src/scenes/ShopScene.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { api } from '../api/client.js';
import type { ShopItem } from '../types/index.js';

export class ShopScene extends Phaser.Scene {
  private student: any;
  private items: ShopItem[] = [];
  private ownedItemIds: Set<number> = new Set();
  private selectedIndex = 0;
  private itemTexts: Phaser.GameObjects.Text[] = [];
  private coinText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Shop' });
  }

  init(data: { student: any }) {
    this.student = data.student;
  }

  async create() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e);

    this.add.text(GAME_WIDTH / 2, 30, '🛍️ 상점', {
      fontSize: '24px',
      color: '#ffd700',
    }).setOrigin(0.5);

    this.coinText = this.add.text(GAME_WIDTH - 20, 30, `💰 ${this.student.coins}`, {
      fontSize: '16px',
      color: '#ffd700',
    }).setOrigin(1, 0.5);

    // 데이터 로드
    this.items = await api.getShopItems();
    const inventory = await api.getInventory(this.student.id);
    this.ownedItemIds = new Set(inventory.map((item: any) => item.id));

    // 아이템 목록
    this.items.forEach((item, i) => {
      const owned = this.ownedItemIds.has(item.id);
      const text = this.add.text(40, 80 + i * 36,
        `${owned ? '✓ ' : '  '}${item.name} (${item.category}) — ${item.price}코인`,
        {
          fontSize: '14px',
          color: owned ? '#88cc88' : (i === 0 ? '#ffdd57' : '#ffffff'),
        }
      ).setInteractive();

      text.on('pointerdown', () => {
        this.selectedIndex = i;
        this.updateHighlight();
      });

      this.itemTexts.push(text);
    });

    // 하단: 설명 + 구매 버튼
    this.descText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 90, '', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    const buyBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, '[ 구매 (A) ]', {
      fontSize: '18px',
      color: '#4a90d9',
    }).setOrigin(0.5).setInteractive();
    buyBtn.on('pointerdown', () => this.buySelected());

    const backBtn = this.add.text(40, GAME_HEIGHT - 30, '← 돌아가기 (B)', {
      fontSize: '14px',
      color: '#888888',
    }).setInteractive();
    backBtn.on('pointerdown', () => this.returnToHub());

    // 키보드
    this.input.keyboard?.on('keydown-UP', () => { this.selectedIndex = Math.max(0, this.selectedIndex - 1); this.updateHighlight(); });
    this.input.keyboard?.on('keydown-DOWN', () => { this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1); this.updateHighlight(); });
    this.input.keyboard?.on('keydown-ENTER', () => this.buySelected());
    this.input.keyboard?.on('keydown-ESC', () => this.returnToHub());

    this.updateHighlight();
  }

  private updateHighlight() {
    this.itemTexts.forEach((t, i) => {
      const owned = this.ownedItemIds.has(this.items[i].id);
      if (i === this.selectedIndex) {
        t.setColor('#ffdd57');
      } else if (owned) {
        t.setColor('#88cc88');
      } else {
        t.setColor('#ffffff');
      }
    });

    const selected = this.items[this.selectedIndex];
    if (selected) {
      const owned = this.ownedItemIds.has(selected.id);
      this.descText.setText(owned ? '이미 보유 중' : `${selected.name} — ${selected.price}코인`);
    }
  }

  private async buySelected() {
    const item = this.items[this.selectedIndex];
    if (!item || this.ownedItemIds.has(item.id)) return;
    if (this.student.coins < item.price) {
      this.descText.setText('코인이 부족합니다!').setColor('#ff4444');
      return;
    }

    try {
      const result = await api.buyItem(this.student.id, item.id);
      this.student.coins = result.remaining_coins;
      this.coinText.setText(`💰 ${this.student.coins}`);
      this.ownedItemIds.add(item.id);
      this.updateHighlight();
      this.descText.setText('구매 완료!').setColor('#88cc88');
    } catch (err) {
      this.descText.setText('구매 실패').setColor('#ff4444');
    }
  }

  private returnToHub() {
    this.scene.start('Hub', { student: this.student });
  }
}
```

- [ ] **Step 2: main.ts에 씬 등록**

```typescript
import { ShopScene } from './scenes/ShopScene.js';

const config = createGameConfig([BootScene, LoginScene, CharacterCreateScene, HubScene, RegionScene, ShopScene]);
```

- [ ] **Step 3: 커밋**

```bash
git add client/src/scenes/ShopScene.ts client/src/main.ts
git commit -m "feat: 상점 씬 (아이템 목록, 구매, 인벤토리)"
```

---

## Task 18: v1 콘텐츠 시드 데이터 + DB 로더

**Files:**
- Create: `server/src/db/seed.sql`
- Create: `tools/seed-content.ts`
- Create: `content/6-1-사회/1-1_story_config.json` (placeholder 구조)

- [ ] **Step 1: seed.sql (기본 아이템 + 테스트 교사/반)**

```sql
-- server/src/db/seed.sql

-- 테스트 교사 (password: test1234)
INSERT INTO teachers (login_id, password_hash) VALUES
  ('teacher', '$2b$10$placeholder_hash_to_be_replaced')
ON CONFLICT (login_id) DO NOTHING;

-- 상점 아이템 (v1)
INSERT INTO items (name, category, lpc_sprite_path, price) VALUES
  ('빨간 리본', 'hair', 'hair/ribbon_red.png', 20),
  ('마법사 모자', 'hat', 'hat/wizard.png', 40),
  ('왕관', 'hat', 'hat/crown_gold.png', 80),
  ('갑옷 상의', 'torso', 'torso/armor_silver.png', 60),
  ('빨간 망토', 'cape', 'cape/red.png', 50),
  ('파란 망토', 'cape', 'cape/blue.png', 50),
  ('나무 검', 'weapon', 'weapon/sword_wood.png', 30),
  ('마법 지팡이', 'weapon', 'weapon/staff_magic.png', 70),
  ('가죽 부츠', 'feet', 'feet/boots_leather.png', 25),
  ('은색 레깅스', 'legs', 'legs/leggings_silver.png', 45),
  ('초록 치마', 'legs', 'legs/skirt_green.png', 35),
  ('금색 어깨갑옷', 'torso', 'torso/shoulders_gold.png', 90),
  ('검은 부츠', 'feet', 'feet/boots_black.png', 30),
  ('보라 머리띠', 'hair', 'hair/band_purple.png', 25),
  ('철 방패', 'weapon', 'weapon/shield_iron.png', 100)
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: story_config.json placeholder 구조**

```json
// content/6-1-사회/1-1_story_config.json
{
  "region": {
    "name": "1-1 평화통일을 위한 노력",
    "theme": "한반도 접경 마을",
    "intro_dialogue": [
      "여기는 휴전선 근처의 작은 마을이야.",
      "이 마을에는 분단의 아픔을 간직한 사람들이 살고 있단다.",
      "그들의 이야기를 들어볼래?"
    ],
    "epilogue_dialogue": [
      "이 마을에서 만난 사람들은 모두 같은 꿈을 꾸고 있었어.",
      "다시 하나가 되는 그 날을..."
    ],
    "story_synopsis": "분단 마을에서 실향민, 군인, 이산가족 등을 만나며 통일의 필요성을 느끼는 이야기"
  },
  "npcs": [
    {
      "name": "실향민 할아버지",
      "character_desc": "80대, 함경도 사투리, 따뜻하지만 슬픈 눈",
      "story_phase": "intro",
      "position_x": 200,
      "position_y": 150,
      "quiz_type": "blank_fill",
      "quiz_difficulty": "easy",
      "sort_order": 1,
      "dialogue_before": [
        "어서 오너라, 젊은이.",
        "나는 함흥에서 태어났단다. 1950년 그 여름, 포격 소리에 잠을 깼지.",
        "가족과 헤어져 여기까지 왔어. 60년이 넘었구나..."
      ],
      "dialogue_correct": [
        "그래, 맞아. 역시 똑똑하구나.",
        "저 시절을 잊지 않아줘서 고맙다."
      ],
      "dialogue_wrong": [
        "허허, 다시 한번 생각해보렴.",
        "내가 고향을 떠난 그 해를 잘 떠올려보거라..."
      ],
      "dialogue_after": [
        "저기 철책 근처에 젊은 군인이 있을 거야.",
        "그 친구한테도 가보렴. 지금 이 상황을 잘 알려줄 거야."
      ],
      "next_npc_hint": "저기 초소에 있는 군인에게 가보렴.",
      "questions": [
        {
          "content": {
            "type": "blank_fill",
            "sentence": "1950년에 일어난 _____으로 인해 많은 사람들이 고향을 잃었습니다.",
            "options": ["6·25 전쟁", "임진왜란", "한국 광복", "4·19 혁명"]
          },
          "correct_answer": "6·25 전쟁",
          "coin_reward": 10
        }
      ]
    }
  ]
}
```

> **NOTE:** 이 JSON은 placeholder 구조입니다. 실제 스토리 콘텐츠는 교과서 PDF에서 핵심개념 추출 후 `/game-story` 스킬로 생성합니다. 위 예시는 NPC 1명분이며, v1 완성 시 5~7명 NPC가 5막 구조로 배치됩니다.

- [ ] **Step 3: seed-content.ts (story_config → DB 로더)**

```typescript
// tools/seed-content.ts
import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seedContent() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const contentDir = join(__dirname, '../content');
  const subjects = readdirSync(contentDir);

  for (const subject of subjects) {
    const subjectDir = join(contentDir, subject);
    const files = readdirSync(subjectDir).filter(f => f.endsWith('_story_config.json'));

    for (const file of files) {
      const config = JSON.parse(readFileSync(join(subjectDir, file), 'utf-8'));
      console.log(`Loading: ${file}`);

      // Region 삽입
      const regionResult = await client.query(
        `INSERT INTO regions (name, theme, intro_dialogue, ending_dialogue, epilogue_dialogue, story_synopsis, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          config.region.name,
          config.region.theme,
          JSON.stringify(config.region.intro_dialogue || []),
          JSON.stringify(config.region.ending_dialogue || []),
          JSON.stringify(config.region.epilogue_dialogue || []),
          config.region.story_synopsis || '',
          config.region.sort_order || 1,
        ]
      );

      if (regionResult.rows.length === 0) {
        console.log(`  Region "${config.region.name}" already exists, skipping.`);
        continue;
      }

      const regionId = regionResult.rows[0].id;

      // NPC + Questions 삽입
      for (const npc of config.npcs) {
        const npcResult = await client.query(
          `INSERT INTO npcs (region_id, name, character_desc, story_phase,
             dialogue_before, dialogue_correct, dialogue_wrong, dialogue_after,
             next_npc_hint, position_x, position_y, quiz_type, quiz_difficulty, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           RETURNING id`,
          [
            regionId, npc.name, npc.character_desc, npc.story_phase,
            JSON.stringify(npc.dialogue_before),
            JSON.stringify(npc.dialogue_correct),
            JSON.stringify(npc.dialogue_wrong),
            JSON.stringify(npc.dialogue_after),
            npc.next_npc_hint,
            npc.position_x, npc.position_y,
            npc.quiz_type, npc.quiz_difficulty, npc.sort_order,
          ]
        );

        const npcId = npcResult.rows[0].id;

        for (const q of npc.questions || []) {
          await client.query(
            'INSERT INTO questions (npc_id, content, correct_answer, coin_reward) VALUES ($1, $2, $3, $4)',
            [npcId, JSON.stringify(q.content), q.correct_answer, q.coin_reward || 10]
          );
        }

        console.log(`  NPC "${npc.name}" + ${npc.questions?.length || 0} questions`);
      }
    }
  }

  console.log('Content seeding complete.');
  await client.end();
}

seedContent().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 4: 시드 실행**

Run: `cd server && npx tsx src/db/init.ts && psql lpc_rpg -f src/db/seed.sql && npx tsx ../tools/seed-content.ts`
Expected: 스키마 생성 → 기본 아이템 삽입 → 콘텐츠 로드 완료

- [ ] **Step 5: 커밋**

```bash
git add server/src/db/seed.sql tools/seed-content.ts content/
git commit -m "feat: v1 시드 데이터 + story_config 로더"
```

---

## Task 19: End-to-End 수동 검증

**Files:** (수정 없음 — 검증만)

- [ ] **Step 1: 서버 + 클라이언트 동시 실행**

```bash
# 터미널 1
cd server && npx tsx src/index.ts

# 터미널 2
cd client && npx vite
```

- [ ] **Step 2: 교사 대시보드 검증**

1. `http://localhost:3000/dashboard/` 접속
2. 회원가입 (teacher / test1234)
3. 반 만들기 (6학년 3반 / 2026-1학기)
4. 학생 일괄 등록 (김민수, 이서연, 박지호)
5. Expected: 대시보드에 학생 3명 표시, 지역 1개 그리드

- [ ] **Step 3: 학생 게임 플레이 검증**

1. `http://localhost:5173` 접속 (또는 태블릿 브라우저)
2. 반 선택 → 이름 선택 (김민수)
3. 캐릭터 생성 → 허브 월드 진입
4. 지역 1 포탈 진입 → NPC와 대화 → 퀴즈 풀기
5. 정답 → 코인 획득 확인
6. 허브 복귀 → 상점에서 아이템 구매
7. Expected: 전체 플로우 동작, 교사 대시보드에 실시간 업데이트

- [ ] **Step 4: 버그 수정 및 최종 커밋**

발견된 이슈 수정 후:

```bash
git add -A
git commit -m "fix: e2e 검증에서 발견된 이슈 수정"
```

---

## Task 20: LPC 스프라이트 에셋 준비 + 연동

**Files:**
- Create: `client/public/assets/sprites/` 하위 파일들
- Modify: `client/src/scenes/BootScene.ts` (실제 스프라이트 로드)

- [ ] **Step 1: LPC 스프라이트 복사**

LPC Generator 폴더에서 child 체형 기본 에셋을 `client/public/assets/sprites/`로 복사:

```bash
# body
cp Universal-LPC-Spritesheet-Character-Generator-master/spritesheets/body/bodies/child/*.png \
   client/public/assets/sprites/body/

# hair (선택된 옵션들)
cp Universal-LPC-Spritesheet-Character-Generator-master/spritesheets/hair/short/*.png \
   client/public/assets/sprites/hair/

# torso, legs, feet 등도 동일 패턴
```

> **NOTE:** 실제 사용할 파일은 CharacterCreateScene의 SLOTS 옵션에 정의된 조합과 일치해야 합니다. 파일이 없는 조합은 옵션에서 제거하거나 placeholder 이미지 사용.

- [ ] **Step 2: BootScene에 실제 스프라이트 로드 추가**

```typescript
// BootScene.ts preload()에 추가
// 기본 body
this.load.spritesheet('lpc_body_child_light', 'assets/sprites/body/child_light.png', {
  frameWidth: 64, frameHeight: 64,
});

// hair 옵션들
this.load.spritesheet('lpc_hair_short_brown', 'assets/sprites/hair/short_brown.png', {
  frameWidth: 64, frameHeight: 64,
});
// ... 각 옵션별로 추가
```

- [ ] **Step 3: placeholder 사각형을 CharacterSprite로 교체**

HubScene, RegionScene에서 `this.player = this.add.rectangle(...)` 부분을 `CharacterSprite` 인스턴스로 교체.

- [ ] **Step 4: 수동 확인 + 커밋**

```bash
git add client/public/assets/sprites/ client/src/scenes/BootScene.ts \
        client/src/scenes/HubScene.ts client/src/scenes/RegionScene.ts
git commit -m "feat: LPC 스프라이트 에셋 연동"
```

---

## 주의사항

1. **Task 18의 story_config.json은 placeholder입니다.** 실제 스토리 콘텐츠는 교과서 PDF + 핵심개념 추출 후 `/game-story` 스킬로 생성해야 합니다. 이 스킬은 별도 작업으로 만들어야 합니다.

2. **Task 20의 스프라이트 파일명은 가정입니다.** 실제 LPC 폴더 내 파일명을 확인한 뒤 경로를 맞춰야 합니다. LPC child 체형 스프라이트의 실제 파일 구조를 탐색하는 작업이 Task 20 시작 시 필요합니다.

3. **quiz.ts의 이전 정답 체크 쿼리**(currval 사용 부분)는 동시성 이슈가 있을 수 있습니다. 운영 환경에서는 별도 `first_correct_at` 컬럼을 student_progress에 추가하는 것이 안전합니다.

4. **matching 퀴즈의 정답 검증**: 현재 구현에서는 클라이언트가 `answer`를 `right1|right2|right3` 형태로 보내고, 서버에서 `correct_answer`와 비교합니다. 서버측 matching 검증 로직은 story_config에 정답 순서를 명시하는 방식으로 보강해야 합니다.
