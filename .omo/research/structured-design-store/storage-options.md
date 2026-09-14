# Categorized design store: storage decision

## Recommendation and evidence boundary

**Recommend one SQLite-backed HTTP authoring service, with normalized identities/links/reviews, narrative JSON payloads, and deterministic Git-reviewed exports.** This is a proposed target, not an authorized migration. Until the owner approves changing authority policy and operating a durable host, retain versioned repository files as canonical. Do not select a paid service by default.

Investigation: 2026-09-13; checkout HEAD `09863cf39209467c56c5459e8b4a552e58db2b3e`. File citations describe the inspected working tree, including pre-existing dirty `SERVICES.md` and `vercel.json`, not a deployed-state verification. Context7 was queried first: resolved `/websites/sqlite_docs` and `/websites/mongodb_manual`, then queried concurrency/integrity/backup documentation. Official pages below were subsequently fetched directly. No benchmark, Windows host probe, or production request was performed; no throughput or availability claim is implied.

Repository constraints:

- The site already exposes `/design/`, `/world/`, `/rules/`; its configuration builds to `dist`, uses local search, and currently ignores dead links (`docs-site/.vitepress/config.mts:22-30,55-75`). Proposed canonical domain values are `planning`, `world`, `rules`, with `planning -> /design/`; preserve existing URLs.
- The mount script reads root design files and `docs/game-logic` Markdown, classifies pages, and writes site copies; those copies must not become another write authority (`docs-site/scripts/mount.mjs:71-80,159-180,193-197`). Scoped inventory: `git ls-files docs-site/design docs-site/world docs-site/rules`, filtering `.md`, counted 13/165/36 files respectively, including index pages, at the HEAD above. This is a tracked-path count, not an entity count or load estimate.
- Existing cast data already mixes IDs, source UUIDs, affiliation, and narrative fields (`docs/game-logic/name-pools/roster-100.json:35-60`). The profile contract requires community, language, livelihood, affiliation, and meaningful relationships (`docs/game-logic/Cast-Profile-Contract.md:9-20`). These support a linked model without converting every sentence into columns.
- Accepted policy makes repository documents authoritative, requires PR delivery, and reserves merging for the owner (`docs/adr/ADR-001-repository-delivery-policy.md:24-31`). A database canonical store therefore requires an explicit policy amendment, not merely a new service.

## Compare the right layers

SQLite is an embedded SQL database engine, not an HTTP server; the proposed application supplies HTTP, authentication, authorization, validation, and review workflow [S1]. JSON is a data-interchange format, not a database or concurrency protocol [J1]. MongoDB is the server document-database comparator; it stores BSON, not plain JSON files [M1]. It also needs an application API for this workflow. JSON payloads/exports are compatible with either database [S4, M1, M6].

The matrix combines documented capabilities (citations) with explicitly proposed operating choices. No numerical scores imply unmeasured performance.

| Criterion | SQLite canonical service | Versioned JSON files | MongoDB server document database |
|---|---|---|---|
| Fit for three domains and linked records | **Recommended target:** common entity/revision tables with domain discriminator, FK-backed edges; narrative JSON supported [S3,S4]. | **Recommended interim:** one entity per file plus domain directories/manifests; application validator checks the complete graph. JSON itself supplies no datastore integrity [J1,J2]. | Documents accommodate narrative structures; use explicit IDs/references, but application logic must maintain referential integrity [M1,M3]. |
| FK/structural integrity | FK constraints, enabled and verified on **every connection before transactions**; `CHECK(json_valid(payload))` validates JSON syntax, not the whole domain schema [S3,S4]. | JSON Schema validates required fields/types; add separate uniqueness, cross-file reference, and review-state checks [J2]. Do not treat schema `$ref` as a data FK. | Collection validation can reject invalid documents; it does not replace cross-collection integrity logic [M2,M3]. Multi-document transactions require a supported replica-set/sharded topology, not standalone [M5]. |
| Multi-agent edits/no lost updates | WAL permits concurrent readers and a writer, but **one writer at a time**. Require revision compare-and-swap (CAS), short atomic transactions, explicit conflicts [S2,S5]. | Separate branches/worktrees and owner-reviewed merges; validate merged content. Git can detect textual conflicts, but semantic conflicts require the proposed graph/revision checks [J3]. Shared-file overwrites are not the design. | Atomic conditional updates support expected-revision filters; WiredTiger permits different-document writers concurrently. Same-document conflicts still need CAS [M4,M7]. |
| Revision/provenance/review | Proposed immutable revision, provenance, review-event tables; update entity head and revision atomically [S5]. | Proposed machine-readable revision/review manifests alongside content; Git history supports review, but does not itself define reviewed status [J3]. | Proposed revision/review collections; use transactions when content and audit records span documents [M4,M5]. |
| Git review/export | Proposed stable per-entity JSON plus generated Markdown; export reviewed releases, not the live binary. Preserve owner PR gate (ADR:27-31). | Native text diffs/merges; proposed stable formatting and schema versioning [J1,J3]. Closest to existing authority policy (ADR:30). | Proposed deterministic JSON export for Git; official `mongoexport` is **not a backup** [M6]. |
| Backup/restore | Online Backup API or `VACUUM INTO`; do not copy only an active WAL database's main file. Verify restored DB and FKs separately [S2,S6,S7]. | Proposed off-machine repository mirror plus release snapshots; include unmerged work if its recovery matters. Git-reviewed exports cannot recover drafts never exported. | `mongodump`/restore with topology-appropriate consistency; concurrent writes without `--oplog` do not yield a single-moment dump. Replica-set dump/replay requires documented restrictions [M8]. |
| Offline snapshots | Proposed consistent SQLite backup for local queries and JSON/Markdown release for reading [S6]. Offline edits return as revision-bound proposals. | Proposed full release tree usable offline; reconciliation happens through Git, not last-write-wins [J3]. | Proposed JSON/Markdown reading snapshots or restored backup; exported JSON alone is not a server backup [M6,M8]. |
| Hosting/scale/operations | Proposed one service on durable local disk; no shared SMB/NFS database or independent writer hosts in WAL [S2]. Vercel is frontend/proxy, not mutable local DB storage [V1,V2]. | Static VitePress delivery matches the present build path (`docs-site/package.json:7-12`); online write coordination must be added, not assumed. | Separate database deployment plus API, access controls and backup ownership. Replica-set operations buy capabilities not justified solely by narrative content [M1,M5,M7]. Paid hosting needs approval. |

Here "ADR" means `docs/adr/ADR-001-repository-delivery-policy.md`.

## Proposed target architecture

### 1. Normalize relationships, retain narrative payloads

Use one database across all three domains, not three isolated stores. Proposed minimum model:

- `entity(id, domain, kind, slug, head_revision)` with stable IDs and unique routing keys.
- Immutable `revision(entity_id, revision, base_revision, payload_json, schema_version, actor, content_hash, created_at)`; composite identity binds content to its entity.
- `link(from_entity, from_revision, relation_type, to_entity)` with FK endpoints; optionally pin target revisions where the source meaning depends on an exact version.
- `source(id, uri_or_repo_path, source_commit, source_hash, locator)` and revision-to-source associations; retain original source UUIDs rather than replacing provenance with a generated summary.
- Append-only `review(entity_id, revision, decision, reviewer, evidence, timestamp)`; derive current reviewed status from an authorized approval of the exact revision/hash. Editing creates an unreviewed revision, never inherits the previous badge.

Keep prose, heterogeneous character details, and narrative sections in JSON/Markdown strings. Normalize IDs, membership, relation endpoints, source associations, and review records because those are shared constraints/query targets. SQLite supports JSON alongside SQL constraints [S3,S4]; narrative payloads do not remove the need to reject dangling links or bind approval to an immutable revision. Those design needs are illustrated by the existing cast fields and contract cited above. Use JSON Schema at the API/import boundary; SQL FK/CHECK/UNIQUE constraints enforce the relational envelope [J2,S3].

### 2. Make stale writes fail visibly

Proposed API: each edit/import supplies entity ID, expected base revision, and idempotency key. In one short transaction, compare the current head with the expected revision, validate link targets and payload, append the new revision/links/provenance, advance the head conditionally, and record the request result. A stale head returns `409 Conflict` with current revision; do not automatically replay stale replacement content. Batch cross-entity edits commit or fail together. SQLite supports the transaction boundary; `BEGIN IMMEDIATE` may return `SQLITE_BUSY`, which is contention, not a content conflict [S5].

Serialize writes through the service; no agent opens the database file. Perform model calls and human review outside transactions. Proposed bounded busy handling must return an explicit retriable error when exhausted; retain the same idempotency key on retry. WAL's one-writer limit does **not** mean only one agent may submit work [S2]. Measure queue latency, busy failures, transaction duration, checkpoint behavior, and write mix before making a scale decision; no throughput estimate was established here.

### 3. One authoring authority, Git-controlled publication

Proposed post-approval flow: agent proposal -> validated database revision -> authorized review -> immutable release manifest -> stable JSON and generated Markdown -> owner-reviewed PR -> published VitePress snapshot. Manifest entries bind entity/revision/hash, schema/exporter version, and source commit. Later database edits must not silently change the release under review. Mark publication only after the merged artifact matches that manifest; Git and database updates are not one atomic transaction, so use an idempotent reconciliation record.

Do not support uncontrolled dual writes. Repository corrections and offline changes must enter through revision-checked imports, not overwrite the database. Before authority-policy approval, reverse the arrangement: Git remains canonical and any database is a rebuildable index. The present mount script writes site copies directly; replacing its source contract is future scoped work, not done here (`docs-site/scripts/mount.mjs:193-197`). Add release-time link validation rather than relying on `ignoreDeadLinks` (`docs-site/.vitepress/config.mts:27`).

### 4. Durable host, same-domain surface, recoverable releases

Proposed Windows option: service/runtime state under owner-approved `E:/git/design-store-data/`, outside the repository worktree and cloud-sync/network shares. Existing generator documentation references Windows `E:\git` dataset storage, but proves neither an available service host nor its uptime (`tools/cast/generate_nemotron_roster.py:2-6`). Confirm local disk, restart supervision, service identity, network access, and backup destination before adoption.

Keep published reads on VitePress. Propose `/design-store-api/` as a distinct same-domain API prefix backed by an authenticated HTTPS origin; preserve existing access protection. Current `/api/:path*` already rewrites to character-forge, so do not capture it (`vercel.json:25-28`; `SERVICES.md:24-30`). External rewrites support proxying [V2], but a reachable secured origin is still an owner deployment decision. Never assume a Windows LAN address is reachable from Vercel. Vercel documents ephemeral, non-shared function storage and no local-filesystem persistence guarantee [V1].

Proposed operations: consistent online backups to a separate failure domain; encrypted/access-controlled copies; owner-defined retention and recovery objectives; restore exercises running both `integrity_check` and `foreign_key_check` because the former omits FK errors [S6,S7]. Keep reviewed JSON/Markdown snapshots for service-down reading, but do not call exports a complete backup of drafts/audit history. Public reads should survive authoring-host downtime; online writes may be unavailable until recovery.

## Decisions that change the recommendation

| Owner decision / observed condition | Recommended consequence |
|---|---|
| No authority-policy amendment, no durable-host operator, or asynchronous PR editing is sufficient | Stay with versioned JSON/Markdown as canonical; use isolated worktrees, schema/graph checks and reviewed manifests. SQLite may be an expendable query index. |
| Approves canonical service, single durable writer host, revision-bound reviews, Git publication gate | Adopt the SQLite target above. No paid service selection is implied. |
| Measured writer contention misses owner-set latency objectives after shortening transactions; concurrent independent writer hosts or availability requirements cannot tolerate one host | Reopen database selection. MongoDB is warranted only if document-oriented operations and its application-managed integrity tradeoff fit; if relational integrity remains primary, evaluate a server relational database instead [S1,M3,M7]. |
| Requires independent offline writes that converge automatically | None of these storage choices alone specifies that protocol. Define conflict semantics and synchronization first; default remains offline snapshots plus explicit CAS imports [J1,J3,M4]. |

**Explicit approvals required:** canonical-authority policy change; reviewer identities and approval/revocation rules; domain naming/URL mapping; API exposure/authentication and host operator; recovery-point/recovery-time objectives and acceptable write downtime; export/publication boundary; any paid infrastructure. This report authorizes none of those actions.

## Official sources

- [S1] SQLite use cases/server distinction: https://www.sqlite.org/whentouse.html
- [S2] WAL concurrency, single writer, same-host requirement, WAL file safety: https://www.sqlite.org/wal.html
- [S3] FK enforcement and per-connection enablement: https://www.sqlite.org/foreignkeys.html
- [S4] JSON storage/functions: https://www.sqlite.org/json1.html
- [S5] Transactions and write contention: https://www.sqlite.org/lang_transaction.html
- [S6] Online backup and `VACUUM INTO`: https://www.sqlite.org/backup.html
- [S7] Integrity/FK checks: https://www.sqlite.org/pragma.html
- [J1] JSON format standard: https://www.rfc-editor.org/rfc/rfc8259
- [J2] JSON Schema object validation: https://json-schema.org/understanding-json-schema/reference/object
- [J3] Git merge/conflicts: https://git-scm.com/docs/git-merge
- [M1] MongoDB BSON documents: https://www.mongodb.com/docs/manual/core/document/
- [M2] Schema validation: https://www.mongodb.com/docs/manual/core/schema-validation/
- [M3] Application-maintained referential integrity: https://www.mongodb.com/docs/manual/data-modeling/data-consistency/
- [M4] Atomicity and expected-value updates: https://www.mongodb.com/docs/manual/core/write-operations-atomicity/
- [M5] Transaction deployment requirements: https://www.mongodb.com/docs/manual/core/transactions-production-consideration/
- [M6] JSON export is not backup: https://www.mongodb.com/docs/database-tools/mongoexport/
- [M7] WiredTiger document-level concurrency: https://www.mongodb.com/docs/manual/core/wiredtiger/
- [M8] Dump consistency and oplog/replay restrictions: https://www.mongodb.com/docs/database-tools/mongodump/
- [V1] Vercel local SQLite persistence constraint: https://vercel.com/kb/guide/is-sqlite-supported-in-vercel
- [V2] External rewrites: https://vercel.com/docs/rewrites
