import { createHash } from "node:crypto";
import { closeSync, lstatSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { dirname, isAbsolute, join, parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// This entrypoint is launched ONLY through the clean-environment PowerShell
// bootstrap. In-JS checks cannot undo NODE_OPTIONS code run before this module.
const fail = (code) => { throw Error(code); };
function existing(path, directory) {
  if (typeof path !== "string" || !isAbsolute(path) || resolve(path) !== path)
    fail("NATIVE_ABSOLUTE_PATH_REQUIRED");
  const stat = lstatSync(path);
  if (stat.isDirectory() !== directory || (!directory && (!stat.isFile() || stat.nlink !== 1)))
    fail("NATIVE_PATH_TYPE");
  for (let cursor = path;; cursor = dirname(cursor)) {
    if (lstatSync(cursor).isSymbolicLink()) fail("NATIVE_REPARSE_PATH");
    if (cursor === parse(cursor).root) break;
  }
  return path;
}
const config = JSON.parse(readFileSync(existing(process.argv[2], false), "utf8"));
if (config.schema !== "portal-native-launch.v1" || process.versions.node.split(".")[0] !== "24")
  fail("NATIVE_RUNTIME_CONTRACT");
const server = existing(config.serverPath, false);
if (!/^[a-f0-9]{64}$/.test(config.serverSha256) ||
    createHash("sha256").update(readFileSync(server)).digest("hex") !== config.serverSha256)
  fail("NATIVE_SERVER_HASH_MISMATCH");
const database = existing(config.originalsDb, false);
const storage = existing(config.storagePath, true);
const publicPath = existing(config.publicPath, true);
const allowed = new Set([
  "PORTAL_SESSION_SECRET", "PORTAL_OWNER_EMAIL", "PORTAL_ACCESS_ISSUER",
  "PORTAL_ACCESS_AUDIENCE", "PORTAL_ACCESS_JWKS_FILE", "PORTAL_TEMPLATE_MANIFEST",
  "PORTAL_TEMPLATE_PINS", "PORTAL_PERSONAL_PROVIDER_URL",
  "PORTAL_PERSONAL_PROVIDER_KEY", "WIKI_BASE_URL", "PORTAL_COMFYUI",
  "PORTAL_LOCAL_AI_CATALOG",
]);
if (!config.environment || typeof config.environment !== "object" || Array.isArray(config.environment))
  fail("NATIVE_ENVIRONMENT_INVALID");
for (const [key, value] of Object.entries(config.environment)) {
  if (!allowed.has(key) || typeof value !== "string") fail("NATIVE_ENVIRONMENT_INVALID");
  if (key === "PORTAL_COMFYUI" && value !== "true" && value !== "false")
    fail("NATIVE_ENVIRONMENT_INVALID");
}
for (const key of [
  "PORTAL_TEMPLATE_MANIFEST",
  "PORTAL_TEMPLATE_PINS",
  "PORTAL_ACCESS_JWKS_FILE",
  "PORTAL_LOCAL_AI_CATALOG",
])
  if (config.environment[key]) existing(config.environment[key], false);
for (const key of Object.keys(process.env))
  if (!["SYSTEMROOT", "WINDIR"].includes(key.toUpperCase())) delete process.env[key];
Object.assign(process.env, config.environment, {
  PORTAL_MODE: "personal", PORTAL_HOST: "127.0.0.1", PORTAL_PORT: "18766",
  PORTAL_PUBLIC_URL: "https://sss.linalab.io/tools", PORTAL_BASE_PATH: "/tools",
  PORTAL_ORIGINALS_DB: database, PORTAL_STORAGE_PATH: storage,
  PORTAL_PUBLIC_PATH: publicPath, PORTAL_TOKENS_PATH: join(publicPath, "tokens.css"),
});
process.chdir(dirname(server));
// Persistent exclusive marker: a crash leaves it behind. Never steal a stale
// marker by PID or timeout; an operator must prove writer absence before removal.
const lockPath = join(dirname(database), "portal-writer.lock");
const lock = openSync(lockPath, "wx", 0o600);
writeSync(lock, `${process.pid}\n`);
process.once("exit", () => { closeSync(lock); unlinkSync(lockPath); });
console.log(`NATIVE_RUNTIME_PID=${process.pid}`);
await import(pathToFileURL(server).href);
