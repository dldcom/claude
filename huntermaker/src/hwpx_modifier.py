import os
import re
import zipfile
import xml.etree.ElementTree as ET


# HWPX XML 네임스페이스
NS = {
    "hp": "http://www.hancom.co.kr/hwpml/2011/paragraph",
    "hs": "http://www.hancom.co.kr/hwpml/2011/section",
    "hc": "http://www.hancom.co.kr/hwpml/2011/core",
    "hh": "http://www.hancom.co.kr/hwpml/2011/head",
}

# 카드 레이아웃: 2페이지, 각 4×4 테이블
# Row 0,2 = 질문 (큰 셀), Row 1,3 = 답 (작은 셀)
# 질문 인덱스 0~7: Table 0의 Row 0(4개) + Row 2(4개)
# 질문 인덱스 8~15: Table 1의 Row 0(4개) + Row 2(4개)


def _get_question_cells(root):
    """XML에서 질문 셀(Row 0, Row 2)을 순서대로 반환한다."""
    tables = root.findall(".//hp:tbl", NS)
    question_cells = []
    for tbl in tables:
        rows = tbl.findall("hp:tr", NS)
        for row_idx in [0, 2]:
            if row_idx < len(rows):
                cells = rows[row_idx].findall("hp:tc", NS)
                question_cells.extend(cells)
    return question_cells


def _get_answer_cells(root):
    """XML에서 답 셀(Row 1, Row 3)을 순서대로 반환한다."""
    tables = root.findall(".//hp:tbl", NS)
    answer_cells = []
    for tbl in tables:
        rows = tbl.findall("hp:tr", NS)
        for row_idx in [1, 3]:
            if row_idx < len(rows):
                cells = rows[row_idx].findall("hp:tc", NS)
                answer_cells.extend(cells)
    return answer_cells


def _remove_extra_paragraphs(cell):
    """셀 내의 첫 번째 <hp:p> 단락만 남기고 나머지는 제거한다.

    템플릿의 일부 셀은 여러 단락으로 나뉘어 있어서, 빈 단락이 남으면
    수직 공간을 차지해 텍스트가 위로 떠 보인다. 추가 단락을 제거하여
    셀의 수직 정렬이 제대로 작동하게 한다.
    """
    p_tag = f"{{{NS['hp']}}}p"
    for parent in cell.iter():
        p_children = [c for c in list(parent) if c.tag == p_tag]
        if len(p_children) > 1:
            # 첫 번째 <hp:p>만 남기고 나머지 제거
            for extra in p_children[1:]:
                parent.remove(extra)


def _set_cell_text(cell, text):
    """셀의 첫 번째 <hp:t>에 텍스트를 설정하고, 나머지는 비운다."""
    t_elems = list(cell.iter(f"{{{NS['hp']}}}t"))
    if t_elems:
        t_elems[0].text = text
        for t_elem in t_elems[1:]:
            t_elem.text = ""


def _clear_linesegarray(cell):
    """셀 내의 모든 <hp:linesegarray>를 빈 태그로 교체한다."""
    for parent in cell.iter():
        for child in list(parent):
            if child.tag == f"{{{NS['hp']}}}linesegarray":
                parent.remove(child)
                empty = ET.SubElement(parent, f"{{{NS['hp']}}}linesegarray")
                empty.text = None


def create_hunter_worksheet(
    template_path: str,
    output_path: str,
    questions: list[dict],
    metadata: dict,
    page_start: int,
    page_end: int,
) -> None:
    """hunter_card.hwpx 템플릿을 수정하여 새 문제사냥놀이 카드를 생성한다.

    questions가 16개보다 적으면 나머지 카드는 빈 텍스트로 채운다.
    """
    if not (1 <= len(questions) <= 16):
        raise ValueError(f"문제는 1~16개여야 하지만 {len(questions)}개가 전달되었습니다.")

    # 16개 미만이면 빈 카드로 패딩
    padded = list(questions) + [{"question": "", "answer": ""}] * (16 - len(questions))
    questions = padded

    # 템플릿 ZIP에서 파일 읽기
    with zipfile.ZipFile(template_path, "r") as zin:
        xml_bytes = zin.read("Contents/section0.xml")

    # 네임스페이스 등록 (출력 시 ns0, ns1 대신 원래 접두사 유지)
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)
    extra_ns = re.findall(r'xmlns:(\w+)="([^"]+)"', xml_bytes.decode("utf-8"))
    for prefix, uri in extra_ns:
        ET.register_namespace(prefix, uri)

    root = ET.fromstring(xml_bytes)

    # === 질문 셀 교체 ===
    q_cells = _get_question_cells(root)
    if len(q_cells) < 16:
        raise ValueError(f"템플릿에서 질문 셀을 16개 찾을 수 없습니다 ({len(q_cells)}개 발견)")

    for i, (cell, q_data) in enumerate(zip(q_cells[:16], questions)):
        _remove_extra_paragraphs(cell)
        _set_cell_text(cell, q_data["question"])
        _clear_linesegarray(cell)

    # === 답 셀 교체 ===
    a_cells = _get_answer_cells(root)
    for i, (cell, q_data) in enumerate(zip(a_cells[:16], questions)):
        _remove_extra_paragraphs(cell)
        _set_cell_text(cell, q_data["answer"])
        _clear_linesegarray(cell)

    # === XML을 문자열로 변환 ===
    xml_str = ET.tostring(root, encoding="unicode", xml_declaration=False)
    xml_str = '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n' + xml_str

    # === 새 HWPX 파일 생성 ===
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    with zipfile.ZipFile(template_path, "r") as zin:
        with zipfile.ZipFile(output_path, "w") as zout:
            for info in zin.infolist():
                new_info = zipfile.ZipInfo(info.filename, date_time=info.date_time)
                new_info.compress_type = info.compress_type
                new_info.external_attr = info.external_attr

                if info.filename == "Contents/section0.xml":
                    zout.writestr(new_info, xml_str.encode("utf-8"))
                else:
                    zout.writestr(new_info, zin.read(info.filename))
