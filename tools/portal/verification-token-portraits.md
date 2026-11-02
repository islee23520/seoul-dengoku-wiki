# Token-only portraits and bounded output verification

Implemented on the shared checkout; not deployed or committed.

- Wiki detail and exact authored token bytes are fetched from the established
  `person-details/` and `portrait-tokens/` endpoints. Person ID, character ID and
  name are checked. Original-photo registration remains strict.
- Single and batch portrait generation support an absent identity photo with
  explicit null image provenance. Technique and framing references remain;
  no replacement person's face is supplied.
- Delivered portrait PNGs are 340x510 RGBA (2:3, both dimensions below 512).
  Provider requests remain 1024x1536; original provider bytes and canonical
  receipts are retained separately. Downsampling uses premultiplied alpha and
  records source/output hashes. Historical full-size results remain readable.
- Final related run: 157 tests passed, 0 failed, 1732 assertions across 12 files.
  Log: `/tmp/portal-pass.log`. Production build exited 0. Scoped Biome check
  passed 15 files; `git diff --check` passed. Source LSP diagnostics were clean.
- Package typecheck remains blocked by pre-existing errors in
  `test/personal-access.test.ts:56` and `:894`. Full-suite exploration also
  encountered unrelated supervisor and workstation timeouts; these were not
  weakened or edited. Relevant changed paths passed the final run above.
- Aside desktop QA at 1440x900 confirmed token-only eligibility, the absent-photo
  notice, and 340x510 label, with no document or main-container horizontal
  overflow. Mobile QA was unavailable: the installed Aside wrapper exposes no
  supported viewport sizing or live CDP session. No CSS fake viewport was used.
- Recent production job `19eeb3fe-330c-449e-9ef2-19d48ae3a0b9` (이연) failed
  with `LOCAL_HTTP_FAILURE`: stored provider response HTTP 401, 27 bytes,
  `{"error":"Invalid API key"}`. No PNG was returned and no retry was made.

No paid generation, production deployment, credential change, or commit was
performed for this request. Existing person-1017 image/review deletions and other
shared changes were preserved.
