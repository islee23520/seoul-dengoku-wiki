import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import {
	mkdir,
	mkdtemp,
	readFile,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { invokeManagement, operations } from "../src/management.ts";
import { indexWorkstationArtifact } from "../src/reference-validation.ts";
import {
	generatePortalWorkstation,
	parseWorkstationRequest,
	referenceKinds,
} from "../src/references.ts";
import { hash } from "../src/sources.ts";
import { workstationFixture } from "./references-fixture.ts";

test("v2 adapter indexes immutable category/person/parent/child frames and rejects tampering", async () => {
	for (const category of [
		"portrait",
		"fullbody-turntable",
		"torso",
		"detached-head",
		"head-without-hair-eyes-teeth",
		"hair",
		"underwear-only-torso",
	]) {
		const f = await workstationFixture(category);
		let calls = 0;
		try {
			const request = parseWorkstationRequest(f.request);
			expect(() =>
				parseWorkstationRequest({ ...f.request, shots: ["hair"] }),
			).toThrow();
			expect(() =>
				parseWorkstationRequest({
					...f.request,
					frames: [...f.request.frames].reverse().slice(1),
				}),
			).toThrow();
			const input = { ...f, request, ownerRoot: f.root };
			const transport = async (
				payload: import("../src/references.ts").WorkstationDispatch,
			) => {
				calls++;
				return {
					schemaVersion: 2,
					status: "SUCCEEDED",
					requestId: payload.requestId,
					binding: payload.binding,
					outputSpecSha256: payload.outputSpecSha256,
					pngBase64: f.png.toString("base64"),
					imageSha256: hash(f.png),
				};
			};
			const result = await generatePortalWorkstation(input, transport);
			expect(result.status).toBe("candidate-unreviewed");
			const query = {
				ownerRoot: f.root,
				personId: request.personId,
				parentRequestId: request.requestId,
			};
			const rows = await indexWorkstationArtifact(query);
			expect(rows).toHaveLength(request.frames.length);
			expect(rows[0]).toMatchObject({
				category,
				personId: request.personId,
				parentRequestId: request.requestId,
				semanticReview: "UNVERIFIED",
				approval: "NONE",
			});
			expect(Object.isFrozen(rows[0])).toBe(true);
			await expect(
				generatePortalWorkstation(input, transport),
			).rejects.toThrow();
			expect(calls).toBe(request.frames.length);
			await expect(
				indexWorkstationArtifact({ ...query, personId: "person-999" }),
			).rejects.toThrow();
			const directory = join(
				f.root,
				"workstations",
				request.personId,
				request.requestId,
			);
			await writeFile(join(directory, "frame-0.png"), "tampered");
			await expect(indexWorkstationArtifact(query)).rejects.toThrow();
		} finally {
			await rm(f.root, { recursive: true, force: true });
		}
	}
});

test("v2 decoded dimensions, background, alpha and crop failures stop remaining frames without retry", async () => {
	for (const mismatch of [
		"dimensions",
		"alpha",
		"crop",
		"background",
		"uuid",
	]) {
		const f = await workstationFixture("fullbody-turntable");
		let calls = 0;
		try {
			const request = structuredClone(parseWorkstationRequest(f.request));
			for (const frame of request.frames) {
				if (mismatch === "crop")
					frame.outputSpec.alignment.crop = [20, 0, 48, 64];
				if (mismatch === "background")
					frame.outputSpec.background = {
						kind: "solid",
						alpha: "opaque",
						rgb: [255, 255, 255],
					};
				frame.outputSpecSha256 = hash(
					Buffer.from(JSON.stringify(frame.outputSpec)),
				);
			}
			const pixels = new Uint8Array(48 * 64 * 4).fill(255);
			const png =
				mismatch === "dimensions"
					? Buffer.from(
							encodePng({
								width: 2,
								height: 2,
								pixels: new Uint8Array(16).fill(255),
							}),
						)
					: mismatch === "alpha"
						? Buffer.from(encodePng({ width: 48, height: 64, pixels }))
						: f.png;
			const input = { ...f, request, ownerRoot: f.root };
			const transport = async (
				payload: import("../src/references.ts").WorkstationDispatch,
			) => {
				calls++;
				return {
					schemaVersion: 2,
					status: "SUCCEEDED",
					requestId: mismatch === "uuid" ? randomUUID() : payload.requestId,
					binding: payload.binding,
					outputSpecSha256: payload.outputSpecSha256,
					pngBase64: png.toString("base64"),
					imageSha256: hash(png),
				};
			};
			expect((await generatePortalWorkstation(input, transport)).status).toBe(
				"UNKNOWN",
			);
			expect(calls).toBe(1);
			await expect(
				generatePortalWorkstation(input, transport),
			).rejects.toThrow();
			expect(calls).toBe(1);
			await expect(
				indexWorkstationArtifact({
					ownerRoot: f.root,
					personId: request.personId,
					parentRequestId: request.requestId,
				}),
			).rejects.toThrow();
		} finally {
			await rm(f.root, { recursive: true, force: true });
		}
	}
});

test("v2 reader rejects rehashed metadata, foreign source, owner paths and decoded pixel forgery", async () => {
	const f = await workstationFixture("hair");
	try {
		const request = parseWorkstationRequest(f.request);
		const input = { ...f, request, ownerRoot: f.root };
		let calls = 0;
		const transport = async (
			payload: import("../src/references.ts").WorkstationDispatch,
		) => {
			calls++;
			return {
				schemaVersion: 2,
				status: "SUCCEEDED",
				requestId: payload.requestId,
				binding: payload.binding,
				outputSpecSha256: payload.outputSpecSha256,
				pngBase64: f.png.toString("base64"),
				imageSha256: hash(f.png),
			};
		};
		await expect(
			generatePortalWorkstation(
				{ ...input, identity: { ...f.identity, personId: "person-999" } },
				transport,
			),
		).rejects.toThrow();
		expect(calls).toBe(0);
		await generatePortalWorkstation(input, transport);
		const query = {
			ownerRoot: f.root,
			personId: request.personId,
			parentRequestId: request.requestId,
		};
		const directory = join(
			f.root,
			"workstations",
			request.personId,
			request.requestId,
		);
		const manifestBytes = await readFile(join(directory, "set.json"));
		const receiptBytes = await readFile(
			join(directory, "frame-0.receipt.json"),
		);
		for (const mutate of [
			(r: { width: number; requestId: string; semanticReview: string }) => {
				r.width = 999;
			},
			(r: { width: number; requestId: string; semanticReview: string }) => {
				r.requestId = randomUUID();
			},
			(r: { width: number; requestId: string; semanticReview: string }) => {
				r.semanticReview = "APPROVED";
			},
		]) {
			const receipt = JSON.parse(receiptBytes.toString());
			mutate(receipt);
			const bytes = Buffer.from(JSON.stringify(receipt));
			const manifest = JSON.parse(manifestBytes.toString());
			manifest.frames[0].receiptSha256 = hash(bytes);
			await writeFile(join(directory, "frame-0.receipt.json"), bytes);
			await writeFile(join(directory, "set.json"), JSON.stringify(manifest));
			await expect(indexWorkstationArtifact(query)).rejects.toThrow();
		}
		await writeFile(join(directory, "frame-0.receipt.json"), receiptBytes);
		await writeFile(join(directory, "set.json"), manifestBytes);
		await rm(join(directory, "frame-0.png"));
		await symlink(join(f.root, "identity.png"), join(directory, "frame-0.png"));
		await expect(indexWorkstationArtifact(query)).rejects.toThrow();
		await expect(
			indexWorkstationArtifact({ ...query, parentRequestId: "../escape" }),
		).rejects.toThrow();
	} finally {
		await rm(f.root, { recursive: true, force: true });
	}
});

const pathKey = "PATH",
	evidenceKey = "TASK16_EVIDENCE";

export async function localReferenceFixture(root: string) {
	const directory = join(root, "references");
	await mkdir(directory);
	const png = Buffer.from(
		encodePng({ width: 2, height: 2, pixels: new Uint8Array(16).fill(255) }),
	);
	const binding = {
		parentRequestId: randomUUID(),
		connectionId: randomUUID(),
		personId: "person-1017",
		characterId: "K1017",
		providerModel: "gpt-image-2.5-sunburst",
		sourceSha256: hash(Buffer.from("controlled-source")),
		styleLockSha256: hash(Buffer.from("controlled-style")),
		styleReferenceSha256: hash(png),
		identityResultId: randomUUID(),
		identityReferenceSha256: hash(png),
		faceMode: { kind: "unique", variantId: null },
		faceVariant: null,
	};
	const shots = [];
	for (const shot of referenceKinds) {
		const requestId = randomUUID();
		const receipt = {
			schemaVersion: 1,
			requestId,
			shot,
			binding,
			status: "SUCCEEDED",
			imageName: `${shot}.png`,
			imageSha256: hash(png),
			width: 2,
			height: 2,
			channels: 4,
			visiblePixels: 4,
			continuitySha256: shot === "front" ? null : hash(png),
			reviewStatus: "candidate-unreviewed",
		};
		const bytes = JSON.stringify(receipt);
		await writeFile(join(directory, `${shot}.receipt.json`), bytes);
		await writeFile(join(directory, `${shot}.png`), png);
		shots.push({
			shot,
			requestId,
			status: "SUCCEEDED",
			receiptSha256: hash(Buffer.from(bytes)),
		});
	}
	const manifest = {
		schemaVersion: 1,
		kind: "image-reference-set",
		binding,
		order: [...referenceKinds],
		status: "candidate-unreviewed",
		shots,
		paidProof: "NOT_RUN",
	};
	await writeFile(join(directory, "set.json"), JSON.stringify(manifest));
	await writeFile(join(root, "outside.png"), png);
	return {
		directory,
		manifest,
		png,
		input: { artifactRoot: root, artifactDirectory: directory },
	};
}

test("local references.validate proves nine-shot integrity with no outbound or authority", async () => {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "reference-validation-")),
	);
	const f = await localReferenceFixture(root);
	const originalFetch = globalThis.fetch;
	let outbound = 0;
	globalThis.fetch = Object.assign(
		async () => {
			outbound++;
			throw Error("OUTBOUND_FORBIDDEN");
		},
		{ preconnect: originalFetch.preconnect },
	);
	try {
		expect(
			operations.find((item) => item.name === "references.validate"),
		).toMatchObject({
			effectClass: "LOCAL_ARTIFACT_READ",
			transports: ["cli", "mcp"],
		});
		const report = await invokeManagement("references.validate", f.input);
		expect(report).toMatchObject({
			ok: true,
			result: {
				verdict: "VALID",
				approval: "NONE",
				dispatch: "NONE",
				paidProof: "NOT_RUN",
				order: referenceKinds,
			},
		});
		for (const [name, change] of [
			[
				"missing-manifest",
				async () => {
					await rm(join(f.directory, "set.json"));
				},
			],
			[
				"malformed",
				async () => {
					await writeFile(join(f.directory, "set.json"), "{");
				},
			],
			[
				"schema",
				async () => {
					await writeFile(
						join(f.directory, "set.json"),
						JSON.stringify({ ...f.manifest, schemaVersion: 2 }),
					);
				},
			],
			[
				"order",
				async () => {
					await writeFile(
						join(f.directory, "set.json"),
						JSON.stringify({
							...f.manifest,
							order: [...referenceKinds].reverse(),
						}),
					);
				},
			],
			[
				"identity",
				async () => {
					await writeFile(
						join(f.directory, "set.json"),
						JSON.stringify({
							...f.manifest,
							binding: {
								...f.manifest.binding,
								identityResultId: randomUUID(),
							},
						}),
					);
				},
			],
			[
				"source",
				async () => {
					await writeFile(
						join(f.directory, "set.json"),
						JSON.stringify({
							...f.manifest,
							binding: {
								...f.manifest.binding,
								sourceSha256: hash(Buffer.from("other-source")),
							},
						}),
					);
				},
			],
			[
				"style",
				async () => {
					await writeFile(
						join(f.directory, "set.json"),
						JSON.stringify({
							...f.manifest,
							binding: {
								...f.manifest.binding,
								styleReferenceSha256: hash(Buffer.from("other-style")),
							},
						}),
					);
				},
			],
			[
				"png-tamper",
				async () => {
					await writeFile(join(f.directory, "hair.png"), "tampered");
				},
			],
			[
				"receipt-tamper",
				async () => {
					await writeFile(join(f.directory, "hair.receipt.json"), "{}");
				},
			],
			[
				"symlink",
				async () => {
					await rm(join(f.directory, "hair.png"));
					await symlink(
						join(root, "outside.png"),
						join(f.directory, "hair.png"),
					);
				},
			],
		] as const) {
			const receipt = await readFile(join(f.directory, "hair.receipt.json"));
			await change();
			const rejected = await invokeManagement("references.validate", f.input);
			expect(rejected, name).toMatchObject({
				ok: false,
				result: { verdict: "INVALID", approval: "NONE", dispatch: "NONE" },
			});
			await rm(join(f.directory, "hair.png"));
			await writeFile(join(f.directory, "hair.png"), f.png);
			await writeFile(join(f.directory, "hair.receipt.json"), receipt);
			await writeFile(
				join(f.directory, "set.json"),
				JSON.stringify(f.manifest),
			);
		}
		expect(
			await invokeManagement("references.validate", {
				...f.input,
				artifactDirectory: `${root}-outside`,
			}),
		).toMatchObject({ ok: false });
		expect(
			await invokeManagement("references.validate", {
				...f.input,
				url: "https://example.invalid",
			}),
		).toMatchObject({ ok: false, failures: [{ code: "INVALID_PARAMS" }] });
		expect(outbound).toBe(0);
	} finally {
		globalThis.fetch = originalFetch;
		await rm(root, { recursive: true, force: true });
	}
});

test("source-free installed CLI and MCP validate local artifacts and reject tampering", async () => {
	const root = await realpath(
		await mkdtemp(join(tmpdir(), "reference-installed-")),
	);
	const dist = fileURLToPath(new URL("../dist/", import.meta.url));
	const prefix = join(root, "install");
	const env = {
		HOME: root,
		PATH: process.env[pathKey],
		SSSTOOL_SERVER_URL: "https://outbound-forbidden.invalid/tools/",
	};
	async function run(command: string, args: string[]) {
		const child = spawn(command, args, {
			cwd: root,
			env,
			stdio: ["ignore", "pipe", "pipe"],
		});
		const exited = once(child, "close", { signal: AbortSignal.timeout(15000) });
		let stdout = "",
			stderr = "";
		child.stdout.on("data", (bytes) => {
			stdout += String(bytes);
		});
		child.stderr.on("data", (bytes) => {
			stderr += String(bytes);
		});
		const [code] = await exited;
		return { code, stdout, stderr };
	}
	try {
		const install = await run("/bin/sh", [
			join(dist, "install/ssstool.sh"),
			"--archive",
			join(dist, "ssstool-release.tar"),
			"--manifest",
			join(dist, "ssstool-manifest.json"),
			"--prefix",
			prefix,
		]);
		expect(install.code).toBe(0);
		const f = await localReferenceFixture(root);
		const cli = () =>
			run(join(prefix, "bin/ssstool"), [
				"references",
				"validate",
				"--artifact-root",
				root,
				"--artifact-directory",
				f.directory,
			]);
		const child = spawn("node", [join(prefix, "bin/launch.mjs"), "--mcp"], {
			cwd: root,
			env,
			stdio: ["pipe", "pipe", "pipe"],
		});
		const exited = once(child, "close", { signal: AbortSignal.timeout(15000) });
		const lines = createInterface({ input: child.stdout });
		let id = 0;
		async function call(method: string, params: object) {
			const response = once(lines, "line", {
				signal: AbortSignal.timeout(10000),
			});
			child.stdin.write(
				`${JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params })}\n`,
			);
			return JSON.parse(String((await response)[0]));
		}
		try {
			await call("initialize", {
				protocolVersion: "2025-11-25",
				capabilities: {},
				clientInfo: { name: "local-validation-proof", version: "1" },
			});
			child.stdin.write(
				`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
			);
			const catalog = await call("tools/list", {});
			expect(
				catalog.result.tools.some(
					(item: { name: string }) => item.name === "references.validate",
				),
			).toBe(true);
			const proof = [];
			for (const name of [
				"valid",
				"missing",
				"malformed",
				"identity",
				"tampered-png",
				"symlink",
			] as const) {
				if (name === "missing") await rm(join(f.directory, "set.json"));
				if (name === "malformed")
					await writeFile(join(f.directory, "set.json"), "{");
				if (name === "identity")
					await writeFile(
						join(f.directory, "set.json"),
						JSON.stringify({
							...f.manifest,
							binding: {
								...f.manifest.binding,
								identityResultId: randomUUID(),
							},
						}),
					);
				if (name === "tampered-png")
					await writeFile(join(f.directory, "hair.png"), "tampered");
				if (name === "symlink") {
					await rm(join(f.directory, "hair.png"));
					await symlink(
						join(root, "outside.png"),
						join(f.directory, "hair.png"),
					);
				}
				const actual = await cli();
				const report = JSON.parse(actual.stdout);
				const mcp = await call("tools/call", {
					name: "references.validate",
					arguments: f.input,
				});
				expect(mcp.result.structuredContent).toEqual(report);
				expect(actual.code).toBe(name === "valid" ? 0 : 1);
				expect(report.result).toMatchObject({
					verdict: name === "valid" ? "VALID" : "INVALID",
					approval: "NONE",
					dispatch: "NONE",
				});
				proof.push({ name, cli: actual, mcp });
				await writeFile(
					join(f.directory, "set.json"),
					JSON.stringify(f.manifest),
				);
				await rm(join(f.directory, "hair.png"));
				await writeFile(join(f.directory, "hair.png"), f.png);
			}
			if (process.env[evidenceKey])
				console.log(
					`TASK16_INSTALLED_VALIDATION ${JSON.stringify({ root, install, catalog, proof })}`,
				);
		} finally {
			child.stdin.end();
			await exited;
			lines.close();
		}
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
