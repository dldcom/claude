import pytest
import fitz
import os
import tempfile
from pdf_handler import load_pdf, render_page, render_page_large, extract_pages

PDF_PATH = "../pdfextractor/society_textbook_chapter1.pdf"


@pytest.fixture
def sample_doc():
    doc = fitz.open(PDF_PATH)
    yield doc
    doc.close()


@pytest.fixture
def tiny_pdf(tmp_path):
    """3페이지짜리 임시 PDF 생성"""
    pdf_path = str(tmp_path / "test.pdf")
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page()
        page.insert_text((72, 72), f"Page {i + 1}")
    doc.save(pdf_path)
    doc.close()
    return pdf_path


class TestLoadPdf:
    def test_loads_valid_pdf(self, tiny_pdf):
        doc = load_pdf(tiny_pdf)
        assert doc is not None
        assert doc.page_count == 3
        doc.close()

    def test_raises_on_missing_file(self):
        with pytest.raises(Exception):
            load_pdf("nonexistent.pdf")


class TestRenderPage:
    def test_returns_bytes(self, tiny_pdf):
        doc = load_pdf(tiny_pdf)
        result = render_page(doc, 0, width=150)
        assert isinstance(result, bytes)
        assert len(result) > 0
        doc.close()

    def test_thumbnail_width_respected(self, tiny_pdf):
        """렌더링 결과 이미지 너비가 요청 너비에 근사해야 함"""
        doc = load_pdf(tiny_pdf)
        import io
        from PIL import Image
        result = render_page(doc, 0, width=100)
        img = Image.open(io.BytesIO(result))
        assert abs(img.width - 100) <= 5
        doc.close()


class TestRenderPageLarge:
    def test_returns_bytes(self, tiny_pdf):
        doc = load_pdf(tiny_pdf)
        result = render_page_large(doc, 0)
        assert isinstance(result, bytes)
        assert len(result) > 0
        doc.close()

    def test_larger_than_thumbnail(self, tiny_pdf):
        doc = load_pdf(tiny_pdf)
        thumb = render_page(doc, 0, width=150)
        large = render_page_large(doc, 0)
        assert len(large) > len(thumb)
        doc.close()


class TestExtractPages:
    def test_extracts_correct_page_count(self, tiny_pdf, tmp_path):
        doc = load_pdf(tiny_pdf)
        output = str(tmp_path / "output.pdf")
        extract_pages(doc, [0, 2], output)
        doc.close()

        result = fitz.open(output)
        assert result.page_count == 2
        result.close()

    def test_output_file_created(self, tiny_pdf, tmp_path):
        doc = load_pdf(tiny_pdf)
        output = str(tmp_path / "output.pdf")
        extract_pages(doc, [1], output)
        doc.close()
        assert os.path.exists(output)
