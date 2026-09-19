import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = dirname(import.meta.filename);
const index = JSON.parse(readFileSync(join(root, 'source-anchor-index.json'), 'utf8'));
const review = readFileSync(join(root, 'quality-review.md'), 'utf8');
const anchors = new Map(index.anchors.map((anchor) => [anchor.id, anchor]));
for (const id of review.matchAll(/\[anchor:([^\]]+)\]/g)) {
  const anchor = anchors.get(id[1]);
  if (!anchor) throw new Error(`unknown anchor ${id[1]}`);
  const source = readFileSync(join(root, anchor.file), 'utf8');
  if (createHash('sha256').update(source).digest('hex') !== anchor.sha256) throw new Error(`stale source ${id[1]}`);
  if (anchor.startLine > anchor.endLine || !anchor.startText || !anchor.endText) throw new Error(`empty anchor ${id[1]}`);
}
console.log(`quality anchors verified: ${new Set([...review.matchAll(/\[anchor:([^\]]+)\]/g)].map((m) => m[1])).size}`);
