"""교과서 PDF를 소단원별로 자동 분리하는 CLI 스크립트."""

import argparse
import re
from pathlib import Path

import fitz

from pdf_handler import load_pdf, extract_page_range

# 소단원명이 표시되는 알려진 폰트 패턴 (ToC용)
TOC_FONTS = ["TTSpringSun", "OTChungchunsidaeL", "12LotteMartDreamBold"]

# 소단원 표지 페이지의 제목 폰트 패턴 (큰 글씨)
TITLE_FONTS = {
    "TTSpringSun": 30,             # 비상교육
    "ONEMobilePOPOTFRegular": 40,  # 천재교육
    "12LotteMartDreamBold": 27,    # 아이스크림
}

# 소단원 표지 키워드 폴백
TITLE_KEYWORDS = ["열어요"]


def parse_toc(doc: fitz.Document) -> list[str]:
    """첫 페이지(표지)에서 소단원 이름 목록을 추출한다.

    여러 출판사의 폰트 패턴을 시도한다.
    """
    page = doc[0]
    blocks = page.get_text("dict")["blocks"]

    # 전략 1: 알려진 ToC 폰트에서 소단원명 추출
    for toc_font in TOC_FONTS:
        names = _extract_names_by_font(blocks, toc_font, min_length=4)
        if names:
            return names

    # 전략 2: 번호(1, 2, ...) 뒤에 오는 텍스트를 소단원명으로 추출
    names = _extract_numbered_items(blocks)
    if names:
        return names

    return []


def _extract_names_by_font(blocks: list, font_name: str, min_length: int = 4) -> list[str]:
    """특정 폰트의 텍스트를 소단원명으로 추출한다."""
    names = []
    seen = set()

    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            line_text = ""
            matched = False
            for span in line["spans"]:
                if span["font"] == font_name:
                    matched = True
                    line_text += span["text"]
            text = line_text.strip()
            if matched and len(text) >= min_length:
                norm = re.sub(r"\s+", "", text)
                if norm not in seen:
                    seen.add(norm)
                    names.append(text)

    return names


def _extract_numbered_items(blocks: list) -> list[str]:
    """번호(1, 2, ...) + 텍스트 패턴에서 소단원명을 추출한다."""
    # 모든 스팬을 순서대로 수집
    spans = []
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"].strip()
                if text:
                    spans.append(span)

    # 작은 번호(1, 2, 3...) 뒤에 오는 텍스트 찾기
    names = []
    for i, span in enumerate(spans):
        text = span["text"].strip()
        if text.isdigit() and int(text) in range(1, 10) and span["size"] < 15:
            # 다음 스팬이 소단원명
            if i + 1 < len(spans):
                next_span = spans[i + 1]
                next_text = next_span["text"].strip()
                if len(next_text) >= 4 and next_span["font"] != span["font"]:
                    names.append(next_text)

    return names


def _normalize(text: str) -> str:
    """공백을 모두 제거하여 매칭용 문자열을 만든다."""
    return re.sub(r"\s+", "", text)


def find_unit_boundaries(doc: fitz.Document, names: list[str]) -> list[tuple[str, int]]:
    """본문에서 소단원 경계 페이지를 찾는다.

    1. 제목 페이지(큰 폰트/키워드)를 먼저 찾기
    2. ToC 이름과 제목 페이지를 매칭
    3. 매칭 실패 시 제목 페이지에서 직접 이름 추출
    """
    # 1단계: 소단원 표지 후보 페이지 수집
    title_pages = []
    for i in range(2, doc.page_count):
        page = doc[i]
        if _is_title_page(page):
            title_pages.append(i)
            continue
        text = page.get_text("text")
        if any(kw in text for kw in TITLE_KEYWORDS):
            title_pages.append(i)

    if not title_pages:
        return []

    # 2단계: ToC 이름을 제목 페이지에서 텍스트 매칭
    matched = {}  # page_index -> name (ToC 이름)
    norm_names = {name: _normalize(name) for name in names}

    for i in title_pages:
        page_text = _normalize(doc[i].get_text("text"))
        for name, norm in norm_names.items():
            if norm in page_text and i not in matched:
                matched[i] = name

    # 3단계: 모든 제목 페이지에서 경계 구성
    # (매칭 여부와 관계없이 제목 페이지에서 직접 이름 추출)
    boundaries = []
    for page_idx in title_pages:
        clean_name = _extract_title_from_page(doc[page_idx])
        if clean_name:
            boundaries.append((clean_name, page_idx))
        elif page_idx in matched:
            boundaries.append((matched[page_idx], page_idx))

    boundaries.sort(key=lambda x: x[1])
    return boundaries


def _is_title_page(page: fitz.Page) -> bool:
    """페이지가 소단원 표지인지 판단한다."""
    blocks = page.get_text("dict")["blocks"]
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                for font, min_size in TITLE_FONTS.items():
                    if span["font"] == font and span["size"] >= min_size:
                        return True
    return False


def _extract_title_from_page(page: fitz.Page) -> str | None:
    """페이지에서 큰 폰트의 소단원 제목을 추출한다.

    character-level 위치 정보를 사용하여 시각적 공백을 복원한다.
    """
    blocks = page.get_text("rawdict")["blocks"]
    parts = []
    for block in blocks:
        if "lines" not in block:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                # 알려진 제목 폰트 중 하나인지 확인
                is_title = False
                for font, min_size in TITLE_FONTS.items():
                    if span["font"] == font and span["size"] >= min_size:
                        is_title = True
                        break
                if not is_title:
                    continue

                chars = span.get("chars", [])
                if not chars:
                    text = span["text"].strip()
                    if text and not text.isdigit():
                        parts.append(text)
                    continue
                text = ""
                prev_end = None
                for c in chars:
                    if prev_end is not None:
                        gap = c["bbox"][0] - prev_end
                        char_width = c["bbox"][2] - c["bbox"][0]
                        if char_width > 0 and gap > char_width * 0.3:
                            text += " "
                    text += c["c"]
                    prev_end = c["bbox"][2]
                text = text.strip()
                if text and not text.isdigit():
                    parts.append(text)
    if parts:
        # 같은 텍스트가 중복된 경우 제거 (순서 유지)
        seen = set()
        unique_parts = []
        for p in parts:
            if p not in seen:
                seen.add(p)
                unique_parts.append(p)
        return " ".join(unique_parts)
    return None


def extract_unit_label(pdf_path: str) -> str:
    """PDF 파일명에서 단원 레이블을 추출한다.

    예: '[사회]4-1_1_교과서.pdf' -> '1단원'
        '초_사회4-1(김정인)_1단원_교과서.pdf' -> '1단원'
    """
    name = Path(pdf_path).stem
    # 패턴 1: _N_교과서
    match = re.search(r"(\d+)_교과서", name)
    if match:
        return f"{match.group(1)}단원"
    # 패턴 2: _N단원_
    match = re.search(r"(\d+)단원", name)
    if match:
        return f"{match.group(1)}단원"
    # 폴백: 파일명 그대로 사용
    return name


def make_filename(unit_label: str, subunit_idx: int, subunit_name: str) -> str:
    """출력 파일명을 생성한다."""
    # 파일명에 사용 불가한 문자 제거
    clean = re.sub(r'[\\/:*?"<>|]', "", subunit_name)
    clean = clean.replace(" ", "_")
    return f"{unit_label}_{subunit_idx}소단원_{clean}.pdf"


def split_pdf_by_subchapters(
    input_path: str, output_dir: str, dry_run: bool = False
) -> list[str]:
    """단일 PDF를 소단원별로 분할한다."""
    doc = load_pdf(input_path)
    names = parse_toc(doc)
    unit_label = extract_unit_label(input_path)

    boundaries = find_unit_boundaries(doc, names)

    if not boundaries:
        print(f"  경고: 소단원 경계를 찾을 수 없습니다. 건너뜁니다.")
        doc.close()
        return []

    print(f"  소단원 {len(boundaries)}개 감지:")
    for idx, (name, page_idx) in enumerate(boundaries, 1):
        print(f"    [{idx}] p.{page_idx + 1}: {name}")

    if dry_run:
        doc.close()
        return []

    Path(output_dir).mkdir(parents=True, exist_ok=True)
    created_files = []

    for idx, (name, start_page) in enumerate(boundaries, 1):
        if idx < len(boundaries):
            end_page = boundaries[idx][1] - 1
        else:
            end_page = doc.page_count - 1

        filename = make_filename(unit_label, idx, name)
        output_path = str(Path(output_dir) / filename)
        extract_page_range(doc, start_page, end_page, output_path)
        print(f"  저장: {filename} (p.{start_page + 1}~{end_page + 1})")
        created_files.append(output_path)

    doc.close()
    return created_files


def main():
    parser = argparse.ArgumentParser(description="교과서 PDF를 소단원별로 자동 분리")
    parser.add_argument("input", help="PDF 파일 또는 PDF가 들어있는 폴더")
    parser.add_argument("-o", "--output", default=None, help="출력 폴더 (기본: 입력 폴더 안의 output/)")
    parser.add_argument(
        "--dry-run", action="store_true", help="감지 결과만 출력, 파일 생성 안 함"
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    if input_path.is_dir():
        pdf_files = sorted(input_path.glob("*.pdf"))
        default_output = input_path / "output"
    elif input_path.is_file() and input_path.suffix.lower() == ".pdf":
        pdf_files = [input_path]
        default_output = input_path.parent / "output"
    else:
        print(f"오류: 유효한 PDF 파일 또는 폴더가 아닙니다: {args.input}")
        return

    if not pdf_files:
        print(f"오류: PDF 파일을 찾을 수 없습니다: {args.input}")
        return

    output_dir = args.output if args.output else str(default_output)

    total_created = 0
    for pdf_file in pdf_files:
        print(f"처리 중: {pdf_file.name}")
        try:
            created = split_pdf_by_subchapters(
                str(pdf_file), output_dir, dry_run=args.dry_run
            )
            total_created += len(created)
        except Exception as e:
            print(f"  오류: {e}")
        print()

    if args.dry_run:
        print("(dry-run 모드: 파일을 생성하지 않았습니다)")
    else:
        print(f"완료: {total_created}개 파일 생성 → {output_dir}/")


if __name__ == "__main__":
    main()
