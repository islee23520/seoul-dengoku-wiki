# Protected internal successor identity export

The owner selected internal approved-successor identity authority. This does not
change current-public document admission or authorize protected execution. The
existing `wiki-map-identity-request.v1` branch and its public-admitted reader keep
their original predicates. They cannot select internal revisions or fall back to
an old admitted head.

The actual exporter CLI also accepts the exact request:

```json
{
  "schema": "wiki-internal-map-identity-request.v1",
  "databasePath": "/absolute/accepted-checkpoint.sqlite",
  "bootstrapReceiptPath": "/absolute/accepted-bootstrap.json",
  "outputDirectory": "/absolute/new-protected-output",
  "selectionId": "owner-reviewed-selection",
  "evidencePath": "/absolute/derived-minimal-identity-evidence.json"
}
```

All paths are explicit, normalized and absolute. `selectionId` is only a selector,
not authority: it must exist in code-owned `scripts/internal-identity-selections.json`.
That registry is empty because the actual accepted successor snapshot/bootstrap,
minimal authenticated mapping derivation and current union crosswalk are not
available in the authorized local evidence. Production returns
`E_IDENTITY_SELECTION_UNAVAILABLE` before reading any requested input. There is
no environment override, dynamic provider loader, request pin or approved flag.

## Enrollment contract, not a new approval process

An independently reviewed selection binds databaseSha256, bootstrapReceiptSha256,
affiliation `{sourceId,sourceSha256,revisionId,parentRevision,semanticSha256}`,
evidenceSha256, approvalRef, personCount, dispositionRef, sourceHashes and exact
crosswalks. The affiliation logical path remains Sixteen-States and the algorithm
typed-envelope-v1. Pins must come from the accepted authored-successor scope,
not from caller bytes or an older admitted snapshot. The internal reader checks
current head=selected sealed successor and compares only current/sealed identity
columns. It does not claim to rehash the complete document from a partial slice.

Evidence `wiki-internal-identity-evidence.v1` contains scope
`internal-approved-successor`, mappingAuthoritySha256, approvalRef, affiliation,
persons, mappings and crosswalks. Its **exact bytes** are independently enrolled;
hash equality is integrity, not new semantic authorization. This is the narrow
read-only derivation of an existing authenticated result recommended by
identity-contract-review, not a new proof table, approval writer or public loader.

The existing authentication boundary remains
`loadDatabasePersonDetailMappingAuthority` in public-person-detail-admission.mjs:
it replays the original/final mapping stores and checks current typed sources,
returning the privately branded authority pinned to final receipt
`5f8f5cc0d7a0dfd2d24f5a379ccf11b8bdc18d61fa875a27aaf060759726df96`.
That closure requires halted protected reads and reconstructs far more than this
exporter; it is deliberately **not imported or invoked here**. A source owner must
derive only the five required mappings from its successfully authenticated result,
retain source/approved-successor/transformation bindings and exact scope, and
independently review/enroll the resulting minimal evidence hash. No extractor or
authentication-success receipt is fabricated by this increment. It cannot enroll
itself or accept an arbitrary summary because a request supplied its hash.

Persons in evidence bind exact issued ID, name, stored route, state/stateName,
alias presence/order and active/retired-current status. The provider checks the
typed registry order, complete person count, disposition decision, unique stored
routes/IDs, ordered aliases and explicit null state/name pair. It never derives a
route from K IDs, drops retired identities or turns missing state into S00. Every
person's exact `state` and `stateName` are retained separately from political
membership. Authored S00 must match its source state label and exact evidence;
it emits neither a polity nor a polityRef. It is not converted to null. S01-S16
may reference their existing polities; authored null remains null. The political
affiliation reader still rejects S00 membership. Every
characterId/name/detailRoute/state/stateName has one exact authenticated mapping
and original/approved-successor source fingerprint. Alias/disposition values are
covered by the independently accepted whole snapshot and exact evidence record,
not falsely attributed to the five-field mapping receipt.

Union crosswalks must bind the exact successor revision, source pointer, ordered
memberStateIds, existing `union:religious` key and source-owned approval evidence.
They are separately enrolled with the selection and must equal both evidence and
typed affiliation. No name/ordinal inference creates a union key. A union's null
state head is not neutral. Only an explicit neutral affiliation yields null;
unsupported or drifting crosswalks reject. The exporter does not certify that a
union crosswalk exists merely because the key appears in household policy.

## Output and remaining gate

Both files remain protected and are staged/published together into a fresh
directory, with input fingerprint rechecks. Internal identity and receipt are
explicitly labeled `internal-approved-successor`, `publicAdmission:false` and
`trusted-snapshot/internal-approved-successor-projection`. Receipt binds selected
snapshot/bootstrap/evidence/revision identities. No map, values, soul, prose,
geographic base or public-generation dependency is imported by this provider.

Missing actual source pins/evidence are an intentional production gate, not a
stub successful export. Disposable fixtures test the real reader/provider/export
path with explicitly code-registered synthetic accepted sources. They cannot
establish real identity extraction, rights or public admission. A later source-owned
enrollment needs accepted snapshot/bootstrap bindings, authenticated five-field
mapping derivation, exact union/source/member approval and disposition coverage.
Protected reads/authentication/hydration remain halted until explicitly restarted.
