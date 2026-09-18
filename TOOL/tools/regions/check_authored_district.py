"""Check one writer-owned district against its actual source-bound region inputs."""

import argparse
import json
from pathlib import Path

from provenance import load
from verify_region_atlas import content_errors


def check(document, source):
    errors = []
    if document.get("schema") != "seoul-region-content.v1":
        errors.append("content_schema")
    if document.get("as_of") != source["as_of"]:
        errors.append("content_cutoff")
    if document.get("district_id") != source["district"]["id"] or document.get("district_name") != source["district"]["name"]:
        errors.append("district_identity")
    originals = {r["id"]: r for r in source["regions"]}
    seen = set()
    for row in document.get("regions", []):
        rid = row.get("region_id")
        if rid not in originals or rid in seen:
            errors.append("unknown_or_duplicate_region:" + str(rid))
            continue
        seen.add(rid)
        original = originals[rid]
        if row.get("name") != original["name"]:
            errors.append("region_name:" + rid)
        content = row.get("content")
        errors.extend(content_errors(dict(original, content=content)))
        if not isinstance(content, dict):
            continue
        for polity in content.get("polity_contexts", []):
            if polity not in {f"S{i:02d}" for i in range(1, 17)}:
                errors.append("unknown_polity:" + str(polity))
        root = Path(__file__).resolve().parents[3]
        for reference in content.get("canon_refs", []):
            path = (root / reference).resolve()
            if not path.is_relative_to(root) or not path.is_file():
                errors.append("invalid_canon_reference:" + str(reference))
    for rid in sorted(set(originals) - seen):
        errors.append("missing_region:" + rid)
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--content", required=True, type=Path)
    args = parser.parse_args()
    source, document = load(args.input), load(args.content)
    errors = check(document, source)
    print(json.dumps({"passed": not errors, "district": document.get("district_name"),
                      "regions": len(document.get("regions", [])), "errors": errors}, ensure_ascii=False))
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
