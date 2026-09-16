#!/usr/bin/env python3
"""혈연 간선으로 세수를 계산하고 항렬자를 이름에 적용한다."""

from __future__ import annotations


def derive_sesu(person_id: str, parents: dict[str, str], founder_sesu: dict[str, int]) -> int:
    """부모 간선만 따라 세수를 구한다. 나이·직업·성별은 입력받지 않는다."""
    seen: set[str] = set()
    current = person_id
    depth = 0
    while current not in founder_sesu:
        if current in seen:
            raise ValueError(f"lineage cycle at {current}")
        seen.add(current)
        parent = parents.get(current)
        if parent is None:
            raise ValueError(f"no founder path for {person_id}")
        current = parent
        depth += 1
    return founder_sesu[current] + depth


def apply_hangnyeol(given_name: str, character: str, position: str) -> str:
    if len(given_name) < 2:
        raise ValueError("hangnyeol requires a two-syllable given name")
    if len(character) != 1:
        raise ValueError("hangnyeol character must be one syllable")
    if position == "first":
        return character + given_name[1:]
    if position == "second":
        return given_name[0] + character + given_name[2:]
    raise ValueError(f"unknown hangnyeol position: {position}")


def select_hangnyeol(
    person_id: str,
    clan: dict,
    parents: dict[str, str],
    founder_sesu: dict[str, int],
) -> dict | None:
    if person_id not in parents:
        return None
    sesu = derive_sesu(person_id, parents, founder_sesu)
    for row in clan.get("rows", []):
        if int(row["sesu"]) == sesu:
            return {
                "sesu": sesu,
                "hangnyeol": row["hangnyeol"],
                "position": row["position"],
            }
    return None


def lineage_clan_id(person_id: str, lineage: dict) -> str | None:
    """가계가 명시한 문중만 반환한다. 성씨나 이름에서 문중을 추측하지 않는다."""
    return lineage.get("person_clan", {}).get(person_id)


def normalize_lineage_document(document: dict) -> dict:
    """순수 lineage JSON과 cast-hangnyeol 적용표를 같은 생성기 입력으로 만든다."""
    if "lineage" not in document:
        return document
    lineage = dict(document["lineage"])
    person_clan = dict(lineage.get("person_clan", {}))
    for person in document.get("people", []):
        if person.get("status") == "applied" and person.get("clan"):
            person_clan[person["name"]] = person["clan"]
    lineage["person_clan"] = person_clan
    return lineage
