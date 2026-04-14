import re
import zipfile
from pathlib import Path


# 문제 셀(약 146mm, 12pt 한글) 한 줄에 들어가는 문자 수 기준
_CHARS_PER_LINE = 40
# 문제 표 전체 최대 높이 (단위 mm) — 헤더 행까지 포함한 하드 상한
_MAX_TABLE_HEIGHT_MM = 330.0
# 문제 표 헤더(문제/정답 제목행) 높이 (HWPUNIT). 템플릿 그대로 유지.
_HEADER_ROW_HEIGHT = 2263
# 1 mm = 283.464 HWPUNIT (=1/7200 inch)
_HWPUNIT_PER_MM = 283.464


def _estimate_line_count(question_text: str) -> int:
    """질문 문장의 문자 수로 몇 줄로 렌더링될지 대략 추정 (1~3줄)."""
    n = -(-len(question_text) // _CHARS_PER_LINE)  # ceil
    return max(1, min(n, 3))


def _adjust_question_row_heights(xml: str, question_texts: list[str]) -> str:
    """각 문제 행 높이를 질문 길이(추정 줄수)에 비례해 재분배한다.

    - 헤더 행 높이는 그대로 두고, 25개 문제 행에만 예산을 배분
    - 총 높이(헤더 포함)가 ``_MAX_TABLE_HEIGHT_MM``를 넘지 않도록 정확히 채움
    - 줄당 높이는 ``budget / total_line_units``로, 2줄짜리는 1줄짜리의 2배
      높이가 된다(비례 유지).
    """
    lines_per_q = [_estimate_line_count(q) for q in question_texts]
    total_line_units = sum(lines_per_q)

    budget = int(_MAX_TABLE_HEIGHT_MM * _HWPUNIT_PER_MM) - _HEADER_ROW_HEIGHT
    per_line = budget // total_line_units  # 정수, 하드 상한 엄수

    heights = [n * per_line for n in lines_per_q]

    for q_text, new_h in zip(question_texts, heights):
        idx = xml.find(q_text)
        if idx == -1:
            continue
        tr_start = xml.rfind("<hp:tr>", 0, idx)
        if tr_start == -1:
            continue
        tr_end = xml.find("</hp:tr>", idx)
        if tr_end == -1:
            continue
        tr_end += len("</hp:tr>")
        row = xml[tr_start:tr_end]
        new_row = re.sub(
            r'(<hp:cellSz width="\d+" height=")\d+("/>)',
            rf'\g<1>{new_h}\g<2>',
            row,
        )
        xml = xml[:tr_start] + new_row + xml[tr_end:]

    return xml


# 템플릿의 기존 문제/정답 텍스트 (인덱스 순서로 정렬)
TEMPLATE_QUESTIONS = [
    "( 123쪽 )은 실제 지구의 모습을 작게 줄여 만든 모형입니다.",
    "2.  ( 123쪽 )은 둥근 지구를 평면으로 나타낸 것입니다.",
    "3. 지구본은 ( 124쪽 )라서 실을 이용하면 편리하게 이용할 수 있어요.",
    "4. ( 126쪽 )은 항공 사진이나 위성 영상에 장소나 지역의 이름, 경계선 등을 표시한 지도입니다.",
    "5. 디지털 영상 지도는 ( 127쪽 )가 자유로워 특정 지역을 자세히 살펴보거나 세계의 모습을 전체적으로 볼 수 있습니다.",
    "6. 지구본과 세계지도에는 위치를 쉽게 찾을 수 있도록 ( 130쪽 )으로 그려 놓은 선이 있습니다.",
    "7. ( 130쪽 )은 적도를 기준으로 남북으로 얼마나 떨어져 있는지를 나타내며 북쪽과 남쪽으로 각각 90°씩 나뉩니다.",
    "8. 햇볕이 비스듬하게 들어와 넓은 지역으로 열이 퍼진다. ( 131쪽 )",
    "9. 햇볕이 수직에 가깝게 들어와 좁은 지역에 열이 모인다. ( 131쪽 )",
    "10. 지구가 기울어진 상태로 태양 주위를 돌기 때문에 ( 131쪽 )의 변화가 나타납니다.",
    "11. ( 132쪽 )는 본초 자오선을 기준으로 동서로 얼마나 떨어져 있는지를 나타내며 동쪽과 서쪽으로 각각 180°씩 나뉩니다.",
    "12. 경도 0° 선으로 영국 런던을 지남. ( 132쪽 ) ",
    "13. 지구는 하루에 한 바퀴씩 스스로 회전하기 때문에 경도에 따라 시각이 달라져 ( 133쪽 )가 발생합니다.",
    "14. 바다로 둘러싸인 커다란 육지 ( 139쪽 )",
    "15. 세계의 바다 가운데 넓은 바다 ( 139쪽 )",
    "16. 두 번째로 넓은 대양입니다. 유럽, 아프리카, 북아메리카, 남아메리카 대륙으로 둘러싸여 있습니다. ( 139쪽 )",
    "17. 세 번째로 넓은 대양입니다. 아시아, 아프리카, 오세아니아 대륙에 접해 있습니다. ( 139쪽 )",
    "18. 남극 대륙을 둘러싸고 있는 바다입니다. ( 139쪽 )",
    "19. ( 141쪽 )는 세계에서 가장 넓은 대륙으로 대부분 북반구에 분포해 있습니다.",
    "20. ( 141쪽 )는 세계에서 가장 작은 대륙으로 대부분 남반구에 분포해 있습니다.",
    "21. ( 146쪽 )은 유럽의 남쪽에 있으며 아시아 다음으로 넓은 대륙입니다.",
    "22. ( 150쪽 )은 세 번째로 큰 대륙으로 세계에서 가장 큰 섬인 그린란드를 포함합니다.",
    "23. ( 150쪽 )은 대부분 남반구에 속해 있습니다. 세계에서 가장 긴 산맥인 안데스산맥이 있습니다.",
    "24. 두 개의 육지를 연결하는 좁고 잘록한 땅 ( 150쪽 )",
    "25. 국가의 주가 되는 국토 ( 151쪽 )",
]

TEMPLATE_ANSWERS = [
    "지구본", "세계지도", "입체", "디지털 영상 지도", "확대와 축소",
    "가상", "위도", "고위도", "저위도", "계절",
    "경도", "본초 자오선", "시차", "대륙", "대양",
    "대서양", "인도양", "남극해", "아시아", "오세아니아",
    "아프리카", "북아메리카", "남아메리카", "지협", "본토",
]


def create_bingo_worksheet(
    template_path: str,
    output_path: str,
    questions: list[dict],
    metadata: dict,
    page_start: int,
    page_end: int,
) -> None:
    """bingo.hwpx 템플릿을 수정하여 새 빙고 학습지를 생성한다."""
    if len(questions) != 25:
        raise ValueError(f"25개 문제가 필요하지만 {len(questions)}개가 전달되었습니다.")

    # 템플릿 ZIP에서 section0.xml 읽기
    with zipfile.ZipFile(template_path, "r") as zin:
        xml = zin.read("Contents/section0.xml").decode("utf-8")

    grade = metadata["grade"]
    unit = metadata["unit"]
    subunit = metadata.get("subunit")
    unit_name = metadata.get("unit_name", "")
    if subunit is not None:
        full_unit_name = f"{unit}-{subunit} {unit_name}"
    else:
        full_unit_name = f"{unit} {unit_name}"

    # 1. 단원명 교체
    xml = xml.replace("3. 지구, 대륙 그리고 국가들", full_unit_name)

    # 2. 학년 교체 (단순 replace)
    xml = xml.replace("6학년", f"{grade}학년")

    # 3. 페이지 범위 교체 (신·구 템플릿 두 포맷 모두 지원)
    xml = xml.replace(
        "교과서 122쪽 ~ 157쪽",
        f"교과서 {page_start}쪽 ~ {page_end}쪽",
    )
    xml = xml.replace(
        "교과서 122쪽부터 157쪽까지",
        f"교과서 {page_start}쪽부터 {page_end}쪽까지",
    )

    # 4. "118쪽에 붙이기" → 동일 길이 공백으로 교체
    old_paste = "118쪽에 붙이기"
    xml = xml.replace(old_paste, " " * len(old_paste))

    # 5. 제목 변경
    xml = xml.replace("주요 단어 빙고", "주요 단어 찾기")

    # 6. 빙고 규칙 설명 수정
    xml = xml.replace(
        "※3줄 빙고 완성(가로, 세로만 인정. 대각선X)",
        "※3줄 빙고 완성" + " " * len("(가로, 세로만 인정. 대각선X)"),
    )

    # 5. 25개 문제 교체 + linesegarray를 빈 태그로 교체 (한글이 열 때 자동 재계산)
    # Q1은 단락 스타일로 자동 번호 매김이 적용되어 있으므로 번호를 붙이지 않고,
    # Q2~Q25는 본문에 "N. " 접두를 붙여 번호를 표시한다.
    for i, (old_q, new_q_data) in enumerate(zip(TEMPLATE_QUESTIONS, questions)):
        new_q = new_q_data["question"]
        if i >= 1:
            new_q = f"{i + 1}. {new_q}"

        # 원본 문제의 linesegarray 찾아서 빈 태그로 교체
        idx = xml.find(old_q)
        if idx != -1:
            ls_start = xml.find("<hp:linesegarray>", idx)
            ls_end = xml.find("</hp:linesegarray>", ls_start) + len("</hp:linesegarray>")
            if ls_start != -1 and ls_end != -1:
                xml = xml[:ls_start] + "<hp:linesegarray/>" + xml[ls_end:]

        # 텍스트 교체
        xml = xml.replace(old_q, new_q)

    # 6. 25개 정답 교체
    for old_a, new_q_data in zip(TEMPLATE_ANSWERS, questions):
        new_a = new_q_data["answer"]
        xml = xml.replace(
            f"<hp:t>{old_a}</hp:t>",
            f"<hp:t>{new_a}</hp:t>",
        )

    # 7. 문제 행 높이 재분배 (질문 길이 비례, 전체 표 ≤ 233mm)
    prefixed_questions = [
        (f"{i + 1}. {q['question']}" if i >= 1 else q["question"])
        for i, q in enumerate(questions)
    ]
    xml = _adjust_question_row_heights(xml, prefixed_questions)

    # 새 HWPX 파일 생성 (ZIP) - 원본 속성 유지
    with zipfile.ZipFile(template_path, "r") as zin:
        with zipfile.ZipFile(output_path, "w") as zout:
            for info in zin.infolist():
                new_info = zipfile.ZipInfo(info.filename, date_time=info.date_time)
                new_info.compress_type = info.compress_type
                new_info.external_attr = info.external_attr
                if info.filename == "Contents/section0.xml":
                    zout.writestr(new_info, xml.encode("utf-8"))
                else:
                    zout.writestr(new_info, zin.read(info.filename))
