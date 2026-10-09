# Sealed historical person inputs

These are immutable archival inputs, not current world canon and not public assets. The two root JSON files preserve the exact issued ledger bytes at the revisions in their filenames. `corpus/` preserves the citation sources whose hashes are recorded in `scripts/issued-preservation-baseline.json`, using revision `5f34d92d54ca56b1f6c8f117cc6cbe8eda0067e4`.

Normal generation verifies the seals and projects both historical records beside current person data from `lore/`. The historical `state` value remains unchanged even when the same person's current affiliation changes. No legacy number becomes an opposed-d10 rating.

For an explicit byte-for-byte reimport from existing Git objects, run `node scripts/import-issued-history.mjs`. The importer validates all hashes before writing and does not update seals. A new historical revision or changed seal needs separate approval; regeneration cannot authorize it.
