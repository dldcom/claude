# Bingo Questions Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Claude Code skill that generates 25 fill-in-the-blank bingo questions from a textbook PDF with accurate page numbers, then produces an HWPX worksheet.

**Architecture:** Add `extract_text_by_page()` to `pdf_reader.py` for page-tagged text extraction, add `validate_questions()` to `question_generator.py` for post-generation verification, create a Claude Code skill file that orchestrates the full pipeline.

**Tech Stack:** Python, PyMuPDF (fitz), Claude Code skill (Markdown)

---

### Task 1: Add `extract_text_by_page()` to pdf_reader.py

**Files:**
- Modify: `bingomaker/src/pdf_reader.py`
- Create: `bingomaker/tests/test_pdf_reader.py`

- [ ] **Step 1: Write the failing test**

```python
# bingomaker/tests/test_pdf_reader.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from pdf_reader import extract_text_by_page


def test_extract_text_by_page_returns_tagged_string():
    """페이지별 태그가 붙은 문자열을 반환하는지 확인."""
    pdf_path = str(Path(__file__).parent.parent / "input" / "1단원_2소단원_우리_지역의_위치와_특성.pdf")
    result, page_texts = extract_text_by_page(pdf_path)

    # [N쪽] 태그가 최소 1개 이상 존재
    assert "[" in result and "쪽]" in result

    # page_texts 딕셔너리가 비어있지 않음
    assert len(page_texts) > 0

    # 모든 키는 정수 (교과서 쪽수)
    assert all(isinstance(k, int) for k in page_texts.keys())

    # 모든 값은 비어있지 않은 문자열
    assert all(isinstance(v, str) and len(v) > 0 for v in page_texts.values())


def test_extract_text_by_page_pages_are_sorted():
    """태그의 쪽수가 오름차순인지 확인."""
    pdf_path = str(Path(__file__).parent.parent / "input" / "1단원_2소단원_우리_지역의_위치와_특성.pdf")
    result, page_texts = extract_text_by_page(pdf_path)

    pages = list(page_texts.keys())
    assert pages == sorted(pages)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bingomaker && python -m pytest tests/test_pdf_reader.py -v`
Expected: FAIL with "cannot import name 'extract_text_by_page'"

- [ ] **Step 3: Write minimal implementation**

Add to `bingomaker/src/pdf_reader.py`:

```python
def extract_text_by_page(pdf_path: str) -> tuple[str, dict[int, str]]:
    """PDF에서 페이지별 텍스트를 추출하고 교과서 쪽수 태그를 붙여 반환한다.

    Returns:
        tagged_text: "[N쪽]\n텍스트\n\n[M쪽]\n텍스트\n..." 형태의 문자열
        page_texts: {교과서쪽수: 텍스트} 딕셔너리 (검증용)
    """
    doc = fitz.open(pdf_path)
    page_texts = {}

    for i in range(doc.page_count):
        page = doc[i]
        text = page.get_text().strip()
        if not text:
            continue

        # 페이지 하단에서 교과서 쪽수 추출
        page_num = _detect_page_number(page)
        if page_num is None:
            continue

        page_texts[page_num] = text

    doc.close()

    # 쪽수 오름차순으로 태그 문자열 생성
    tagged_parts = []
    for num in sorted(page_texts.keys()):
        tagged_parts.append(f"[{num}쪽]\n{page_texts[num]}")

    tagged_text = "\n\n".join(tagged_parts)
    return tagged_text, page_texts


def _detect_page_number(page) -> int | None:
    """페이지 하단에서 교과서 쪽수를 추출한다. 없으면 None."""
    lines = page.get_text().strip().split("\n")
    for line in reversed(lines):
        line = line.strip()
        if line.isdigit():
            return int(line)
    return None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bingomaker && python -m pytest tests/test_pdf_reader.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bingomaker/src/pdf_reader.py bingomaker/tests/test_pdf_reader.py
git commit -m "feat(bingomaker): add extract_text_by_page for page-tagged text extraction"
```

---

### Task 2: Add `validate_questions()` to question_generator.py

**Files:**
- Modify: `bingomaker/src/question_generator.py`
- Create: `bingomaker/tests/test_question_generator.py`

- [ ] **Step 1: Write the failing test**

```python
# bingomaker/tests/test_question_generator.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from question_generator import validate_questions


def _make_q(page: int, answer: str) -> dict:
    return {"question": f"( {page}쪽 ) 테스트 (    )입니다.", "answer": answer}


def test_validate_all_pass():
    """모든 검증을 통과하는 경우."""
    page_texts = {28: "방위표는 방위를 나타냅니다.", 29: "축척은 거리를 나타냅니다."}
    questions = [_make_q(28, "방위표")] * 13 + [_make_q(29, "축척")] * 12
    errors = validate_questions(questions, page_texts, 28, 46)
    assert errors == []


def test_validate_wrong_count():
    """25개가 아닌 경우 오류."""
    questions = [_make_q(28, "방위표")] * 10
    errors = validate_questions(questions, {28: "방위표"}, 28, 46)
    assert any("25개" in e for e in errors)


def test_validate_page_out_of_range():
    """쪽수가 범위 밖인 경우 오류."""
    questions = [_make_q(99, "방위표")] * 25
    errors = validate_questions(questions, {99: "방위표"}, 28, 46)
    assert any("범위" in e for e in errors)


def test_validate_not_sorted():
    """쪽수가 오름차순이 아닌 경우 오류."""
    page_texts = {28: "방위표", 29: "축척"}
    questions = [_make_q(29, "축척")] * 13 + [_make_q(28, "방위표")] * 12
    errors = validate_questions(questions, page_texts, 28, 46)
    assert any("오름차순" in e for e in errors)


def test_validate_answer_not_in_text():
    """정답이 해당 쪽 텍스트에 없는 경우 오류."""
    page_texts = {28: "방위표는 방위를 나타냅니다."}
    questions = [_make_q(28, "존재하지않는단어")] * 25
    errors = validate_questions(questions, page_texts, 28, 46)
    assert any("존재하지않는단어" in e for e in errors)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bingomaker && python -m pytest tests/test_question_generator.py -v`
Expected: FAIL with "cannot import name 'validate_questions'"

- [ ] **Step 3: Write minimal implementation**

Add to `bingomaker/src/question_generator.py`:

```python
import re


def validate_questions(
    questions: list[dict],
    page_texts: dict[int, str],
    page_start: int,
    page_end: int,
) -> list[str]:
    """생성된 문제를 검증하고 오류 목록을 반환한다.

    검증 항목:
    1. 정확히 25개인지
    2. 각 쪽수가 page_start~page_end 범위 내인지
    3. 쪽수가 오름차순인지
    4. 각 정답이 해당 쪽수 텍스트에 존재하는지
    """
    errors = []

    # 1. 개수 검증
    if len(questions) != 25:
        errors.append(f"문제가 {len(questions)}개입니다. 정확히 25개여야 합니다.")

    # 각 문제에서 쪽수 추출
    page_nums = []
    for i, q in enumerate(questions):
        match = re.search(r"\(\s*(\d+)쪽\s*\)", q["question"])
        if match:
            page_nums.append(int(match.group(1)))
        else:
            errors.append(f"문제 {i+1}: 쪽수를 찾을 수 없습니다.")
            page_nums.append(0)

    # 2. 범위 검증
    for i, num in enumerate(page_nums):
        if num != 0 and (num < page_start or num > page_end):
            errors.append(f"문제 {i+1}: {num}쪽은 범위({page_start}~{page_end}) 밖입니다.")

    # 3. 오름차순 검증
    if page_nums != sorted(page_nums):
        errors.append("쪽수가 오름차순이 아닙니다.")

    # 4. 정답 존재 검증
    for i, q in enumerate(questions):
        if i >= len(page_nums) or page_nums[i] == 0:
            continue
        page_num = page_nums[i]
        answer = q["answer"]
        text = page_texts.get(page_num, "")
        if answer not in text:
            errors.append(f"문제 {i+1}: 정답 '{answer}'이(가) {page_num}쪽 텍스트에 없습니다.")

    return errors
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bingomaker && python -m pytest tests/test_question_generator.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add bingomaker/src/question_generator.py bingomaker/tests/test_question_generator.py
git commit -m "feat(bingomaker): add validate_questions for post-generation verification"
```

---

### Task 3: Add `parse_subunit_filename()` to pdf_reader.py

기존 `parse_filename()`은 `[과목]학년-학기-단원_교과서.pdf` 형식만 지원한다.
pdf_extractor가 생성하는 `1단원_2소단원_우리_지역의_위치와_특성.pdf` 형식을 파싱하는 함수가 필요하다.

**Files:**
- Modify: `bingomaker/src/pdf_reader.py`
- Modify: `bingomaker/tests/test_pdf_reader.py`

- [ ] **Step 1: Write the failing test**

`bingomaker/tests/test_pdf_reader.py`에 추가:

```python
from pdf_reader import parse_subunit_filename


def test_parse_subunit_filename():
    """소단원 파일명에서 단원/소단원/이름 추출."""
    result = parse_subunit_filename("1단원_2소단원_우리_지역의_위치와_특성.pdf")
    assert result == {
        "unit": 1,
        "subunit": 2,
        "subunit_name": "우리 지역의 위치와 특성",
    }


def test_parse_subunit_filename_different_unit():
    result = parse_subunit_filename("3단원_1소단원_경제활동과_합리적_선택.pdf")
    assert result == {
        "unit": 3,
        "subunit": 1,
        "subunit_name": "경제활동과 합리적 선택",
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd bingomaker && python -m pytest tests/test_pdf_reader.py::test_parse_subunit_filename -v`
Expected: FAIL with "cannot import name 'parse_subunit_filename'"

- [ ] **Step 3: Write minimal implementation**

Add to `bingomaker/src/pdf_reader.py`:

```python
def parse_subunit_filename(pdf_path: str) -> dict:
    """소단원 PDF 파일명에서 단원, 소단원, 이름을 추출한다.

    예: 1단원_2소단원_우리_지역의_위치와_특성.pdf
        → {"unit": 1, "subunit": 2, "subunit_name": "우리 지역의 위치와 특성"}
    """
    filename = Path(pdf_path).stem
    match = re.search(r"(\d+)단원_(\d+)소단원_(.+)", filename)
    if not match:
        raise ValueError(f"파일명 형식이 올바르지 않습니다: {filename}\n"
                         f"예상 형식: N단원_M소단원_이름.pdf")
    return {
        "unit": int(match.group(1)),
        "subunit": int(match.group(2)),
        "subunit_name": match.group(3).replace("_", " "),
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd bingomaker && python -m pytest tests/test_pdf_reader.py -v`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add bingomaker/src/pdf_reader.py bingomaker/tests/test_pdf_reader.py
git commit -m "feat(bingomaker): add parse_subunit_filename for pdf_extractor output format"
```

---

### Task 4: Create the Claude Code skill file

**Files:**
- Create: `skills/bingo-questions.md`

- [ ] **Step 1: Create skills directory**

```bash
mkdir -p skills
```

- [ ] **Step 2: Write the skill file**

```markdown
---
name: bingo-questions
description: 교과서 PDF에서 25개 빈칸 채우기 빙고 문제를 생성하고 HWPX 학습지를 만든다. 사용법 - /bingo-questions [PDF경로]
---

# 빙고 문제 생성 Skill

교과서 소단원 PDF에서 25개 빈칸 채우기 문제를 생성하고 HWPX 빙고 학습지를 만든다.

## Step 1: PDF 텍스트 추출

아래 Python 코드를 실행하여 페이지별 태그 텍스트와 메타데이터를 추출한다.

\```python
import sys
sys.path.insert(0, "bingomaker/src")
from pdf_reader import extract_text_by_page, parse_subunit_filename

pdf_path = "{인자로 받은 PDF 경로}"
tagged_text, page_texts = extract_text_by_page(pdf_path)
metadata = parse_subunit_filename(pdf_path)

print(f"단원: {metadata['unit']}단원 {metadata['subunit']}소단원")
print(f"소단원명: {metadata['subunit_name']}")
print(f"페이지 수: {len(page_texts)}개")
print(f"페이지 범위: {min(page_texts.keys())}~{max(page_texts.keys())}쪽")
print("---")
print(tagged_text)
\```

## Step 2: 25개 문제 생성

추출한 텍스트를 바탕으로 아래 규칙에 따라 정확히 25개 문제를 생성한다.

### 규칙
1. 정확히 25개 문제를 만든다.
2. 형식: `( N쪽 ) 서술문에 빈칸(    ) → 정답은 1~3단어`
3. N쪽은 반드시 해당 내용이 실제로 있는 페이지의 `[N쪽]` 태그와 일치해야 한다.
4. 쪽수 오름차순으로 정렬한다.
5. 중요한 개념, 용어, 사실 위주로 출제한다.
6. 정답 단어는 반드시 해당 쪽의 원문 텍스트에 존재해야 한다.
7. JSON 배열로 출력한다: `[{"question": "( N쪽 ) ...(    )...", "answer": "정답"}, ...]`

### 출력
JSON 코드블록으로 25개 문제를 출력한다.

## Step 3: 검증

생성한 JSON을 아래 Python 코드로 검증한다. page_texts는 Step 1에서 얻은 값을 사용한다.

\```python
import sys, json
sys.path.insert(0, "bingomaker/src")
from question_generator import validate_questions

questions = json.loads('''여기에 Step 2에서 생성한 JSON을 붙여넣기''')

page_start = min(page_texts.keys())
page_end = max(page_texts.keys())
errors = validate_questions(questions, page_texts, page_start, page_end)

if errors:
    print("검증 실패:")
    for e in errors:
        print(f"  - {e}")
else:
    print("검증 통과!")
\```

검증 실패 시: 오류 내용을 확인하고 해당 문제만 수정하여 다시 검증한다.

## Step 4: JSON 저장 및 HWPX 생성

검증 통과 후 아래를 실행한다.

\```python
import json
from pathlib import Path

# JSON 저장
output_dir = Path("bingomaker/output")
output_dir.mkdir(exist_ok=True)
json_path = output_dir / "questions.json"
json_path.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"문제 저장: {json_path}")
\```

그 다음 make_bingo.py를 실행하여 HWPX를 생성한다.
단, make_bingo.py는 `parse_filename()`으로 `[과목]학년-학기-단원` 형식을 기대하므로,
skill에서 직접 HWPX 생성 함수를 호출한다:

\```python
import sys
sys.path.insert(0, "bingomaker/src")
from pathlib import Path
from pdf_reader import extract_text_by_page, parse_subunit_filename
from question_generator import load_questions
from hwpx_modifier import create_bingo_worksheet

pdf_path = "{PDF 경로}"
metadata = parse_subunit_filename(pdf_path)
_, page_texts = extract_text_by_page(pdf_path)
page_start = min(page_texts.keys())
page_end = max(page_texts.keys())

questions = load_questions("bingomaker/output/questions.json")

# 메타데이터 구성 — 과목/학년/학기는 사용자에게 확인하거나 컨텍스트에서 추론
hwpx_metadata = {
    "subject": "사회",   # 필요시 사용자에게 확인
    "grade": 4,           # 필요시 사용자에게 확인
    "semester": 1,        # 필요시 사용자에게 확인
    "unit": metadata["unit"],
    "unit_name": metadata["subunit_name"],
}

stem = f"{metadata['unit']}-{metadata['subunit']}_{metadata['subunit_name'].replace(' ', '_')}_빙고학습지"
output_path = f"bingomaker/output/{stem}.hwpx"
template_path = "bingomaker/template/bingo.hwpx"

create_bingo_worksheet(template_path, output_path, questions, hwpx_metadata, page_start, page_end)
print(f"학습지 생성 완료: {output_path}")
\```
```

- [ ] **Step 3: Commit**

```bash
git add skills/bingo-questions.md
git commit -m "feat: add bingo-questions Claude Code skill"
```

---

### Task 5: Integration test — 실제 PDF로 전체 파이프라인 테스트

**Files:**
- Modify: `bingomaker/tests/test_pdf_reader.py`

- [ ] **Step 1: 실제 PDF로 extract_text_by_page 결과 확인**

```bash
cd bingomaker && python -c "
import sys; sys.path.insert(0, 'src')
from pdf_reader import extract_text_by_page, parse_subunit_filename

pdf_path = 'input/1단원_2소단원_우리_지역의_위치와_특성.pdf'
tagged, pages = extract_text_by_page(pdf_path)
meta = parse_subunit_filename(pdf_path)

print(f'단원: {meta}')
print(f'페이지 수: {len(pages)}')
print(f'페이지 번호: {sorted(pages.keys())}')
print()
print(tagged[:500])
"
```

Expected: 교과서 쪽수가 태그로 표시된 텍스트가 출력됨.

- [ ] **Step 2: /bingo-questions skill을 사용하여 실제 문제 생성 테스트**

Claude Code에서 `/bingo-questions bingomaker/input/1단원_2소단원_우리_지역의_위치와_특성.pdf` 실행.
검증 통과 + HWPX 파일 생성 확인.

- [ ] **Step 3: 모든 테스트 실행**

```bash
cd bingomaker && python -m pytest tests/ -v
```

Expected: ALL PASS
