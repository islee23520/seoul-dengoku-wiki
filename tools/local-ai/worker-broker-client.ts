import { createConnection } from "node:net";
import { createHash } from "node:crypto";

export const workerPipe = "\\\\.\\pipe\\seoul-local-ai-worker-v1";
export class BrokerError extends Error {
  constructor(readonly code: string) { super(code); this.name = "BrokerError"; }
}
export type RunRequest = {
  readonly version: 1; readonly op: "run"; readonly requestId: string;
  readonly tool: "unimate" | "uniforge3d"; readonly assetId: string;
  readonly seed: number; readonly prompt: string;
};
export function requestSha256(request: Pick<RunRequest, "tool" | "assetId" | "seed" | "prompt">): string {
  return createHash("sha256").update(JSON.stringify({
    tool: request.tool, asset: request.assetId, seed: request.seed,
    prompt: Buffer.from(request.prompt, "utf8").toString("hex"),
  })).digest("hex");
}
export type BrokerRequest = RunRequest | { readonly version: 1; readonly op: "probe" | "admission" } |
  { readonly version: 1; readonly op: "result"; readonly requestId: string } |
  { readonly version: 1; readonly op: "get"; readonly artifactId: string; readonly offset: number; readonly length: number };
export type BrokerReply =
  | { readonly version: 1; readonly op: "admission"; readonly configurationEligible: boolean }
  | { readonly version: 1; readonly op: "result"; readonly receipt: string }
  | { readonly version: 1; readonly op: "probe"; readonly ownerSid: string; readonly peerSid: string;
      readonly identitySource: "windows-pipe-impersonation"; readonly manifestSha256: string;
      readonly leaseAuthority: "unwired" | "owner-bridge"; readonly gpuDispatches: 0; readonly ubuntuUid: string }
  | { readonly version: 1; readonly op: "run"; readonly requestId: string; readonly state: string; readonly requestSha256: string; readonly exitCode: number | null }
  | { readonly version: 1; readonly op: "get"; readonly artifactId: string; readonly offset: number; readonly total: number; readonly sha256: string; readonly data: string };

// This file is outside the portal package; keep the wire parser dependency-free.
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new BrokerError("INVALID_OBJECT");
  return Object.fromEntries(Object.entries(value));
}
function keys(value: Record<string, unknown>, expected: readonly string[]) {
  if (Object.keys(value).length !== expected.length || Object.keys(value).some(k => !expected.includes(k))) throw new BrokerError("INVALID_FIELDS");
}
function text(value: unknown): string {
  if (typeof value !== "string") throw new BrokerError("INVALID_STRING");
  return value;
}
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new BrokerError("INVALID_INTEGER");
  return value;
}
function digest(value: unknown): string {
  const result = text(value);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new BrokerError("INVALID_DIGEST");
  return result;
}
export function parseReply(input: unknown): BrokerReply {
  const v = object(input);
  if (v["version"] !== 1) throw new BrokerError("INVALID_VERSION");
  switch (v["op"]) {
    case "admission": {
      keys(v,["version","op","configurationEligible"]);
      if (typeof v["configurationEligible"] !== "boolean") throw new BrokerError("INVALID_ADMISSION");
      return {version:1,op:"admission",configurationEligible:v["configurationEligible"]};
    }
    case "result": {
      keys(v,["version","op","receipt"]);
      const receipt=text(v["receipt"]);
      if (Buffer.byteLength(receipt)>32768) throw new BrokerError("RECEIPT_BOUNDS");
      return {version:1,op:"result",receipt};
    }
    case "error": keys(v, ["version", "op", "code"]); throw new BrokerError(text(v["code"]));
    case "probe": {
      keys(v, ["version", "op", "ownerSid", "peerSid", "identitySource", "manifestSha256", "leaseAuthority", "gpuDispatches", "ubuntuUid"]);
      if (v["identitySource"] !== "windows-pipe-impersonation" || (v["leaseAuthority"] !== "unwired" && v["leaseAuthority"] !== "owner-bridge") || v["gpuDispatches"] !== 0) throw new BrokerError("INVALID_IDENTITY_PROOF");
      return { version:1, op:"probe", ownerSid:text(v["ownerSid"]), peerSid:text(v["peerSid"]),
        identitySource:"windows-pipe-impersonation", manifestSha256:digest(v["manifestSha256"]), leaseAuthority:v["leaseAuthority"], gpuDispatches:0, ubuntuUid:text(v["ubuntuUid"]) };
    }
    case "run": {
      keys(v, ["version", "op", "requestId", "state", "requestSha256", "exitCode"]);
      const state = text(v["state"]);
      if (!["RUNNING", "UNKNOWN", "AWAITING_VALIDATION", "FAILED"].includes(state)) throw new BrokerError("INVALID_STATE");
      return { version:1, op:"run", requestId:text(v["requestId"]), state, requestSha256:digest(v["requestSha256"]), exitCode:v["exitCode"] === null ? null : integer(v["exitCode"]) };
    }
    case "get": {
      keys(v, ["version", "op", "artifactId", "offset", "total", "sha256", "data"]);
      const data = text(v["data"]), offset = integer(v["offset"]), total = integer(v["total"]);
      if (total > 128*1024*1024 || offset > total || data.length > 43692 || Buffer.from(data,"base64").toString("base64") !== data || Buffer.from(data,"base64").length > Math.min(32768,total-offset)) throw new BrokerError("INVALID_CHUNK");
      return { version:1, op:"get", artifactId:text(v["artifactId"]), offset, total, sha256:digest(v["sha256"]), data };
    }
    default: throw new BrokerError("INVALID_OPERATION");
  }
}
export function encodeRequest(request: BrokerRequest): Buffer {
  const v = object(request);
  if (v["version"] !== 1) throw new BrokerError("INVALID_VERSION");
  switch (request.op) {
    case "admission": keys(v,["version","op"]); break;
    case "result":
      keys(v,["version","op","requestId"]);
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(request.requestId)) throw new BrokerError("INVALID_REQUEST");
      break;
    case "probe": keys(v,["version","op"]); break;
    case "run":
      keys(v,["version","op","requestId","tool","assetId","seed","prompt"]);
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(request.requestId) ||
          !["unimate","uniforge3d"].includes(request.tool) || !/^[a-z0-9-]{1,80}$/.test(request.assetId) ||
          integer(request.seed) > 2147483647 || request.prompt.length > 2000) throw new BrokerError("INVALID_REQUEST");
      break;
    case "get":
      keys(v,["version","op","artifactId","offset","length"]);
      if (!/^[a-z0-9-]{1,80}$/.test(request.artifactId) || integer(request.length) < 1 || request.length > 32768) throw new BrokerError("INVALID_REQUEST");
      integer(request.offset); break;
    default: { const exhaustive: never = request; throw new BrokerError(String(exhaustive)); }
  }
  const bytes = Buffer.from(JSON.stringify(request));
  if (!bytes.length || bytes.length > 65536) throw new BrokerError("FRAME_BOUNDS");
  const header = Buffer.alloc(4); header.writeUInt32LE(bytes.length);
  return Buffer.concat([header,bytes]);
}
export function requestWorker(request: BrokerRequest, signal: AbortSignal): Promise<BrokerReply> {
  const frame = encodeRequest(request);
  if (process.platform !== "win32") return Promise.reject(new BrokerError("WORKER_UNAVAILABLE"));
  return new Promise((resolve,reject) => {
    const socket = createConnection(workerPipe);
    // Accumulator is bounded to one frame. No retry: disconnect may follow dispatch.
    let buffered = Buffer.alloc(0);
    const fail = (error: Error) => { socket.destroy(); reject(error); };
    const abort = () => fail(new BrokerError("WORKER_INTERRUPTED"));
    signal.addEventListener("abort",abort,{once:true});
    socket.once("close",() => { signal.removeEventListener("abort",abort); reject(new BrokerError("WORKER_UNAVAILABLE")); });
    socket.once("error",() => fail(new BrokerError("WORKER_UNAVAILABLE")));
    socket.once("connect",() => { if (signal.aborted) abort(); else socket.write(frame); });
    socket.on("data",chunk => {
      try {
        if (typeof chunk === "string") throw new BrokerError("FRAME_ENCODING");
        if (buffered.length+chunk.length > 65540) throw new BrokerError("FRAME_BOUNDS");
        buffered = Buffer.concat([buffered,chunk]);
        if (buffered.length < 4) return;
        const size = buffered.readUInt32LE();
        if (!size || size > 65536 || buffered.length > size+4) throw new BrokerError("FRAME_BOUNDS");
        if (buffered.length !== size+4) return;
        const reply = parseReply(JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(buffered.subarray(4))));
        if (reply.op !== request.op) throw new BrokerError("REPLY_MISMATCH");
        if (reply.op === "run" && request.op === "run" && reply.requestId !== request.requestId) throw new BrokerError("REPLY_MISMATCH");
        if (reply.op === "get" && request.op === "get" && (reply.artifactId !== request.artifactId || reply.offset !== request.offset || Buffer.from(reply.data,"base64").length > request.length)) throw new BrokerError("REPLY_MISMATCH");
        resolve(reply); socket.end();
      } catch (error) { if (error instanceof Error) fail(error); else throw error; }
    });
  });
}
export function verifyArtifact(bytes: Uint8Array, expectedSha256: string): void {
  if (createHash("sha256").update(bytes).digest("hex") !== digest(expectedSha256)) throw new BrokerError("ARTIFACT_HASH_MISMATCH");
}
