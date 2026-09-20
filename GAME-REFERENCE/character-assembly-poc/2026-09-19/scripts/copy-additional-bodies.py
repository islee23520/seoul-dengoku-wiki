# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Preserve additional body source pairs with collision-safe copying and hashes."""
import hashlib
import json
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path('/Users/danny/Downloads')
batch = ROOT / 'sources' / ('additional-bodies-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
assert not batch.exists()
models = sorted(p for p in DOWNLOADS.iterdir() if p.is_file() and p.suffix.lower() in {'.glb', '.fbx'})
manifest = json.loads((ROOT / 'reports/source-manifest.json').read_text())
known = {row['name']: row['sha256'] for row in manifest['files']}
digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
new_models = [p for p in models if p.name not in known or digest(p) != known[p.name]]
inputs = set(new_models)
for model in new_models:
    archive = model.with_suffix('.zip')
    if archive.is_file():
        inputs.add(archive)
batch.mkdir(parents=True)
rows, archives = [], []
for source in sorted(inputs):
    destination = batch / 'originals' / source.name
    destination.parent.mkdir(parents=True, exist_ok=True)
    assert not destination.exists()
    sha = digest(source)
    shutil.copy2(source, destination)
    assert digest(destination) == sha
    rows.append({'name': source.name, 'source': str(source), 'copy': str(destination), 'bytes': source.stat().st_size, 'sha256': sha, 'verified': True})
    if source.suffix.lower() == '.zip':
        extracted = batch / 'extracted' / source.stem
        members = []
        with zipfile.ZipFile(destination) as archive:
            for info in archive.infolist():
                target = (extracted / info.filename).resolve()
                assert target.is_relative_to(extracted.resolve()), info.filename
                assert (info.external_attr >> 16) & 0o170000 != 0o120000, 'Symlink in archive'
                if info.is_dir():
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                assert not target.exists()
                payload = archive.read(info)
                with target.open('xb') as output:
                    output.write(payload)
                member_sha = hashlib.sha256(payload).hexdigest()
                assert digest(target) == member_sha
                members.append({'member': info.filename, 'path': str(target), 'bytes': len(payload), 'sha256': member_sha})
        archives.append({'name': source.name, 'members': members})
report = {'batch': str(batch), 'copied_files': len(rows), 'glb_count': sum(p.suffix.lower() == '.glb' for p in new_models), 'loose_fbx_count': sum(p.suffix.lower() == '.fbx' for p in new_models), 'zip_count': len(archives), 'extracted_fbx_count': sum(m['path'].lower().endswith('.fbx') for a in archives for m in a['members']), 'files': rows, 'archives': archives, 'existing_sources_overwritten': False, 'downloads_modified': False}
(batch / 'manifest.json').write_text(json.dumps(report, indent=2))
(ROOT / 'reports/additional-bodies-copy.json').write_text(json.dumps(report, indent=2))
print(json.dumps({k: v for k, v in report.items() if k not in {'files', 'archives'}}))
