import re
from pathlib import Path

import fitz


def parse_filename(pdf_path: str) -> dict:
    """파일명에서 과목, 학년, 학기, 단원 정보를 추출한다.

    예: [과학]4-1-1_교과서.pdf → {"subject": "과학", "grade": 4, "semester": 1, "unit": 1}
    """
    filename = Path(pdf_path).stem
    match = re.search(r"\[(.+?)\](\d+)-(\d+)-(\d+)", filename)
    if not match:
        raise ValueError(f"파일명 형식이 올바르지 않습니다: {filename}\n"
                         f"예상 형식: [과목]학년-학기-단원_교과서.pdf")
    return {
        "subject": match.group(1),
        "grade": int(match.group(2)),
        "semester": int(match.group(3)),
        "unit": int(match.group(4)),
    }


def extract_text(pdf_path: str) -> tuple[str, int, int]:
    """PDF에서 전체 텍스트를 추출하고, 교과서 내 첫/마지막 페이지 번호를 반환한다."""
    doc = fitz.open(pdf_path)
    all_text = []
    page_numbers = []

    for page in doc:
        text = page.get_text()
        all_text.append(text)
        # 페이지 하단에 표시된 교과서 쪽수 추출 (보통 마지막 줄에 숫자)
        lines = text.strip().split("\n")
        for line in reversed(lines):
            line = line.strip()
            if line.isdigit():
                page_numbers.append(int(line))
                break

    doc.close()

    full_text = "\n".join(all_text)
    page_start = min(page_numbers) if page_numbers else 1
    page_end = max(page_numbers) if page_numbers else len(all_text)

    return full_text, page_start, page_end


def extract_unit_name(pdf_path: str) -> str:
    """교과서에서 단원명을 추출한다.

    교과서 표준 패턴: "자석의 이용"을 배우면
    """
    doc = fitz.open(pdf_path)

    for i in range(min(doc.page_count, 10)):
        text = doc[i].get_text()
        match = re.search(r'[\u201c\u201d""](.+?)[\u201c\u201d""]을 배우면', text)
        if match:
            doc.close()
            return match.group(1)

    doc.close()
    raise ValueError("교과서에서 단원명을 찾을 수 없습니다. "
                     "'\"단원명\"을 배우면' 패턴이 없습니다.")
