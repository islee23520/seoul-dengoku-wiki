import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const file = join(dirname(fileURLToPath(import.meta.url)), "..", "artifact-allowlist.json");
const data = JSON.parse(await readFile(file, "utf8"));
const allowed = new Set((data.routes || []).filter(r => r.disposition === "allow").map(r => r.id));
const reject = process.argv[2] === "--reject" ? process.argv[3] : "";
if (reject) {
  if (allowed.has(reject)) { console.log("PASS " + reject); process.exit(0); }
  console.log("FAIL " + reject);
  process.exit(1);
}
console.log("PASS " + [...allowed].join(","));
