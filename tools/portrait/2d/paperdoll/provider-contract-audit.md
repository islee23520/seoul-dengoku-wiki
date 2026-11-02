# Existing intermediary audit: bounded findings

No provider request or remote probe made by this worker. Configured resolver
targets HTTP100.77.98.25:8317/v1, openai-compatible, modelgpt-image-2.5-sunburst.
Credential values were neither printed nor retained. Local listener/process and
focused installation inventory found no serving proxy source/package. Endpoint
is remote to this workstation; its forwarding implementation is inaccessible in
the inspected local scope. Whether it forwards mask/customsize unchanged or
normalizes downstream remains unknown. Client resolver performs no image resize.

Actual sent multipart implementation uses image[] file parts, registered master
first and original second, plus actual mask PNG file under mask, model, n=1,
size832x1136, transparent background and png output. Local captured multipart
tests prove exact bytes/count/mask locally, not production forwarding upstream.
No production wire capture exists. Mask-alpha semantics are a request contract,
not proof that this intermediary/model enforces hard protected-pixel preservation.

Returned HTTP200 metadata and actual native PNG both1073x1465. Model identifier
was absent. Alpha counts:595636zero,1071opaque,975238partial. Requested832x1136
versus returned canvas suggests near-uniform1.2896output scaling, but root's
actual input-matched-head comparison disproves resize-only explanation:

- Returned-to-input head fit scale0.784803095, translation(-2.63848435,43.76650722),
  RMS7.5651. Root viewed returned-input-matched-head-comparison.png.
- Mapped body bottom1145.630 versus target952: extra193.630pixels.
- Below-head extension/eye-chin1.8421 versus target1.05295.

Thus body/framing changed beyond global canvas resampling. No failed output was
normalized into approval. The legacy three-reference prefix was a confirmed
client prompt bug and is fixed. A second original portrait influencing framing is
only a hypothesis, not an established root cause; remote mask/size behavior is
also unproven. No additional retries authorized by this audit.

Next prepared attempt removes original upload (still bound in receipt), uses one
registered master and actual mask, explicit upper-bust cutoff/no extra torso/no
hair restyle. Strict custom-size validation remains. Root chooses after evidence;
no POST until directed. Existing failed claim/native/response stay immutable.
