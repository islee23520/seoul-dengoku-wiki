import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const file = join(dirname(fileURLToPath(import.meta.url)), "..", "artifact-allowlist.json");
const data = JSON.parse(await readFile(file, "utf8"));
const probe = process.argv[2] === "--probe" ? process.argv[3] : "";
if (probe) {
  console.log("FAIL " + probe);
  process.exit(1);
}
const bad = (data.routes || []).filter(r => r.disposition !== "allow");
if (bad.length) {
  console.log("FAIL " + bad.map(r => r.id).join(","));
  process.exit(1);
}
console.log("PASS");
