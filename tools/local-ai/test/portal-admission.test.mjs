import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { portalAdmissionRequest } from "../comfy-maintenance-controller.mjs";

async function privateAcl(path, directory = false) {
  if (process.platform !== "win32") return chmod(path, directory ? 0o700 : 0o600);
  const script = `$ErrorActionPreference='Stop'; $s=[Security.Principal.WindowsIdentity]::GetCurrent().User; $p='${path.replaceAll("'", "''")}'; $a=Get-Acl -LiteralPath $p; $a.SetAccessRuleProtection($true,$false); foreach($r in @($a.Access)) { $a.RemoveAccessRuleSpecific($r) }; $a.SetOwner($s); $a.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($s,'FullControl','Allow'))); Set-Acl -LiteralPath $p -AclObject $a`;
  const child = spawn("C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")]);
  assert.equal((await once(child, "close", { signal: AbortSignal.timeout(15000) }))[0], 0);
}

test("portal HTTP mapping pins owner auth, URLs and durable response state", async () => {
  const root = await mkdtemp(join(tmpdir(), "portal-mapping-"));
  const stateFile = join(root, "admission.json");
  const authFile = join(root, "auth.json");
  const authBytes = JSON.stringify({ cookie: "portal_session=fixture", csrfToken: "a".repeat(32) });
  let state;
  const server = createServer(async (request, response) => {
    assert.equal(request.headers.cookie, "portal_session=fixture");
    assert.equal(request.headers["x-csrf-token"], "a".repeat(32));
    if (request.method === "POST") {
      let body = "";
      for await (const bytes of request) body += bytes;
      state = { ...JSON.parse(body), admission: request.url.endsWith("/close") ? "closed" : "open", updatedAt: new Date().toISOString() };
      await writeFile(stateFile, JSON.stringify(state));
    } else assert.equal(request.method, "GET");
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(state));
  });
  try {
    await privateAcl(root, true);
    await writeFile(authFile, authBytes);
    await privateAcl(authFile);
    server.listen(0, "127.0.0.1");
    await once(server, "listening", { signal: AbortSignal.timeout(10000) });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const spec = { transport: "portal-http", origin, stateFile, reason: "fixture", windowId: "fixture-window",
      auth: { kind: "portal-owner-session", file: authFile, sha256: createHash("sha256").update(authBytes).digest("hex") },
      ...Object.fromEntries(["close", "open", "status"].map(op => [op, `${origin}/tools/api/local-ai/admission/${op}`])) };
    assert.equal((await portalAdmissionRequest(spec, "close")).admission, "closed");
    assert.equal((await portalAdmissionRequest(spec, "status")).admission, "closed");
    assert.equal((await portalAdmissionRequest(spec, "open")).admission, "open");
    await assert.rejects(portalAdmissionRequest({ ...spec, close: "http://example.com/tools/api/local-ai/admission/close" }, "close"), /INVALID_PORTAL_ADMISSION/);
    await writeFile(authFile, "{}");
    await assert.rejects(portalAdmissionRequest(spec, "close"), /PIN_MISMATCH/);
  } finally { server.closeAllConnections(); await new Promise(done => server.close(done)); await rm(root, { recursive: true, force: true }); }
});
