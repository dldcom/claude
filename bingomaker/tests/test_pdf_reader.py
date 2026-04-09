import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from pdf_reader import extract_text_by_page, parse_subunit_filename


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
