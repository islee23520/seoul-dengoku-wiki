#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "Wikis" / "game-logic"
POOL = ROOT / "name-pools"

STATE_NAMES = {
    "S01": "영등포수문정부",
    "S02": "구로제작동맹",
    "S03": "마곡연구평의회",
    "S04": "뚝섬공방연합",
    "S05": "암사상수단",
    "S06": "서울역기록청",
    "S07": "용산철도후국",
    "S08": "노량진상회",
    "S09": "디지털미디어시티송신공사",
    "S10": "북한산보국문피난연맹",
    "S11": "창동차륜방",
    "S12": "신내환승시",
    "S13": "제기동의정동맹",
    "S14": "구의관문국",
    "S15": "가락시장배급국",
    "S16": "수서협약도시",
}

TITLES = {
    "S01": ["배급구역 서기", "수문 당직", "관로 탐사원", "정수 기록관", "교량 통행 전령", "저수조 순찰대"],
    "S02": ["부품 규격 검사원", "작업반 전령", "차단문 정비사", "복구복무 기록관", "공구 물류상", "전력장치 순찰대"],
    "S03": ["수질 계측원", "방재대 순찰", "종자 기록관", "밀폐실험 당직", "인증 전령", "안전심사 서기"],
    "S04": ["펌프 정비사", "공방 전령", "합금 기록관", "유치선 순찰대", "공정 서기", "부품 물류상"],
    "S05": ["상수 호위 순찰대", "장교 서기", "급수 전령", "보급 기록관", "관문 당직", "호송 정비사"],
    "S06": ["원장 서기", "인준 기록관", "열람 당직", "사본 전령", "봉인 순찰대", "증언 탐사원"],
    "S07": ["배차 서기", "선로 정비사", "호송 전령", "차량 기록관", "중계 당직", "도제 순찰대"],
    "S08": ["냉동 당직", "경매 서기", "시세 전령", "얼음 물류상", "전력슬롯 기록관", "시장 순찰대"],
    "S09": ["송신 당직", "검증 기록관", "대역 전령", "방송 서기", "안테나 정비사", "청취 탐사원"],
    "S10": ["귀환 명부 서기", "가족 전령", "회랑 순찰대", "피난 기록관", "검역 당직", "주거 물류상"],
    "S11": ["차륜 정비사", "기지 당직", "북문 순찰대", "시험 기록관", "호송 전령", "철재 물류상"],
    "S12": ["환승 서기", "배차 전령", "대합실 당직", "의무호송 기록관", "창구 순찰대", "대기열 탐사원"],
    "S13": ["처방 서기", "진료 당직", "약재 물류상", "의무 전령", "방역 기록관", "환자 호송 순찰대"],
    "S14": ["관문 당직", "능선 순찰대", "봉인 기록관", "초소 전령", "수비 정비사", "검역 서기"],
    "S15": ["경매 서기", "배급 전령", "창고 당직", "시세 기록관", "호송 물류상", "시장 순찰대"],
    "S16": ["계약 서기", "감사 기록관", "중계 전령", "공동구 당직", "협약 탐사원", "호송 순찰대"],
}

AXES = ["권위", "개방", "무력", "물질", "공동", "원칙", "공개", "자격", "분산", "변혁"]
DESIRE_AXES = ["갈망", "독점", "위험", "과시", "지속"]


def minus(n: int) -> str:
    return str(n).replace("-", "−")


def value_line(vals: dict) -> str:
    return " | ".join(f"{k} {minus(vals[k])}" for k in AXES)


def desire_line(d: dict) -> str:
    nums = " | ".join(f"{k} {minus(d[k])}" for k in DESIRE_AXES)
    return f"{nums} | 지향 {d['지향']} | 결합 {d['결합']}"


def load_values() -> dict:
    doc = json.loads((POOL / "values-cast.json").read_text(encoding="utf-8"))
    return {p["name"]: p for p in doc["people"]}


def inject_cast_state(by_name: dict) -> int:
    patched = 0
    missing = []
    for path in sorted(ROOT.glob("Cast-State-*.md")):
        text = path.read_text(encoding="utf-8")
        parts = re.split(r"(?=^### 인물 )", text, flags=re.M)
        out = []
        for part in parts:
            m = re.match(r"^### 인물 (.+)$", part, re.M)
            if not m:
                out.append(part)
                continue
            name = m.group(1).strip()
            rec = by_name.get(name)
            if rec is None:
                missing.append((path.name, name))
                out.append(part)
                continue
            vline = f"- 가치관: {value_line(rec['values'])}\n"
            dline = f"- 욕망: {desire_line(rec['desire'])}\n"
            if "- 가치관:" in part and "- 욕망:" in part:
                out.append(part)
                continue
            # insert after 직위
            lines = part.splitlines(keepends=True)
            inserted = False
            new_lines = []
            for line in lines:
                new_lines.append(line)
                if line.startswith("- 직위:") and not inserted:
                    if "- 가치관:" not in part:
                        new_lines.append(vline)
                    if "- 욕망:" not in part:
                        new_lines.append(dline)
                    inserted = True
            if not inserted:
                new_lines.append(vline)
                new_lines.append(dline)
            out.append("".join(new_lines))
            patched += 1
        path.write_text("".join(out), encoding="utf-8")
    if missing:
        raise SystemExit(f"missing values for {len(missing)}: {missing[:8]}")
    return patched


def existing_names() -> set[str]:
    names = set(json.loads((POOL / "existing-names.json").read_text(encoding="utf-8")))
    names |= set(load_values())
    for p in ROOT.glob("Cast-State-*.md"):
        names |= set(re.findall(r"^### 인물 (.+)$", p.read_text(encoding="utf-8"), re.M))
    return names


def syllables() -> list[str]:
    return list("가나다라마바사아자차카타파하금은동서남북하늘별솔달빛구름산강바다숲돌바람새")


def make_names(need: int, taken: set[str]) -> list[tuple[str, str]]:
    surnames = json.loads((POOL / "surnames.json").read_text(encoding="utf-8"))["surnames"]
    male = json.loads((POOL / "given-male.json").read_text(encoding="utf-8"))["names"]
    female = json.loads((POOL / "given-female.json").read_text(encoding="utf-8"))["names"]
    extra = syllables()
    out: list[tuple[str, str]] = []
    i = 0
    while len(out) < need:
        i += 1
        sur = surnames[i % len(surnames)]
        if (i // 3) % 2 == 0:
            given = male[i % len(male)]
            gender = "남"
        else:
            given = female[i % len(female)]
            gender = "여"
        # mix hangnyeol-like extra syllable for uniqueness
        if i > 800:
            given = extra[i % len(extra)] + given[1:]
        if i > 1600:
            given = given[0] + extra[(i * 7) % len(extra)]
        name = sur + given
        if name in taken:
            name = sur + extra[(i * 3) % len(extra)] + given[1:]
        if name in taken:
            continue
        taken.add(name)
        out.append((name, gender))
    return out


def hshift(name: str, i: int) -> int:
    digest = hashlib.sha256(f"{name}:{i}".encode()).hexdigest()
    return (int(digest[:8], 16) % 21) - 10


def clamp(n: float) -> int:
    n = max(-100.0, min(100.0, float(n)))
    return int(round(n / 5.0) * 5)


def new_person(name: str, state: str, title: str, gender: str, i: int) -> dict:
    from fill_values import person_values, person_desire, AXES as FAXES, STATE_NAMES as SN

    vals = person_values(name, state, title)
    des = person_desire(name, state, title)
    return {
        "name": name,
        "title": title,
        "stage": "S4",
        "state": state,
        "state_name": STATE_NAMES[state],
        "generation": "opening",
        "source": "proposal",
        "minors": False,
        "gender": gender,
        "values": dict(zip(FAXES, vals)),
        "desire": des,
        "ambition": f"{title} 자리에서 {STATE_NAMES[state]}의 장부를 끊기지 않게 잇는다.",
        "fear": f"{title} 당직이 비면 {STATE_NAMES[state]}의 통행이 강국 볼모가 되는 것.",
        "trigger": f"개막 후 추가 당직 {i}호가 열리자 빈 칸을 메운다.",
    }


def prose_block(p: dict) -> str:
    v = value_line(p["values"])
    d = desire_line(p["desire"])
    return (
        f"### 인물 {p['name']}\n\n"
        f"- 소속: {p['state_name']}\n"
        f"- 직위: {p['title']}\n"
        f"- 가치관: {v}\n"
        f"- 욕망: {d}\n"
        f"- 성격: 당직을 끊지 않는 쪽을 먼저 고른다. 큰소리보다 장부 한 줄을 믿는다.\n"
        f"- 개인 야망: {p['ambition']}\n"
        f"- 공포: {p['fear']}\n"
        f"- 통치 방식: 자기 직위의 열쇠와 기록만 넘기고, 없는 권한은 만들지 않는다.\n"
        f"- 핵심 관계: 같은 생활권 선배 당직과 인수인계로 묶인다.\n"
        f"- 촉발 사건: {p['trigger']}\n"
        f"- 플레이어 개입: 당직 인수 증인을 세우거나 빈 열쇠를 폭로할 수 있다.\n"
    )


def append_cast_state(people: list[dict]) -> None:
    by_state: dict[str, list[dict]] = {k: [] for k in STATE_NAMES}
    for p in people:
        by_state[p["state"]].append(p)
    for sid, group in by_state.items():
        if not group:
            continue
        n = int(sid[1:])
        path = ROOT / f"Cast-State-{n:02d}.md"
        extra = "\n" + "\n".join(prose_block(p) for p in group)
        text = path.read_text(encoding="utf-8")
        if not text.endswith("\n"):
            text += "\n"
        path.write_text(text + extra, encoding="utf-8")


def append_index(people: list[dict]) -> None:
    path = ROOT / "Cast-Index.md"
    text = path.read_text(encoding="utf-8")
    by_state: dict[str, list[dict]] = {k: [] for k in STATE_NAMES}
    for p in people:
        by_state[p["state"]].append(p)
    for sid, group in by_state.items():
        if not group:
            continue
        n = int(sid[1:])
        header = f"## 국가 {n:02d} "
        i = text.find(header)
        if i < 0:
            header = f"## 국가 {n} "
            i = text.find(header)
        if i < 0:
            raise SystemExit(f"missing index header {sid}")
        nxt = text.find("\n## ", i + 3)
        rows = "".join(
            f"| {p['name']} | {p['title']} | S4 | 0 |\n" for p in group
        )
        if nxt < 0:
            text = text.rstrip() + "\n" + rows
        else:
            text = text[:nxt] + rows + text[nxt:]
    path.write_text(text, encoding="utf-8")


def main() -> None:
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    by_name = load_values()
    patched = inject_cast_state(by_name)
    print("patched cast-state", patched)

    taken = existing_names()
    need = 1000 - len(by_name)
    print("need new", need, "taken", len(taken))
    names = make_names(need, taken)
    # distribute across 16 states
    new_people = []
    for i, (name, gender) in enumerate(names):
        sid = f"S{(i % 16) + 1:02d}"
        title = TITLES[sid][i % len(TITLES[sid])]
        new_people.append(new_person(name, sid, title, gender, i + 1))

    append_cast_state(new_people)
    append_index(new_people)

    # merge json
    doc = json.loads((POOL / "values-cast.json").read_text(encoding="utf-8"))
    doc["people"].extend(
        [
            {
                "name": p["name"],
                "title": p["title"],
                "stage": p["stage"],
                "state": p["state"],
                "state_name": p["state_name"],
                "generation": "opening",
                "source": "proposal",
                "minors": False,
                "values": p["values"],
                "desire": p["desire"],
            }
            for p in new_people
        ]
    )
    doc["count"] = len(doc["people"])
    doc["note"] = (
        "창작 제안. 나이·미성년 서사는 넣지 않는다. "
        f"이름 있는 인물 {doc['count']}명. 핵심 17명은 잠금값."
    )
    (POOL / "values-cast.json").write_text(
        json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("values-cast", doc["count"])


if __name__ == "__main__":
    main()
