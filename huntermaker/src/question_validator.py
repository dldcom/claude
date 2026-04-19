def validate_questions(questions: list[dict]) -> list[str]:
    """문제사냥놀이 16개 카드 문제를 검증한다.

    Args:
        questions: 문제 리스트

    Returns:
        오류 메시지 리스트 (빈 리스트이면 검증 통과)
    """
    errors = []

    # 1. 문제 수 검증 (1~16개 허용)
    if not (1 <= len(questions) <= 16):
        errors.append(f"문제 수는 1~16개여야 하지만 {len(questions)}개입니다.")

    # 2. type 유효성 검증
    valid_types = {"blank", "choice"}
    for i, q in enumerate(questions):
        if q.get("type") not in valid_types:
            errors.append(f"문제 {i+1}: type이 '{q.get('type')}'입니다. "
                          f"blank, choice 중 하나여야 합니다.")

    # 3. 필수 필드 검증
    for i, q in enumerate(questions):
        if not q.get("question"):
            errors.append(f"문제 {i+1}: question이 비어 있습니다.")
        if not q.get("answer"):
            errors.append(f"문제 {i+1}: answer가 비어 있습니다.")

    # 4. 정답 길이 검증 (1~3단어)
    for i, q in enumerate(questions):
        answer = q.get("answer", "")
        word_count = len(answer.split())
        if word_count > 3:
            errors.append(f"문제 {i+1}: 정답 '{answer}'이(가) 3단어를 초과합니다.")

    # 5. 문제 중복 검증
    seen = set()
    for i, q in enumerate(questions):
        text = q.get("question", "")
        if text in seen:
            errors.append(f"문제 {i+1}: 중복된 문제입니다.")
        seen.add(text)

    # 6. choice 유형 형식 검증
    for i, q in enumerate(questions):
        if q.get("type") == "choice":
            text = q.get("question", "")
            if " / " not in text:
                errors.append(f"문제 {i+1}: choice 유형에 '(A / B)' 형식의 선택지가 없습니다.")

    return errors


def load_questions(json_path: str) -> list[dict]:
    """JSON 파일에서 문제를 로드한다."""
    import json
    from pathlib import Path

    data = json.loads(Path(json_path).read_text(encoding="utf-8"))
    if len(data) != 16:
        raise ValueError(f"16개 문제가 필요하지만 {len(data)}개가 있습니다.")
    return data
