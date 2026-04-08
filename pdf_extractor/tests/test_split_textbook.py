"""split_textbook.py 테스트."""

import os
import tempfile

import fitz
import pytest

from split_textbook import (
    _normalize,
    extract_unit_label,
    make_filename,
    parse_toc,
    find_unit_boundaries,
    split_pdf_by_subchapters,
)


TEXTBOOK_DIR = os.path.join(os.path.dirname(__file__), "..", "textbooks", "비상교육_사회4-1")


def _has_textbooks():
    return os.path.isdir(TEXTBOOK_DIR) and any(
        f.endswith(".pdf") for f in os.listdir(TEXTBOOK_DIR)
    )


class TestNormalize:
    def test_removes_spaces(self):
        assert _normalize("다양한 정보가 담긴 지도") == "다양한정보가담긴지도"

    def test_removes_newlines(self):
        assert _normalize("다양한\n정보가\n담긴") == "다양한정보가담긴"

    def test_removes_tabs(self):
        assert _normalize("a\t b\nc") == "abc"


class TestExtractUnitLabel:
    def test_standard_filename(self):
        assert extract_unit_label("[사회]4-1_1_교과서.pdf") == "1단원"

    def test_second_unit(self):
        assert extract_unit_label("[사회]4-1_2_교과서.pdf") == "2단원"

    def test_third_unit(self):
        assert extract_unit_label("[사회]4-1_3_교과서.pdf") == "3단원"

    def test_fallback(self):
        result = extract_unit_label("unknown_file.pdf")
        assert result == "unknown_file"


class TestMakeFilename:
    def test_basic(self):
        result = make_filename("1단원", 1, "다양한 정보가 담긴 지도")
        assert result == "1단원_1소단원_다양한_정보가_담긴_지도.pdf"

    def test_special_chars_removed(self):
        result = make_filename("1단원", 1, 'test/:*?"<>|name')
        assert result == "1단원_1소단원_testname.pdf"


@pytest.mark.skipif(not _has_textbooks(), reason="textbook PDFs not available")
class TestWithRealPDFs:
    def test_parse_toc_pdf1(self):
        doc = fitz.open(os.path.join(TEXTBOOK_DIR, "[사회]4-1_1_교과서.pdf"))
        names = parse_toc(doc)
        assert len(names) == 2
        doc.close()

    def test_parse_toc_pdf2(self):
        doc = fitz.open(os.path.join(TEXTBOOK_DIR, "[사회]4-1_2_교과서.pdf"))
        names = parse_toc(doc)
        assert len(names) == 2
        assert "살아 숨 쉬는 우리 지역의 역사" in names
        assert "과거와 현재를 이어 주는 국가유산" in names
        doc.close()

    def test_parse_toc_pdf3(self):
        doc = fitz.open(os.path.join(TEXTBOOK_DIR, "[사회]4-1_3_교과서.pdf"))
        names = parse_toc(doc)
        assert len(names) == 2
        assert "경제활동과 합리적 선택" in names
        assert "교류하며 발전하는 우리 지역" in names
        doc.close()

    def test_find_boundaries_pdf2(self):
        doc = fitz.open(os.path.join(TEXTBOOK_DIR, "[사회]4-1_2_교과서.pdf"))
        names = parse_toc(doc)
        boundaries = find_unit_boundaries(doc, names)
        assert len(boundaries) == 2
        # 첫 소단원은 page 4, 두 번째는 page 20
        assert boundaries[0][1] == 4
        assert boundaries[1][1] == 20
        doc.close()

    def test_split_creates_files(self):
        pdf_path = os.path.join(TEXTBOOK_DIR, "[사회]4-1_2_교과서.pdf")
        with tempfile.TemporaryDirectory() as tmpdir:
            created = split_pdf_by_subchapters(pdf_path, tmpdir)
            assert len(created) == 2
            for f in created:
                assert os.path.isfile(f)
                doc = fitz.open(f)
                assert doc.page_count > 0
                doc.close()

    def test_split_all_textbooks(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            total = 0
            for fname in sorted(os.listdir(TEXTBOOK_DIR)):
                if not fname.endswith(".pdf"):
                    continue
                pdf_path = os.path.join(TEXTBOOK_DIR, fname)
                created = split_pdf_by_subchapters(pdf_path, tmpdir)
                total += len(created)
            assert total == 6
