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
