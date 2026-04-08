import pytest
from page_mapper import parse_page_input, apply_offset, build_map_from_ocr, extrapolate_from_anchor


class TestParsePageInput:
    def test_single_page(self):
        assert parse_page_input("5") == [5]

    def test_comma_separated_pages(self):
        assert parse_page_input("1, 5, 10") == [1, 5, 10]

    def test_range(self):
        assert parse_page_input("5-10") == [5, 6, 7, 8, 9, 10]

    def test_mixed_range_and_individual(self):
        assert parse_page_input("1, 5-10, 15") == [1, 5, 6, 7, 8, 9, 10, 15]

    def test_deduplication_and_sort(self):
        assert parse_page_input("5, 3, 5, 1-3") == [1, 2, 3, 5]

    def test_empty_string_returns_empty(self):
        assert parse_page_input("") == []

    def test_whitespace_handling(self):
        assert parse_page_input("  1 , 2-3 ") == [1, 2, 3]


class TestApplyOffset:
    def test_positive_offset(self):
        # PDF 1페이지 = 교과서 10페이지 → offset=9
        assert apply_offset([25, 26], offset=9) == [16, 17]

    def test_zero_offset(self):
        assert apply_offset([1, 2, 3], offset=0) == [1, 2, 3]

    def test_negative_offset(self):
        assert apply_offset([1, 2], offset=-2) == [3, 4]

    def test_empty_list(self):
        assert apply_offset([], offset=5) == []


class TestBuildMapFromOcr:
    def test_builds_map_correctly(self):
        # ocr_results: {pdf_index: textbook_number}
        ocr_results = {0: 10, 1: 11, 2: 12}
        result = build_map_from_ocr(ocr_results)
        assert result == {10: 0, 11: 1, 12: 2}

    def test_empty_ocr_results(self):
        assert build_map_from_ocr({}) == {}

    def test_partial_ocr_results(self):
        # OCR이 일부 페이지만 인식한 경우
        ocr_results = {0: None, 1: 25, 2: 26}
        result = build_map_from_ocr(ocr_results)
        assert result == {25: 1, 26: 2}


class TestExtrapolateFromAnchor:
    def test_fills_all_pages_from_anchor(self):
        # pdf_index 2 → 교과서 25, confidence 90
        # 나머지는 그 기준으로 보간
        raw = {
            0: (None, 0.0),
            1: (None, 0.0),
            2: (25, 90.0),
            3: (None, 0.0),
            4: (None, 0.0),
        }
        result = extrapolate_from_anchor(raw, total_pages=5)
        assert result == {0: 23, 1: 24, 2: 25, 3: 26, 4: 27}

    def test_picks_highest_confidence_anchor(self):
        # pdf_index 1이 낮은 신뢰도, pdf_index 3이 높은 신뢰도
        raw = {
            0: (None, 0.0),
            1: (10, 30.0),   # 낮은 신뢰도
            2: (None, 0.0),
            3: (20, 95.0),   # 높은 신뢰도 → 앵커로 선택
            4: (None, 0.0),
        }
        result = extrapolate_from_anchor(raw, total_pages=5)
        # 앵커: pdf_index 3 = 교과서 20
        assert result == {0: 17, 1: 18, 2: 19, 3: 20, 4: 21}

    def test_returns_empty_when_no_detection(self):
        raw = {0: (None, 0.0), 1: (None, 0.0)}
        assert extrapolate_from_anchor(raw, total_pages=2) == {}

    def test_clamps_negative_page_numbers(self):
        # 앵커가 2번 페이지이고 교과서 번호가 1이면, 0번은 -1이 되어 제외
        raw = {0: (None, 0.0), 1: (None, 0.0), 2: (1, 80.0)}
        result = extrapolate_from_anchor(raw, total_pages=3)
        # 교과서 페이지 1 미만은 포함하지 않음
        assert 0 not in result or result[0] >= 1
        assert result[2] == 1
