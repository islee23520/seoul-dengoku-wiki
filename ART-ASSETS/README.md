# ART-ASSETS

`ART-ASSETS/` is the main repository's canonical store for authored and source-bound art files that are too production-oriented to live in `GAME-REFERENCE/` and are not yet Unity runtime imports.

## Ownership boundaries

- `ART-ASSETS/`: raw/source art, editable Blender scenes, interchange exports, external textures, review renders and asset manifests.
- `TOOL/`: executable generation, repair, validation and export tooling. Tools refer to assets through manifests and do not own production binaries.
- `GAME-REFERENCE/`: frozen references, experiments and historical evidence. Candidate existence here does not promote it into the art library.
- `GAME/Assets/`: Unity runtime imports only after provenance and project import gates pass.

## Directory contract

Each asset family uses this shape:

```text
ART-ASSETS/<family>/
├── manifest.json        # portable paths, hashes, roles and approval status
├── source/              # immutable original source captures when rights/provenance permit
├── components/          # reusable editable parts
├── deliverables/        # approved editable and interchange packages
├── textures/            # canonical textures shared by deliverables
├── showcase/            # review-only comparison scenes
└── evidence/            # selected review renders and machine-readable receipts
```

Binary formats are tracked through repository Git LFS rules. Do not store virtual environments, caches, Blender backup files, temporary bakes, or failed exploratory candidates here.

## Promotion rule

Moving a file from `GAME-REFERENCE/` to `ART-ASSETS/` is an explicit promotion. It requires:

1. stable role and path;
2. SHA-256 identity in the family manifest;
3. rights/provenance status;
4. relevant geometry, UV, material and reopen checks;
5. selected visual evidence;
6. no hard failure hidden by a score.

