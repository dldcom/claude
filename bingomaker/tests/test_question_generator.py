import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from question_generator import validate_questions


def _make_q(page: int, answer: str) -> dict:
    return {"question": f"( {page}쪽 ) 테스트 (    )입니다.", "answer": answer}


def test_validate_all_pass():
    """모든 검증을 통과하는 경우."""
    page_texts = {28: "방위표는 방위를 나타냅니다.", 29: "축척은 거리를 나타냅니다."}
    questions = [_make_q(28, "방위표")] * 13 + [_make_q(29, "축척")] * 12
    errors = validate_questions(questions, page_texts, 28, 46)
    assert errors == []


def test_validate_wrong_count():
    """25개가 아닌 경우 오류."""
    questions = [_make_q(28, "방위표")] * 10
    errors = validate_questions(questions, {28: "방위표"}, 28, 46)
    assert any("25개" in e for e in errors)


def test_validate_page_out_of_range():
    """쪽수가 범위 밖인 경우 오류."""
    questions = [_make_q(99, "방위표")] * 25
    errors = validate_questions(questions, {99: "방위표"}, 28, 46)
    assert any("범위" in e for e in errors)


def test_validate_not_sorted():
    """쪽수가 오름차순이 아닌 경우 오류."""
    page_texts = {28: "방위표", 29: "축척"}
    questions = [_make_q(29, "축척")] * 13 + [_make_q(28, "방위표")] * 12
    errors = validate_questions(questions, page_texts, 28, 46)
    assert any("오름차순" in e for e in errors)


def test_validate_answer_not_in_text():
    """정답이 해당 쪽 텍스트에 없는 경우 오류."""
    page_texts = {28: "방위표는 방위를 나타냅니다."}
    questions = [_make_q(28, "존재하지않는단어")] * 25
    errors = validate_questions(questions, page_texts, 28, 46)
    assert any("존재하지않는단어" in e for e in errors)
