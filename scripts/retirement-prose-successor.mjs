import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { openReadOnly } from './cast-sqlite/db.mjs';
import { readRetirementProse } from './cast-sqlite/retirement-prose.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const RETIREMENT_PROSE_PATCH = '.omo/evidence/seoul-lock/people-halving/survivor-prose-exact-patch-20261021.json';
const pins = [
  [
    "lore/characters/Cast-State-01.json",
    "5c655f2309c5f1859e2fc6b6ac5af0d9b2501ff4e56c152933ca57952c381564",
    "5a7c9190727fea08c265ee4c10141303ef8e668051fc4d018e7836038540abc6"
  ],
  [
    "lore/characters/Cast-State-03.json",
    "2a3792784ff9a0c0ed971cd1285a63b16b2b34231dab79f1731fac8df42da762",
    "24e12445117d83a9c192c58865a45b956124500c331704f7150f2382de8750d0"
  ],
  [
    "lore/characters/Cast-State-04.json",
    "cbc04cbb9623fdd7a2af24da671a49dbffb52a2b82cfc242178a0042b13e3974",
    "c5e586e8e82f84ca6a452573f76ad8df71cfce6e97553410101e5de92b5d94ed"
  ],
  [
    "lore/characters/Cast-State-05.json",
    "7d56869751a3c4aa7c84aa6be6e6a1900d238b2109f184a113bd306933817c2f",
    "eb860b748476a3f16a2968efe6684ed889487ef7420745dabde305de6aa2b2eb"
  ],
  [
    "lore/characters/Cast-State-07.json",
    "ccb429ce471b9cd81b22c678263338c890dba5a52eb9810c2dfdfb74b715bf42",
    "e6e28d312828edd670d2f954b7b822bda17af48651f3fd03fb496db29acbe80f"
  ],
  [
    "lore/characters/Cast-State-08.json",
    "d83497eecd7002f20fcc72e1f15fca27399b29bceb61acb7a1bea254a4c5fa98",
    "8d3cc4e9617ad510cf272b6838ee1ede7304c67202b0598d92b7238dd1fe428e"
  ],
  [
    "lore/characters/Cast-State-09.json",
    "4afe8de9a60eb61aaed5c1da19a2047c3ceca293ae5d886545a0790a88c9d624",
    "e072faec94f81658730713a346f01f059186341580dd5335d2d2df8a0d1e7a9b"
  ]
];
export async function retirementProsePredecessorReader(root, reader) {
  const files = new Map();
  let changes;
  for (const [path, beforeHash, afterHash] of pins) {
    const current = Buffer.from(await reader(resolve(root, path)));
    if (hash(current) === beforeHash) continue;
    if (hash(current) !== afterHash) throw Error('E_RETIREMENT_PROSE_SOURCE');
    if (!changes) {
      const db = openReadOnly(process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite'));
      try { changes = readRetirementProse(db); } finally { db.close(); }
      const ordered = [...changes].sort((a, b) => a.path.localeCompare(b.path) || a.pointer.localeCompare(b.pointer));
      if (hash(JSON.stringify(ordered)) !== 'a3447239ec5d31cb0f40d0c6fb95b2f0e18b7f3665dbc79f0ee2a94b24244948')
        throw Error('E_RETIREMENT_PROSE_PATCH');
    }
    let before = current.toString();
    for (const change of changes.filter(row => row.path === path)) {
      const afterToken = JSON.stringify(change.after);
      if (before.split(afterToken).length !== 2) throw Error('E_RETIREMENT_PROSE_REPLAY');
      before = before.replace(afterToken, JSON.stringify(change.before));
    }
    if (hash(before) !== beforeHash) throw Error('E_RETIREMENT_PROSE_REPLAY');
    files.set(resolve(root, path), Buffer.from(before));
  }
  const predecessor = async (path, options) => {
    const bytes = files.get(resolve(path));
    return bytes ? options === 'utf8' ? bytes.toString() : Buffer.from(bytes) : reader(path, options);
  };
  predecessor.readHistorical = reader.readHistorical;
  predecessor.appliedDiskOverrides = new Map(reader.appliedDiskOverrides ?? []);
  return predecessor;
}
