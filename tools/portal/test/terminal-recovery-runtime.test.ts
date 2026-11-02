import { afterAll, beforeAll, expect, test } from "bun:test";
import { execFile } from "node:child_process";
import {
	cp,
	mkdtemp,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import {
	decodePng,
	encodePng,
} from "../../portrait/acceptance/src/png.ts";
import { hash } from "../src/sources.ts";
import { terminalRejectionFile } from "../src/terminal-rejections.ts";
import {
	fileHashes,
	jsonFile,
	recoveryFixture,
} from "./terminal-recovery-fixture.ts";

const exec = promisify(execFile);
let directory: string;
let worker: string;
beforeAll(async () => {
	directory = await realpath(
		await mkdtemp(
			join(process.env["RUN_TMP"] ?? tmpdir(), "recovery-runtime-"),
		),
	);
	worker = join(directory, "reader.mjs");
	const build = await Bun.build({
		entrypoints: [join(import.meta.dir, "terminal-recovery-runtime-worker.ts")],
		target: "node",
	});
	if (!build.success || !build.outputs[0])
		throw Error(`WORKER_BUILD_FAILED: ${build.logs}`);
	await writeFile(worker, await build.outputs[0].text());
});
afterAll(async () => {
	if (directory) await rm(directory, { recursive: true, force: true });
});

async function readInBothRuntimes(ownerRoot: string, requestId: string) {
	const results = [];
	for (const command of [
		[process.execPath, "--no-install", worker, ownerRoot, requestId],
		[
			process.env["TERMINAL_RECOVERY_NODE"] ?? "node",
			worker,
			ownerRoot,
			requestId,
		],
	]) {
		const executable = command[0];
		if (!executable) throw Error("MISSING_RUNTIME");
		const { stdout } = await exec(executable, command.slice(1), {
			timeout: 15000,
		});
		const output = JSON.parse(stdout);
		expect(output.result.job.state).toBe("FAILED");
		expect(output.result.event.modelAttestation).toBe("UNKNOWN");
		expect(output.result.event.imageAdoption).toBe("NONE");
		expect(output.retainedPixelsSHA256).toBe(output.recomputedPixelsSHA256);
		results.push({ command, ...output });
		console.log(JSON.stringify({ command, ...output }));
	}
	expect(results[0].runtime).toStartWith("Bun ");
	expect(results[1].runtime).toStartWith("Node v");
	expect(results[0].result).toEqual(results[1].result);
	expect(results[0].recomputedPixelsSHA256).toBe(
		results[1].recomputedPixelsSHA256,
	);
	return results;
}

test("actual Bun and Node CLIs fold the same copied event without encoding identity", async () => {
	const f = await recoveryFixture();
	try {
		expect((await f.post(f.route, await f.operation())).status).toBe(201);
		const copy = join(directory, "synthetic", "1");
		await cp(f.ownerRoot, copy, { recursive: true });
		const copyDir = join(copy, "jobs", f.id);
		const before = await fileHashes(copyDir);
		const results = await readInBothRuntimes(copy, f.id);
		// This is a real encoder differential, not a mock of the proof predicate.
		expect(results[0].recomputedSHA256).not.toBe(results[1].recomputedSHA256);
		expect(await fileHashes(copyDir)).toEqual(before);
		for (const name of [
			"reference-normalized.png",
			"provider-source.png.receipt.json",
		]) {
			const path = join(copyDir, name);
			const retained = await readFile(path);
			if (name === "reference-normalized.png") {
				const image = decodePng(retained);
				image.pixels[0] = 1;
				await writeFile(path, encodePng(image));
			} else {
				await jsonFile(copyDir, name, {
					...JSON.parse(retained.toString("utf8")),
					size: "340x510",
				});
			}
			for (const result of results) {
				await expect(
					exec(result.command[0], result.command.slice(1), {
						timeout: 15000,
					}),
				).rejects.toMatchObject({
					code: 1,
					stderr: expect.stringContaining("TERMINAL_REJECTION_PROOF_MISMATCH"),
				});
			}
			await writeFile(path, retained);
		}
		expect(await fileHashes(copyDir)).toEqual(before);
		expect(f.outbound).toBe(0);
	} finally {
		await f.close();
	}
}, 30000);

const committed = process.env["TERMINAL_RECOVERY_COMMITTED_JOB"];
const evidence = process.env["TERMINAL_RECOVERY_COMMITTED_EVIDENCE"];
if (committed && evidence) {
	test("actual Bun and Node read an exact committed original snapshot with historical pins", async () => {
		const trusted = JSON.parse(await readFile(evidence, "utf8"));
		const expected = {
			...trusted.original.priorPins,
			[terminalRejectionFile]: trusted.event.sha256,
		};
		expect(await fileHashes(committed)).toEqual(expected);
		const copy = join(directory, "retained", "1");
		const copyDir = join(copy, "jobs", basename(committed));
		await cp(committed, copyDir, { recursive: true });
		expect(await fileHashes(copyDir)).toEqual(expected);
		const results = await readInBothRuntimes(copy, basename(committed));
		expect(results[1].runtime).toStartWith("Node v26.");
		expect(results[0].recomputedSHA256).not.toBe(results[1].recomputedSHA256);
		expect(await fileHashes(copyDir)).toEqual(expected);
		expect(await fileHashes(committed)).toEqual(expected);
	}, 30000);
}

for (const kind of [
	"pixel",
	"alpha",
	"hidden-rgb",
	"geometry",
	"crc",
	"trailing",
	"source",
	"analysis",
	"receipt",
] as const) {
	test(`normalized semantic proof rejects ${kind} tampering even with synthetic caller pins`, async () => {
		const f = await recoveryFixture();
		try {
			const path = join(f.dir, "reference-normalized.png");
			const original = await readFile(path);
			const image = decodePng(original);
			if (kind === "pixel" || kind === "alpha" || kind === "hidden-rgb") {
				const center = (254 * 340 + 169) * 4;
				const index =
					kind === "hidden-rgb" ? 0 : center + (kind === "alpha" ? 3 : 0);
				image.pixels[index] = (image.pixels[index] ?? 0) ^ 1;
				await writeFile(path, encodePng(image));
			} else if (kind === "geometry") {
				await writeFile(
					path,
					encodePng({ width: 510, height: 340, pixels: image.pixels }),
				);
			} else if (kind === "crc") {
				original[29] = (original[29] ?? 0) ^ 1;
				await writeFile(path, original);
			} else if (kind === "trailing") {
				await writeFile(path, Buffer.concat([original, Buffer.from([0])]));
			} else if (kind === "source") {
				const source = JSON.parse(
					await readFile(join(f.dir, "source-bytes.json"), "utf8"),
				);
				source.image = Buffer.from(
					encodePng({
						width: 1,
						height: 1,
						pixels: new Uint8Array([41, 50, 60, 255]),
					}),
				).toString("base64");
				await jsonFile(f.dir, "source-bytes.json", source);
			} else if (kind === "analysis") {
				const analysis = JSON.parse(
					await readFile(join(f.dir, "reference-analysis.json"), "utf8"),
				);
				analysis.records.manifest.value.sourceSHA256 = "a".repeat(64);
				await jsonFile(f.dir, "reference-analysis.json", analysis);
			} else {
				const receipt = JSON.parse(
					await readFile(
						join(f.dir, "provider-source.png.receipt.json"),
						"utf8",
					),
				);
				receipt.size = "340x510";
				await jsonFile(f.dir, "provider-source.png.receipt.json", receipt);
			}
			const response = await f.post(f.route, await f.operation());
			expect(response.status).toBe(409);
			expect(await response.json()).toEqual({
				error: { code: "TERMINAL_REJECTION_PROOF_MISMATCH" },
			});
			expect((await fileHashes(f.dir))[terminalRejectionFile]).toBeUndefined();
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
}

test("even equivalent PNG bytes cannot replace the pinned retained encoding", async () => {
	const f = await recoveryFixture();
	try {
		const operation = await f.operation();
		const path = join(f.dir, "reference-normalized.png");
		const bytes = await readFile(path);
		// A valid empty ancillary chunk changes only encoding metadata, not pixels.
		const chunk = Buffer.from("00000000744558749642c585", "hex");
		const changed = Buffer.concat([
			bytes.subarray(0, 33),
			chunk,
			bytes.subarray(33),
		]);
		expect(hash(decodePng(changed).pixels)).toBe(hash(decodePng(bytes).pixels));
		await writeFile(path, changed);
		const response = await f.post(f.route, operation);
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: { code: "TERMINAL_REJECTION_CONFLICT" },
		});
	} finally {
		await f.close();
	}
});
