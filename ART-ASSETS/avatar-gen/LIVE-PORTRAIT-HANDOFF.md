# Live portrait handoff

The reviewed Three.js portrait plan is compatible with the new asset ownership model under these fixed inputs:

- canonical source: `deliverables/female-underwear.blend`
- source identity: role `female-underwear` in `manifest.json`
- reference target: `TOOL/portrait-gen/assets/v2/target.png`
- authoring output: a non-destructive derivative inside portrait-gen's ignored authoring workspace
- publishable output: self-contained static GLB, portrait manifest and verified fallback PNG only

The portrait implementation must not read the old Round2 `final-integration.blend`, publish raw `ART-ASSETS` paths through HTTP, or reinterpret the existence of six bodies as approval for a multi-avatar product surface.

## Required portrait manifest linkage

The portrait manifest records:

- repository-relative source path;
- source SHA-256 copied from the avatar asset manifest;
- derived GLB and fallback SHA-256;
- `PORTRAIT_ROOT` and `PORTRAIT_CAMERA` identities;
- fixed pose/camera contract;
- Three.js version and render settings;
- source-library schema version.

This link allows the portrait derivative to be invalidated when its accepted source changes without coupling `portrait-gen` to arbitrary repository filesystem serving.
