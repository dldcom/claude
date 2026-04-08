import sys
from pathlib import Path

from pdf_reader import extract_text, extract_unit_name, parse_filename
from question_generator import load_questions
from hwpx_modifier import create_bingo_worksheet

# 프로젝트 루트 디렉토리 (src의 상위)
PROJECT_ROOT = Path(__file__).parent.parent


def main():
    if len(sys.argv) < 2:
        print("사용법: python src/make_bingo.py [교과서PDF경로] [문제JSON경로]")
        print("예시:   python src/make_bingo.py input/[과학]4-1-1_교과서.pdf output/questions.json")
        sys.exit(1)

    pdf_path = sys.argv[1]
    json_path = sys.argv[2] if len(sys.argv) > 2 else str(PROJECT_ROOT / "output" / "questions.json")

    if not Path(pdf_path).exists():
        print(f"파일을 찾을 수 없습니다: {pdf_path}")
        sys.exit(1)

    if not Path(json_path).exists():
        print(f"문제 파일을 찾을 수 없습니다: {json_path}")
        sys.exit(1)

    # 1. 파일명에서 메타데이터 추출
    print("1/3 파일명 분석 중...")
    metadata = parse_filename(pdf_path)
    print(f"     과목: {metadata['subject']}, {metadata['grade']}학년 "
          f"{metadata['semester']}학기 {metadata['unit']}단원")

    # 2. PDF에서 텍스트 추출 (단원명, 페이지 범위)
    print("2/3 교과서 정보 추출 중...")
    _, page_start, page_end = extract_text(pdf_path)
    unit_name = extract_unit_name(pdf_path)
    metadata["unit_name"] = unit_name
    print(f"     단원명: {unit_name} ({page_start}~{page_end}쪽)")

    # 3. 문제 로드 & HWPX 생성
    print("3/3 빙고 학습지 생성 중...")
    questions = load_questions(json_path)

    stem = Path(pdf_path).stem.replace("_교과서", "_빙고학습지")
    output_path = str(PROJECT_ROOT / "output" / f"{stem}.hwpx")

    template_path = str(PROJECT_ROOT / "template" / "bingo.hwpx")
    if not Path(template_path).exists():
        print(f"템플릿 파일을 찾을 수 없습니다: {template_path}")
        sys.exit(1)

    create_bingo_worksheet(template_path, output_path, questions, metadata, page_start, page_end)
    print(f"\n완료! 파일 생성됨: {output_path}")


if __name__ == "__main__":
    main()
