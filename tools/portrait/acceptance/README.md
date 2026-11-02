# Portrait acceptance evaluator

This directory contains a TypeScript acceptance evaluator and CLI for internal testing. It is not a release approval system, and it does not grant owner approval. Operators must independently supply and verify the profile SHA-256 and position-reference authority; the candidate image or its review cannot select its own pins. The package is private and is installed from the authorized internal workspace/binary distribution, not from a public npm tarball.

## CLI

From this directory, build the TypeScript project before invoking the emitted CLI:

```sh
npm run build
node dist/cli.js --help
```

The installed executable is private and not yet distributed: distribution remains pending. Once installed in an authorized internal operator environment, invoke its absolute path rather than relying on a public npm tarball:

```sh
/path/to/portrait-acceptance --help
/path/to/portrait-acceptance \
  /path/to/candidate.png /path/to/review.json \
  /path/to/profile.json /path/to/measurement.json \
  --character K001 --request req-2026-001 \
  --profile-sha <operator-supplied-profile-sha256> \
  --position-reference /path/to/operator-supplied-authority.json
```

The CLI accepts an image, an exact-image review JSON file, a proportion profile, and a measurement JSON file. Identity must be provided explicitly, either as `--character <id> --request <requestId>` or via `--terminal <terminal.json>`. The operator supplies and verifies the `--profile-sha` value and `--position-reference` authority independently; neither is selected from the candidate or review. The CLI emits a JSON verdict; malformed input, missing pins, mismatches, or failed criteria produce a nonzero exit and hold acceptance.

Run `node dist/cli.js --help` for the authoritative positional syntax and option spelling. The CLI does not infer identity from the review document.

## Review and evidence

The review uses schema `portrait-integrated-acceptance.v1` and binds `characterId`, `requestId`, the exact image SHA-256, `actualImageViewed: true`, and `technicalVerdict: "pass"`. Its `criteria` map must contain Q01–Q10 and the semantic assertions `authoredIdentity`, `approvedPositionIntervals`, `opaqueInterior`, `naturalSilhouette`, and `defringe`. Each row is an independently emitted whole-image pass bound to the same image SHA, with an `evidenceSHA` field. The evaluator consumes all 15 emitted rows and does not own or independently establish their truth; these claims may overlap and are not 15 independent measurements.

These are operator-supplied reviewer assertions, not automated recognition. The CLI requires one or more evidence entries containing a relative `path` and `sha256`; it reads each file relative to the review JSON, rejects paths escaping that directory, and verifies each file's SHA-256 against the listed digest. This establishes byte integrity, not the truth or semantic content of a review. Identity binding does not measure placement. The independent position-measurement producer emits all twelve position metrics: `chinY`, `crownY`, `headLeft`, `headRight`, `leftPupilX`, `leftPupilY`, `rightPupilX`, `rightPupilY`, `eyeY`, `topGap`, `headCenterX`, and `headCenterY`. Its position-reference authority is limited to `POSITION_CRITERION_ONLY_NOT_COMBINED_FRAME`; `wholeFramePassAuthority:false` means no whole-frame pass is claimed. The evaluator binds the emitted position-reference version, reference SHA-256, and rule SHA-256 to the independently supplied authority file; this is identity binding, not independent measurement. The profile and measurement artifacts support proportion verification separately.

The proportion profile owns these nine metrics: `headWidth`, `headHeight`, `faceWidth`, `faceHeight`, `eyeY`, `headCenterX`, `crownY`, `shoulderToHead`, and `torsoToHead`. The shared metric names are exactly `crownY`, `eyeY`, and `headCenterX`: the proportion profile owns their measured pixel values and tolerances, while position-reference v2 owns their exact rational interval authority. They remain separate outputs; the evaluator does not convert one representation into the other. These twelve position metrics overlap semantically with profile metrics only at those three names.

The evaluator checks the image dimensions and RGBA channels, requires at least one fully transparent pixel and a nonempty foreground, and checks core-alpha fraction, review bindings, and source-bound measured proportions. The fully transparent-pixel check does not establish a flat or clean transparent background. Malformed input fails closed rather than becoming a pass. Its alpha policy is fixed at 1024×1536 RGBA, alpha ≥250 for at least 0.9 of nontransparent foreground pixels. `strictOpaqueForegroundPass` is a separate diagnostic requiring every nontransparent foreground pixel to have alpha 255; natural antialiased edge pixels can make that diagnostic fail without changing the core-fraction rule.

The operator independently supplies the authority file, which is validated with a strict four-field schema: `schema`, `referenceVersion`, `referenceSHA`, and `ruleSHA`. Unknown fields are rejected. Together with the operator-supplied character/request identity and profile SHA-256, these pins are external inputs; they are not discovered from the candidate image or review. No owner or release approval is established, and the evaluator does not prove generated-image quality.

## Scope and integration status

The evaluator reports semantic assertions and artifact consistency; it does not imply owner approval or release approval. The legacy production runner is unchanged and has not been rewired to this TypeScript gate; production remains paused. The new gate holds when its required authority pins are absent. Do not treat this as evidence that the legacy runner already uses the TypeScript evaluator.

The package remains private and distribution remains pending. The absolute-path invocation above documents intended use after an authorized internal installation; it does not claim that a binary has already been distributed. This package is not distributed through a public npm tarball. The production runner remains paused and has not been rewired to invoke this evaluator.

## Source-native observable review

`observableReviewComparison(input)` and the separate `observe-compare` command validate draft geometry integrity on the original decoded PNG canvas:

```sh
node dist/cli.js observe-compare /path/to/image.png /path/to/observation.json \
  --character K001 --image-sha <sha256> --observation-sha <sha256>
```

Supply both lowercase SHA-256 pins and exact character identity independently. The API takes `imageBytes`, `observationBytes`, `expectedImageSHA`, `expectedObservationSHA`, and `expectedCharacterId`; unknown envelope keys are rejected. Observation bytes are strict UTF-8 JSON without BOM or duplicate keys, using `portrait-observable-observation.v1`. The document retains all thirteen landmark states and bounds, three ordered body bands, operational definitions, and raw origin references. Origin hashes bind assertions but do not authenticate reviewers; this endpoint does not read private review reports.

Coordinates remain original pixel centers. Normalization preserves unreduced fractions. Quarter-band rows retain exact numerator/4 separately from nearest-pixel rounding, with half rows rounding toward increasing y. Widths are point distances, not occupied-pixel counts. Clipped widths describe the visible lower-bound span; their upper endpoints do not bound hidden full width. Unmeasured dependencies retain nulls. Equipment assertions are copied without inferred removal or segmentation.

A valid result is one compact `portrait-observable-review.v1` JSON record plus newline on stdout, empty stderr, and exit 0. It always reports `integrityAssessment: "PASS"`, `evidenceAuthority: "UNVERIFIED_DRAFT_ASSERTIONS"`, `evidenceAuthorityAccepted: false`, `reviewAcceptance: "NOT_EVALUATED"`, and `productionAdvancement: "HOLD"`. Completeness, owner, release, profile, and anatomical authority remain false even when every measurement is observed. This partial report cannot satisfy the full acceptance evaluator or batch gate.

Invalid input exits 1 with empty stdout and exactly `{"schema":"portrait-observable-review-error.v1","code":"<code>","productionAdvancement":"HOLD"}` plus newline on stderr. API codes distinguish invalid envelope, raw SHA mismatch, invalid JSON/schema, identity, PNG, canvas, bounds, intervals, rows, and clipping. CLI syntax and filesystem failures add `USAGE`, `MISSING_ARTIFACT`, and `INVALID_ARTIFACT`. Exactly two paths and each required flag once are accepted; flags may interleave paths. Equals syntax, aliases, duplicate or unknown flags are rejected. Sole `--help` or `-h` prints usage and exits 0 without reading artifacts.
