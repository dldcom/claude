# Bingo Questions Skill 설계

## 개요

교과서 PDF에서 페이지별 텍스트를 추출하고, 25개 빈칸 채우기 빙고 문제를 생성하여 HWPX 학습지를 만드는 Claude Code skill.

## 배경

기존에는 Claude 대화창에서 수동으로 프롬프트를 주고 JSON을 받아 저장하는 방식이었음. 이때 두 가지 문제 발생:
- 문제에 적힌 쪽수가 실제 교과서 쪽수와 불일치
- 쪽수가 오름차순이 아닌 뒤죽박죽 순서

**근본 원인:** Claude가 텍스트의 출처 페이지를 모르는 상태에서 쪽수를 추측했기 때문.

## 해결 방식

PDF 텍스트를 **페이지별로 분리**하여 `[N쪽]` 태그를 붙여 전달. Claude가 문제를 만들 때 태그에서 쪽수를 직접 참조하므로 쪽수 오류가 구조적으로 방지됨.

## Skill 실행 흐름

```
사용자: /bingo-questions [PDF경로]
    ↓
Step 1: PDF 텍스트 추출
    - extract_text_by_page()로 페이지별 태그 텍스트 생성
    - parse_filename()으로 과목/학년/학기/단원 메타데이터 추출
    ↓
Step 2: 문제 생성
    - 페이지별 태그 텍스트 + 메타데이터를 프롬프트에 포함
    - Claude가 25개 빈칸 채우기 문제를 JSON으로 생성
    ↓
Step 3: 검증
    - 정확히 25개인지 확인
    - 각 문제의 쪽수가 교과서 페이지 범위 내인지 확인
    - 쪽수 오름차순 정렬 여부 확인
    - 각 정답 단어가 해당 쪽수 텍스트에 실제 존재하는지 확인
    - 실패 시 오류 내용 보고 후 재생성
    ↓
Step 4: 저장 & HWPX 생성
    - output/questions.json 저장
    - make_bingo.py 실행하여 HWPX 학습지 생성
```

## 페이지별 텍스트 추출 (`extract_text_by_page`)

`bingomaker/src/pdf_reader.py`에 추가하는 새 함수.

**입력:** PDF 파일 경로
**출력:** 페이지별 태그가 붙은 문자열

```
[28쪽]
지도에서 방위를 나타내는 기호를 방위표라고 합니다...

[29쪽]
우리 지역의 위치를 나타내는 방법에는 여러 가지가 있습니다...
```

**동작:**
- 각 PDF 페이지에서 텍스트 추출 (PyMuPDF)
- 기존 쪽수 인식 로직으로 각 페이지의 교과서 쪽수 매핑
- 쪽수 인식 불가 페이지(표지, 목차 등)는 제외
- 문자열로 결합하여 반환

## 문제 생성 프롬프트

```
당신은 초등학교 {학년}학년 {과목} 교과서로 빈칸 채우기 문제를 만드는 교사입니다.

아래는 교과서 텍스트입니다. 각 페이지에 [N쪽] 태그가 붙어 있습니다.

{페이지별_태그_텍스트}

규칙:
1. 정확히 25개 문제를 만드세요.
2. 형식: ( N쪽 ) 서술문에 빈칸(    ) → 정답은 1~3단어
3. N쪽은 반드시 해당 내용이 실제로 있는 페이지의 [N쪽] 태그와 일치해야 합니다.
4. 쪽수 오름차순으로 정렬하세요.
5. 중요한 개념, 용어, 사실 위주로 출제하세요.
6. JSON 배열로 출력: [{"question": "( N쪽 ) ...(    )...", "answer": "정답"}, ...]
```

## 검증 함수 (`validate_questions`)

`bingomaker/src/question_generator.py`에 추가하는 새 함수.

**입력:** questions(리스트), page_texts(페이지별 텍스트 딕셔너리), page_start, page_end
**출력:** 검증 결과 (성공/실패 + 오류 목록)

**검증 항목:**
1. 문제 개수 == 25
2. 각 문제의 쪽수가 page_start ~ page_end 범위 내
3. 쪽수가 오름차순
4. 각 정답 단어가 해당 쪽수 텍스트에 포함됨

## Skill 파일

**경로:** `skills/bingo-questions.md`

```yaml
---
name: bingo-questions
description: 교과서 PDF에서 25개 빈칸 채우기 빙고 문제를 생성하고 HWPX 학습지를 만든다
---
```

skill은 Claude Code 대화에서 `/bingo-questions [PDF경로]`로 호출.

## 기존 코드 변경점

| 파일 | 변경 내용 |
|------|-----------|
| `bingomaker/src/pdf_reader.py` | `extract_text_by_page()` 함수 추가 |
| `bingomaker/src/question_generator.py` | `validate_questions()` 함수 추가 |
| `skills/bingo-questions.md` | 새 파일 생성 |

기존 함수들(`extract_text`, `parse_filename`, `load_questions`, `make_bingo.py` 등)은 변경 없음.
