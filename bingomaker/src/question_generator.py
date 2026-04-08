import json
from pathlib import Path


def load_questions(json_path: str) -> list[dict]:
    """JSON 파일에서 25개 문제를 로드한다.

    JSON 형식: [{"question": "문제", "answer": "정답"}, ...]
    """
    data = json.loads(Path(json_path).read_text(encoding="utf-8"))

    if len(data) != 25:
        raise ValueError(f"25개 문제가 필요하지만 {len(data)}개가 있습니다.")

    return data
