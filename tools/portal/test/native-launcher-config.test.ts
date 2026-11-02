import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
	access,
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const node =
	"/Users/ilseoblee/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node";
const launcher = fileURLToPath(
	new URL("../install/start-personal-native.mjs", import.meta.url),
);

async function launch(
	environment: Record<string, unknown>,
	fault?: "hash" | "path" | "lock",
) {
	const root = await mkdtemp(
		join(await realpath(tmpdir()), "portal-native-launcher-"),
	);
	try {
		const serverPath = join(root, "server.mjs");
		const originalsDb = join(root, "originals.sqlite");
		const storagePath = join(root, "storage");
		const publicPath = join(root, "public");
		const lockPath = join(root, "portal-writer.lock");
		await mkdir(storagePath);
		await mkdir(publicPath);
		await writeFile(originalsDb, "synthetic-only");
		await writeFile(
			serverPath,
			`console.log("FIXTURE_IMPORTED=" + JSON.stringify({
        comfyui: process.env.PORTAL_COMFYUI ?? null,
        inherited: process.env.PORTAL_UNLISTED_INHERITED ?? null,
        mode: process.env.PORTAL_MODE
      }));`,
		);
		if (fault === "lock") await writeFile(lockPath, "existing-writer\n");
		const config = join(root, "launch.json");
		await writeFile(
			config,
			JSON.stringify({
				schema: "portal-native-launch.v1",
				serverPath: fault === "path" ? "server.mjs" : serverPath,
				serverSha256:
					fault === "hash"
						? "0".repeat(64)
						: createHash("sha256")
								.update(await readFile(serverPath))
								.digest("hex"),
				originalsDb,
				storagePath,
				publicPath,
				environment,
			}),
		);
		const child = spawn(node, [launcher, config], {
			stdio: ["ignore", "pipe", "pipe"],
			env: { PORTAL_COMFYUI: "true", PORTAL_UNLISTED_INHERITED: "discard" },
			timeout: 5_000,
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		const [code, signal] = await once(child, "close");
		const lockExists = await access(lockPath).then(
			() => true,
			() => false,
		);
		const lockContents = lockExists ? await readFile(lockPath, "utf8") : null;
		return { code, signal, stdout, stderr, lockExists, lockContents };
	} finally {
		await rm(root, { recursive: true, force: true });
	}
}

for (const value of [undefined, "true", "false"]) {
	test(`native launcher admits ComfyUI ${value ?? "omission"}`, async () => {
		const result = await launch(
			value === undefined ? {} : { PORTAL_COMFYUI: value },
		);
		expect(result.code).toBe(0);
		expect(result.signal).toBeNull();
		expect(result.stderr).toBe("");
		const imported = result.stdout
			.split("\n")
			.find((line) => line.startsWith("FIXTURE_IMPORTED="));
		expect(imported).toBeDefined();
		expect(
			JSON.parse(imported?.slice("FIXTURE_IMPORTED=".length) ?? "null"),
		).toEqual({
			comfyui: value ?? null,
			inherited: null,
			mode: "personal",
		});
		expect(result.lockExists).toBe(false);
	});
}

test("native launcher rejects invalid ComfyUI values and unknown keys before import", async () => {
	for (const environment of [
		...[
			true,
			false,
			null,
			0,
			1,
			"",
			"TRUE",
			"False",
			"1",
			" true",
			"false ",
			{},
			[],
		].map((value) => ({ PORTAL_COMFYUI: value })),
		{ PORTAL_UNKNOWN: "true" },
	]) {
		const result = await launch(environment);
		expect(result.code).toBe(1);
		expect(result.stderr).toContain("NATIVE_ENVIRONMENT_INVALID");
		expect(result.stdout).toBe("");
		expect(result.lockExists).toBe(false);
	}
});

for (const [fault, error] of [
	["hash", "NATIVE_SERVER_HASH_MISMATCH"],
	["path", "NATIVE_ABSOLUTE_PATH_REQUIRED"],
	["lock", "EEXIST"],
] as const) {
	test(`native launcher retains ${fault} gate with ComfyUI enabled`, async () => {
		const result = await launch({ PORTAL_COMFYUI: "true" }, fault);
		expect(result.code).toBe(1);
		expect(result.stderr).toContain(error);
		expect(result.stdout).toBe("");
		expect(result.lockContents).toBe(
			fault === "lock" ? "existing-writer\n" : null,
		);
	});
}
