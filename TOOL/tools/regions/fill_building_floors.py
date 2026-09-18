"""Fill per-floor state for every authored building. OSM has no building:levels."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ALLOWED_STATE = {"flooded", "sealed", "occupied", "abandoned", "yard"}


def wet(river: str) -> bool:
    return river in {"hangang-north", "hangang-south", "tributary"}


def floor(level, label, state, contents, condition):
    if state not in ALLOWED_STATE:
        raise ValueError(state)
    return {
        "level": level,
        "label": label,
        "state": state,
        "contents": contents,
        "condition": condition,
    }


def floors_for(building: dict, dong: str, holders: list) -> list:
    name = building["name"]
    use = building["observed_use"]
    river = building["river"]
    who = ", ".join(h["polity"] for h in holders) if holders else "공백"
    w = wet(river)
    ground_state = "flooded" if w else "occupied"

    if use == "역":
        return [
            floor(-2, "선로", "sealed",
                  f"{name} 선로. {dong} 통행세 구간. 보유 {who}.",
                  "침목은 남고 전동차는 없다. 허가 없는 보행은 돌린다."),
            floor(-1, "승강장", "occupied" if not w else "flooded",
                  f"{name} 승강장. 피난 침상과 손수레 대기.",
                  "우기에는 물이 차오르고, 건기에는 침상을 깐다."),
            floor(1, "대합실", "occupied",
                  f"{name} 대합실. 생활 화물 인계와 배급 창구.",
                  "개찰 자리는 책상으로 바꿨다. 야간만 연다."),
            floor("roof", "옥상", "sealed",
                  f"{name} 옥상 망루. {dong} 방향 관측.",
                  "난간은 철사. 출입은 초소 암호패."),
        ]
    if use == "학교":
        return [
            floor(0, "운동장", "yard",
                  f"{name} 운동장. {dong} 화물 정렬.",
                  "우기에는 물길, 건기에는 손수레 축."),
            floor(1, "현관·1층 교실", ground_state,
                  f"{name} 1층. 민병 현관과 신발 더미.",
                  "1층 창호는 판자. 침수는 우기에만 본다."),
            floor(2, "교실 숙영", "occupied",
                  f"{name} 2층 교실. {who} 분대 침상.",
                  "칠판은 당번표. 책상은 침상 다리."),
            floor(3, "특별실", "sealed",
                  f"{name} 과학실·음악실. 봉인.",
                  "가스관과 악기는 치우지 않았다. 열쇠는 동 장부."),
            floor("roof", "옥상", "occupied",
                  f"{name} 옥상 망루.",
                  "급수통 두 개. 야간 교대."),
        ]
    if use == "아파트":
        return [
            floor(1, "1층", "flooded" if w else "abandoned",
                  f"{name} 1층. {dong} 우기 창고이거나 포기.",
                  "현관 유리 없음. 우편함은 녹슬었다."),
            floor(2, "2층", "abandoned" if w else "sealed",
                  f"{name} 2층. 거주 금지.",
                  "창호를 막았거나 물이 남긴 자국만 있다."),
            floor(3, "3층", "occupied",
                  f"{name} 3층. {who} 거주.",
                  "엘레베이터 샤프트는 봉인. 계단만 쓴다."),
            floor("roof", "옥상", "sealed",
                  f"{name} 옥상.",
                  "태양광 판은 뜯겼거나 창고 지붕이다."),
        ]
    if use == "주민센터":
        return [
            floor(1, "민원 창구", "occupied",
                  f"{name} 1층. {dong} 배급 창구. 보유 {who}.",
                  "번호표 기계는 죽은 채. 야간만 연다."),
            floor(2, "서고", "sealed",
                  f"{name} 2층 서고. 동 장부 원본.",
                  "철문. 열쇠는 창구 당번."),
        ]
    if use in {"병원", "의원"}:
        return [
            floor(1, "대기실", "flooded" if w else "abandoned",
                  f"{name} 1층 대기. 탁수 때는 쓰지 않는다.",
                  "의자 줄은 남고 접수 창구는 막았다."),
            floor(2, "침상", "occupied",
                  f"{name} 2층 교대 침상. {who} 야전 의무.",
                  "수술실 대신 커튼 칸. 약품은 자물쇠."),
        ]
    if use == "대학":
        return [
            floor(1, "로비·열람", "occupied",
                  f"{name} 1층. 기록 사본 공방. {dong}.",
                  "복사기는 없고 필사 책상만 있다."),
            floor(2, "실험동", "sealed",
                  f"{name} 실험동. 부품 분해 전 봉인.",
                  "환기팬은 멈춤. 허가 없이 못 연다."),
        ]
    if use == "시장":
        return [
            floor(-1, "지하 창고", "flooded" if w else "occupied",
                  f"{name} 지하. 예약 재고.",
                  "우기에는 물건을 1층으로 올린다."),
            floor(1, "장터", "occupied",
                  f"{name} 1층 허가 장터. 보유 {who}.",
                  "예약분과 판매분을 줄로 나눈다."),
        ]
    if use == "공원·녹지":
        return [
            floor(0, "지표면", "yard",
                  f"{name}. {dong} 얕은 경작과 우기 배수.",
                  "묘지로 쓰지 않는다. 방목은 낮에만."),
        ]
    if use == "집회당":
        return [
            floor(1, "본당", "occupied",
                  f"{name} 본당. {dong} 집회와 유언 낭독.",
                  "종은 경보로만 친다."),
            floor("roof", "종루", "sealed",
                  f"{name} 종루.",
                  "사다리 출입. 야간 봉인."),
        ]
    if use in {"상점", "사무실"}:
        return [
            floor(1, "1층", "occupied" if not w else "sealed",
                  f"{name} 1층. 공방이거나 셔터 봉인. {dong}.",
                  "간판 상호는 장부에 올리지 않는다."),
        ]
    return [
        floor(1, "1층", ground_state,
              f"{name} 1층. {dong} 잔존 골조. 보유 {who}.",
              "관측된 출입구만 쓰고 나머지는 막는다."),
        floor("roof", "옥상", "abandoned",
              f"{name} 옥상.",
              "난간만 남았거나 없다."),
    ]


def fill_document(doc: dict) -> int:
    n = 0
    for row in doc["regions"]:
        holders = (row["content"].get("territory") or {}).get("holders") or []
        dong = row["name"]
        for building in row["content"].get("buildings") or []:
            building["floors"] = floors_for(building, dong, holders)
            n += 1
    return n


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--content-dir", required=True)
    parser.add_argument("--only", nargs="*", default=None, help="district json filenames")
    args = parser.parse_args()
    directory = Path(args.content_dir)
    files = sorted(directory.glob("*.json"))
    if args.only:
        wanted = set(args.only)
        files = [p for p in files if p.name in wanted]
    total = 0
    for path in files:
        doc = json.loads(path.read_text(encoding="utf-8"))
        total += fill_document(doc)
        path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"files": len(files), "buildings": total}))


if __name__ == "__main__":
    main()
