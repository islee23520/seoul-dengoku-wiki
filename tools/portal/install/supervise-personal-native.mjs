import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

// The PowerShell bootstrap admits the absolute config, pinned Node and adjacent
// scripts before starting this process with a cleared environment.
const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
if (config.schema !== "portal-native-launch.v1" || process.versions.node.split(".")[0] !== "24")
  throw Error("NATIVE_RUNTIME_CONTRACT");
const launcher = fileURLToPath(new URL("./start-personal-native.mjs", import.meta.url));
const environment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => ["SYSTEMROOT", "WINDIR"].includes(key.toUpperCase())),
);
const child = spawn(config.nodePath, [launcher, process.argv[2]], {
  cwd: fileURLToPath(new URL("./", import.meta.url)),
  env: environment,
  stdio: ["ignore", "inherit", "inherit", "ipc"],
  windowsHide: true,
});
const protocol = "portal-native-ipc.v1";
let state = "starting";
let requested = false;
let acknowledged = false;
let failure = false;
const report = (value) => {
  state = value;
  console.log(`NATIVE_SUPERVISOR_STATE=${value} child=${child.pid ?? "none"}`);
};
const fail = (reason) => {
  failure = true;
  console.error(`NATIVE_SUPERVISOR_FAILURE=${reason} child=${child.pid ?? "none"}`);
  report("failed");
  process.exitCode = 1;
};
function sendStop() {
  if (state !== "ready" || !requested) return;
  report("stopping");
  child.send({ schema: protocol, type: "stop" }, (error) => {
    if (error) fail("STOP_SEND_FAILED");
  });
}
report("starting");
const input = createInterface({ input: process.stdin });
input.on("line", (line) => {
  if (line !== "stop" || requested) return;
  requested = true;
  sendStop();
});
child.on("message", (message) => {
  if (!message || typeof message !== "object" || Array.isArray(message) ||
      Object.keys(message).length !== 2 || message.schema !== protocol) return;
  if (message.type === "ready" && state === "starting") {
    report("ready");
    sendStop();
  } else if (message.type === "drained" && state === "stopping") {
    acknowledged = true;
    report("drained");
  } else if (message.type === "drain-failed" && state === "stopping") {
    fail("DRAIN_FAILED");
  }
});
child.on("disconnect", () => {
  if (!acknowledged && !failure) fail("CHANNEL_LOST");
});
child.on("error", (error) => {
  console.error(error);
  fail("CHILD_SPAWN_FAILED");
});
// A failed spawn emits error and close, but not exit. Keep stdin open while
// an actual child still exists; otherwise the controller pipe would pin this
// failed supervisor (and the PowerShell WaitForExit) indefinitely.
child.on("close", () => {
  if (child.pid === undefined) {
    if (!failure) fail("CHILD_SPAWN_FAILED");
    input.close();
  }
});
child.on("exit", (code, signal) => {
  input.close();
  console.log(`NATIVE_SUPERVISOR_CHILD_EXIT code=${code ?? "null"} signal=${signal ?? "null"} child=${child.pid}`);
  if (!failure && acknowledged && code === 0 && signal === null) {
    report("stopped");
  } else {
    fail(`CHILD_EXIT_${code ?? "signal"}${signal ? `_${signal}` : ""}`);
  }
});
