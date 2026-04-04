from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

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
    from pptx.util import Emu
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
    txBox = slide.shapes.add_textbox(x, y, w, h)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(font_size)
    run.font.bold = bold
    run.font.color.rgb = color
    return txBox


def header_bar(slide, title_text, bg_color=BLUE):
    """슬라이드 상단에 색상 헤더 바와 제목 텍스트를 추가한다."""
    add_rect(slide, Inches(0), Inches(0), W, Inches(1.1), bg_color)
    add_text(slide, title_text,
             Inches(0.4), Inches(0.15),
             Inches(12.5), Inches(0.85),
             font_size=28, bold=True, color=WHITE, align=PP_ALIGN.LEFT)


def build_ppt():
    prs = new_prs()
    # 슬라이드 빌더 함수들이 여기에 추가됨
    prs.save("자전거_안전_교육.pptx")
    print("저장 완료: 자전거_안전_교육.pptx")


if __name__ == "__main__":
    build_ppt()
