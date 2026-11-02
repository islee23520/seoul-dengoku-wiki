# UniForge3D broker contract

```ts
prepareUniForge3D(input: unknown, config: UniForge3DConfig): Promise<PreparedUniForge3D>
collectUniForge3D(prepared: PreparedUniForge3D, stdout: string): Promise<UniForge3DResult>
uniforge3dRequestSchema // strict {assetId, seed}; seed integer 0..2147483647
```

Private config maps a server-approved assetId to an ordered list of 1..16
canonical image paths. No caller paths, URLs, commands, model choice or credentials
are accepted. prepare checks file pins, cardinality and total input bytes <=128 MiB;
it does not spawn or claim decoded inputs. Both worker modes decode every image
with Pillow before source import: one frame, positive dimensions, long side <=4096.
Generation copies the pinned images in order into the fresh private job, rehashes
the copies and never modifies originals. A failed decode is a failed job.

Config supplies canonical absolute python/worker/source/model/hfHome/outputRoot,
sourceRevision/runtimeId and SHA-256 pins. Required pins cover interpreter, worker,
pipeline source, local model pipeline.json and inputs. Generation additionally
requires every source .py and every local model file to be pinned. Operators must
include native extensions, dependency locks and all auxiliary offline cache model
files in reviewed preflight pins. sourceRevision/runtimeId are preflight identities,
not independently attested claims. Restrict the root using OS ACLs; mode 0600 alone
is not a Windows ACL. Do not expose private requests or prepared values publicly.

Prepared generation/validation contain fixed executable, argv, cwd, shell:false
and a credential-free offline environment. The broker owner bridge owns spawning
inside the task13 lease's runExclusive callback, cancellation of the process tree
and waiting for exit. Service identity probe is an independent deployment gate.
WSL path/distro translation belongs to that bridge; do not spawn WSL from service.
The worker imports only the pinned local source and calls
`from_pretrained(local_model, device=0, low_vram=True, local_files_only=True)`, then
`run(images, fresh_prediction_glb, seed=seed, overwrite=False)`. Offline variables
are required. No automatic downloads, retries or existing-output skip are allowed.

After generation exit 0, run validation separately and require exit 0. Only its
stdout JSON may enter collect. CPU validation imports NumPy/Pillow/Pydantic, not
torch or UniForge. It checks freshness against request mtime; GLB magic/version/
exact length and chunk boundaries; actual bufferViews/accessors, finite float32
positions, unsigned in-range triangle indices, nondegenerate faces, finite nonzero
bounds, material/texture/image references, embedded image decode and finite UVs.
The deliberately narrow fixed-export parser accepts one embedded BIN buffer and
indexed triangles, and rejects external buffer/image URIs and required extensions.
It is not a generic glTF scene validator. Optional textures are allowed; rigging,
skeleton, animation, rendering quality and commercial-use approval are not claimed.

Parsing is capped at 1 MiB request, 4 MiB GLB JSON and 128 MiB GLB. Triangle work
is chunked. All pin/artifact digests stream in 1 MiB reads. collect binds the result
to the unchanged request hash and rehashes prediction.glb before publication.
Broker must publish verified bytes atomically and keep untrusted writers excluded.

Portable tests require Python >=3.10, Pydantic >=2,<3, NumPy >=1.24,<3 and Pillow
>=10,<13 already installed, plus normal portal npm dependencies and Bun. Set
`UNIFORGE3D_TEST_PYTHON` or use `python` from PATH. Missing dependencies fail, never
skip/install. Run only `bun test TOOL/tools-portal/test/local-ai-uniforge3d.test.ts`.
The real worker subprocess consumes tiny image/triangle GLB fixtures; no source,
models, GPU or machine-specific path is needed. Tests clean their exact mkdtemp
root in finally and print `UNIFORGE3D_CLEANUP <path>` as the cleanup receipt.
Actual GPU pipeline, peak memory and deployment remain task12/14 evidence.
