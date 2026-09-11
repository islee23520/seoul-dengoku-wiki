#!/usr/bin/env python3
"""Validate this proposal packet, not game behavior or narrative quality.

Default mode checks real files in a complete checkout. --source-index supports
an isolated document snapshot; indexed link targets are metadata-checked only.
"""
from __future__ import annotations

import argparse
import json
import re
import tempfile
from pathlib import Path
from urllib.parse import unquote, urlsplit

BASE = "4c2f8ecec47e27ddf13c70e412188f92a07a8663"
STATUS = "상태: 제안, 미구현, 플레이테스트 미실시."
REQUIRED = {
    "docs/proposals/Narrative-Direction.md": [
        "## 1. 이번 문서의 권한과 범위", "## 2. 중심 방향",
        "## 3. 담당 기여와 책임 경계", "## 8. 경험 검증",
        "## 9. 요청하는 검토 결정",
    ],
    "docs/proposals/Scenario-Hold-the-Gate.md": [
        "## 2. 배역과 충돌", "## 3. 공간과 사전 정보",
        "## 5. 귀환 사건의 발생 조건", "## 7. 성공, 실패, 부재와 비개입",
        "## 8. 상태와 정산 연결", "## 9. 기존 기반과 추가 구현",
        "## 10. 최소 검증과 보류 기준",
    ],
}
LINK = re.compile(r"\[[^\]\n]+\]\(([^)\s]+)\)")


def validate(root: Path, indexed: set[str]) -> list[str]:
    """Return failures for the packet's supported simple Markdown syntax."""
    errors: list[str] = []
    root = root.resolve()
    for rel, headings in REQUIRED.items():
        path = root / rel
        if not path.is_file():
            errors.append(f"{rel}: missing document")
            continue
        try:
            raw = path.read_bytes()
            text = raw.decode("utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"{rel}: unreadable UTF-8: {exc}")
            continue
        if not raw.endswith(b"\n") or b"\r" in raw or b"\x00" in raw:
            errors.append(f"{rel}: invalid newline or NUL")
        lines = text.splitlines()
        if STATUS not in lines or BASE not in text:
            errors.append(f"{rel}: missing proposal status or baseline")
        if sum(line.startswith("# ") for line in lines) != 1:
            errors.append(f"{rel}: expected one document title")
        for heading in headings:
            if heading not in lines:
                errors.append(f"{rel}: missing heading {heading}")
        for number, line in enumerate(lines, 1):
            if line != line.rstrip() or "\t" in line:
                errors.append(f"{rel}:{number}: whitespace")
            if re.match(r"^(<{7}|={7}|>{7})( |$)", line):
                errors.append(f"{rel}:{number}: conflict marker")
        for target in LINK.findall(text):
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc:
                if parsed.scheme != "https" or parsed.netloc != "github.com":
                    errors.append(f"{rel}: unsupported external link {target}")
                continue
            if not parsed.path or parsed.fragment or parsed.query:
                errors.append(f"{rel}: unsupported local link {target}")
                continue
            resolved = (path.parent / unquote(parsed.path)).resolve()
            try:
                key = resolved.relative_to(root).as_posix()
            except ValueError:
                errors.append(f"{rel}: link escapes root {target}")
                continue
            if not resolved.is_file() and key not in indexed:
                errors.append(f"{rel}: broken link {target}")
    return errors


def load_index(path: Path | None) -> set[str]:
    if path is None:
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("repository") != "islee23520/seoul-kenshi" or data.get("base_commit") != BASE:
        raise ValueError("source index identity mismatch")
    entries = data.get("files", {})
    if not isinstance(entries, dict) or not entries:
        raise ValueError("source index must contain file metadata")
    for rel, sha in entries.items():
        if Path(rel).is_absolute() or ".." in Path(rel).parts or not re.fullmatch(r"[0-9a-f]{40}", sha):
            raise ValueError(f"invalid source-index entry: {rel}")
    return set(entries)


def self_test() -> None:
    """Test validation failures using explicitly synthetic temporary fixtures."""
    with tempfile.TemporaryDirectory(prefix="narrative-doc-test-") as tmp:
        root = Path(tmp)
        for rel, headings in REQUIRED.items():
            path = root / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("\n".join(["# Fixture", STATUS, BASE, *headings, ""]), encoding="utf-8")
        if validate(root, set()):
            raise AssertionError("valid fixture rejected")
        path = root / next(iter(REQUIRED))
        original = path.read_text(encoding="utf-8")
        mutations = {
            "missing-status": original.replace(STATUS, ""),
            "broken-link": original + "[missing](Missing.md)\n",
            "path-escape": original + "[outside](../../../outside.md)\n",
            "missing-heading": original.replace(REQUIRED[next(iter(REQUIRED))][0], ""),
        }
        for name, changed in mutations.items():
            path.write_text(changed, encoding="utf-8")
            if not validate(root, set()):
                raise AssertionError(f"mutation accepted: {name}")
            path.write_text(original, encoding="utf-8")
        path.unlink()
        if not validate(root, set()):
            raise AssertionError("missing document accepted")
    print("PASS self-test: positive fixture + 5 rejected mutations")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument("--source-index", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        if args.self_test:
            self_test()
            return 0
        indexed = load_index(args.source_index)
        errors = validate(args.root, indexed)
    except (OSError, ValueError, TypeError, AssertionError) as exc:
        print(f"FAIL: {exc}")
        return 1
    if errors:
        print("\n".join(f"FAIL: {error}" for error in errors))
        return 1
    mode = "snapshot + supplied remote path index" if args.source_index else "local filesystem"
    print(f"PASS: {len(REQUIRED)} proposal documents; link mode: {mode}")
    if args.source_index:
        print("LIMIT: indexed targets were not read or built by this command")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
