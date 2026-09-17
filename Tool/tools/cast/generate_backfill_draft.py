#!/usr/bin/env python3
"""Emit contract-field DRAFTS for the 16-state named cast.

Reads Cast-State-01..16, Cast-Index, and Core-Characters. Writes review
artifacts under Wikis/game-logic/name-pools/. Does not modify source corpus
files. Python 3 stdlib only. Same inputs → same outputs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import sys
from collections import Counter, OrderedDict
from pathlib import Path

GENERATED_ISO = "2026-09-12T00:00:00Z"

STATE_DISTRICTS: dict[str, list[str]] = {
    "영등포수문정부": ["서울-영등포구", "서울-양천구"],
    "구로제작동맹": ["서울-구로구", "서울-금천구"],
    "마곡연구평의회": ["서울-강서구"],
    "디지털미디어시티송신공사": ["서울-마포구", "서울-은평구"],
    "용산철도후국": ["서울-용산구"],
    "서울역기록청": ["서울-중구", "서울-종로구", "서울-서대문구"],
    "노량진상회": ["서울-동작구", "서울-관악구"],
    "뚝섬공방연합": ["서울-성동구", "서울-광진구"],
    "북한산보국문피난연맹": ["서울-강북구", "서울-도봉구"],
    "창동차륜방": ["서울-노원구"],
    "암사상수단": ["서울-강동구"],
    "신내환승시": ["서울-중랑구"],
    "제기동의정동맹": ["서울-동대문구"],
    "구의관문국": ["서울-성북구"],
    "가락시장배급국": ["서울-송파구"],
    "수서협약도시": ["서울-강남구", "서울-서초구"],
}

LIVELIHOOD_KEYWORDS: list[tuple[tuple[str, ...], str]] = [
    (("경비", "순찰", "호위"), "순찰대"),
    (("정비", "수리", "기술", "기계", "펌프"), "정비사"),
    (("의무", "방역", "약"), "의무원"),
    (("기록", "문서", "서기", "장부"), "기록관"),
    (("배급", "상회", "시장", "운송", "물류"), "물류상"),
    (("전령", "통신", "송신"), "전령"),
    (("탐사", "정찰"), "탐사원"),
]

LIVELIHOOD_FALLBACK = ["정비사", "물류상", "의무원", "순찰대", "전령", "기록관", "탐사원"]

MILITARY_KEYWORDS = ("군사", "경비", "호위", "탈영", "군벌")

CONSCRIPTION_WEIGHTED: list[tuple[str, int]] = [
    ("없음", 40),
    ("예비군 명부", 20),
    ("병 만기", 20),
    ("동원 거부", 20),
]

NATIVE_POLITICAL = (
    "성격",
    "개인 야망",
    "공포",
    "통치 방식",
    "핵심 관계",
    "촉발 사건",
    "플레이어 개입",
)

PERSON_HEAD_RE = re.compile(r"^### 인물[ \t]+(.+?)\s*$", re.M)
STATE_FILE_HEAD_RE = re.compile(r"^# 국가\s+(\d+)\s+(.+)$", re.M)
INDEX_STATE_HEAD_RE = re.compile(r"^## 국가\s+(\d+)\s+(.+)$", re.M)
FIELD_RE = re.compile(r"^- ([^:]+):[ \t]*(.*)$")
SKIP_NAME_RE = re.compile(r"^(B0\d+|G\d+)", re.I)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def name_rng(name: str) -> random.Random:
    digest = hashlib.sha256(name.encode("utf-8")).digest()
    seed = int.from_bytes(digest[:16], "big")
    return random.Random(seed)


def native(value: str) -> dict:
    return {"value": value, "derived": False}


def derived(value: str, rule: str) -> dict:
    return {"value": value, "derived": True, "rule": rule}


def parse_person_blocks(text: str, source_file: str) -> dict[str, dict]:
    matches = list(PERSON_HEAD_RE.finditer(text))
    out: dict[str, dict] = {}
    for i, m in enumerate(matches):
        name = m.group(1).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end]
        fields: dict[str, str] = {}
        for line in body.splitlines():
            fm = FIELD_RE.match(line)
            if not fm:
                continue
            key = fm.group(1).strip()
            val = fm.group(2).strip()
            if key and key not in fields:
                fields[key] = val
        out[name] = {"name": name, "source_file": source_file, "fields": fields}
    return out


def parse_cast_states(docs: Path) -> dict[str, dict]:
    people: dict[str, dict] = {}
    for n in range(1, 17):
        path = docs / f"Cast-State-{n:02d}.md"
        text = path.read_text(encoding="utf-8")
        head = STATE_FILE_HEAD_RE.search(text)
        file_state = head.group(2).strip() if head else ""
        blocks = parse_person_blocks(text, path.name)
        for name, block in blocks.items():
            block["file_state"] = file_state
            block["state_no"] = n
            people[name] = block
    return people


def parse_core(docs: Path) -> dict[str, dict]:
    path = docs / "Core-Characters.md"
    text = path.read_text(encoding="utf-8")
    return parse_person_blocks(text, path.name)


def parse_index(docs: Path) -> list[dict]:
    path = docs / "Cast-Index.md"
    text = path.read_text(encoding="utf-8")
    heads = list(INDEX_STATE_HEAD_RE.finditer(text))
    roster: list[dict] = []
    for i, m in enumerate(heads):
        state_no = int(m.group(1))
        state_name = m.group(2).strip()
        start = m.end()
        end = heads[i + 1].start() if i + 1 < len(heads) else len(text)
        body = text[start:end]
        for line in body.splitlines():
            stripped = line.strip()
            if not stripped.startswith("|"):
                continue
            cols = [c.strip() for c in stripped.strip("|").split("|")]
            if len(cols) < 2:
                continue
            name = cols[0]
            if not name or name == "이름":
                continue
            if set(name.replace(" ", "")) <= {"-"}:
                continue
            if SKIP_NAME_RE.match(name):
                continue
            roster.append(
                {
                    "성명": name,
                    "직위": cols[1],
                    "단계": cols[2] if len(cols) > 2 else "",
                    "소속": state_name,
                    "state_no": state_no,
                    "source_file": path.name,
                }
            )
    return roster


def livelihood_haystack(title: str, affiliation: str) -> str:
    cleaned = affiliation
    for state in STATE_DISTRICTS:
        cleaned = cleaned.replace(state, " ")
    return f"{title} {cleaned}"


약_FALSE_POS = (
    "계약",
    "협약",
    "공약",
    "조약",
    "요약",
    "예약",
    "약소",
    "약속",
    "약정",
    "약자",
    "약점",
    "약식",
    "약관",
)


def contains_keyword(text: str, token: str) -> bool:
    """Substring match with Korean false-positive guards.

    `약` is medicine, not the syllable inside 계약/협약/약소국.
    `군사` does not fire on 비군사.
    """
    if token == "약":
        start = 0
        while True:
            i = text.find("약", start)
            if i < 0:
                return False
            covered = False
            for compound in 약_FALSE_POS:
                pos = compound.find("약")
                if pos < 0:
                    continue
                a = i - pos
                b = a + len(compound)
                if a >= 0 and b <= len(text) and text[a:b] == compound:
                    covered = True
                    break
            if not covered:
                return True
            start = i + 1
    if token == "군사":
        start = 0
        while True:
            i = text.find("군사", start)
            if i < 0:
                return False
            prev = text[i - 1] if i > 0 else ""
            if prev != "비":
                return True
            start = i + 2
    return token in text


def derive_livelihood(title: str, affiliation: str, rng: random.Random) -> tuple[str, str]:
    hay = livelihood_haystack(title, affiliation)
    for keys, live in LIVELIHOOD_KEYWORDS:
        if any(contains_keyword(hay, k) for k in keys):
            return live, "livelihood-keyword"
    return rng.choice(LIVELIHOOD_FALLBACK), "livelihood-hash"


def is_military_org(title: str, affiliation: str) -> bool:
    blob = f"{title} {affiliation}"
    return any(contains_keyword(blob, k) for k in MILITARY_KEYWORDS)


def derive_conscription(title: str, affiliation: str, rng: random.Random) -> tuple[str, str]:
    if is_military_org(title, affiliation):
        return "병 만기", "military-org"
    roll = rng.randrange(100)
    acc = 0
    for label, weight in CONSCRIPTION_WEIGHTED:
        acc += weight
        if roll < acc:
            return label, "conscript-hash"
    return "없음", "conscript-hash"


def derive_arms(live: str, conscript: str, military: bool) -> tuple[str, str]:
    if live == "순찰대":
        return "제식 봉·순찰 방패", "arms-patrol"
    if military and conscript == "병 만기":
        return "제식 소화기(봉인)", "arms-military-discharge"
    if live == "정비사":
        return "생업 공구", "arms-mechanic"
    return "없음", "arms-none"


def derive_origin(affiliation: str, index_state: str, rng: random.Random) -> tuple[str, str]:
    districts = STATE_DISTRICTS.get(affiliation)
    rule = "origin-district-hash"
    if districts is None:
        districts = STATE_DISTRICTS.get(index_state)
    if not districts:
        return "미확인", "unknown-state"
    district = districts[rng.randrange(len(districts))]
    return f"{district} / 한국 국적 (추정)", rule


def merge_person(row: dict, state_people: dict, core_people: dict) -> dict:
    name = row["성명"]
    state_block = state_people.get(name)
    core_block = core_people.get(name)
    merged: dict[str, str] = {}
    source_file = row["source_file"]
    if state_block:
        merged.update(state_block["fields"])
        source_file = state_block["source_file"]
    if core_block:
        for k, v in core_block["fields"].items():
            if k not in merged or not merged[k]:
                merged[k] = v
            elif core_block and not state_block:
                merged[k] = v
        if not state_block:
            source_file = core_block["source_file"]
            merged.update(core_block["fields"])
    affiliation = merged.get("소속") or row["소속"]
    title = merged.get("직위") or row["직위"]
    merged["소속"] = affiliation
    merged["직위"] = title
    return {
        "성명": name,
        "소속": affiliation,
        "직위": title,
        "index_소속": row["소속"],
        "state_no": row["state_no"],
        "source_file": source_file,
        "matched_state": state_block is not None,
        "matched_core": core_block is not None,
        "native": merged,
    }


def build_record(merged: dict) -> dict:
    name = merged["성명"]
    affiliation = merged["소속"]
    title = merged["직위"]
    rng = name_rng(name)
    origin, origin_rule = derive_origin(affiliation, merged["index_소속"], rng)
    live, live_rule = derive_livelihood(title, affiliation, rng)
    military = is_military_org(title, affiliation)
    conscript, conscript_rule = derive_conscription(title, affiliation, rng)
    arms, arms_rule = derive_arms(live, conscript, military)

    fields: OrderedDict[str, dict] = OrderedDict()
    fields["성명"] = native(name)
    fields["소속"] = native(affiliation)
    fields["직위"] = native(title)
    for key in NATIVE_POLITICAL:
        if key in merged["native"] and merged["native"][key]:
            fields[key] = native(merged["native"][key])
    fields["출신 공동체"] = derived(origin, origin_rule)
    fields["언어"] = derived("한국어", "language-korean")
    fields["생업"] = derived(live, live_rule)
    fields["징집 이력"] = derived(conscript, conscript_rule)
    fields["무장 접근"] = derived(arms, arms_rule)

    return {
        "성명": name,
        "소속": affiliation,
        "직위": title,
        "출신 공동체": origin,
        "언어": "한국어",
        "생업": live,
        "징집 이력": conscript,
        "무장 접근": arms,
        "source_file": merged["source_file"],
        "fields": fields,
        "_state_no": merged["state_no"],
        "_index_소속": merged["index_소속"],
        "_matched_state": merged["matched_state"],
        "_matched_core": merged["matched_core"],
    }


def strip_private(record: dict) -> dict:
    return {k: v for k, v in record.items() if not k.startswith("_")}


def render_markdown(people: list[dict]) -> str:
    lines = [
        "# 인물 카드 백필 초안 (검토용)",
        "",
        "이 표는 `Tool/tools/cast/generate_backfill_draft.py`가 기존 명부에서 **규칙으로 파생**한 DRAFT다.",
        "정본이 아니며, 인간 검토 없이 Cast-State·Cast-Index·Core-Characters에 올리지 않는다.",
        "출신 공동체·생업·징집 이력·무장 접근은 성명 해시 시드로 굴렸다. 소속·직위는 원문 그대로다.",
        "",
        f"- 생성 스탬프(결정론): `{GENERATED_ISO}`",
        f"- 인원: {len(people)}",
        "- 확인 칸에 ✓ 또는 수정값을 적은 뒤에만 계약 칸으로 승격한다.",
        "",
    ]
    by_state: OrderedDict[tuple[int, str], list[dict]] = OrderedDict()
    for p in people:
        key = (p["_state_no"], p["_index_소속"])
        by_state.setdefault(key, []).append(p)
    for (num, state), rows in by_state.items():
        lines.append(f"## 국가 {num:02d} {state}")
        lines.append("")
        lines.append("| 성명 | 출신(초안) | 생업(초안) | 징집(초안) | 무장(초안) | 확인 |")
        lines.append("| --- | --- | --- | --- | --- | --- |")
        for p in rows:
            lines.append(
                "| {성명} | {출신} | {생업} | {징집} | {무장} |  |".format(
                    성명=p["성명"],
                    출신=p["출신 공동체"],
                    생업=p["생업"],
                    징집=p["징집 이력"],
                    무장=p["무장 접근"],
                )
            )
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--docs",
        type=Path,
        default=None,
        help="Wikis/game-logic directory (default: repo Wikis/game-logic)",
    )
    args = ap.parse_args()
    root = repo_root()
    docs = args.docs or (root / "docs" / "game-logic")
    out_json = docs / "name-pools" / "cast-backfill-draft.json"
    out_md = docs / "name-pools" / "cast-backfill-draft.md"

    roster = parse_index(docs)
    state_people = parse_cast_states(docs)
    core_people = parse_core(docs)

    records = [build_record(merge_person(row, state_people, core_people)) for row in roster]

    payload = {
        "generated": GENERATED_ISO,
        "count": len(records),
        "people": [strip_private(p) for p in records],
    }
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    out_md.write_text(render_markdown(records), encoding="utf-8")

    unmatched = [
        p["성명"]
        for p in records
        if not p["_matched_state"] and not p["_matched_core"]
    ]
    by_state = Counter(p["_index_소속"] for p in records)
    by_live = Counter(p["생업"] for p in records)
    summary = {
        "index_rows": len(roster),
        "cast_state_blocks": len(state_people),
        "core_blocks": len(core_people),
        "emitted": len(records),
        "index_unmatched": unmatched,
        "by_state": dict(by_state),
        "by_livelihood": dict(by_live),
        "out_json": str(out_json.relative_to(root)),
        "out_md": str(out_md.relative_to(root)),
    }
    json.dump(summary, sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
