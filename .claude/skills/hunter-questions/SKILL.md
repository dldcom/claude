---
name: hunter-questions
description: 핵심개념 JSON에서 16개 문제사냥놀이 카드를 생성하고 HWPX 학습지를 만든다. 사용법 - /hunter-questions [핵심개념.json경로]
---

# 문제사냥놀이 카드 생성

핵심개념 JSON에서 16개 문제(빈칸/선택지)를 생성하고 HWPX 카드학습지를 만든다.

## Step 1: 핵심개념 JSON 로드

인자로 받은 JSON 경로를 사용하여 아래 Python 코드를 실행한다.

```python
import sys, json
sys.stdout.reconfigure(encoding="utf-8")

json_path = "<인자로 받은 JSON 경로>"
with open(json_path, encoding="utf-8") as f:
    concepts = json.load(f)

total = sum(len(s["items"]) for s in concepts)
print(f"섹션 수: {len(concepts)}")
print(f"총 개념 수: {total}")
print("---")
for s in concepts:
    print(f"\n[{s['section']}] ({len(s['items'])}개)")
    for item in s["items"]:
        print(f"  Q: {item['question']}")
        print(f"  A: {item['answer']}")
```

출력된 `concepts`를 기억해둔다.

## Step 2: 16개 카드 문제 생성

Step 1에서 로드한 핵심개념을 바탕으로, 아래 규칙에 따라 정확히 16개 카드 문제를 JSON으로 생성한다.

### 문제 유형 (2가지)

#### 1. 빈칸 채우기 (blank)
- 핵심개념 JSON의 `(      )` 빈칸을 `○○`(정답 글자수만큼 동그라미)로 바꾼다.
- 예: `"물이 서로 다른 상태로 변하는 현상을 물의 (      )라고 한다."` → `"물이 서로 다른 상태로 변하는 현상을 물의 ○○ ○○라고 한다."`

#### 2. 선택지 (choice)
- 빈칸 대신 `(정답 / 오답)` 형식으로 두 선택지를 제시한다.
- 오답은 정답의 반대말, 비슷하지만 틀린 개념, 또는 학생들이 흔히 혼동하는 단어를 사용한다.
- 예: `"물이 얼면 부피는 (늘어나고 / 줄어들고), ..."` → 정답: 늘어나고

### 규칙
1. 정확히 16개 문제를 만든다.
2. blank과 choice 두 유형을 적절히 혼합한다. choice는 4~6개 정도.
3. **핵심개념 JSON에 있는 문제만 사용한다.** 새로운 문제를 만들지 말 것.
4. 개념이 16개보다 많으면 핵심적인 것을 선별하고, 적으면 JSON의 모든 개념을 사용한다.
5. **각 문제의 문장은 서로 달라야 한다.**
6. **카드 한 장만으로 문제를 이해할 수 있어야 한다.** "이와 같은 현상", "이것은" 같은 지시어가 있으면 구체적인 내용으로 바꾼다.
7. 정답은 1~3단어.
8. choice 유형에서 정답과 오답의 순서는 랜덤하게 섞는다 (항상 정답이 먼저 오지 않도록).

### JSON 형식

```json
[
  {
    "type": "blank",
    "question": "물이 서로 다른 상태로 변하는 현상을 물의 ○○ ○○라고 한다.",
    "answer": "상태 변화"
  },
  {
    "type": "choice",
    "question": "물이 얼면 부피는 (늘어나고 / 줄어들고), 얼음이 녹으면 부피가 줄어든다.",
    "answer": "늘어나고"
  }
]
```

16개 문제를 JSON 코드블록으로 출력한다.

## Step 3: 검증

생성한 JSON을 아래 Python 코드로 검증한다.

```python
import sys, json
sys.path.insert(0, "huntermaker/src")
from question_validator import validate_questions

questions = <Step 2에서 생성한 JSON 리스트를 Python 리스트로 직접 대입>

errors = validate_questions(questions)

if errors:
    print("검증 실패:")
    for e in errors:
        print(f"  - {e}")
else:
    print("검증 통과!")
    print(f"문제 수: {len(questions)}개")
    type_counts = {}
    for q in questions:
        type_counts[q['type']] = type_counts.get(q['type'], 0) + 1
    print(f"유형별: {type_counts}")
```

- 검증 실패 시: 오류 내용을 확인하고 해당 문제를 수정한 후 다시 검증한다.
- 검증 통과될 때까지 반복한다.

## Step 4: JSON 저장 및 HWPX 생성

검증 통과 후 아래를 실행한다. 실행 전 반드시 사용자에게 **과목, 학년, 학기**를 확인한다.

```python
import sys, json, re
sys.path.insert(0, "huntermaker/src")
from pathlib import Path
from hwpx_modifier import create_hunter_worksheet

json_input_path = "<인자로 받은 JSON 경로>"

# 파일명에서 메타데이터 추출: [과목]학년-학기-단원_핵심개념.json
filename = Path(json_input_path).stem
match = re.search(r"\[(.+?)\](\d+)-(\d+)-(\d+)", filename)
if match:
    subject, grade, semester, unit = match.group(1), int(match.group(2)), int(match.group(3)), int(match.group(4))
else:
    subject = "<사용자에게 확인>"
    grade = "<사용자에게 확인>"
    semester = "<사용자에게 확인>"
    unit = "<사용자에게 확인>"

# JSON 저장
output_dir = Path("huntermaker/output")
output_dir.mkdir(exist_ok=True)
json_path = output_dir / "questions.json"
json_path.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"문제 저장: {json_path}")

# HWPX 생성
hwpx_metadata = {
    "subject": subject,
    "grade": grade,
    "semester": semester,
    "unit": unit,
    "unit_name": "",
}

stem = Path(json_input_path).stem.replace("_핵심개념", "") + "_문제사냥놀이카드"
output_path = str(output_dir / f"{stem}.hwpx")
template_path = "huntermaker/template/hunter_card.hwpx"

create_hunter_worksheet(template_path, output_path, questions, hwpx_metadata, 0, 0)
print(f"카드학습지 생성 완료: {output_path}")
```
