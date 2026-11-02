# UniMate broker integration

`src/local-ai-unimate.ts` exports:

```ts
prepareUniMate(input: unknown, config: UniMateConfig): Promise<PreparedUniMate>
collectUniMate(prepared: PreparedUniMate, stdout: string): Promise<UniMateResult>
unimateRequestSchema // strict {assetId, prompt, seed}; unknown keys rejected
```

The remaining exported types are `UniMateConfig`, `UniMateInvocation`,
`PreparedUniMate`, `UniMateResult`; `UniMateContractError.code` identifies adapter
contract failures. Prompt is trimmed, nonempty, at most 2000 characters and has
no NUL. Seed is an integer in 0..2147483647. No request path, shell, credentials,
model choice, rigging, or automatic LLM annotation is accepted.

The operator resolves the catalog and supplies absolute, canonical private paths.
`pins` must cover the interpreter, this worker, checkpoint, experiment config,
dataset stats, cond and canonical GLB. Supply all other preflight model/source
pins as well; task5/task15 own source revision, complete T5 cache, dependency and
license preparation. `sourceRevision` and `runtimeId` are preflight identities,
not assertions independently attested by this adapter. Use an ACL-restricted
output root; POSIX mode 0600 is not a Windows ACL. Each prepare creates a fresh
job directory with an exclusive private request and its SHA-256. Retain this
prepared value in the broker, not a caller-modifiable serialized replacement.

The prepared generation and validation invocations contain fixed executable,
argv, cwd, shell:false and a credential-free offline-only environment. They
**do not spawn**. The broker retains the process-local task13 maintenance lease
and calls `lease.runExclusive(signal => spawnPinnedWorkerSynchronously(signal))`.
Use `prepared.generation` only inside that callback, honor abort by terminating
the owned process tree (worker and sampler), and settle only after the tree exits.
Never treat a receipt, status endpoint or PID as spawn authority. The worker is
a trusted private executable, not an independently authorized GPU API.

After generation exit 0, run `prepared.validation` and require exit 0. It imports
NumPy and Pydantic, not torch or the source package. Pass
only its stdout JSON to `collectUniMate`. Generator stdout/stderr are not receipts;
broker logging must be bounded and private. The worker invokes the real pinned
module with one asset/prompt, explicit checkpoint, batch/repetitions 1, seed and
`--only_save_motion`. An existing samples directory fails before sampler import.
The broker must not retry an interrupted or uncertain generation automatically.

Pin digests use bounded 1 MiB streaming reads in both languages, including large
checkpoint and T5 files. Artifact digests also stream; the worker caps the
manifest at 1 MiB and motion NPY at 128 MiB before parsing.

The CPU validator rechecks dependency hashes and the prepared cond's joint order
and upstream frame digest algorithm (SHA-1 over names, int64 parents and rounded
float64 canonical arrays with signed zero folded). The upstream `unimate-samples/1` manifest must bind
exactly one run/sample/asset to checkpoint, exp_dir, seed, text mode, prompt,
cond path/key, canonical GLB, joint order and frame digest. The primary motion
must be a fresh non-pickled floating NPY with `(frames,joints,features)`, frames>1,
expected joint and feature counts, all finite values and temporal variation>0.
The collector binds validator stdout to the unchanged private request and
rehashes the manifest and NPY before publication. Copy verified bytes to the
job store atomically; no unrelated exporter output is approved by this contract.
Neither motion quality nor commercial use nor GLB/FBX animation is approved.

Prepared task15 input: `unimate-example-eagle` ->
`<private-data-root>/examples/eagle`, cond key `Eagle`, 51 joints. The v3
config's `dataset.feature_len` is 12, not the legacy v2 assumption 22. Obtain
`jointNames` and `frameDigest` from the pinned cond using upstream
`data_process.utils.asset_files.cond_frame_digest` during private catalog setup.
Interpreter: `<private-runtime-root>/python` (platform-specific executable);
source: `<private-source-root>`; v3 experiment:
`<private-model-root>/unimate_uniml3d_f60_v3`. Configure `hfHome` to the
already prepared offline cache, not an empty cache or automatic download path.

Mandatory portable tests require Python >=3.10 with NumPy >=1.24,<3 and Pydantic
>=2.0,<3 installed in that interpreter, plus the portal's normal npm dependencies
and Bun. They use `UNIMATE_TEST_PYTHON` when set, otherwise `python` from PATH;
missing dependencies fail explicitly, with no skip or download. Example invocation:
`UNIMATE_TEST_PYTHON=<private-test-python> bun test TOOL/tools-portal/test/local-ai-unimate.test.ts`.
The fixtures create their own 51-joint cond, canonical placeholder and tiny
NPY/manifest; no UniMate checkout, model cache, Eagle download or GPU is needed.
They exercise the actual worker and output parser; only model/config/stats pins
are synthetic because CPU validation never loads them. Temp roots are removed
in finally. The machine-specific task15 prepared-asset/GPU invocation is a
separate broker integration run owned by task12, using private config and the
same exported signatures; it is not a mandatory full-suite prerequisite.
Actual broker cancellation/OS exclusion remains task13's responsibility.
