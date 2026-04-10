---
name: key-concepts
description: 교과서 소단원 PDF에서 핵심 개념을 추출하여 빈칸 채우기 형태의 JSON을 생성한다. 사용법 - /key-concepts [PDF경로]
---

# 핵심 개념 추출

교과서 소단원 PDF에서 핵심 개념을 분석하여 ■ 섹션별 빈칸 채우기 JSON을 생성한다.

## Step 1: PDF 텍스트 추출

인자로 받은 PDF 경로를 사용하여 아래 Python 코드를 실행한다.

```python
import sys
sys.path.insert(0, "testmaker/src")
from pdf_reader import extract_text_by_page, parse_subunit_filename

pdf_path = "<인자로 받은 PDF 경로>"
tagged_text, page_texts = extract_text_by_page(pdf_path)
metadata = parse_subunit_filename(pdf_path)

page_start = min(page_texts.keys())
page_end = max(page_texts.keys())

print(f"단원: {metadata['unit']}단원 {metadata['subunit']}소단원")
print(f"소단원명: {metadata['subunit_name']}")
print(f"페이지 범위: {page_start}~{page_end}쪽 ({len(page_texts)}페이지)")
print("---")
print(tagged_text)
```

출력된 `tagged_text`, `page_texts`, `metadata`를 기억해둔다.

## Step 2: 핵심 개념 JSON 생성

Step 1에서 추출한 페이지별 태그 텍스트를 바탕으로, 아래 규칙에 따라 핵심 개념을 JSON으로 생성한다.

### 출력 형식

```json
[
  {
    "section": "섹션명",
    "items": [
      {"question": "빈칸이 포함된 문장 (      )", "answer": "정답 단어"}
    ]
  }
]
```

### 섹션 구성 규칙
- 소단원의 학습 내용을 **주제별로 ■ 섹션으로 나눈다.**
- 섹션명은 해당 주제를 간결하게 요약한다. (예: "지도의 의미", "방위의 의미와 필요성", "축척에 따른 지도의 정보")
- 교과서의 학습 흐름 순서를 따른다.

### 빈칸 채우기 규칙
1. **빈칸 표시:** 정답 단어 자리를 `(      )`로 대체한다. 한 문장에 빈칸은 1~2개.
2. **정답:** 1~3단어. 반드시 교과서 원문 텍스트에 존재하는 단어여야 한다.
3. **문장:** 교과서 원문을 기반으로 하되, 빈칸 채우기에 적합하도록 간결하게 정리할 수 있다.

### 출제 기준
- **출제해야 하는 것:**
  - 교과서가 정의하거나 설명하는 핵심 개념과 용어
  - 학습 목표에 직접 연결되는 내용
  - "꼭 기억해요", 정리 코너 등에 등장하는 핵심 단어
  - 개념 간의 관계나 원리
- **출제하면 안 되는 것:**
  - 단순 예시로 등장하는 고유명사 (특정 지역명, 인물명 등)
  - 구체적 숫자 (통계 수치, 연도 등)
  - 학습 목표와 무관한 사소한 사실
  - 활동 지시문 (써 봅시다, 이야기해 봅시다 등)
- **판단 기준:** "이 단어를 모르면 이 소단원을 이해했다고 할 수 없는가?" → Yes면 출제, No면 제외

### 분량 기준
- 소단원 분량에 비례하여 적절한 수의 섹션과 항목을 생성한다.
- 일반적으로 5~15개 섹션, 섹션당 2~6개 항목이 적절하다.

### 출력
핵심 개념 JSON을 코드블록으로 출력한다.

## Step 3: 검증

생성한 JSON을 아래 Python 코드로 검증한다. `page_texts`는 Step 1에서 얻은 값을 사용한다.

```python
import sys
sys.path.insert(0, "testmaker/src")
from concept_validator import validate_concepts

concepts = <Step 2에서 생성한 JSON 리스트를 Python 리스트로 직접 대입>

errors = validate_concepts(concepts, page_texts)

if errors:
    print("검증 실패:")
    for e in errors:
        print(f"  - {e}")
else:
    print("검증 통과!")
    total_items = sum(len(s["items"]) for s in concepts)
    print(f"섹션 수: {len(concepts)}개, 총 항목 수: {total_items}개")
```

- 검증 실패 시: 오류 내용을 확인하고 해당 항목을 수정한 후 다시 검증한다.
- 검증 통과될 때까지 반복한다.

## Step 4: JSON 저장

검증 통과 후 아래를 실행한다.

```python
import sys, json
sys.path.insert(0, "testmaker/src")
from pathlib import Path
from pdf_reader import parse_subunit_filename

pdf_path = "<인자로 받은 PDF 경로>"
metadata = parse_subunit_filename(pdf_path)

output_dir = Path("testmaker/output")
output_dir.mkdir(exist_ok=True)

stem = f"{metadata['unit']}-{metadata['subunit']}_{metadata['subunit_name'].replace(' ', '_')}_핵심개념"
json_path = output_dir / f"{stem}.json"
json_path.write_text(json.dumps(concepts, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"핵심 개념 저장 완료: {json_path}")
```
