def parse_page_input(text: str) -> list[int]:
    """'1, 5-10, 15' 형태의 문자열을 정렬된 페이지 번호 리스트로 변환"""
    if not text.strip():
        return []

    pages = set()
    for part in text.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-", 1)
            pages.update(range(int(start.strip()), int(end.strip()) + 1))
        elif part:
            pages.add(int(part))

    return sorted(pages)


def apply_offset(textbook_pages: list[int], offset: int) -> list[int]:
    """교과서 페이지 번호 리스트를 PDF 인덱스 리스트로 변환.

    offset = 교과서번호 - PDF인덱스(1-based)
    PDF인덱스 = 교과서번호 - offset
    """
    return [page - offset for page in textbook_pages]


def extrapolate_from_anchor(
    raw: dict,        # {pdf_index: (textbook_num | None, confidence)}
    total_pages: int,
) -> dict:
    """가장 신뢰도 높은 인식 결과를 앵커로 삼아 전체 페이지 번호를 보간.

    교과서 페이지는 연속되어 있으므로:
      textbook_num[i] = anchor_num + (i - anchor_idx)

    Returns: {pdf_index: textbook_num}  (교과서 번호 1 미만인 페이지는 제외)
    """
    # 유효한 인식 결과 중 신뢰도 최대값 찾기
    best = max(
        ((idx, num, conf) for idx, (num, conf) in raw.items() if num is not None),
        key=lambda x: x[2],
        default=None,
    )
    if best is None:
        return {}

    anchor_idx, anchor_num, _ = best
    result = {}
    for i in range(total_pages):
        num = anchor_num + (i - anchor_idx)
        if num >= 1:
            result[i] = num
    return result


def build_map_from_ocr(ocr_results: dict) -> dict:
    """OCR 결과 {pdf_index: textbook_number}를 {textbook_number: pdf_index}로 변환.

    None 값(인식 실패 페이지)은 제외한다.
    """
    return {
        textbook_num: pdf_idx
        for pdf_idx, textbook_num in ocr_results.items()
        if textbook_num is not None
    }
