"""Opening-day interiors for every catalog station. Observed floor counts stay empty until a ledger joins."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

NORTH = {
    "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구", "성북구",
    "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구", "강서구",
}
SOUTH = {
    "양천구", "구로구", "금천구", "영등포구", "동작구", "관악구", "서초구",
    "강남구", "송파구", "강동구",
}

WATERFRONT = ("여의", "이촌", "반포", "잠실", "망원", "합정", "당산", "노량진", "한강", "뚝섬", "성수", "서빙고")


def river(gu: str, name: str) -> str:
    if any(t in name for t in WATERFRONT):
        return "hangang-north" if gu in NORTH else "hangang-south"
    if gu in {"관악구", "도봉구", "강북구", "성북구"}:
        return "inland"
    if gu in {"중랑구", "동대문구", "노원구", "양천구", "구로구"}:
        return "tributary"
    if gu in NORTH:
        return "hangang-north"
    return "hangang-south"


def parse_catalog(text: str) -> list[dict]:
    gu = None
    rows = []
    for line in text.splitlines():
        m = re.match(r"^## (.+) \((\d+)\)", line)
        if m:
            gu = m.group(1)
            continue
        if not line.startswith("|"):
            continue
        cols = [c.strip() for c in line.strip("|").split("|")]
        if len(cols) < 5 or cols[0] in {"이름", "---"} or set(cols[0]) <= {"-"}:
            continue
        rows.append({
            "name": cols[0],
            "name_en": cols[1],
            "lat": float(cols[2]) if cols[2] else None,
            "lon": float(cols[3]) if cols[3] else None,
            "network": cols[4],
            "district": gu,
        })
    return rows


def interior(st: dict) -> dict:
    name = st["name"]
    gu = st["district"]
    rv = river(gu, name)
    wet = rv in {"hangang-north", "hangang-south", "tributary"}
    return {
        "name": name,
        "name_en": st["name_en"],
        "district": gu,
        "lat": st["lat"],
        "lon": st["lon"],
        "network": st["network"],
        "observed_levels": None,
        "observed_levels_source": None,
        "epoch": "opening-day",
        "collapse_plus_years": 110,
        "river": rv,
        "layers": [
            {
                "id": "tracks",
                "wiki_layer": "승강장·선로",
                "state": "sealed",
                "contents": f"{name} 선로. {gu} 통행세 구간. 전동차는 없고 침목만 남았다.",
                "condition": "허가 없는 보행은 돌린다. 침수는 우기에만 본다.",
            },
            {
                "id": "platform",
                "wiki_layer": "승강장·선로",
                "state": "flooded" if wet else "occupied",
                "contents": f"{name} 승강장. 피난 침상과 손수레 대기. 붕괴 뒤 한 세기가 지나 안내판 글자는 지워졌다.",
                "condition": "건기에는 침상을 깔고, 우기에는 물을 퍼낸다.",
            },
            {
                "id": "concourse",
                "wiki_layer": "역사 대합실",
                "state": "occupied",
                "contents": f"{name} 대합실. 생활 화물 인계와 배급 창구. 개찰 자리는 책상이다.",
                "condition": "야간만 연다. 전력은 손발전기나 거점 배전.",
            },
            {
                "id": "surface",
                "wiki_layer": "지상 폐허",
                "state": "abandoned" if wet else "yard",
                "contents": f"{name} 지상 출입. {gu} 쪽으로 손수레가 모인다.",
                "condition": "캐노피는 녹슬었거나 없다. 표지판은 동 장부 사본.",
            },
        ],
        "slots": [
            {"kind": "창고", "where": "concourse", "note": "예약 화물"},
            {"kind": "급수", "where": "concourse", "note": "배급 창구 옆"},
        ],
        "uncertainty": "관측 층수(지상/지하 몇 층)는 비어 있다. OSM 역 노드에 building:levels가 거의 없다. 서울 건축물대장 조인이 오기 전에는 층 개수를 창작으로 채우지 않는다. 위 네 층은 개막 쓰임이다.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    stations = parse_catalog(Path(args.catalog).read_text(encoding="utf-8"))
    payload = {
        "schema": "station-interior.v1",
        "as_of": "opening-day",
        "count": len(stations),
        "stations": [interior(s) for s in stations],
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"stations": len(stations), "out": str(out)}))


if __name__ == "__main__":
    main()
