"""
페이지 번호 인식 모듈.

Tesseract OCR 대신 pymupdf의 텍스트 추출을 사용한다.
교과서 PDF는 텍스트 기반이므로 get_text()로 직접 숫자를 읽을 수 있어
속도와 정확도 모두 OCR보다 훨씬 뛰어나다.
"""
import re
import fitz

from page_mapper import extrapolate_from_anchor


def get_bottom_crop_rect(page_rect: fitz.Rect, page_index: int) -> fitz.Rect:
    """페이지 하단 좌/우 영역 좌표 반환.

    짝수 인덱스(왼쪽 페이지): 좌하단
    홀수 인덱스(오른쪽 페이지): 우하단
    """
    w, h = page_rect.width, page_rect.height
    top = h * 0.88
    bottom = h

    if page_index % 2 == 0:
        return fitz.Rect(0, top, w / 2, bottom)
    else:
        return fitz.Rect(w / 2, top, w, bottom)


def parse_number_from_text(text: str) -> int | None:
    """텍스트에서 첫 번째 숫자를 추출. 없으면 None 반환."""
    match = re.search(r"\d+", text)
    return int(match.group()) if match else None


def _extract_page_number_from_text(text: str) -> tuple[int | None, float]:
    """텍스트에서 페이지 번호 후보 추출.

    - 숫자가 1개면 신뢰도 높음 (90.0)
    - 마지막 숫자를 사용 (페이지 번호는 맨 아래에 위치)
    - 숫자가 없으면 (None, 0.0)
    """
    numbers = re.findall(r"\b\d+\b", text)
    if not numbers:
        return None, 0.0

    page_num = int(numbers[-1])  # 마지막 숫자 = 페이지 번호
    confidence = 90.0 if len(numbers) == 1 else 70.0
    return page_num, confidence


def detect_page_number_with_confidence(
    doc: fitz.Document, page_index: int
) -> tuple[int | None, float]:
    """PDF 페이지 하단에서 교과서 페이지 번호와 신뢰도를 반환.

    pymupdf 텍스트 추출 사용 — Tesseract 불필요.
    좌하단/우하단/전체 하단 세 영역 중 최고 신뢰도 결과 선택.
    """
    page = doc[page_index]
    w, h = page.rect.width, page.rect.height

    candidates = []
    for rect in [
        fitz.Rect(0,     h * 0.88, w / 2, h),   # 좌하단
        fitz.Rect(w / 2, h * 0.88, w,     h),   # 우하단
        fitz.Rect(0,     h * 0.88, w,     h),   # 전체 하단 (폴백)
    ]:
        text = page.get_text("text", clip=rect).strip()
        num, conf = _extract_page_number_from_text(text)
        if num is not None:
            candidates.append((num, conf))

    if not candidates:
        return None, 0.0

    return max(candidates, key=lambda x: x[1])


def detect_page_number(doc: fitz.Document, page_index: int) -> int | None:
    """하위 호환용. 신뢰도 없이 숫자만 반환."""
    num, _ = detect_page_number_with_confidence(doc, page_index)
    return num


def scan_all_pages(doc: fitz.Document, progress_callback=None) -> dict:
    """모든 페이지 텍스트 추출 → 앵커 기반 보간으로 전체 {pdf_index: textbook_num} 반환.

    인식 결과가 하나도 없으면 {pdf_index: None} 반환.
    progress_callback: (current, total) 형태의 콜백
    """
    raw = {}
    total = doc.page_count
    for i in range(total):
        num, conf = detect_page_number_with_confidence(doc, i)
        raw[i] = (num, conf)
        if progress_callback:
            progress_callback(i + 1, total)

    extrapolated = extrapolate_from_anchor(raw, total_pages=total)
    if extrapolated:
        return extrapolated  # {pdf_index: textbook_num}

    return {i: v[0] for i, v in raw.items()}
