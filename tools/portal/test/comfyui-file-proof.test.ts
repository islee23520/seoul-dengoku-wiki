import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
	mossWorkflowAssets,
	verifyMossAssetProof,
} from "../src/comfyui-assets.ts";
import {
	COMFY_ENDPOINT,
	COMFY_ROOT,
	measureRemoteComfyFiles,
} from "../src/comfyui-file-proof.ts";
import {
	COMFY_FINISH_MODEL,
	COMFY_FINISH_NODES,
	verifyFinishingProof,
} from "../src/comfyui-finishing.ts";
import { createComfyProvider } from "../src/comfyui-provider.ts";
import { COMFY_SOURCE_WORKFLOW } from "../src/provider-models.ts";
import { finishingProof } from "./comfyui-finishing-fixture.ts";
import { sourceFixture, sourceTransport } from "./comfyui-source-fixture.ts";

const path = `${COMFY_ROOT}/models/background_removal/${COMFY_FINISH_MODEL.filename}`;
function response(command: string) {
	const script = Buffer.from(command, "base64").toString("utf16le");
	const encoded = script.match(/FromBase64String\('([A-Za-z0-9+/=]+)'\)/)?.[1];
	assert(encoded);
	const request = JSON.parse(Buffer.from(encoded, "base64").toString());
	return {
		schema: "comfy-native-ssh-files.v1",
		endpoint: request.endpoint,
		root: request.root,
		nonce: request.nonce,
		pid: 41224,
		processStarted: "2026-10-19T00:00:00Z",
		files: [
			{
				path,
				sha256: String(COMFY_FINISH_MODEL.sha256),
				bytes: Number(COMFY_FINISH_MODEL.bytes),
			},
		],
	};
}

test("remote measurement uses a fresh challenge and returns actual file hashes without local stat", async () => {
	const commands: string[] = [];
	const run = async (command: string) => {
		commands.push(command);
		return JSON.stringify(response(command));
	};
	const first = await measureRemoteComfyFiles([path], run);
	const second = await measureRemoteComfyFiles([path], run);
	expect(first.files[0]?.sha256).toBe(COMFY_FINISH_MODEL.sha256);
	expect(first.nonce).not.toBe(second.nonce);
	expect(commands).toHaveLength(2);
});

for (const mismatch of [
	"host",
	"root",
	"path",
	"nonce",
	"files",
	"hash",
	"pid",
] as const) {
	test(`remote proof rejects ${mismatch} mismatch`, async () => {
		const run = async (command: string) => {
			const proof = response(command);
			if (mismatch === "host") proof.endpoint = "http://127.0.0.1:8188";
			if (mismatch === "root") proof.root = "C:/substitute";
			if (mismatch === "path")
				proof.files[0] = {
					path: `${COMFY_ROOT}/other`,
					sha256: COMFY_FINISH_MODEL.sha256,
					bytes: COMFY_FINISH_MODEL.bytes,
				};
			if (mismatch === "nonce") proof.nonce = randomUUID();
			if (mismatch === "files") proof.files = [];
			if (mismatch === "hash")
				proof.files[0] = { path, sha256: "metadata-only", bytes: 1 };
			if (mismatch === "pid") proof.pid = 0;
			return JSON.stringify(proof);
		};
		await expect(measureRemoteComfyFiles([path], run)).rejects.toThrow();
	});
}

test("SSH failure fails closed without local filesystem fallback", async () => {
	await expect(
		measureRemoteComfyFiles([path], async () => {
			throw Error("Host key verification failed");
		}),
	).rejects.toThrow("Host key verification failed");
});

test("finishing proof rejects pinned summary with substituted remote file hash", () => {
	const proof = finishingProof();
	const remote = {
		schema: "comfy-native-ssh-files.v1",
		endpoint: COMFY_ENDPOINT,
		root: COMFY_ROOT,
		nonce: randomUUID(),
		pid: 41224,
		processStarted: "2026-10-19T00:00:00Z",
		files: [
			{ path, sha256: "0".repeat(64), bytes: COMFY_FINISH_MODEL.bytes },
			...Object.entries(COMFY_FINISH_NODES).map(([name, sha256]) => ({
				path: `${COMFY_ROOT}/${name}`,
				sha256,
				bytes: 100,
			})),
		],
	};
	expect(() => verifyFinishingProof({ ...proof, remote })).toThrow(
		"COMFY_FINISH_ASSET_MISMATCH",
	);
});

test("revoked authorization prevents remote measurement before readiness", async () => {
	let calls = 0;
	const provider = createComfyProvider({
		authorize: () => {
			throw Error("revoked");
		},
		measureFinishing: async () => {
			calls++;
			return finishingProof();
		},
	});
	await expect(provider.connect()).rejects.toThrow(
		"COMFY_CONNECTION_NOT_READY",
	);
	expect(calls).toBe(0);
});

test("runtime hash replacement after connect rejects before prompt or upload", async () => {
	let measurements = 0;
	const fixture = sourceTransport();
	const provider = createComfyProvider({
		authorize: (start) => start(),
		measureFinishing: async () => {
			measurements++;
			return verifyFinishingProof(
				measurements === 1
					? finishingProof()
					: {
							...finishingProof(),
							model: { ...finishingProof().model, sha256: "0".repeat(64) },
						},
			);
		},
		measureAssets: async (workflow = COMFY_SOURCE_WORKFLOW) =>
			verifyMossAssetProof(
				{
					schema: "moss-runtime-file-sha256.v1",
					method: "server-file-stream-sha256",
					assets: mossWorkflowAssets(workflow).map(
						({ path: _path, ...asset }) => asset,
					),
				},
				workflow,
			),
		transport: fixture.transport,
	});
	const connection = await provider.connect(COMFY_SOURCE_WORKFLOW);
	await expect(provider.generate(connection, sourceFixture())).rejects.toThrow(
		"COMFY_FINISH_ASSET_MISMATCH",
	);
	expect(fixture.paths).toEqual(["/system_stats", "/object_info"]);
	expect(measurements).toBe(2);
});
