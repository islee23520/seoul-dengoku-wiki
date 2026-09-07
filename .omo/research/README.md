# Historical citation metadata

- [reference-source-index.json](reference-source-index.json) retains the 514
  historical IDs, titles, URLs when present, claim scopes and limitations
  used by the reference corpus. Machine paths, task IDs, raw responses,
  search logs and captures are omitted. The source hash identifies the
  inspected local registry; no URL has been freshly re-verified by this sync.
- [ck3-ui-reference.md](ck3-ui-reference.md) preserves the secondary UI report
  required by S-CK3-M01 and its URL table. It is research, not runtime acceptance.
- IDs are scoped to their originating reports. A document-local ID absent
  from the registry is an unresolved citation, not permission to guess a URL.
  In particular XCOM 2's S1-S19 mapping was not present in the inspected
  registry; those claims remain unverified until a source table is recovered.
- Local-only secondary reports named by the registry are historical context,
  not available raw evidence. Their upstream source IDs/limitations remain
  recorded. Private research is repository context and is not copied into
  generated Wiki output. ADR-001 remains the delivery authority.
