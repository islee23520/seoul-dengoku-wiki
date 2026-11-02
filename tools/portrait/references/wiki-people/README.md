# Git-backed wiki portrait references

Canonical sources: https://github.com/islee23520/seoul-dengoku-wiki.git

`manifest.json` pins commit `28f940c8b3c7ed6078b4d2c633527078f6bf437b`, which reproduces all 24 captured portraits, design tokens, and historical review receipts byte for byte. The pin deliberately preserves the captured reference set rather than silently following changes on `main`.

The source files live under `public/portraits/`, `public/portrait-tokens/`, and `public/portrait-reviews/` in the wiki repository. PNGs are retrieved through GitHub's LFS media endpoint; JSON comes from the commit-pinned raw endpoint. Every downloaded and cached file is SHA-256 checked before use. Downloads have a 30-second timeout; HTTP or hash failures stop selection without accepting replacement bytes.

Only tools-owned metadata is tracked here:

- `manifest.json`: permanent person/character IDs, source repository paths, revision, hashes, dimensions, capture provenance, and unchanged approval states.
- `styles/`: local technique-only configurations bound to the exact source PNG hashes.
- `source22-observations.json`: historical face/eye/gaze observations and uncertainty, including K1017/K1019 exclusions and K1005's distinct role hashes. Image references are commit-pinned remote URLs.

Source bytes are materialized on demand outside the repository at `${XDG_CACHE_HOME:-~/.cache}/seoul-dengoku-tools/wiki-people/<revision>/`. Valid cached files work offline; the first selection requires network access. A corrupted cache fails closed; remove the affected cache file to fetch it again. No sibling wiki checkout, submodule, or machine-specific source path is required.

From the repository root:

```bash
node TOOL/avatar-gen/portrait/bin/wiki-portrait-reference.mjs list
node TOOL/avatar-gen/portrait/bin/wiki-portrait-reference.mjs person-1003
```

Listing uses only the tracked manifest. Selecting a person verifies image, token, and review bytes and builds a real portrait prompt preview without a provider call. The original token is preserved separately from the generator-schema projection. Identity references belong only to their selected person; style configurations are technique-only. Collection and preview do not approve canon or infer missing appearance fields. Keep generated outputs outside this reference metadata directory.
