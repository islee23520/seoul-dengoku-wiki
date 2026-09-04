# Wiki publisher commands

Root `package.json` pins the Wiki parser stack (`entities@8.0.0`, `mdast-util-from-markdown@2.0.3`, `parse5@8.0.1`) for Node `>=22 <27` and npm 12. Clean Wiki work always starts with `npm ci` at the repository root.

```bash
# Install pinned parsers from package-lock.json
npm ci

# Existing Wiki builder security contract
node tools/wiki/test-build-wiki.mjs

# Fail-closed publisher contract (no remote push)
node tools/wiki/test-publish-wiki.mjs

# Disposable generated mirror
node tools/wiki/build-wiki.mjs docs/game-logic docs/assets/wiki <output-dir> "$(git rev-parse HEAD)"

# Atomic local Wiki checkout replace. Never pushes unless --push is set.
# npm ci, node tests, nonzero required pages, assets, and path-escape checks
# all pass before the live checkout is swapped. Failures leave it unchanged.
node tools/wiki/publish-wiki.mjs --wiki-dir <wiki-checkout> --no-push
```

Do not edit a generated Wiki checkout as source. Canonical pages live under `docs/game-logic/`.
