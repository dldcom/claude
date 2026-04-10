import re


def validate_concepts(
    concepts: list[dict],
    page_texts: dict[int, str],
) -> list[str]:
    """생성된 핵심 개념 JSON을 검증하고 오류 목록을 반환한다.

    검증 항목:
    1. 각 항목에 section, items 필드가 존재하는지
    2. 각 item에 question, answer 필드가 존재하는지
    3. 각 정답이 교과서 원문 텍스트 어딘가에 존재하는지
    """
    errors = []
    full_text = "\n".join(page_texts.values())

    for i, section in enumerate(concepts):
        if "section" not in section:
            errors.append(f"섹션 {i+1}: 'section' 필드가 없습니다.")
        if "items" not in section:
            errors.append(f"섹션 {i+1}: 'items' 필드가 없습니다.")
            continue

        section_name = section.get("section", f"(이름 없음 #{i+1})")

        if not isinstance(section["items"], list) or len(section["items"]) == 0:
            errors.append(f"섹션 '{section_name}': items가 비어 있거나 리스트가 아닙니다.")
            continue

        for j, item in enumerate(section["items"]):
            if "question" not in item:
                errors.append(f"섹션 '{section_name}' 항목 {j+1}: 'question' 필드가 없습니다.")
            if "answer" not in item:
                errors.append(f"섹션 '{section_name}' 항목 {j+1}: 'answer' 필드가 없습니다.")
                continue

            answer = item["answer"]
            if answer not in full_text:
                errors.append(
                    f"섹션 '{section_name}' 항목 {j+1}: "
                    f"정답 '{answer}'이(가) 교과서 텍스트에 없습니다."
                )

    return errors
