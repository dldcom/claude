# LPC 교육용 RPG 게임 설계 문서

## 1. 개요

### 목적
초등학교 6학년 학생들이 태블릿으로 플레이하며 사회 교과 핵심개념을 학습하는 2D RPG 어드벤처 게임.

### 핵심 콘셉트
- LPC(Liberated Pixel Cup) 픽셀아트 스프라이트 기반 2D 탑다운 RPG
- **스토리 중심 설계**: 각 소단원이 도입→전개→위기→절정→결말의 5막 서사 구조를 가짐
- 학생이 캐릭터를 만들고 맵을 탐험하며, 스토리 속 NPC와의 대화 흐름에서 자연스럽게 학습
- 퀴즈는 대화의 일부로 등장하며, 독립된 "시험"이 아님
- 허브 월드 + 소단원별 지역 구조
- 퀴즈 정답 시 코인 획득 → 상점에서 캐릭터 파츠 구매
- 교사용 실시간 대시보드로 학생 진행도 모니터링

### 타겟
- 학생: 초등학교 6학년 (태블릿, 키보드 없음, 터치 전용)
- 교사: 교실 PC/노트북에서 대시보드 접속
- 첫 버전 콘텐츠: 6학년 사회 1학기
- 범용 프레임워크: 콘텐츠(핵심개념 JSON + 스토리 설정)만 교체하면 다른 학년/과목에도 적용 가능

## 2. 스토리 설계 (최우선 품질 요소)

> **스토리는 이 게임의 핵심이다.** 인위적이지 않고 자연스러워야 하며, 학생이 몰입할 수 있어야 한다.
> AI가 쓴 것 같은 뻔한 느낌이 나면 안 된다. 실제 역사적 사실, 인물, 장소를 깊이 조사하여
> 살아있는 이야기를 만들어야 한다.

### 2.1 스토리 품질 원칙

1. **구체적 디테일로 몰입시킨다**
   - "전쟁이 일어났습니다" (X)
   - "1950년 6월 25일 새벽, 할아버지는 함경남도 함흥에서 포격 소리에 잠을 깼습니다" (O)
   - 실제 지명, 날짜, 상황을 구체적으로 사용

2. **NPC는 개성 있는 인간이다**
   - 말투, 감정, 사연이 각각 다름
   - 할아버지는 사투리 섞어 느리게, 군인은 짧고 단호하게, 아이는 호기심 가득하게
   - 같은 사건도 NPC마다 다른 시각으로 이야기

3. **감정을 먼저, 지식은 뒤따르게**
   - NPC의 사연에 공감하다 보면 자연스럽게 "왜?"가 생기고, 그 답이 학습 내용
   - 퀴즈는 "시험"이 아니라 "이 사람의 이야기를 제대로 들었는지 확인"

4. **갈등과 긴장이 있다**
   - 위기 막에서 진짜 긴장감: 단순히 "어렵습니다"가 아니라 상황이 꼬이는 느낌
   - 절정에서 플레이어가 해결에 참여한다는 주체성

5. **교훈은 직접 말하지 않는다**
   - "평화통일이 중요합니다" 라고 NPC가 직접 말하면 안 됨
   - 이야기를 다 듣고 나면 학생 스스로 "아, 통일이 필요하구나"를 느끼게

### 2.2 지역 스토리 5막 구조

각 지역(소단원)은 5막 서사 구조를 따른다:

```
도입(Introduction) → 전개(Development) → 위기(Crisis) → 절정(Climax) → 결말(Conclusion)
     NPC 1              NPC 2~3             NPC 4~5         NPC 6         에필로그 나레이션
     쉬움                보통                 어려움           어려움           —
```

| 막 | 역할 | 퀴즈 난이도 | 설계 의도 |
|---|---|---|---|
| 도입 | 세계관 소개, 플레이어를 이야기 속으로 끌어들임 | 쉬움 | 부담 없이 진입, 호기심 유발 |
| 전개 | 상황과 인물을 깊이 알아감, 복선 깔기 | 보통 | 배경 지식 확장, NPC에 감정 이입 |
| 위기 | 갈등/문제 발생, 긴장감 상승 | 어려움 | "이걸 어떡하지?" 라는 몰입 |
| 절정 | 핵심 도전, 플레이어가 해결에 참여 | 어려움 | 성취감 극대화, 핵심 개념 집중 |
| 결말 | 해소, 희망적 마무리, 여운 | — | 긍정적 정서로 학습 내용 각인 |

### 2.3 NPC 상호작용 플로우

```
NPC에게 접근 (A버튼)
    ↓
[대화 Phase 1: 스토리]
  NPC가 자기 이야기를 들려줌 (3~5개 대화 버블)
  학습 내용이 이야기 속에 자연스럽게 녹아있음
    ↓
[대화 Phase 2: 퀴즈 전환]
  대화 흐름 속에서 자연스럽게 질문으로 이어짐
  예: "그런데 젊은이, 혹시 알고 있나? 남북이 분단된 해가..."
    ↓
[퀴즈]
  해당 NPC에 지정된 퀴즈 유형으로 출제
    ↓
[정답 시 - 대화 Phase 3: 반응]
  NPC가 기뻐하며 추가 이야기 + 다음 NPC로의 연결 대사
  예: "맞아! 역시 똑똑하구나. 저기 초소에 있는 군인에게도 가보렴."
  코인 획득 + NPC 머리 위 체크 표시
    ↓
[오답 시]
  NPC가 캐릭터에 맞는 방식으로 힌트
  예: (할아버지) "허허, 다시 한번 생각해보렴. 내가 고향을 떠난 그 해 말이야..."
  재도전 가능 (무제한, 코인 보상 감소)
```

### 2.4 예시: "평화통일을 위한 노력" 지역

| 막 | NPC | 캐릭터 | 스토리 | 학습 내용 |
|---|---|---|---|---|
| 도입 | 실향민 할아버지 | 80대, 함경도 사투리, 따뜻하지만 슬픈 눈 | "나는 함흥에서 태어났단다. 1950년 그 여름, 포격 소리에 잠을 깨고... 가족과 헤어져 여기까지 왔지. 60년이 넘었어..." | 6.25 전쟁, 남북 분단 배경 |
| 전개 | DMZ 경비 군인 | 20대, 단호하지만 속마음은 복잡 | "매일 이 철책을 지키고 있습니다. 저 건너편에도 저처럼 서있는 군인이 있겠죠. 같은 민족인데..." | 비무장지대, 휴전선, 군사분계선 |
| 전개 | 이산가족 할머니 | 70대, 목소리가 떨림 | "작년에 이산가족 상봉 신청서를 냈어. 60년 만에 동생 얼굴을... 볼 수 있을까. 내가 살아있는 동안에..." | 이산가족 상봉, 남북 교류 |
| 위기 | 뉴스 기자 | 30대, 급박한 톤 | "속보입니다! 남북 대화가 결렬됐습니다. 할아버지와 할머니의 바람은... 또 무너지는 걸까요?" | 통일의 걸림돌, 남북 체제 차이 |
| 절정 | 통일부 직원 | 40대, 지치지만 포기 안 함 | "상황이 어렵지만 포기할 수 없어요. 저 할아버지, 할머니를 위해서라도. 당신이 도와줄 수 있겠어요?" | 통일 정책, 평화적 해결 노력 |
| 결말 | 탈북민 청년 | 20대, 밝고 희망적 | "저는 북에서 왔어요. 처음엔 모든 게 낯설었지만... 여기 사람들 덕분에 새 삶을 시작했죠. 언젠가 하나가 될 거라 믿어요." | 통일의 필요성, 미래 비전 |
| 에필로그 | (나레이션) | — | "이 마을에서 만난 사람들은 모두 같은 꿈을 꾸고 있었다. 다시 하나가 되는 그 날을..." | — |

### 2.5 스토리 작성 프로세스

스토리 작성 시 반드시 다음 과정을 거친다:

1. **교과서 원문 정독** — 소단원 PDF에서 핵심 사실/개념 파악
2. **다양한 소스 리서치** — 관련 역사 자료, 뉴스 기사, 다큐멘터리, 수기, 인터뷰 등을 검색하여 생생한 디테일 확보
3. **NPC 캐릭터 설계** — 각 NPC의 나이, 배경, 말투, 감정선을 구체적으로 잡기
4. **5막 구조에 맞춰 서사 배치** — 도입에서 결말까지 갈등과 해소의 흐름
5. **대사 작성** — 각 NPC의 개성이 살아있는 자연스러운 대사. 교과서 문장을 그대로 옮기지 않음.
6. **퀴즈 연결** — 대사 흐름에서 자연스럽게 이어지는 질문 설계
7. **맵 힌트** — 스토리 분위기에 맞는 맵 오브젝트/배경 제안 (접경 마을, 철책, 초소, 기자회견장 등)
8. **검수** — 교과 정확성 확인 + 어색한 대사 수정

이 프로세스는 스킬(`/game-story`)로 만들어 재사용 가능하게 한다.
참고한 리서치 소스와 스토리 작성 노하우도 스킬에 누적하여 품질을 지속적으로 개선한다.

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│          학생 태블릿 (브라우저)            │
│  Phaser 3 (TypeScript) + 터치 오버레이    │
│  ├ 게임 화면 (맵/캐릭터/NPC/대화/퀴즈)   │
│  └ 캐릭터 생성 & 상점 UI                 │
└──────────────┬──────────────────────────┘
               │ REST API + WebSocket
┌──────────────┴──────────────────────────┐
│          백엔드 서버                      │
│  Node.js + Express                       │
│  ├ REST: 인증, 진행도, 상점, 콘텐츠      │
│  ├ WebSocket: 실시간 대시보드 푸시        │
│  └ Raw SQL (node-postgres/pg)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│          PostgreSQL                       │
│  teachers, classes, students, regions,   │
│  npcs, questions, student_progress,      │
│  quiz_attempts, items, student_items     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          교사 대시보드 (브라우저)          │
│  HTML + JS (가벼운 SPA)                  │
│  ├ 반별 학생 진행도 실시간 모니터링       │
│  ├ 학생 계정 일괄 생성/관리              │
│  └ 콘텐츠(핵심개념 JSON) 업로드          │
└─────────────────────────────────────────┘
```

## 4. 기술 스택

| 항목 | 기술 | 비고 |
|---|---|---|
| 게임 엔진 | Phaser 3 | 최신 안정 버전 |
| 프론트 언어 | TypeScript | strict mode |
| 번들러 | Vite | Phaser + TS 빌드 |
| 백엔드 | Node.js + Express | |
| DB | PostgreSQL | 로컬 개발 → 추후 클라우드 |
| DB 드라이버 | pg (node-postgres) | raw SQL, ORM 없음 |
| 실시간 | ws (WebSocket 라이브러리) | 교사 대시보드용 |
| 맵 | Tiled JSON 호환 형식 | 코드로 직접 생성 |
| 스프라이트 | LPC 에셋 (CC-BY-SA) | CREDITS.csv 포함 필수 |

## 5. 데이터 모델

```sql
-- 교사
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    login_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 반
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id),
    name VARCHAR(50) NOT NULL,
    school_year VARCHAR(20) NOT NULL
);

-- 학생 (교사가 사전 생성, 비밀번호 없음)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id),
    name VARCHAR(50) NOT NULL,
    avatar_config JSONB DEFAULT '{}',
    coins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 게임 지역 (소단원)
CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    theme VARCHAR(200),                    -- "한반도 접경 마을"
    intro_dialogue JSONB,                  -- 지역 진입 시 나레이션
    ending_dialogue JSONB,                 -- 전체 클리어 시 나레이션
    epilogue_dialogue JSONB,               -- 에필로그
    story_synopsis TEXT,                   -- 스토리 요약 (교사 대시보드용)
    map_data JSONB,
    sort_order INTEGER NOT NULL
);

-- NPC
CREATE TABLE npcs (
    id SERIAL PRIMARY KEY,
    region_id INTEGER REFERENCES regions(id),
    name VARCHAR(50) NOT NULL,
    character_desc TEXT,                    -- "실향민 할아버지, 80대, 함경도 사투리"
    story_phase VARCHAR(20) NOT NULL,      -- 'intro', 'develop', 'crisis', 'climax', 'conclusion'
    dialogue_before JSONB NOT NULL,        -- 퀴즈 전 스토리 대화 스크립트 (배열)
    dialogue_correct JSONB NOT NULL,       -- 정답 시 반응 대사
    dialogue_wrong JSONB NOT NULL,         -- 오답 시 힌트 대사
    dialogue_after JSONB NOT NULL,         -- 퀴즈 후 마무리 + 다음 NPC 유도
    next_npc_hint TEXT,                    -- "저기 초소에 있는 군인에게 가보렴"
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    quiz_type VARCHAR(30) NOT NULL,
    quiz_difficulty VARCHAR(10) NOT NULL,  -- 'easy', 'normal', 'hard'
    sort_order INTEGER NOT NULL            -- 스토리 추천 순서
);

-- 퀴즈 문제
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    npc_id INTEGER REFERENCES npcs(id),
    content JSONB NOT NULL,
    correct_answer VARCHAR(200) NOT NULL,
    coin_reward INTEGER DEFAULT 10
);

-- 학생 진행도
CREATE TABLE student_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    npc_id INTEGER REFERENCES npcs(id),
    is_cleared BOOLEAN DEFAULT FALSE,
    cleared_at TIMESTAMP,
    UNIQUE(student_id, npc_id)
);

-- 퀴즈 풀이 로그
CREATE TABLE quiz_attempts (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    question_id INTEGER REFERENCES questions(id),
    answer VARCHAR(200),
    is_correct BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- 상점 아이템
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    lpc_sprite_path VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL
);

-- 학생 보유 아이템
CREATE TABLE student_items (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    item_id INTEGER REFERENCES items(id),
    is_equipped BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, item_id)
);
```

### avatar_config JSONB 구조 예시

```json
{
    "body": "child/light",
    "hair": "short/brown",
    "torso": "shirt/blue",
    "legs": "pants/dark",
    "feet": "shoes/brown"
}
```

## 6. 게임플레이 설계

### 6.1 학생 플레이 플로우

```
앱 접속 → 반 선택 → 이름 선택 (드롭다운)
    ↓
[신규 학생] 캐릭터 생성 화면
  - 체형/피부색: child + 기본 피부색 (고정, 선택 불가)
  - 선택 슬롯 4개:
    - 머리 (3~5가지 스타일/색상)
    - 상의 (3~5가지: 셔츠, 조끼 등) — torso 레이어
    - 하의 (3~5가지: 바지, 치마, 반바지 등) — legs 레이어
    - 신발 (3~5가지) — feet 레이어
  - 완료 → DB에 avatar_config 저장
    ↓
[기존 학생] 바로 허브 월드 진입
    ↓
허브 월드 (중앙 마을)
  - 6개 지역 입구 (v1은 1개만 활성화, 나머지 "준비중" 표시)
  - 상점 NPC (코인으로 파츠 구매)
  - 내 캐릭터 확인/장비 변경
    ↓
지역 진입
  - 도입 나레이션 재생
  - 맵에 NPC 5~7명 배치 (스토리 추천 순서 있으나 강제 아님)
    ↓
NPC 상호작용 (스토리 + 퀴즈 통합)
  - Phase 1: 스토리 대화 (3~5개 대화 버블)
  - Phase 2: 대화 흐름 속 자연스러운 퀴즈 전환
  - Phase 3: 정답 반응 + 다음 NPC 유도 대사
  - 오답 시: NPC 캐릭터에 맞는 힌트 + 재도전
    ↓
전원 클리어 → 에필로그 나레이션 + 지역 완료 배지 + 보너스 코인
  → 허브로 복귀
```

### 6.2 퀴즈 유형 (총 7종)

| # | 유형 | 설명 | 조작 | v1 포함 |
|---|---|---|---|---|
| 1 | 빈칸 채우기 | 문장 속 빈칸에 들어갈 단어 고르기 | 보기 4개 탭 | O |
| 2 | 객관식 | 4지선다 | 보기 탭 | O |
| 3 | 짝맞추기 | 좌-우 3~4쌍 연결 | 드래그 or 순서 탭 | O |
| 4 | O/X 퀴즈 | 참/거짓 판별 | 두 버튼 탭 | O |
| 5 | 순서 정렬 | 사건/절차를 시간순 배열 | 카드 드래그 | 2차 |
| 6 | 카드 뒤집기 (메모리) | 짝 맞는 카드 2장 찾기 | 카드 탭 | 2차 |
| 7 | 빈칸 드래그 | 복수 빈칸에 단어 풀에서 끌어다 놓기 | 드래그 앤 드롭 | 2차 |

### 6.3 터치 컨트롤

화면 분할 없이 게임이 화면 100%를 사용하고, 버튼은 반투명 오버레이로 배치:

```
┌──────────────────────────────────────┐
│                                      │
│          게임 화면 (전체)              │
│                                      │
│                                      │
│  ↑                                   │
│ ← →                            [B]  │
│  ↓                             [A]  │
│           (반투명 오버레이)            │
└──────────────────────────────────────┘
```

- 좌하단: ↑←↓→ 4개 개별 버튼 (반투명 30~40% opacity)
- 우하단: A(상호작용/확인), B(취소/뒤로) 버튼 (반투명)
- 퀴즈 진입 시: 이동 버튼 + A/B 모두 숨김, 퀴즈 UI가 화면 중앙 모달로 표시

### 6.4 코인 경제

| 행동 | 코인 |
|---|---|
| 퀴즈 첫 시도 정답 | +10 |
| 재시도 정답 (2회째) | +5 |
| 재시도 정답 (3회 이상) | +2 |
| 지역 전체 클리어 보너스 | +30 |
| 상점 아이템 가격대 | 20~100 |

### 6.5 캐릭터 꾸미기 & 상점

- 시작 시: 기본 파츠 4슬롯(머리/상의/하의/신발) 선택
- 허브 상점: 코인으로 추가 파츠 구매 (모자, 망토, 무기 등 장식 슬롯 포함)
- 구매한 파츠는 인벤토리에 저장, 자유롭게 착용/해제
- LPC 스프라이트 레이어 순서대로 합성하여 캐릭터 렌더링

상점 아이템 카테고리:
- hair (머리) — 새 헤어스타일
- torso (상의) — 갑옷, 드레스, 재킷
- legs (하의) — 치마, 반바지, 레깅스
- feet (신발) — 부츠, 샌들
- hat (모자) — 왕관, 투구, 마법사 모자
- cape (망토) — 다양한 색상
- weapon (무기) — 장식용 검, 마법 지팡이

## 7. 교사 대시보드

### 7.1 핵심 화면

| 화면 | 기능 |
|---|---|
| 반 전체 현황 | 학생 24명 x 지역 그리드. 초록(완료)/노랑(진행중)/회색(미시작). WebSocket 실시간 갱신 |
| 학생 개별 상세 | 해당 학생의 NPC별 정답률, 총 코인, 가장 많이 틀린 문제 |
| 문제별 통계 | "이 문제를 몇 명이 틀렸는가" — 수업 중 개입 포인트 파악 |
| 학생 관리 | CSV 업로드로 일괄 생성, 개별 추가/삭제 |

### 7.2 교사 인증

- login_id + password로 로그인
- 세션 기반 인증 (JWT 또는 세션 쿠키)
- 학생과 달리 비밀번호 필수

## 8. 콘텐츠 파이프라인

```
교과서 소단원 PDF
    ↓ (/key-concepts 스킬로 추출)
핵심개념.json
    ↓ (/game-story 스킬로 스토리 생성)
    │  - 다양한 소스 리서치 (역사 자료, 뉴스, 다큐, 수기 등)
    │  - 5막 구조 설계
    │  - NPC 캐릭터 + 대사 스크립트 작성
    │  - 퀴즈를 대화에 자연스럽게 연결
    │  - 맵 분위기/오브젝트 힌트 포함
    ↓
story_config.json
    ↓ (content/ 폴더에 저장)
gamemaker/content/6-1-사회/
  ├── 1-1_핵심개념.json       (원본 핵심개념)
  └── 1-1_story_config.json   (스토리 + NPC + 대사 + 퀴즈 연결)
    ↓ (서버 시작 시 또는 교사 업로드 시 DB에 로드)
regions + npcs + questions 테이블 → 학생이 플레이
```

새 단원 추가 시: PDF → 핵심개념 추출 → 스토리 생성 → content/ 저장 → DB 로드. 게임 코드 수정 불필요.

## 9. v1 범위

### 포함

- 허브 월드 1개 + 지역 1개 (6학년 사회 1학기 소단원 1개)
- **5막 스토리 구조의 완성된 서사** (NPC 5~7명, 각각 개성 있는 캐릭터와 대사)
- 퀴즈 유형 4종 (빈칸채우기, 객관식, 짝맞추기, O/X) — 대화 흐름에 자연스럽게 통합
- 캐릭터 생성 (고정 child 체형 + 4슬롯 선택)
- 코인 획득 + 상점 (아이템 10~15개)
- 학생 인증 (반 선택 → 이름 드롭다운)
- 교사 인증 + 반/학생 관리 + 실시간 대시보드
- 진행도/코인/인벤토리 PostgreSQL 저장
- 코드 생성 Tiled JSON 맵
- `/game-story` 스킬 (스토리 생성 프로세스를 재사용 가능하게)

### 미포함 (이후 확장)

- 나머지 5개 지역 (스토리 + 콘텐츠만 추가)
- 드래그 기반 퀴즈 3종 (순서정렬, 카드뒤집기, 빈칸드래그)
- 보스 이벤트
- 경제 단원 연계 이벤트
- 학생 간 순위표/경쟁 요소
- 다른 학년/과목 콘텐츠
- Tiled GUI를 이용한 맵 리디자인

## 10. 라이선스

LPC 에셋은 CC-BY-SA 라이선스. 반드시 CREDITS.csv를 게임 내 크레딧 화면에 포함하거나 접근 가능하게 제공해야 함.
