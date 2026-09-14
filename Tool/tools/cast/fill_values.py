#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3] / "Wikis" / "game-logic"
AXES = ["권위", "개방", "무력", "물질", "공동", "원칙", "공개", "자격", "분산", "변혁"]
POLICIES = ["전쟁", "이주민", "급수", "노동", "기록", "기술", "교역", "후계", "결합"]
DESIRE_AXES = ["갈망", "독점", "위험", "과시", "지속"]
ORIENT = ["이성", "동성", "양성", "무성향", "유동"]
BOND = ["단혼", "다자", "계약동거", "비독점", "없음"]
MINORS_FORBIDDEN = True

CORE_VALUES = {
    "한재목": [40, -10, 10, 30, 20, -20, -20, -10, -60, -30],
    "강민서": [-40, 20, -20, 40, 40, 10, 40, 70, 30, 20],
    "서이안": [-20, 30, -40, 10, -10, 50, 50, 60, 20, 10],
    "임하준": [-10, 10, -30, 20, 30, 10, -40, 50, 20, -20],
    "배우진": [70, -50, 70, 20, 40, -30, -50, -20, -60, -40],
    "임초원": [-30, 20, -20, 10, -20, 20, 20, 80, 40, 10],
    "윤서린": [20, -10, -30, -20, 10, 40, -30, 0, -40, -50],
    "박태겸": [10, 20, -10, 20, -30, -40, -40, 40, -10, 0],
    "오해린": [0, 40, -20, 70, -40, -50, 30, 0, 20, 10],
    "문가람": [-20, 10, -40, -10, -20, 30, 70, 20, 30, -20],
    "백온": [-60, 50, -50, -20, 50, 40, 40, 40, 50, -10],
    "김도윤": [10, -20, -10, 30, 20, 10, -10, 80, 10, -30],
    "장세화": [-20, 40, -30, 0, 20, 10, 20, 30, 40, 0],
    "류은비": [-30, 30, -60, -20, 10, 50, 30, 20, 20, -20],
    "고서준": [40, -20, 50, 10, 30, -10, -10, -10, -30, -20],
    "남윤경": [10, 30, -10, 60, -30, -60, -40, -10, -20, 0],
    "정유라": [-40, 30, -40, 0, 10, 30, 40, 30, 50, -10],
}

CORE_DESIRE = {
    "한재목": {"갈망": 20, "독점": 40, "위험": -20, "과시": -10, "지속": 50, "지향": "이성", "결합": "단혼"},
    "강민서": {"갈망": 30, "독점": -30, "위험": 10, "과시": -20, "지속": 40, "지향": "양성", "결합": "계약동거"},
    "서이안": {"갈망": 10, "독점": -10, "위험": -30, "과시": -40, "지속": 20, "지향": "유동", "결합": "비독점"},
    "임하준": {"갈망": 40, "독점": 20, "위험": -10, "과시": -20, "지속": 30, "지향": "이성", "결합": "단혼"},
    "배우진": {"갈망": 50, "독점": 60, "위험": 40, "과시": 30, "지속": -10, "지향": "이성", "결합": "단혼"},
    "임초원": {"갈망": 20, "독점": -20, "위험": 20, "과시": -30, "지속": 10, "지향": "동성", "결합": "계약동거"},
    "윤서린": {"갈망": -10, "독점": 10, "위험": -40, "과시": -20, "지속": 40, "지향": "무성향", "결합": "없음"},
    "박태겸": {"갈망": 30, "독점": -40, "위험": 20, "과시": 10, "지속": -20, "지향": "양성", "결합": "비독점"},
    "오해린": {"갈망": 60, "독점": -20, "위험": 30, "과시": 50, "지속": -30, "지향": "유동", "결합": "다자"},
    "문가람": {"갈망": 10, "독점": -30, "위험": -20, "과시": -10, "지속": 20, "지향": "동성", "결합": "계약동거"},
    "백온": {"갈망": 20, "독점": -50, "위험": -30, "과시": -40, "지속": 50, "지향": "이성", "결합": "단혼"},
    "김도윤": {"갈망": 0, "독점": 20, "위험": -20, "과시": -30, "지속": 60, "지향": "이성", "결합": "단혼"},
    "장세화": {"갈망": 30, "독점": -10, "위험": 0, "과시": -10, "지속": 30, "지향": "양성", "결합": "계약동거"},
    "류은비": {"갈망": 10, "독점": -20, "위험": -40, "과시": -30, "지속": 40, "지향": "이성", "결합": "단혼"},
    "고서준": {"갈망": 40, "독점": 30, "위험": 20, "과시": 10, "지속": 20, "지향": "이성", "결합": "단혼"},
    "남윤경": {"갈망": 50, "독점": -10, "위험": 10, "과시": 40, "지속": -20, "지향": "양성", "결합": "다자"},
    "정유라": {"갈망": 20, "독점": -20, "위험": -10, "과시": -20, "지속": 30, "지향": "유동", "결합": "비독점"},
}

STATE_VALUES = {
    "S01": [50, -10, 10, 30, 20, 20, 10, 0, -50, -20],
    "S02": [-30, 10, -10, 40, 40, 10, 30, 50, 20, 20],
    "S03": [-10, 20, -30, 10, 0, 50, 40, 40, 10, 10],
    "S04": [0, 10, -20, 20, 30, 10, -20, 30, 20, 0],
    "S05": [60, -40, 60, 20, 30, -20, -40, -20, -50, -30],
    "S06": [20, -10, -30, -30, 10, 50, -20, 10, -30, -40],
    "S07": [10, 20, -10, 20, -10, 0, -20, 30, 0, 0],
    "S08": [0, 40, -20, 60, -20, -30, 20, 0, 20, 10],
    "S09": [-10, 10, -30, -10, 0, 20, 50, 10, 20, 0],
    "S10": [-50, 50, -40, -20, 60, 30, 30, 30, 50, 0],
    "S11": [10, -10, -10, 30, 20, 10, 0, 60, 10, -20],
    "S12": [-20, 40, -30, 0, 20, 10, 20, 20, 40, 0],
    "S13": [-20, 30, -50, -20, 20, 40, 20, 20, 20, -10],
    "S14": [40, -20, 40, 10, 20, 0, -10, -10, -20, -10],
    "S15": [10, 30, -10, 50, -20, -40, -20, 0, 0, 0],
    "S16": [-30, 30, -30, 0, 10, 30, 30, 20, 40, 10],
}

STATE_POLICY = {
    "S01": ["제한전", "검역수용", "계약", "계약", "교차검증", "면허공유", "허가", "양자도제"],
    "S02": ["방어", "시민권", "최저선", "시민복무", "교차검증", "공동원장", "허가", "공개시험"],
    "S03": ["방어", "검역수용", "최저선", "계약", "전면공개", "공동원장", "허가", "공개시험"],
    "S04": ["방어", "검역수용", "계약", "계약", "비공개", "가문비밀", "허가", "양자도제"],
    "S05": ["선제", "추방", "볼모", "강제복무", "비공개", "면허공유", "봉쇄", "혈통"],
    "S06": ["방어", "검역수용", "계약", "계약", "교차검증", "면허공유", "허가", "양자도제"],
    "S07": ["제한전", "검역수용", "계약", "계약", "비공개", "면허공유", "허가", "양자도제"],
    "S08": ["방어", "시민권", "계약", "계약", "교차검증", "면허공유", "개방시장", "양자도제"],
    "S09": ["방어", "검역수용", "계약", "계약", "전면공개", "면허공유", "허가", "공개시험"],
    "S10": ["방어", "시민권", "최저선", "시민복무", "교차검증", "면허공유", "허가", "공개시험"],
    "S11": ["방어", "검역수용", "계약", "계약", "교차검증", "가문비밀", "허가", "공개시험"],
    "S12": ["방어", "시민권", "최저선", "계약", "교차검증", "면허공유", "허가", "양자도제"],
    "S13": ["방어", "시민권", "최저선", "계약", "교차검증", "공동원장", "허가", "공개시험"],
    "S14": ["제한전", "추방", "계약", "강제복무", "비공개", "면허공유", "봉쇄", "혈통"],
    "S15": ["방어", "검역수용", "계약", "계약", "비공개", "면허공유", "개방시장", "양자도제"],
    "S16": ["방어", "시민권", "최저선", "계약", "교차검증", "공동원장", "허가", "공개시험"],
}

STATE_NAMES = {
    "S01": "여의신정수문정부",
    "S02": "서남제작동맹",
    "S03": "마곡연구평의회",
    "S04": "뚝도공방연합",
    "S05": "암사고덕상수단",
    "S06": "도성기록청",
    "S07": "용산철도후국",
    "S08": "노량진남관상회",
    "S09": "상암송신공사",
    "S10": "북산피난연맹",
    "S11": "창동차륜방",
    "S12": "신내망우환승시",
    "S13": "약령의정동맹",
    "S14": "아차구의관문국",
    "S15": "가락잠실배급국",
    "S16": "수서강남협약도시",
}


def clamp(n: float) -> int:
    n = max(-100.0, min(100.0, float(n)))
    return int(round(n / 5.0) * 5)


def hshift(name: str, i: int) -> int:
    digest = hashlib.sha256(f"{name}:{i}".encode()).hexdigest()
    return (int(digest[:8], 16) % 21) - 10


ROLE_SHIFTS = [
    (("사령", "수비", "순찰", "호위", "전투", "기병"), {0: 15, 2: 20, 1: -10}),
    (("총재", "청장", "조정관"), {0: 10, 8: -10}),
    (("대표", "평의회", "중재"), {0: -15, 8: 10}),
    (("의무", "치료", "방역", "환자"), {2: -20, 1: 10, 5: 10}),
    (("기록", "원장", "감사", "인준"), {5: 15, 6: 5}),
    (("상인", "경매", "배급", "시세", "물류"), {3: 20, 5: -10}),
    (("난민", "피난", "귀환", "가족"), {1: 20, 4: 20, 0: -15}),
    (("정비", "기술", "시험", "도제", "펌프"), {7: 20, 3: 5}),
    (("전령", "송신", "방송"), {6: 15, 1: 10}),
    (("탐사", "척후"), {9: 10, 1: 5}),
    (("거점장", "당직장"), {0: 5, 4: 10}),
]


def apply_role(vals: list[int], title: str) -> list[int]:
    out = list(vals)
    for keys, shifts in ROLE_SHIFTS:
        if any(k in title for k in keys):
            for i, d in shifts.items():
                out[i] += d
    return out


def person_values(name: str, state: str, title: str) -> list[int]:
    if name in CORE_VALUES:
        return list(CORE_VALUES[name])
    base = list(STATE_VALUES.get(state, [0] * 10))
    base = apply_role(base, title)
    for i in range(10):
        base[i] = clamp(base[i] + hshift(name, i))
    return base


def person_desire(name: str, state: str, title: str) -> dict:
    if name in CORE_DESIRE:
        return dict(CORE_DESIRE[name])
    drive = clamp(20 + hshift(name, 20) * 3)
    exclusive = clamp(hshift(name, 21) * 4)
    risk = clamp(hshift(name, 22) * 4)
    display = clamp(hshift(name, 23) * 3)
    lasting = clamp(10 + hshift(name, 24) * 3)
    if any(k in title for k in ("상인", "경매", "시세")):
        display = clamp(display + 20)
        exclusive = clamp(exclusive - 10)
    if any(k in title for k in ("난민", "피난", "가족")):
        lasting = clamp(lasting + 20)
        exclusive = clamp(exclusive - 15)
    if any(k in title for k in ("사령", "호위", "수비")):
        risk = clamp(risk + 15)
        exclusive = clamp(exclusive + 15)
    if any(k in title for k in ("기록", "감사", "원장")):
        display = clamp(display - 20)
        drive = clamp(drive - 10)
    orient = ORIENT[int(hashlib.sha256(f"{name}:o".encode()).hexdigest()[:8], 16) % len(ORIENT)]
    bond = BOND[int(hashlib.sha256(f"{name}:b".encode()).hexdigest()[:8], 16) % len(BOND)]
    return {
        "갈망": drive,
        "독점": exclusive,
        "위험": risk,
        "과시": display,
        "지속": lasting,
        "지향": orient,
        "결합": bond,
    }


def parse_index() -> list[dict]:
    text = (ROOT / "Cast-Index.md").read_text(encoding="utf-8")
    people = []
    current = None
    skip_header = False
    for line in text.splitlines():
        m = re.match(r"^## 국가 (\d+) ", line)
        if m:
            current = f"S{int(m.group(1)):02d}"
            skip_header = True
            continue
        if not current or not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3:
            continue
        if cells[0] in {"이름", "---"} or set(cells[0]) <= {"-"}:
            continue
        if cells[0].startswith("---"):
            continue
        name, title, stage = cells[0], cells[1], cells[2]
        if name in {"항목", "B001"}:
            continue
        people.append(
            {
                "name": name,
                "title": title,
                "stage": stage,
                "state": current,
                "state_name": STATE_NAMES[current],
            }
        )
    return people


def mean_states(ids: list[str]) -> list[int]:
    acc = [0] * 10
    n = 0
    for sid in ids:
        if sid in STATE_VALUES:
            for i, v in enumerate(STATE_VALUES[sid]):
                acc[i] += v
            n += 1
    if not n:
        return [0] * 10
    return [clamp(v / n) for v in acc]


STATE_BOND = {
    "S01": "단혼허가",
    "S02": "계약동거",
    "S03": "비독점허가",
    "S04": "가문결합",
    "S05": "군호적결합",
    "S06": "기록혼인",
    "S07": "도제동거",
    "S08": "개방결합",
    "S09": "비독점허가",
    "S10": "가족재결합",
    "S11": "시험혼인",
    "S12": "계약동거",
    "S13": "치료동거",
    "S14": "군호적결합",
    "S15": "개방결합",
    "S16": "공동교섭혼인",
}


def mode_policy(ids: list[str]) -> list[str]:
    out = []
    for i in range(8):
        votes = [STATE_POLICY[s][i] for s in ids if s in STATE_POLICY]
        if not votes:
            out.append("계약")
            continue
        out.append(max(set(votes), key=votes.count))
    bonds = [STATE_BOND[s] for s in ids if s in STATE_BOND]
    out.append(max(set(bonds), key=bonds.count) if bonds else "계약동거")
    return out


HOUSE_KIND_SHIFT = {
    "corporate-successor": {3: 15, 0: 10, 8: -10},
    "civic-professional": {4: 15, 7: 10, 0: -10},
}

HOUSE_ID_SHIFT = {
    "HC01": {3: 10, 6: -10},  # cooling ledger
    "HC02": {3: 10, 2: 5},
    "HC05": {5: 20, 9: -15, 6: -10},  # records
    "HC08": {2: 15, 0: 10},  # defense keys
    "HP01": {8: 20, 0: -5},
    "HP04": {5: 20, 6: 10},
    "HP05": {1: 20, 4: 20},
    "HP10": {1: 15, 9: 5},
}


def org_values(oid: str, kind: str, states: list[str]) -> list[int]:
    base = mean_states(states)
    for i, d in HOUSE_KIND_SHIFT.get(kind, {}).items():
        base[i] += d
    for i, d in HOUSE_ID_SHIFT.get(oid, {}).items():
        base[i] += d
    return [clamp(v) for v in base]


def main() -> None:
    people = parse_index()
    names = [p["name"] for p in people]
    print("index people", len(people), "unique", len(set(names)))
    missing_core = [n for n in CORE_VALUES if n not in set(names)]
    print("core missing from index", missing_core)

    filled = []
    for p in people:
        vals = person_values(p["name"], p["state"], p["title"])
        rec = {
            **p,
            "generation": "opening",
            "source": "proposal",
            "minors": False,
            "values": dict(zip(AXES, vals)),
            "desire": person_desire(p["name"], p["state"], p["title"]),
        }
        if p["name"] in CORE_VALUES:
            rec["locked"] = True
        filled.append(rec)

    atlas_t = (ROOT / "World-Narrative-Atlas.md").read_text(encoding="utf-8")
    i = atlas_t.find("```json")
    j = atlas_t.rfind("```")
    atlas = json.loads(atlas_t[i + 7 : j].strip())
    orgs = []
    for h in atlas["houses"]:
        states = h.get("states") or []
        kind = h.get("house_kind") or ""
        vals = org_values(h["id"], kind, states)
        pol = mode_policy(states)
        orgs.append(
            {
                "id": h["id"],
                "name": h.get("display_name"),
                "kind": kind,
                "class": h.get("house_class"),
                "states": states,
                "values": dict(zip(AXES, vals)),
                "policy": dict(zip(POLICIES, pol)),
                "source": "proposal",
            }
        )
    for x in atlas.get("theaters") or []:
        states = x.get("states") or []
        vals = mean_states(states)
        vals[1] = clamp(vals[1] + 15)  # theaters press from outside
        vals[8] = clamp(vals[8] + 10)
        pol = mode_policy(states)
        orgs.append(
            {
                "id": x["id"],
                "name": x.get("display_name"),
                "kind": "external-theater",
                "states": states,
                "values": dict(zip(AXES, vals)),
                "policy": dict(zip(POLICIES, pol)),
                "source": "proposal",
            }
        )

    out_dir = ROOT / "name-pools"
    people_path = out_dir / "values-cast.json"
    org_path = out_dir / "values-orgs.json"
    people_doc = {
        "schema": "janseon.values.cast.v2",
        "note": "창작 제안. 나이·미성년 서사는 넣지 않는다. 핵심 17명은 가치관·욕망 잠금값.",
        "axes": AXES,
        "desire_axes": DESIRE_AXES,
        "count": len(filled),
        "people": filled,
    }
    org_doc = {
        "schema": "janseon.values.orgs.v1",
        "note": "HC·HP·XT 창작 제안. 16국 헌장 평균에 직능 보정을 더한다.",
        "axes": AXES,
        "policies": POLICIES,
        "count": len(orgs),
        "orgs": orgs,
    }
    people_path.write_text(json.dumps(people_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    org_path.write_text(json.dumps(org_doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("wrote", people_path, len(filled))
    print("wrote", org_path, len(orgs))


if __name__ == "__main__":
    main()
