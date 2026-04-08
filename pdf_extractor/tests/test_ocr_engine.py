import pytest
import fitz
from ocr_engine import get_bottom_crop_rect, parse_number_from_text, detect_page_number, detect_page_number_with_confidence


class TestGetBottomCropRect:
    def test_left_page_crops_bottom_left(self):
        """짝수 인덱스(왼쪽 페이지): 좌하단 영역 반환"""
        page_rect = fitz.Rect(0, 0, 600, 800)
        rect = get_bottom_crop_rect(page_rect, page_index=0)
        # 왼쪽 절반, 하단 10%
        assert rect.x0 == 0
        assert rect.x1 <= page_rect.width / 2
        assert rect.y0 >= page_rect.height * 0.85

    def test_right_page_crops_bottom_right(self):
        """홀수 인덱스(오른쪽 페이지): 우하단 영역 반환"""
        page_rect = fitz.Rect(0, 0, 600, 800)
        rect = get_bottom_crop_rect(page_rect, page_index=1)
        # 오른쪽 절반, 하단 10%
        assert rect.x0 >= page_rect.width / 2
        assert rect.x1 == page_rect.width
        assert rect.y0 >= page_rect.height * 0.85

    def test_rect_stays_within_page(self):
        page_rect = fitz.Rect(0, 0, 500, 700)
        rect = get_bottom_crop_rect(page_rect, page_index=0)
        assert rect.x0 >= 0
        assert rect.y0 >= 0
        assert rect.x1 <= 500
        assert rect.y1 <= 700


class TestParseNumberFromText:
    def test_extracts_number_from_clean_text(self):
        assert parse_number_from_text("25") == 25

    def test_extracts_number_surrounded_by_noise(self):
        assert parse_number_from_text("  | 42 |  ") == 42

    def test_returns_none_for_no_number(self):
        assert parse_number_from_text("abc def") is None

    def test_returns_none_for_empty_string(self):
        assert parse_number_from_text("") is None

    def test_picks_first_number_in_multiline(self):
        assert parse_number_from_text("noise\n37\nextra") == 37


class TestDetectPageNumber:
    def test_returns_int_or_none(self, tmp_path):
        """실제 PDF 페이지에서 결과가 int 또는 None임을 확인"""
        pdf_path = str(tmp_path / "test.pdf")
        doc = fitz.open()
        page = doc.new_page(width=600, height=800)
        page.insert_text((50, 780), "25")
        doc.save(pdf_path)
        doc.close()

        doc = fitz.open(pdf_path)
        result = detect_page_number(doc, 0)
        assert result is None or isinstance(result, int)
        doc.close()


class TestDetectPageNumberWithConfidence:
    def test_returns_tuple_of_num_and_confidence(self, tmp_path):
        """(int | None, float) 형태 반환 확인"""
        pdf_path = str(tmp_path / "test.pdf")
        doc = fitz.open()
        page = doc.new_page(width=600, height=800)
        page.insert_text((50, 780), "25")
        doc.save(pdf_path)
        doc.close()

        doc = fitz.open(pdf_path)
        num, conf = detect_page_number_with_confidence(doc, 0)
        assert num is None or isinstance(num, int)
        assert isinstance(conf, float)
        assert 0.0 <= conf <= 100.0
        doc.close()

    def test_confidence_zero_when_no_tesseract_or_no_number(self, tmp_path):
        """숫자가 없는 페이지는 confidence=0"""
        pdf_path = str(tmp_path / "blank.pdf")
        doc = fitz.open()
        doc.new_page(width=600, height=800)  # 빈 페이지
        doc.save(pdf_path)
        doc.close()

        doc = fitz.open(pdf_path)
        num, conf = detect_page_number_with_confidence(doc, 0)
        # 빈 페이지: 숫자 없으면 None, conf=0
        if num is None:
            assert conf == 0.0
        doc.close()
