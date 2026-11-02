# Published people database

This SQLite snapshot captures every registered person at https://seoul-dengoku.linalab.io/wiki/people. Public catalog and detail bytes remain source-bound with their URL, retrieval time, and SHA-256. Permanent `person_id` and `character_id` are distinct unique keys; never infer character IDs from route numbers or match people by name alone.

```bash
node TOOL/tools/people/people-store.mjs collect
node TOOL/tools/people/people-store.mjs verify
node TOOL/tools/people/people-store.mjs list
node TOOL/tools/people/people-store.mjs get K001
node TOOL/tools/people/people-store.mjs get person-0001
```

Default database: `snapshots/people.sqlite`. `--db` selects another path. Collection discovers the deployed application catalog, parses its literal AST without executing remote code, fetches every person detail, and validates portrait identities and actual image hashes. All input validation finishes before a transaction replaces the current people/portrait rows. Failed collection leaves an existing database untouched.

`people` retains complete detail JSON including family trees and game statistics, alongside indexed identity, state, birthday, and age. `portraits` binds only registered images to exact token/image hashes and preserves `art-proposal` status. `sources` retains the original public responses. This is a read-only source snapshot for portrait authoring, not canonical editing or owner approval.
