# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Verify copied source bytes without altering Downloads or archived inputs."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'reports/source-manifest.json').read_text())
rows = []
failures = []
for entry in manifest['files']:
    source = Path(entry['source'])
    copied = ROOT / 'sources/originals' / entry['name']
    row = {'name': entry['name'], 'source': str(source), 'copy': str(copied)}
    for label, path in [('source', source), ('copy', copied)]:
        if not path.is_file():
            failures.append(f'MISSING: {path}')
            row[label + '_sha256'] = None
        else:
            row[label + '_sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    row['matches_manifest'] = row['source_sha256'] == row['copy_sha256'] == entry['sha256']
    if not row['matches_manifest']:
        failures.append(f'HASH_MISMATCH: {entry["name"]}')
    rows.append(row)
members = []
for archive in manifest['archives']:
    for entry in archive['entries']:
        copied = ROOT / 'sources/extracted' / archive['name'].removesuffix('.zip') / entry['member']
        digest = hashlib.sha256(copied.read_bytes()).hexdigest() if copied.is_file() else None
        members.append({'path': str(copied), 'sha256': digest, 'matches_manifest': digest == entry['sha256']})
        if digest != entry['sha256']:
            failures.append(f'EXTRACTED_MISMATCH: {copied}')
known = {entry['name'] for entry in manifest['files']}
extra = sorted(p.name for p in Path('/Users/danny/Downloads').iterdir() if '3d model' in p.name and p.suffix.lower() in {'.zip', '.glb', '.fbx'} and p.name not in known)
report = {'ok': not failures, 'original_count': len(rows), 'archive_count': len(manifest['archives']), 'extracted_member_count': len(members), 'files': rows, 'members': members, 'new_model_candidates': extra, 'failures': failures, 'source_files_modified': False}
(ROOT / 'reports/migrated-source-verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps({key: report[key] for key in ['ok', 'original_count', 'archive_count', 'extracted_member_count', 'new_model_candidates', 'failures']}))
raise SystemExit(0 if report['ok'] else 2)
