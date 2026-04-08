import fitz


def load_pdf(path: str) -> fitz.Document:
    """PDF 파일을 로드해서 fitz.Document 반환"""
    doc = fitz.open(path)
    if doc.page_count == 0:
        raise ValueError(f"PDF에 페이지가 없습니다: {path}")
    return doc


def render_page(doc: fitz.Document, page_index: int, width: int = 200) -> bytes:
    """페이지를 썸네일 크기로 렌더링해서 PNG bytes 반환"""
    page = doc[page_index]
    scale = width / page.rect.width
    mat = fitz.Matrix(scale, scale)
    pix = page.get_pixmap(matrix=mat)
    return pix.tobytes("png")


def render_page_large(doc: fitz.Document, page_index: int, width: int = 700) -> bytes:
    """페이지를 크게 렌더링해서 PNG bytes 반환"""
    return render_page(doc, page_index, width=width)


def extract_pages(doc: fitz.Document, page_indices: list[int], output_path: str) -> None:
    """선택한 PDF 인덱스 페이지들만 새 PDF로 저장"""
    new_doc = fitz.open()
    new_doc.insert_pdf(doc, from_page=0, to_page=-1, start_at=0)

    # 선택되지 않은 페이지 제거 (역순으로 삭제)
    keep = set(page_indices)
    to_delete = [i for i in range(doc.page_count) if i not in keep]
    for i in sorted(to_delete, reverse=True):
        new_doc.delete_page(i)

    new_doc.save(output_path)
    new_doc.close()


def extract_page_range(doc: fitz.Document, start: int, end: int, output_path: str) -> None:
    """연속 페이지 범위 [start, end]를 새 PDF로 저장"""
    new_doc = fitz.open()
    new_doc.insert_pdf(doc, from_page=start, to_page=end)
    new_doc.save(output_path)
    new_doc.close()
