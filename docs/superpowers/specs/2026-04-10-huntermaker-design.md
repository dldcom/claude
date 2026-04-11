# 문제사냥놀이 카드학습지 자동 생성기 (huntermaker) 설계

## Context

초등학교 교사가 교과서 PDF에서 "문제사냥놀이" 카드학습지를 자동 생성하는 skill이 필요하다. 문제사냥놀이는 학생들이 각자 카드 한 장을 들고 돌아다니며, 만난 상대와 가위바위보 후 진 사람이 문제를 내고 이긴 사람이 답을 맞추면 카드를 가져가는 게임이다.

기존 `bingomaker`와 동일한 아키텍처(PDF→문제생성→검증→HWPX)를 따르되, 3가지 문제 유형(빈칸/선택지/이미지)을 지원하고 여러 교과에 범용으로 사용한다.

## 게임 규칙

- 카드 총 16장 (질문+답이 한 장에 합쳐진 형태)
- 학생이 카드 한 장씩 들고 돌아다님
- 상대를 만나면 가위바위보 → 진 사람이 자기 카드의 문제를 냄 → 이긴 사람이 답을 맞추면 카드를 가져감
- 카드를 많이 가져간 팀이 승리

## 산출물 레이아웃

- 2페이지 가로 방향 A4
- 페이지당 4×4 표 = 8장 카드 (큰 셀=질문, 작은 셀=답)
- 행 구성: Row 0(질문4개), Row 1(답4개), Row 2(질문4개), Row 3(답4개)

## 문제 유형 (3가지)

| 유형 | 설명 | 예시 | 최대 개수 |
|------|------|------|-----------|
| `blank` | 빈칸 채우기 (○○) | "○○은 실제 땅의 모습을 줄여 그린 것이다." → 지도 | 제한 없음 |
| `choice` | 선택지 문제 | "등고선 간격이 (넓을수록/좁을수록) 경사가 급하다." → 좁을수록 | 제한 없음 |
| `image` | 이미지 보고 답하기 | [지도 기호 이미지] "이 기호의 이름은?" → 과수원 | 최대 3개 |

## 아키텍처 (4단계 워크플로우)

### Step 1: PDF 텍스트+이미지 추출

`bingomaker/src/pdf_reader.py`의 `extract_text_by_page()`, `parse_subunit_filename()`을 재사용한다.
추가로 `huntermaker/src/image_extractor.py`에서 PDF 내 이미지를 추출한다.

```python
# 재사용
from pdf_reader import extract_text_by_page, parse_subunit_filename

# 새로 작성
from image_extractor import extract_images
# extract_images(pdf_path) → List[dict]
# 각 dict: {"page": int, "index": int, "path": str, "description": str}
# 이미지를 huntermaker/output/images/ 에 저장
```

이미지 추출은 PyMuPDF의 `page.get_images()`로 각 페이지의 이미지를 추출하고, 임시 디렉토리에 PNG로 저장한다.

### Step 2: Claude가 16개 문제 생성

추출된 텍스트와 이미지 목록을 바탕으로 Claude가 16개 문제를 JSON으로 생성한다.

**JSON 스키마:**
```json
[
  {
    "type": "blank",
    "question": "○○은 실제 땅의 모습을 일정한 약속에 따라 줄여서 그린 것이다.",
    "answer": "지도",
    "page": 28
  },
  {
    "type": "choice",
    "question": "등고선 간격이 (넓을수록 / 좁을수록) 경사가 급하다.",
    "answer": "좁을수록",
    "page": 34
  },
  {
    "type": "image",
    "question": "이 기호가 의미하는 것은 무엇인가요?",
    "answer": "과수원",
    "page": 30,
    "image_index": 0
  }
]
```

**출제 규칙:**
- 정확히 16개 문제
- 핵심 개념과 용어 위주 출제 (빙고와 동일한 출제 기준)
- 정답은 1~3단어
- 쪽수 오름차순 정렬
- 정답 단어는 해당 쪽 원문에 그대로 존재해야 함
- 문제 문장은 교과서 원문 그대로 사용 (정답 부분만 ○○ 또는 선택지로 대체)
- image 유형은 최대 3개, 필요한 경우에만 사용
- choice 유형의 선택지는 `(A / B)` 형식

### Step 3: 검증

`huntermaker/src/question_validator.py`에서 검증한다.

**검증 항목:**
1. 정확히 16개 문제
2. 각 문제의 `type`이 `blank`, `choice`, `image` 중 하나
3. 모든 페이지 번호가 추출된 범위 내
4. 페이지 번호 오름차순
5. 각 정답이 해당 쪽 텍스트에 존재
6. `image` 유형의 `image_index`가 추출된 이미지 범위 내
7. `image` 유형이 3개 이하

### Step 4: JSON 저장 + HWPX 생성

`huntermaker/src/hwpx_modifier.py`에서 HWPX를 생성한다.

**처리 방식:**
1. 기존 `문제사냥놀이 카드.hwpx`를 템플릿으로 사용
2. `Contents/section0.xml`의 텍스트를 치환:
   - 기존 질문 텍스트 → 새 질문 텍스트
   - 기존 답 텍스트 → 새 답 텍스트
3. `image` 유형 카드의 경우:
   - 질문 텍스트를 짧은 문구로 설정
   - `BinData/` 디렉토리에 새 이미지 파일 추가
   - XML에서 해당 셀의 `<hp:pic>` 요소의 이미지 참조를 새 이미지로 교체
4. `linesegarray`를 빈 태그로 교체 (한글에서 열 때 자동 재계산)

**출력 경로:** `huntermaker/output/{unit}-{subunit}_{name}_문제사냥놀이카드.hwpx`

## 디렉토리 구조

```
huntermaker/
├── src/
│   ├── image_extractor.py    # PDF에서 이미지 추출 (새로 작성)
│   ├── question_validator.py  # 16개 문제 검증 (새로 작성)
│   └── hwpx_modifier.py      # 카드 HWPX 생성 (새로 작성)
├── template/
│   └── hunter_card.hwpx      # 기존 카드 HWPX를 템플릿으로 복사
├── input/                     # 교과서 PDF 입력
├── output/                    # 생성된 HWPX + images/
│   └── images/               # 추출된 이미지 임시 저장
└── requirements.txt          # PyMuPDF, lxml
```

**공유 모듈:** `bingomaker/src/pdf_reader.py`를 sys.path로 import하여 재사용한다 (bingomaker와 동일한 패턴).

## Skill 파일

`.claude/skills/hunter-questions/SKILL.md`에 4단계 워크플로우를 기술한다.

**사용법:** `/hunter-questions [PDF경로]`

**메타데이터:** 과목/학년/학기를 사용자에게 확인 (범용이므로 기본값 없음).

## 검증 방법

1. 기존 입력 PDF(`1단원_1소단원_다양한_정보가_담긴_지도.pdf`)로 스킬 실행
2. 생성된 HWPX를 한컴오피스에서 열어 카드 레이아웃 확인
3. 질문/답 내용이 올바르게 표시되는지 확인
4. 이미지가 있는 카드에 이미지가 정상 표시되는지 확인
