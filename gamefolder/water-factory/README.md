# 워터 팩토리

초4-1학기 과학 2단원 "물의 상태 변화" 학습용 웹게임. Phaser 3 + TypeScript + Vite.

## 개발 환경

```bash
cd gamefolder/water-factory
npm install
npm run dev        # http://localhost:5173/water-factory/
npm test           # 단위 테스트 (GameState, 13개)
```

## 빌드

```bash
npm run build      # dist/ 생성 (타입 체크 + Vite 번들)
npm run preview    # http://localhost:4173/water-factory/ 로 빌드 결과 확인
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

5. 브라우저에서 `https://<도메인>/water-factory/` 접속.

## 프로젝트 구조

```
src/
├── main.ts                 Phaser 부트스트랩 + 세로모드 가드
├── config.ts               게임 상수 · 주문 6종 · 상태 전이 메타데이터
├── scenes/
│   ├── BootScene.ts        에셋 프리로드(플레이스홀더) + Registry 초기화
│   ├── TitleScene.ts       3슬라이드 스토리 + [▶ 시작]
│   └── GameScene.ts        플레이 루프(주문→변환→출하→게임오버)
├── state/
│   └── GameState.ts        순수 로직 (테스트 대상, Phaser 의존성 0)
├── entities/
│   ├── Cauldron.ts         가마솥 스프라이트 + 상태 변환 애니 + 팝업
│   └── OrderBoard.ts       좌측 주문 카드
└── ui/
    ├── ControlPanel.ts     🔥/❄️/📦 버튼 + 경계 비활성 + 흔들림
    ├── HUD.ts              점수·목숨·타이머·사운드 토글
    ├── GameOverOverlay.ts  게임오버 오버레이(최고점수 · NEW RECORD · 다시하기)
    └── OrientationGuard.ts 세로모드 진입 시 안내 화면
tests/state/                GameState 단위 테스트 (vitest, 13개)
public/assets/              (향후) Kenney CC0 스프라이트·효과음
```

## 학습 내용

- 물의 세 가지 상태: **고체(얼음)·액체(물)·기체(수증기)**
- 교과서 용어 기반 상태 변화 (4학년 1학기 2단원 기준):
  - **녹음**(고→액), **얼음**(액→고)
  - **끓음**(액→기), **응결**(기→액)
- "응고/융해/기화/액화"는 중학교 용어이므로 사용하지 않음.

## 게임 규칙

- 목숨 5개, 주문당 초기 제한시간 10초
- 점수 200점마다 제한시간 0.5초 감소 (최소 4초)
- 정답 출하 시 점수 = 100 + (남은 초 × 10)
- 오답 출하 / 시간 초과 시 목숨 -1
- 목숨 0 → GAME OVER

## 라이선스

- 코드: 교육 목적, MIT(또는 선생님 선호).
- 에셋(추후 통합): Kenney.nl CC0 — 통합 시 `public/assets/LICENSE.txt` 참고.

## 현재 상태 (2026-04-17)

- ✅ Task 1~12: 코어 게임 루프 완성 (플레이 가능)
- ⏳ Task 13~14: Kenney 픽셀아트 스프라이트 + 효과음 통합 (예정)
- ⏳ Task 15~17: 빌드 검증 완료, 수동 테스트 진행 중
- 현재는 단색 사각형 플레이스홀더로 동작 — 게임 로직 완전 체험 가능.
