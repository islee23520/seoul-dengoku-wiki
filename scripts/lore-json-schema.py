"""Validate a lore authoring document with its Draft 2020-12 domain schema.

Usage: lore-json-schema.py <domain> <document.json>. The document is read from its path, never from standard input.
"""

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


root = Path(__file__).resolve().parent.parent / "lore"
schemas = [json.loads(path.read_text()) for path in root.rglob("authoring.schema.json")]
schemas.append(json.loads((root / "authoring.shared.schema.json").read_text()))
schemas.append(json.loads((root / "authoring.atlas.schema.json").read_text()))
registry = Registry().with_resources(
    (schema["$id"], Resource.from_contents(schema)) for schema in schemas
)
if len(sys.argv) != 3:
    print("Usage: lore-json-schema.py <domain> <document.json>", file=sys.stderr)
    sys.exit(2)
domain, document_path = sys.argv[1], sys.argv[2]
schema_path = root / ("" if domain == "root" else domain) / "authoring.schema.json"
if not schema_path.is_file():
    print(f"E_SCHEMA: unknown domain {domain}")
    sys.exit(1)
with open(document_path, encoding="utf-8") as source:
    document = json.load(source)
schema = json.loads(schema_path.read_text())
errors = sorted(Draft202012Validator(schema, registry=registry).iter_errors(document), key=lambda error: str(error.path))
for error in errors:
    field = next(iter(error.path), "")
    code = {
        "id": "E_ID", "locales": "E_LOCALE", "provenance": "E_PROVENANCE",
    }.get(field, "E_SCHEMA")
    if field == "" and error.validator == "required":
        code = next((code for key, code in (("locales", "E_LOCALE"), ("provenance", "E_PROVENANCE"), ("id", "E_ID")) if f"'{key}'" in error.message), code)
    print(f"{code}: {error.json_path}: {error.message}")
sys.exit(bool(errors))
