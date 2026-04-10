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
        # 페이지 하단에 표시된 교과서 쪽수 추출
        nums = _detect_page_numbers(page)
        page_numbers.extend(nums)

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


def extract_text_by_page(pdf_path: str) -> tuple[str, dict[int, str]]:
    """PDF에서 페이지별 텍스트를 추출하고 교과서 쪽수 태그를 붙여 반환한다.

    양면 펼침(한 PDF 페이지에 교과서 두 쪽이 있는 경우)은 텍스트 블록의
    x좌표를 기준으로 왼쪽/오른쪽을 분리하여 각 쪽에 정확히 대응시킨다.

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

        nums = _detect_page_numbers(page)
        if not nums:
            continue

        if len(nums) == 2:
            # 양면 펼침: x좌표로 왼쪽/오른쪽 텍스트 분리
            left_text, right_text = _split_spread_text(page)
            page_texts[nums[0]] = left_text   # 작은 쪽수 = 왼쪽
            page_texts[nums[1]] = right_text   # 큰 쪽수 = 오른쪽
        else:
            page_texts[nums[0]] = text

    doc.close()

    # 쪽수 오름차순으로 태그 문자열 생성
    tagged_parts = []
    for num in sorted(page_texts.keys()):
        tagged_parts.append(f"[{num}쪽]\n{page_texts[num]}")

    tagged_text = "\n\n".join(tagged_parts)
    return tagged_text, page_texts


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


def _detect_page_numbers(page) -> list[int]:
    """페이지 하단에서 교과서 쪽수를 추출한다.

    양면 펼침(두 페이지가 한 PDF 페이지에 있는 경우)이면 두 개의
    쪽수를 반환한다. 감지 못하면 빈 리스트를 반환한다.
    """
    page_height = page.rect.height
    # 하단 15% 영역에서 숫자만으로 구성된 텍스트 블록을 찾는다
    bottom_threshold = page_height * 0.85
    nums = []
    for block in page.get_text("blocks"):
        x0, y0, x1, y1, text, *_ = block
        if y0 < bottom_threshold:
            continue
        # 블록 전체가 숫자와 공백으로만 이뤄진 경우만 쪽수로 인정
        tokens = text.strip().split()
        if tokens and all(t.isdigit() for t in tokens):
            for t in tokens:
                nums.append(int(t))
    # 중복 제거 후 오름차순 정렬, 연속된 두 쪽수만 양면 펼침으로 인정
    nums = sorted(set(nums))
    if len(nums) == 2 and nums[1] - nums[0] != 1:
        # 연속되지 않는 두 숫자는 오감지 — 큰 쪽수만 사용
        nums = [nums[1]]
    return nums


def _split_spread_text(page) -> tuple[str, str]:
    """양면 펼침 PDF 페이지의 텍스트를 x좌표 기준으로 왼쪽/오른쪽으로 분리한다."""
    mid_x = page.rect.width / 2
    left_blocks = []
    right_blocks = []

    for block in page.get_text("blocks"):
        x0, y0, x1, y1, text, *_ = block
        text = text.strip()
        if not text:
            continue
        center_x = (x0 + x1) / 2
        if center_x < mid_x:
            left_blocks.append((y0, x0, text))
        else:
            right_blocks.append((y0, x0, text))

    # y좌표(위→아래), x좌표(왼→오른) 순서로 정렬
    left_blocks.sort()
    right_blocks.sort()

    left_text = "\n".join(t for _, _, t in left_blocks)
    right_text = "\n".join(t for _, _, t in right_blocks)
    return left_text, right_text
