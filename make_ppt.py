from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

# ─── 색상 상수 ───────────────────────────────────────────
BLUE   = RGBColor(0x1E, 0x88, 0xE5)   # 주 색상
GREEN  = RGBColor(0x43, 0xA0, 0x47)   # 보조 색상
ORANGE = RGBColor(0xFB, 0x8C, 0x00)   # 강조 (경고)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
DARK   = RGBColor(0x21, 0x21, 0x21)
LGRAY  = RGBColor(0xF5, 0xF5, 0xF5)   # 연한 회색 배경

FONT_KR = "맑은 고딕"

# ─── 슬라이드 크기 (16:9 와이드) ──────────────────────────
W = Inches(13.33)
H = Inches(7.5)


def new_prs():
    prs = Presentation()
    prs.slide_width  = W
    prs.slide_height = H
    return prs


def blank_slide(prs):
    """완전히 빈 슬라이드를 추가하고 반환한다."""
    blank_layout = prs.slide_layouts[6]
    return prs.slides.add_slide(blank_layout)


def add_rect(slide, x, y, w, h, fill_color, border_color=None):
    """채워진 직사각형 도형을 추가하고 반환한다."""
    shape = slide.shapes.add_shape(
        1,  # MSO_SHAPE_TYPE.RECTANGLE
        x, y, w, h
    )
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if border_color:
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
    else:
        shape.line.fill.background()
    return shape


def add_text(slide, text, x, y, w, h,
             font_size=18, bold=False, color=DARK,
             align=PP_ALIGN.LEFT, font=FONT_KR):
    """텍스트 박스를 추가하고 반환한다."""
    tx_box = slide.shapes.add_textbox(x, y, w, h)
    tf = tx_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    return tx_box


def header_bar(slide, title_text, bg_color=BLUE):
    """슬라이드 상단에 색상 헤더 바와 제목 텍스트를 추가한다."""
    add_rect(slide, Inches(0), Inches(0), W, Inches(1.1), bg_color)
    add_text(slide, title_text,
             Inches(0.4), Inches(0.15),
             Inches(12.5), Inches(0.85),
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.LEFT)


def add_slide_01(prs):
    """슬라이드 1: 표지"""
    sl = blank_slide(prs)
    # 전체 배경 파란색
    add_rect(sl, Inches(0), Inches(0), W, H, BLUE)
    # 중앙 흰색 패널
    add_rect(sl, Inches(1.5), Inches(1.8), Inches(10.33), Inches(3.8), WHITE)
    # 메인 제목
    add_text(sl, "🚲 자전거 안전 교육",
             Inches(1.8), Inches(2.0), Inches(9.8), Inches(1.4),
             font_size=44, bold=True, color=BLUE, align=PP_ALIGN.CENTER)
    # 부제목
    add_text(sl, "초등학교 5학년",
             Inches(1.8), Inches(3.5), Inches(9.8), Inches(0.6),
             font_size=22, color=DARK, align=PP_ALIGN.CENTER)
    # 날짜
    add_text(sl, "도로교통공단 교육자료 기반",
             Inches(1.8), Inches(4.1), Inches(9.8), Inches(0.5),
             font_size=16, color=RGBColor(0x75, 0x75, 0x75), align=PP_ALIGN.CENTER)
    # 하단 띠
    add_rect(sl, Inches(0), Inches(6.8), W, Inches(0.7), GREEN)
    add_text(sl, "안전한 자전거 생활을 위한 필수 교육",
             Inches(0), Inches(6.82), W, Inches(0.55),
             font_size=16, color=WHITE, align=PP_ALIGN.CENTER)


def add_slide_02(prs):
    """슬라이드 2: 오늘의 학습 목표"""
    sl = blank_slide(prs)
    header_bar(sl, "오늘의 학습 목표")
    goals = [
        ("①", "자전거 기본 안전 수칙을 이해한다."),
        ("②", "주요 사고 유형과 원인을 파악한다."),
        ("③", "사고를 예방하는 방법을 익힌다."),
    ]
    colors = [BLUE, GREEN, ORANGE]
    for i, (num, text) in enumerate(goals):
        y = Inches(1.6 + i * 1.7)
        add_rect(sl, Inches(0.5), y, Inches(0.8), Inches(1.2), colors[i])
        add_text(sl, num,
                 Inches(0.5), y + Inches(0.25),
                 Inches(0.8), Inches(0.7),
                 font_size=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_rect(sl, Inches(1.5), y, Inches(11.0), Inches(1.2), LGRAY)
        add_text(sl, text,
                 Inches(1.7), y + Inches(0.2),
                 Inches(10.6), Inches(0.85),
                 font_size=22, color=DARK)


def add_slide_03(prs):
    """슬라이드 3: 자전거, 얼마나 위험할까? (통계)"""
    sl = blank_slide(prs)
    header_bar(sl, "자전거, 얼마나 위험할까?", bg_color=ORANGE)
    # 통계 수치 카드 3개
    stats = [
        ("연간 사고 건수", "약 15,000건", BLUE),
        ("사망·중상 비율", "전체의 30%", ORANGE),
        ("미착용 헬멧\n사고 비율", "68%", GREEN),
    ]
    for i, (label, value, color) in enumerate(stats):
        x = Inches(0.5 + i * 4.3)
        add_rect(sl, x, Inches(1.5), Inches(3.8), Inches(2.5), color)
        add_text(sl, value,
                 x, Inches(1.7), Inches(3.8), Inches(1.2),
                 font_size=36, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(sl, label,
                 x, Inches(2.9), Inches(3.8), Inches(0.8),
                 font_size=16, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(sl, "※ 출처: 도로교통공단 교통사고분석시스템(TAAS) 2023",
             Inches(0.5), Inches(4.3), Inches(12.3), Inches(0.4),
             font_size=12, color=RGBColor(0x75, 0x75, 0x75))
    add_text(sl, "자전거 사고는 생각보다 훨씬 많이 발생합니다.\n헬멧만 써도 부상을 크게 줄일 수 있어요!",
             Inches(0.5), Inches(4.9), Inches(12.3), Inches(1.5),
             font_size=20, bold=True, color=DARK, align=PP_ALIGN.CENTER)


def build_ppt():
    """Generate the bicycle safety education presentation and save it."""
    prs = new_prs()
    add_slide_01(prs)
    add_slide_02(prs)
    add_slide_03(prs)
    prs.save("자전거_안전_교육.pptx")
    print("저장 완료: 자전거_안전_교육.pptx")


if __name__ == "__main__":
    build_ppt()
