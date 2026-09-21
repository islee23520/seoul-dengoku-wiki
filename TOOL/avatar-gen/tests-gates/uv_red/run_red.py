# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy==1.26.4", "pytest"]
# ///
"""Replay captured history or run the corrected regression seam."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import argparse
from datetime import UTC, datetime
from pathlib import Path
from typing import Final

TEST_ROOT: Final = Path(__file__).resolve().parent
WORKTREE: Final = TEST_ROOT.parents[3]
EVIDENCE_ROOT: Final = WORKTREE / "evidence/uv-red"
GREEN_ROOT: Final = TEST_ROOT.parents[1] / "evidence/uv-green"
ARCHIVE: Final = Path(os.environ["AVATAR_GEN_ROUND1_ARCHIVE"])
SOURCE_PATHS: Final = (
    ARCHIVE / "scripts/uv_overlap_audit.py",
    ARCHIVE / "scripts/unwrap_female_uv2.py",
    ARCHIVE / "scripts/retry_male_uv.py",
    ARCHIVE / "review/package_blends.py",
)
FIXTURE_IDS: Final = (
    "clean-edge-contact-and-disjoint",
    "malformed-triangle-shape",
    "dict-positive-overlap",
    "nonfinite-uv",
    "degenerate-uv",
    "adjacent-positive-area-fold",
    "concave-arrow-five-vertex",
)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()



def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--historical-replay", action="store_true")
    arguments = parser.parse_args()
    if arguments.historical_replay:
        manifest_path = EVIDENCE_ROOT / "red-evidence.json"
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        unchanged = all(
            _sha256(Path(item["path"])) == item["sha256_after"]
            for item in manifest["source_provenance"]
        )
        print(
            json.dumps(
                {
                    "mode": "historical-replay",
                    "captured_exit_code": manifest["exit_code"],
                    "captured_failures": manifest["expected_distinct_failures"],
                    "archived_sources_unchanged": unchanged,
                    "transcript": manifest["transcript"]["path"],
                }
            )
        )
        return 0 if unchanged and manifest["exit_code"] != 0 else 1

    GREEN_ROOT.mkdir(parents=True, exist_ok=True)
    command = [
        sys.executable,
        "-m",
        "pytest",
        str(TEST_ROOT / "test_round1_uv_false_approval_red.py"),
        "-q",
    ]
    environment = os.environ.copy()
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    completed = subprocess.run(
        command,
        cwd=WORKTREE,
        capture_output=True,
        text=True,
        timeout=180,
        check=False,
        env=environment,
    )
    transcript_path = GREEN_ROOT / "adapted-red-green.txt"
    transcript_path.write_text(completed.stdout + completed.stderr, encoding="utf-8")
    print(
        json.dumps(
            {
                "mode": "corrected-seam",
                "captured_at_utc": datetime.now(UTC).isoformat(),
                "exit_code": completed.returncode,
                "transcript": str(transcript_path),
            }
        )
    )
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
