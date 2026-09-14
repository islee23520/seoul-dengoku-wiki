#!/usr/bin/env python3
"""Sample ~100 Janseon extra-cast rows from Nemotron-Personas-Korea parquet.

Runs on the Windows host. Reads
  E:\\git\\huggingface\\datasets\\nvidia\\Nemotron-Personas-Korea\\train-00000.parquet
Name pools are passed as JSON next to the script or via --pools.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from collections import Counter
from pathlib import Path

import pyarrow.parquet as pq

DISTRICT_STATE = {
    "서울-영등포구": ("여의신정수문정부", "west-sluice"),
    "서울-양천구": ("여의신정수문정부", "west-sluice"),
    "서울-구로구": ("서남제작동맹", "west-sluice"),
    "서울-금천구": ("서남제작동맹", "west-sluice"),
    "서울-강서구": ("마곡연구평의회", "west-sluice"),
    "서울-마포구": ("상암송신공사", "west-sluice"),
    "서울-용산구": ("용산철도후국", "center-record"),
    "서울-중구": ("도성기록청", "center-record"),
    "서울-종로구": ("도성기록청", "center-record"),
    "서울-동작구": ("노량진남관상회", "center-record"),
    "서울-관악구": ("노량진남관상회", "center-record"),
    "서울-성동구": ("뚝도공방연합", "center-record"),
    "서울-광진구": ("뚝도공방연합", "center-record"),
    "서울-강북구": ("북산피난연맹", "north-refuge"),
    "서울-도봉구": ("북산피난연맹", "north-refuge"),
    "서울-노원구": ("창동차륜방", "north-refuge"),
    "서울-강동구": ("암사고덕상수단", "east-caravan"),
    "서울-중랑구": ("신내망우환승시", "east-caravan"),
    "서울-동대문구": ("약령의정동맹", "east-caravan"),
    "서울-성북구": ("아차구의관문국", "east-caravan"),
    "서울-송파구": ("가락잠실배급국", "southeast-ration"),
    "서울-강남구": ("수서강남협약도시", "southeast-ration"),
    "서울-서초구": ("수서강남협약도시", "southeast-ration"),
    "서울-은평구": ("상암송신공사", "west-sluice"),
    "서울-서대문구": ("도성기록청", "center-record"),
}

JOB_LIVELIHOOD = [
    (("정비", "수리", "기계", "전기", "용접", "운전", "기관", "청소"), "정비사"),
    (("경찰", "순찰", "경호", "소방"), "순찰대"),
    (("간호", "의료", "약사", "치료", "보건"), "의무원"),
    (("회계", "사무", "경리", "기록", "행정"), "기록관"),
    (("배달", "물류", "판매", "상점", "영업", "운송"), "물류상"),
    (("통신", "안내", "통역", "우편"), "전령"),
]

LIVELIHOODS = ["정비사", "물류상", "의무원", "순찰대", "전령", "탐사원", "기록관"]


def livelihood(occupation: str) -> str:
    occ = occupation or ""
    if occ in ("", "무직"):
        h = hashlib.md5((occ or "none").encode()).hexdigest()
        # unemployed collapse-survivors are not default patrol
        pool = ["탐사원", "물류상", "기록관", "전령", "정비사"]
        return pool[int(h[:2], 16) % len(pool)]
    if "경비" in occ:
        return "순찰대"
    for keys, live in JOB_LIVELIHOOD:
        if any(k in occ for k in keys):
            return live
    h = hashlib.md5(occ.encode()).hexdigest()
    return LIVELIHOODS[int(h[:2], 16) % len(LIVELIHOODS)]


def generation_index(age: int) -> int:
    if age >= 60:
        return 0
    if age >= 40:
        return 1
    if age >= 25:
        return 2
    return 3


def corridor_for(district: str, rng: random.Random) -> str | None:
    # Korean-script extra roster stays on 16-state books.
    # Diaspora names are seeded in Diaspora-Corridors.md, not this generator.
    return None


def military(sex: str, mil: str, age: int, rng: random.Random) -> str:
    if mil == "현역":
        return "병·부사관"
    if sex == "남자" and 20 <= age <= 45 and rng.random() < 0.55:
        return rng.choice(["병 만기", "예비군 명부", "동원 거부"])
    if sex == "남자" and age >= 46 and rng.random() < 0.35:
        return "예비군 명부"
    return "없음"


def arms(live: str, mil_hist: str, corridor: str | None) -> str:
    if mil_hist in ("병·부사관",) and live == "순찰대":
        return "제식 소화기(봉인) / 제식 봉"
    if mil_hist == "병 만기" and live in ("순찰대", "정비사"):
        return "제식 봉"
    if live == "순찰대":
        return "제식 봉·순찰 방패"
    if live == "정비사":
        return "생업 공구"
    if live == "물류상":
        return "생업 공구. 전투 아님"
    return "없음"


def compose_name(sex: str, age: int, pools: dict, used: set, rng: random.Random) -> dict:
    surnames = pools["surnames"]["surnames"]
    given = pools["given-male"]["names"] if sex == "남자" else pools["given-female"]["names"]
    clans = {c["surname"]: c for c in pools["clans"]["clans"]}
    for _ in range(24):
        sur = rng.choice(surnames)
        base = rng.choice(given)
        hang = None
        bongwan = None
        clan = clans.get(sur)
        if clan and rng.random() < float(clan.get("keepRate", 0)):
            idx = generation_index(age)
            seq = clan["hangnyeol"]
            hang = seq[min(idx, len(seq) - 1)]
            bongwan = clan["bongwan"]
            if hang == base[1:]:
                continue
            given_out = hang + base[1:]
            if len(given_out) >= 2 and given_out[0] == given_out[1]:
                continue
        else:
            given_out = base
        full = sur + given_out
        if full in used:
            continue
        used.add(full)
        return {
            "성": sur,
            "이름": given_out,
            "성명": full,
            "본관": bongwan,
            "항렬자": hang,
        }
    raise RuntimeError("name pool exhausted")


def snippet(text: str, n: int = 80) -> str:
    t = " ".join(str(text).split())
    return t if len(t) <= n else t[: n - 1] + "…"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet", required=True)
    ap.add_argument("--pools", required=True)
    ap.add_argument("--existing", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--n", type=int, default=100)
    ap.add_argument("--seed", type=int, default=90421)
    args = ap.parse_args()

    pools_dir = Path(args.pools)
    pools = {
        "surnames": json.loads((pools_dir / "surnames.json").read_text(encoding="utf-8")),
        "given-male": json.loads((pools_dir / "given-male.json").read_text(encoding="utf-8")),
        "given-female": json.loads((pools_dir / "given-female.json").read_text(encoding="utf-8")),
        "clans": json.loads((pools_dir / "clans-hangnyeol.json").read_text(encoding="utf-8")),
    }
    existing = set(json.loads(Path(args.existing).read_text(encoding="utf-8")))
    rng = random.Random(args.seed)

    table = pq.read_table(
        args.parquet,
        columns=[
            "uuid",
            "persona",
            "cultural_background",
            "occupation",
            "sex",
            "age",
            "military_status",
            "district",
            "province",
            "career_goals_and_ambitions",
            "skills_and_expertise",
        ],
    )
    rows = table.to_pylist()
    seoul = [r for r in rows if r.get("province") == "서울" and r.get("district") in DISTRICT_STATE]
    rng.shuffle(seoul)

    # quota per state and livelihood so one faction/job cannot eat the roster
    quota: dict[str, int] = Counter()
    live_quota: dict[str, int] = Counter()
    cap = max(4, args.n // 16 + 2)
    live_cap = max(10, args.n // 7 + 3)
    out = []
    used = set(existing)
    for r in seoul:
        if len(out) >= args.n:
            break
        district = r["district"]
        state, culture = DISTRICT_STATE[district]
        if quota[state] >= cap:
            continue
        sex = r["sex"]
        age = int(r["age"])
        live = livelihood(r["occupation"] or "")
        if live_quota[live] >= live_cap:
            continue
        try:
            name = compose_name(sex, age, pools, used, rng)
        except RuntimeError:
            continue
        mil = military(sex, r["military_status"] or "", age, rng)
        corr = corridor_for(district, rng)
        person = {
            "id": f"roll-{r['uuid'][:8]}",
            "source_uuid": r["uuid"],
            "성명": name["성명"],
            "성": name["성"],
            "이름": name["이름"],
            "본관": name["본관"],
            "항렬자": name["항렬자"],
            "sex": sex,
            "age": age,
            "출신 공동체": f"{district} / 한국 국적",
            "언어": "한국어",
            "생업": live,
            "소속": state if not corr else f"{state} · {corr}",
            "직위": f"{live} (개막 무명)",
            "징집 이력": mil,
            "무장 접근": arms(live, mil, corr),
            "culture_key": culture,
            "회랑": corr,
            "성격": snippet(r.get("persona") or r.get("cultural_background") or ""),
            "개인 야망": snippet(r.get("career_goals_and_ambitions") or "맡은 일을 끊기지 않게 유지한다"),
            "공포": "장부에서 이름이 지워지고 숙소가 봉인되는 것",
            "통치·교섭 방식": "자기 생업 도구가 없으면 서명을 미룬다",
            "핵심 관계": "미배정. 랜덤 롤 후 배치",
            "촉발 사건": "소속 생활권 보급이 끊기면 생업을 멈춘다",
            "occupation_src": r.get("occupation"),
            "military_src": r.get("military_status"),
        }
        out.append(person)
        quota[state] += 1
        live_quota[live] += 1

    payload = {
        "seed": args.seed,
        "n": len(out),
        "parquet": args.parquet,
        "by_state": dict(Counter(p["소속"].split(" · ")[0] for p in out)),
        "by_livelihood": dict(Counter(p["생업"] for p in out)),
        "hangnyeol_on": sum(1 for p in out if p["항렬자"]),
        "people": out,
    }
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: payload[k] for k in ("n", "by_state", "by_livelihood", "hangnyeol_on")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
