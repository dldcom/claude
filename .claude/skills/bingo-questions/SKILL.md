---
name: bingo-questions
description: 교과서 소단원 PDF에서 25개 빈칸 채우기 빙고 문제를 생성하고 HWPX 학습지를 만든다. 사용법 - /bingo-questions [PDF경로]
---

# 빙고 문제 생성

교과서 소단원 PDF에서 25개 빈칸 채우기 문제를 생성하고 HWPX 빙고 학습지를 만든다.

## Step 1: PDF 텍스트 추출 및 메타데이터 판별

인자로 받은 PDF 경로를 사용하여 아래 Python 코드를 실행한다.

```python
import sys
sys.path.insert(0, "bingomaker/src")
from pdf_reader import extract_text_by_page, parse_subunit_filename

pdf_path = "<인자로 받은 PDF 경로>"
tagged_text, page_texts = extract_text_by_page(pdf_path)
metadata = parse_subunit_filename(pdf_path)

page_start = min(page_texts.keys())
page_end = max(page_texts.keys())

print(f"kind: {metadata.get('kind')}")
print(f"metadata: {metadata}")
print(f"페이지 범위: {page_start}~{page_end}쪽 ({len(page_texts)}페이지)")
print("---")
print(tagged_text)
```

출력된 `tagged_text`와 `metadata`를 기억해둔다.

### metadata의 `kind` 필드에 따라 분기한다

- **`kind == "subunit"`** — 소단원 PDF. 정상 흐름으로 그대로 Step 2 진행.
- **`kind == "unit"`** — 단원 전체 PDF. 사용자에게 두 가지 옵션 중 무엇을 원하는지 확인한다:
  - (A) 먼저 `/split-textbook`으로 소단원 분리 후, 각 소단원마다 본 스킬 실행
  - (B) 단원 전체에서 핵심 25문제만 뽑아 1개 학습지 생성
  - 사용자가 (A)를 원하면 본 스킬을 종료하고 `/split-textbook`을 안내.
  - 사용자가 (B)를 원하면 **단원명**(예: "물의 상태 변화")을 사용자에게 확인받아 `metadata["unit_name"]`에 저장한 뒤 Step 2 진행. (파일명에 단원명이 없기 때문에 직접 묻는다.)
- **`kind == "unknown"`** — 파일명으로 추정 불가. 사용자에게 과목·학년·학기·단원·(소단원)·이름을 물어서 수동으로 `metadata`를 구성한 뒤 진행. 예:
  ```python
  metadata = {
      "kind": "subunit",          # 또는 "unit"
      "subject": "과학",
      "grade": 4, "semester": 1, "unit": 2,
      "subunit": 1,                # subunit인 경우만
      "subunit_name": "물의 상태 변화",  # subunit인 경우
      # unit인 경우 대신: "unit_name": "물의 상태 변화"
  }
  ```

## Step 2: 25개 문제 생성

Step 1에서 추출한 페이지별 태그 텍스트를 바탕으로, 아래 규칙에 따라 정확히 25개 문제를 JSON으로 생성한다.

### 문제 형식
- `( N쪽 )`이 정답 단어를 대신한다. 별도의 빈칸 `(    )`은 사용하지 않는다.
- 학생은 `( N쪽 )`에 들어갈 단어를 교과서에서 찾아 답을 적는다.
- 정답은 1~3단어.
- 예시: `( 35쪽 )을 보면 우리 지역의 위치를 파악할 수 있습니다.` → 정답: 지도

### 출제 기준
- **이 소단원의 학습 목표 달성에 핵심적인 개념과 용어만 출제한다.**
- **출제해야 하는 것:** 교과서가 정의하거나 설명하는 핵심 개념, 학습 목표에 직접 연결되는 용어, "꼭 기억해요"나 정리 코너에 등장하는 단어
- **출제하면 안 되는 것:** 단순 예시로 등장하는 고유명사(특정 지역명, 인물명 등), 구체적 숫자(통계 수치, 연도 등), 학습 목표와 무관한 사소한 사실
- **판단 기준:** "이 단어를 모르면 이 소단원을 이해했다고 할 수 없는가?" → Yes면 출제, No면 제외

### 규칙
1. 정확히 25개 문제를 만든다.
2. **N쪽은 반드시 해당 내용이 실제로 있는 페이지의 `[N쪽]` 태그와 일치해야 한다.** 추측하지 말 것.
3. **쪽수 오름차순으로 정렬한다. 같은 쪽 안에서는 원문에 등장하는 순서대로 정렬한다.** 즉, 해당 문제의 문장이 페이지 텍스트에서 나타나는 위치를 기준으로 먼저 나오는 문제가 앞에 오도록 한다.
4. **정답 단어는 반드시 해당 쪽의 원문 텍스트에 그대로 존재해야 한다.** 원문에 없는 단어를 정답으로 사용하지 말 것.
5. **각 문제의 문장은 서로 달라야 한다.** 같은 문장에서 빈칸 위치만 바꾼 문제는 안 된다. 같은 개념이 여러 곳에 등장하면 다른 문장을 사용하고, 다른 문장을 찾기 어려우면 해당 단어는 출제하지 않는다.
6. **25개 문제의 정답은 모두 서로 달라야 한다.** 같은 정답이 두 문제에 나오면 안 된다. 같은 단어를 다른 문장에서 다시 출제하는 것도 금지.
7. **문제 문장은 교과서 원문을 그대로 사용해야 한다.** 정답 단어를 `( N쪽 )`으로 바꾸는 것 외에 원문을 수정하지 말 것. 어미 변경("있어요"→"있습니다"), 단어 추가/삭제, 어순 변경 등 어떤 변형도 하지 않는다. 원문이 길면 앞뒤를 잘라도 되지만, 남긴 부분은 원문과 글자 하나 다르지 않아야 한다.
8. JSON 배열 형식: `[{"question": "( N쪽 ) ...문장...", "answer": "정답"}, ...]`

### 출력
25개 문제를 JSON 코드블록으로 출력한다.

## Step 3: 검증

생성한 JSON을 아래 Python 코드로 검증한다. `page_texts`, `page_start`, `page_end`는 Step 1에서 얻은 값을 사용한다.

```python
import sys, json
sys.path.insert(0, "bingomaker/src")
from question_generator import validate_questions

questions = <Step 2에서 생성한 JSON 리스트를 Python 리스트로 직접 대입>

errors = validate_questions(questions, page_texts, page_start, page_end)

if errors:
    print("검증 실패:")
    for e in errors:
        print(f"  - {e}")
else:
    print("검증 통과!")
    print(f"문제 수: {len(questions)}개")
```

- 검증 실패 시: 오류 내용을 확인하고 해당 문제를 수정한 후 다시 검증한다.
- 검증 통과될 때까지 반복한다.

## Step 4: JSON 저장 및 HWPX 생성

검증 통과 후 아래를 실행한다.

```python
import sys, json
sys.path.insert(0, "bingomaker/src")
from pathlib import Path
from question_generator import load_questions
from hwpx_modifier import create_bingo_worksheet
from pdf_reader import extract_text_by_page, parse_subunit_filename

pdf_path = "<인자로 받은 PDF 경로>"
metadata = parse_subunit_filename(pdf_path)
_, page_texts = extract_text_by_page(pdf_path)
page_start = min(page_texts.keys())
page_end = max(page_texts.keys())

# JSON 저장
output_dir = Path("bingomaker/output")
output_dir.mkdir(exist_ok=True)
json_path = output_dir / "questions.json"
json_path.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"문제 저장: {json_path}")

# HWPX 생성 - kind에 따라 분기
if metadata["kind"] == "subunit":
    hwpx_metadata = {
        "subject": metadata.get("subject", "사회"),
        "grade": metadata.get("grade", 4),
        "semester": metadata.get("semester", 1),
        "unit": metadata["unit"],
        "subunit": metadata["subunit"],
        "unit_name": metadata["subunit_name"],
    }
    stem = f"{metadata['unit']}-{metadata['subunit']}_{metadata['subunit_name'].replace(' ', '_')}_빙고학습지"
else:  # kind == "unit"
    hwpx_metadata = {
        "subject": metadata.get("subject", "사회"),
        "grade": metadata.get("grade", 4),
        "semester": metadata.get("semester", 1),
        "unit": metadata["unit"],
        # subunit 생략 → 헤더가 "N 이름" 형식으로 나옴
        "unit_name": metadata["unit_name"],
    }
    stem = f"{metadata['unit']}단원_{metadata['unit_name'].replace(' ', '_')}_빙고학습지"

output_path = str(output_dir / f"{stem}.hwpx")
template_path = "bingomaker/template/bingo_template.hwpx"

create_bingo_worksheet(template_path, output_path, questions, hwpx_metadata, page_start, page_end)
print(f"학습지 생성 완료: {output_path}")
```

NOTE: 파일명으로 과목/학년/학기를 얻지 못한 경우(subject 등이 비어 있는 경우),
      사용자에게 확인 후 hwpx_metadata를 보정한다.

### 문제 표 행 높이 자동 조정 (자동 적용, 별도 설정 불필요)

`create_bingo_worksheet()` 내부에서 각 문제 행의 높이를 **질문 문장 길이에
비례해 자동 재분배**한다. 구현 상수(`bingomaker/src/hwpx_modifier.py`):

- `_CHARS_PER_LINE = 40` — 12pt 한글·146mm 열폭 기준 한 줄 추정 글자 수
- `_MAX_TABLE_HEIGHT_MM = 330.0` — 헤더 포함 문제 표 전체 최대 높이 상한
- `_HEADER_ROW_HEIGHT = 2263` — 헤더 행 높이 고정

결과:
- 1줄 질문: 약 7.7mm, 2줄 질문: 약 15.3mm, 3줄 질문: 약 23.0mm
- 총 문제 표 높이 ≤ 330mm 엄수(정수 내림으로 살짝 아래서 끝남)

이 동작은 기본으로 적용되므로, 다른 요구(상한 변경 등)가 없는 한 추가
작업 없이 그대로 쓴다. 상한을 바꿔야 한다면 위 상수를 직접 수정한다.
