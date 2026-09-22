#!/usr/bin/env node
// Wiki-repo copy of the EN pair check (default mode): changed lore/*.md must have .en.md pairs.
// Kept in sync with TOOL/tools/wiki/lore-tense-check.mjs in the main repo (task 10/12).
import { execFileSync } from "node:child_process";
import { statSync, readFileSync } from "node:fs";
import { join } from "node:path";
const root = join(import.meta.dirname, "..", "..");
let changed = [];
try {
  changed = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { cwd: root, encoding: "utf8" })
    .split("\n").filter(p => p.startsWith("lore/") && !p.startsWith("lore/editorial/") && p.endsWith(".md") && !p.endsWith(".en.md"));
} catch { changed = []; }
const failures = [];
let paired = 0;
for (const rel of changed) {
  const en = join(root, rel.replace(/\.md$/, ".en.md"));
  let ok = true;
  try { statSync(en); } catch { ok = false; }
  if (!ok) { failures.push("missing-pair: " + rel); continue; }
  paired++;
}
console.log(`changed=${changed.length} paired=${paired} failures=${failures.length}`);
for (const f of failures) console.log("FAIL " + f);
if (failures.length) process.exit(1);
console.log("PASS");
