#!/usr/bin/env python3
"""센서스 인구 가중으로 한자 성씨 변형과 대표 본관을 결정적으로 고른다."""

from __future__ import annotations

import hashlib


def surname_rows_by_hangul(rows: list[dict]) -> dict[str, list[dict]]:
    result: dict[str, list[dict]] = {}
    for row in rows:
        result.setdefault(row["hangul"], []).append(row)
    return result


def _stable_pick(key: str, weighted: list[tuple[dict, int]]) -> dict:
    total = sum(max(0, weight) for _, weight in weighted)
    if total <= 0:
        return weighted[0][0]
    point = int(hashlib.sha256(key.encode("utf-8")).hexdigest(), 16) % total
    for item, weight in weighted:
        point -= max(0, weight)
        if point < 0:
            return item
    return weighted[-1][0]


def assign_bongwan(name: str, surname_rows: list[dict]) -> dict | None:
    """같은 한글 성씨의 한자 변형을 2015 인구로 가중 선택한다."""
    candidates = [row for row in surname_rows if row.get("bongwan")]
    if not candidates:
        return None
    surname = _stable_pick(
        f"surname:{name}",
        [(row, int(row.get("population_2015") or 0)) for row in candidates],
    )
    majority = [row for row in surname["bongwan"] if row.get("majority")]
    pool = majority or surname["bongwan"]
    bongwan = _stable_pick(f"bongwan:{name}", [(row, 1) for row in pool])
    return {
        "surname_hanja": surname.get("hanja"),
        "bongwan": bongwan["name"],
        "bongwan_hanja": bongwan.get("hanja"),
    }


def clan_identity(bongwan: str, surname_rows: list[dict]) -> dict | None:
    """지정 문중 본관과 일치하는 센서스 행에서 성·본관 한자를 찾는다."""
    candidates = []
    for surname in surname_rows:
        for row in surname.get("bongwan", []):
            if row.get("name") == bongwan:
                candidates.append((surname, row))
    if not candidates:
        return None
    surname, row = max(candidates, key=lambda pair: int(pair[0].get("population_2015") or 0))
    return {
        "surname_hanja": surname.get("hanja"),
        "bongwan": row["name"],
        "bongwan_hanja": row.get("hanja"),
    }
