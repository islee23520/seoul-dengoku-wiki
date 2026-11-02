import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createLocalAiJobs } from "../src/local-ai-jobs.ts";

test("catalog cannot claim active maintenance when the real owner only validates configuration", async () => {
	// Given real pinned configuration and a controller that must never start.
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "local-ai-admission-")),
	);
	let jobs: Awaited<ReturnType<typeof createLocalAiJobs>> | undefined;
	try {
		const node = process.env["BROKER_NODE"];
		if (!node) throw new Error("BROKER_NODE_REQUIRED");
		const owner = resolve(
			import.meta.dir,
			"../../local-ai/worker-broker-owner.mjs",
		);
		const lease = resolve(
			import.meta.dir,
			"../../local-ai/gpu-maintenance.mjs",
		);
		const pin = async (path: string) =>
			createHash("sha256")
				.update(await readFile(path))
				.digest("hex");
		const maintenance = join(root, "maintenance.json");
		await writeFile(
			maintenance,
			JSON.stringify({
				version: 1,
				leasePort: 32187,
				approval: {
					id: "configuration-only",
					instances: ["not-a-live-instance"],
					directSubmissionsPaused: true,
					autoLaunchersPaused: true,
					restoreConfirmed: true,
				},
				controller: {
					executable: node,
					sha256: await pin(node),
					argv: ["--version"],
					cwd: dirname(node),
					pins: [{ path: owner, sha256: await pin(owner) }],
				},
			}),
		);
		const config = join(root, "owner.json");
		await writeFile(
			config,
			JSON.stringify({
				LeaseModule: lease,
				LeaseModuleSha256: await pin(lease),
				MaintenanceConfig: maintenance,
			}),
		);
		jobs = await createLocalAiJobs({
			storagePath: root,
			catalogPath: null,
			catalog: [
				{
					tool: "unimate",
					assets: ["fixture"],
					missingModels: [],
					unsupportedRuntime: false,
					licenseRequired: false,
					error: null,
				},
			],
			worker: async (request) => {
				if (request.op !== "admission")
					throw new Error("NO_DISPATCH_AUTHORIZED");
				const child = spawn(node, [owner, config], {
					stdio: ["pipe", "pipe", "pipe"],
				});
				const completed = new Promise<number | null>((done, reject) => {
					child.once("error", reject);
					child.once("close", done);
				});
				let stdout = "";
				child.stdout.on("data", (chunk: Buffer) => {
					stdout += chunk.toString();
				});
				child.stderr.resume();
				child.stdin.write('{"op":"admission"}\n');
				expect(await completed).toBe(0);
				expect(JSON.parse(stdout)).toEqual({ exitCode: 0 });
				return { version: 1, op: "admission", configurationEligible: true };
			},
		});
		// When a read-only catalog query exercises actual owner config validation.
		const catalog = await jobs.catalog();
		// Then eligibility is useful, but never an active approved-window proof.
		expect(catalog.find((entry) => entry.tool === "unimate")).toMatchObject({
			configurationEligible: true,
			maintenanceReady: false,
			ready: false,
		});
	} finally {
		await jobs?.close();
		await rm(root, { recursive: true, force: true });
	}
});
