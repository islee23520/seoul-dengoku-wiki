"""원본의 manifest 표현식만 실행한다. Unity 파일 작성 경로는 실행하지 않는다."""
import ast
import importlib.util
import json
import tempfile
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path

SOURCE = Path(__file__).with_name("original-builder.py")
spec = importlib.util.spec_from_file_location("original_builder", SOURCE)
assert spec is not None and spec.loader is not None
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
digest = sha256()
for character in builder.CHARACTERS:
    frames = {}
    for facing in builder.FACINGS:
        for action, count in builder.ACTIONS.items():
            for frame in range(count):
                image = builder.draw_character(character, facing, action, frame)
                frames[(facing, action, frame)] = image
                digest.update(image.tobytes())
    digest.update(builder.identity_sheet(character, frames).tobytes())
    digest.update(builder.atlas_image(frames).tobytes())
print("ORIGINAL_GEOMETRY_SHA256", digest.hexdigest(), flush=True)
tree = ast.parse(SOURCE.read_text())
emission = next(node for node in ast.walk(tree)
                if isinstance(node, ast.Expr) and isinstance(node.value, ast.Call)
                and isinstance(node.value.func, ast.Attribute)
                and isinstance(node.value.func.value, ast.Name)
                and node.value.func.value.id == "bom_assets"
                and node.value.func.attr == "append")
with tempfile.TemporaryDirectory(prefix="character-manifest-red-", dir=SOURCE.parent) as temporary:
    root = Path(temporary)
    context = dict(vars(builder))
    context.update(ROOT=root, bom_assets=[], asset_id="poc-explorer",
                   character=builder.CHARACTERS[0], prompt="poc-explorer",
                   prompt_hash=sha256(b"poc-explorer").hexdigest(),
                   identity_hash=sha256(b"identity-fixture").hexdigest(),
                   atlas_hash=sha256(b"atlas-fixture").hexdigest(),
                   side=builder.side_map(builder.CHARACTERS[0]),
                   fallback={"fallback_reason": "meshgen_6cell_no_passing_geometry"},
                   prefab=root / "Game/Assets/Janseon/Art/Characters/poc-explorer.prefab")
    exec(compile(ast.Module(body=[emission], type_ignores=[]), str(SOURCE), "exec"), context)
    path = root / "manifest.json"
    path.write_text(json.dumps(context["bom_assets"], indent=2))
    manifest = json.loads(path.read_text())
    print(json.dumps(manifest, indent=2), flush=True)
    assert sorted(p.name for p in root.iterdir()) == ["manifest.json"]
    try:
        assert manifest[0]["rights_status"] == "unknown", "local assembly fabricated rights: allowed"
    finally:
        print("cleanup: TemporaryDirectory removes isolated manifest; no Unity files authored", flush=True)
