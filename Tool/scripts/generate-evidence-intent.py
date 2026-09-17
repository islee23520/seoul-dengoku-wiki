#!/usr/bin/env python3
"""
Generate INTENT.md for a new evidence folder.

Usage: python3 generate-evidence-intent.py <folder-path> --goal "<goal text>" [--attempted "<text>"] [--contract "<ref>"] [--verdict "<status>"]
"""
import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Generate INTENT.md for evidence folder")
    parser.add_argument("folder_path", type=Path, help="Path to the evidence folder")
    parser.add_argument("--goal", required=True, help="Goal text (Korean recommended)")
    parser.add_argument("--attempted", default="TBD — fill in when evidence is evaluated", help="Attempted description")
    parser.add_argument("--contract", default="historical/exploratory — no current contract", help="Contract reference")
    parser.add_argument("--verdict", default="no formal evaluation recorded", help="Verdict pointer")
    args = parser.parse_args()

    folder = args.folder_path
    if not folder.is_dir():
        print(f"Error: {folder} is not a directory", file=sys.stderr)
        sys.exit(1)

    intent_path = folder / "INTENT.md"
    name = folder.name

    content = f"""# Evidence Intent: {name}

## Goal (무엇을 시도했나)
{args.goal}

## Attempted (실제로 한 일)
{args.attempted}

## Contract Reference
{args.contract}

## Verdict Pointer
{args.verdict}
"""

    intent_path.write_text(content, encoding="utf-8")
    print(f"Created {intent_path}")
    sys.exit(0)

if __name__ == "__main__":
    main()
