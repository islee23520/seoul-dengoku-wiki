"""Validate a lore authoring document with its Draft 2020-12 domain schema.

Usage: lore-json-schema.py <domain> <document.json | --stdin>.
Logical repository documents come from the canonical DB; explicit fixtures may be files.
"""

import json
import subprocess
import sys
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


root = Path(__file__).resolve().parent
schemas_by_path = json.loads(subprocess.check_output(
    ["node", str(root / "cast-sqlite" / "authoring-schema-documents.mjs")],
    text=True,
))
schemas = [schema for path, schema in schemas_by_path.items()
           if not path.endswith("Naming-Ledger.schema.json")]
registry = Registry().with_resources(
    (schema["$id"], Resource.from_contents(schema)) for schema in schemas
)
if len(sys.argv) != 3:
    print("Usage: lore-json-schema.py <domain> <document.json>", file=sys.stderr)
    sys.exit(2)
domain, document_path = sys.argv[1], sys.argv[2]
schema_path = "lore/" + ("" if domain == "root" else domain + "/") + "authoring.schema.json"
if schema_path not in schemas_by_path:
    print(f"E_SCHEMA: unknown domain {domain}")
    sys.exit(1)
if document_path == "--stdin":
    document = json.load(sys.stdin)
else:
    path = Path(document_path).resolve()
    repository = root.parent
    if path.is_relative_to(repository / "lore"):
        logical_path = path.relative_to(repository).as_posix()
        document = json.loads(subprocess.check_output([
            "node", "--input-type=module", "-e",
            "import { readCanonicalDocument } from "
            + json.dumps((root / "cast-sqlite" / "canonical-document.mjs").as_uri())
            + "; process.stdout.write(JSON.stringify(readCanonicalDocument(process.argv[1])));",
            logical_path,
        ], text=True))
    else:
        with open(path, encoding="utf-8") as source:
            document = json.load(source)
schema = schemas_by_path[schema_path]
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
