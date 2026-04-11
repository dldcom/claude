import json
import re
from pathlib import Path


def load_questions(json_path: str) -> list[dict]:
    """JSON 파일에서 25개 문제를 로드한다.

    JSON 형식: [{"question": "문제", "answer": "정답"}, ...]
    """
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))

    if len(data) != 25:
        raise ValueError(f"25개 문제가 필요하지만 {len(data)}개가 있습니다.")

    return data


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
    5. 25개 정답이 모두 서로 다른지 (중복 금지)
    6. 같은 쪽 안에서 원문 등장 순서대로 정렬되어 있는지 (베스트 에포트)
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

    # 5. 중복 정답 검증
    seen_answers: dict[str, int] = {}
    for i, q in enumerate(questions):
        ans = q["answer"]
        if ans in seen_answers:
            errors.append(
                f"문제 {i+1}: 정답 '{ans}'이(가) 문제 {seen_answers[ans]+1}과 중복입니다."
            )
        else:
            seen_answers[ans] = i

    # 6. 같은 쪽 내 원문 순서 검증 (베스트 에포트)
    #    문제 문장에서 ( N쪽 )을 정답으로 되돌린 뒤, 앞뒤 공백을 제외한
    #    연속 조각을 페이지 텍스트에서 찾아 위치를 얻는다. 찾지 못하면
    #    해당 문제는 순서 검증에서 제외한다.
    def _find_position(q: dict, page_num: int) -> int:
        text = page_texts.get(page_num, "")
        if not text:
            return -1
        restored = re.sub(r"\(\s*\d+쪽\s*\)", q["answer"], q["question"])
        # 우선 전체 문장으로 시도
        idx = text.find(restored)
        if idx != -1:
            return idx
        # 실패 시 정답 앞뒤 15자씩으로 단축 탐색
        m = re.search(re.escape(q["answer"]), restored)
        if not m:
            return -1
        start = max(0, m.start() - 15)
        end = min(len(restored), m.end() + 15)
        snippet = restored[start:end]
        return text.find(snippet)

    positions_by_page: dict[int, list[tuple[int, int, int]]] = {}
    for i, q in enumerate(questions):
        if i >= len(page_nums) or page_nums[i] == 0:
            continue
        page_num = page_nums[i]
        pos = _find_position(q, page_num)
        positions_by_page.setdefault(page_num, []).append((i, pos, i))

    for page_num, entries in positions_by_page.items():
        # 위치를 못 찾은 항목은 순서 검증에서 제외
        known = [(i, pos) for i, pos, _ in entries if pos >= 0]
        if len(known) < 2:
            continue
        indices_order = [i for i, _ in known]
        positions_order = [pos for _, pos in known]
        if positions_order != sorted(positions_order):
            errors.append(
                f"{page_num}쪽 문제들이 원문 등장 순서와 다릅니다. "
                f"문제 번호 순서: {[i+1 for i in indices_order]}, "
                f"원문 위치: {positions_order}"
            )

    return errors
