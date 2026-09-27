"""Validate a lore authoring document with its Draft 2020-12 domain schema."""

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
domain = sys.argv[1]
schema_path = root / ("" if domain == "root" else domain) / "authoring.schema.json"
if not schema_path.is_file():
    print(f"E_SCHEMA: unknown domain {domain}")
    sys.exit(1)
document = json.load(sys.stdin)
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
