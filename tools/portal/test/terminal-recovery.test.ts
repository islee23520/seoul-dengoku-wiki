import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
	mkdir,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { hash } from "../src/sources.ts";
import { terminalRejectionFile } from "../src/terminal-rejections.ts";
import {
	fileHashes,
	jsonFile,
	recoveryFixture,
	unresolvedBatch,
} from "./terminal-recovery-fixture.ts";

const resultSchema = z.object({
	created: z.boolean(),
	event: z.object({
		request: z.object({ operationId: z.uuid() }),
		modelAttestation: z.literal("UNKNOWN"),
		imageAdoption: z.literal("NONE"),
	}),
	job: z.object({
		state: z.string(),
		errorCode: z.string().nullable(),
		imageUrl: z.string().nullable(),
	}),
});
const leaseSchema = z.object({
	jobs: z.array(z.object({ id: z.string(), state: z.string() })),
	lease: z.object({
		admissionBlocked: z.boolean(),
		requestIds: z.array(z.string()),
		batchIds: z.array(z.string()),
	}),
});

test("explicit rejection commits once and every HTTP execution view folds it after restart", async () => {
	const f = await recoveryFixture();
	try {
		// Given retained complete rejection evidence and an authenticated owner.
		const before = await fileHashes(f.dir);
		const input = await f.operation();
		const payload = JSON.parse(
			await readFile(join(f.dir, "request-payload.json"), "utf8"),
		);
		expect(
			leaseSchema.parse(await (await f.get("/jobs")).json()).lease
				.admissionBlocked,
		).toBe(true);
		// When concurrent identical requests are submitted, only one event commits.
		const responses = await Promise.all([
			f.post(f.route, input),
			f.post(f.route, input),
		]);
		expect(responses.map((response) => response.status).sort()).toEqual([
			200, 201,
		]);
		const results = await Promise.all(
			responses.map(async (response) =>
				resultSchema.parse(await response.json()),
			),
		);
		expect(results[0]?.event).toEqual(results[1]?.event);
		// Then no evidence is replaced and all views use FAILED without an image.
		for (const result of results)
			expect(result.job).toMatchObject({
				state: "FAILED",
				errorCode: "LOCAL_MODEL_NOT_EXPOSED",
				imageUrl: null,
			});
		await f.restart();
		for (const response of [
			await f.get(`/jobs/${f.id}`),
			await f.post("/generations", payload),
		])
			expect(await response.json()).toMatchObject({ job: { state: "FAILED" } });
		const inspection = await (await f.get(`/jobs/${f.id}/inspection`)).json();
		expect(inspection).toMatchObject({
			inspection: {
				job: { state: "FAILED" },
				terminalRejection: { modelAttestation: "UNKNOWN" },
				history: [{ job: { state: "RUNNING" } }, { job: { state: "UNKNOWN" } }],
			},
		});
		expect(
			leaseSchema.parse(await (await f.get("/jobs")).json()).lease
				.admissionBlocked,
		).toBe(false);
		expect((await f.get(`/jobs/${f.id}/image`)).status).toBe(404);
		expect((await f.get(`/jobs/${f.id}/result`)).status).toBe(409);
		expect((await f.post(f.route, input)).status).toBe(200);
		expect(
			(await f.post(f.route, { ...input, operationId: randomUUID() })).status,
		).toBe(409);
		expect(
			(
				await f.post(f.route, {
					...input,
					expectedResponseSHA256: "0".repeat(64),
				})
			).status,
		).toBe(409);
		const after = await fileHashes(f.dir);
		for (const [name, digest] of Object.entries(before))
			expect(after[name]).toBe(digest);
		expect(Object.keys(after).filter((name) => !(name in before))).toEqual([
			terminalRejectionFile,
		]);
		expect(f.outbound).toBe(0);
	} finally {
		await f.close();
	}
}, 15000);

for (const field of [
	"expectedJobSHA256",
	"expectedPayloadSHA256",
	"expectedReceiptSHA256",
	"expectedRequestSHA256",
	"expectedResponseSHA256",
] as const) {
	test(`stale ${field} cannot publish a terminal event`, async () => {
		const f = await recoveryFixture();
		try {
			const before = await fileHashes(f.dir);
			const response = await f.post(f.route, {
				...(await f.operation()),
				[field]: "0".repeat(64),
			});
			expect(response.status).toBe(409);
			expect(await response.json()).toEqual({
				error: { code: "TERMINAL_REJECTION_CONFLICT" },
			});
			expect(await fileHashes(f.dir)).toEqual(before);
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
}

test("signed session, exact Origin and CSRF, and owner directory are mandatory", async () => {
	const f = await recoveryFixture();
	try {
		const input = await f.operation();
		const before = await fileHashes(f.dir);
		expect(
			(
				await fetch(`${f.origin}/tools/api${f.route}`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(input),
				})
			).status,
		).toBe(401);
		expect(
			(
				await f.post(f.route, input, {
					...f.headers(),
					"x-csrf-token": "wrong",
				})
			).status,
		).toBe(403);
		expect(
			(
				await f.post(f.route, input, {
					...f.headers(),
					origin: "https://foreign.example",
				})
			).status,
		).toBe(403);
		expect((await f.post(f.route, input, f.headers("2"))).status).toBe(404);
		expect((await f.post(f.route, { ...input, state: "FAILED" })).status).toBe(
			422,
		);
		expect(
			(await f.post(f.route, { ...input, responsePath: "/tmp/forged" })).status,
		).toBe(422);
		expect(await fileHashes(f.dir)).toEqual(before);
	} finally {
		await f.close();
	}
});

for (const kind of [
	"network",
	"partial",
	"invalid-json",
	"invalid-utf8",
	"invalid-envelope",
	"invalid-image-data",
	"non-2xx",
	"returned-model",
	"receipt-owner",
	"payload-id",
	"initial-id",
	"receipt-id",
	"request-tamper",
	"response-tamper",
	"candidate",
	"result",
	"evaluation",
	"batch-marker",
	"batch-membership",
	"legacy",
	"token",
	"comfy",
	"success",
	"running",
] as const) {
	test(`recovery rejects ${kind} evidence even with freshly calculated caller hashes`, async () => {
		const f = await recoveryFixture();
		try {
			const job = JSON.parse(await readFile(join(f.dir, "job.json"), "utf8"));
			const receipt = JSON.parse(
				await readFile(join(f.dir, "provider-source.png.receipt.json"), "utf8"),
			);
			const payload = JSON.parse(
				await readFile(join(f.dir, "request-payload.json"), "utf8"),
			);
			switch (kind) {
				case "network":
					await jsonFile(f.dir, "provider-source.png.receipt.json", {
						...receipt,
						status: "unknown",
						failure: "NETWORK_FAILURE",
					});
					break;
				case "partial":
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						'{"data":',
					);
					break;
				case "invalid-json":
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						"not JSON",
					);
					break;
				case "invalid-utf8":
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						Buffer.from([0xff]),
					);
					break;
				case "invalid-envelope":
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						JSON.stringify({ data: [] }),
					);
					break;
				case "invalid-image-data":
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						JSON.stringify({ data: [{ b64_json: "not-base64" }] }),
					);
					break;
				case "non-2xx":
					await jsonFile(f.dir, "provider-source.png.receipt.json", {
						...receipt,
						status: 500,
					});
					break;
				case "returned-model": {
					const bytes = Buffer.from(
						JSON.stringify({ model: "gpt-image-2.5-sunburst" }),
					);
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						bytes,
					);
					await jsonFile(f.dir, "provider-source.png.receipt.json", {
						...receipt,
						responseBodySHA256: hash(bytes),
					});
					break;
				}
				case "receipt-owner": {
					const binding = JSON.parse(
						await readFile(join(f.dir, "connection-binding.json"), "utf8"),
					);
					await jsonFile(f.dir, "connection-binding.json", {
						...binding,
						ownerId: "2",
					});
					break;
				}
				case "payload-id":
					await jsonFile(f.dir, "request-payload.json", {
						...payload,
						requestId: randomUUID(),
					});
					break;
				case "initial-id":
					await jsonFile(f.dir, "initial-job.json", {
						...job,
						state: "RUNNING",
						errorCode: null,
						id: randomUUID(),
					});
					break;
				case "receipt-id":
					await jsonFile(f.dir, "provider-source.png.receipt.json", {
						...receipt,
						requestId: randomUUID(),
					});
					break;
				case "request-tamper":
					await writeFile(
						join(f.dir, "provider-source.png.request.bin"),
						"tampered",
					);
					break;
				case "response-tamper":
					await writeFile(
						join(f.dir, "provider-source.png.response.bin"),
						"{}",
					);
					break;
				case "candidate":
					await writeFile(join(f.dir, "candidate.png"), "candidate");
					break;
				case "result":
					await jsonFile(f.dir, "result.json", {});
					break;
				case "evaluation":
					await mkdir(join(f.dir, "evaluations"));
					break;
				case "batch-marker":
					await jsonFile(f.dir, "batch-binding.json", {});
					break;
				case "batch-membership":
					await unresolvedBatch(f.ownerRoot, f.id);
					break;
				case "legacy": {
					const { schemaVersion: _schemaVersion, ...legacy } = payload;
					await jsonFile(f.dir, "request-payload.json", legacy);
					break;
				}
				case "token":
					await jsonFile(f.dir, "request-payload.json", {
						...payload,
						inputMode: "token-only",
						sourceSelection: {
							kind: "intentional-absence",
							reason: "no-reference-available",
						},
					});
					break;
				case "comfy":
					await jsonFile(f.dir, "request-payload.json", {
						...payload,
						provider: "comfyui",
					});
					break;
				case "success":
					await jsonFile(f.dir, "job.json", {
						...job,
						state: "HOLD",
						imageUrl: "/image",
						errorCode: null,
					});
					break;
				case "running":
					await jsonFile(f.dir, "job.json", {
						...job,
						state: "RUNNING",
						errorCode: null,
					});
					break;
			}
			if (
				[
					"partial",
					"invalid-json",
					"invalid-utf8",
					"invalid-envelope",
					"invalid-image-data",
				].includes(kind)
			)
				await jsonFile(f.dir, "provider-source.png.receipt.json", {
					...receipt,
					responseBodySHA256: hash(
						await readFile(join(f.dir, "provider-source.png.response.bin")),
					),
				});
			// Given caller hashes match the mutated files; server proof must still fail.
			if (kind === "evaluation")
				await rm(join(f.dir, "evaluations"), { recursive: true });
			const input = await f.operation();
			if (kind === "evaluation") await mkdir(join(f.dir, "evaluations"));
			const originalJob = await readFile(join(f.dir, "job.json"));
			const response = await f.post(f.route, input);
			expect(response.status).toBe(409);
			expect(await readFile(join(f.dir, "job.json"))).toEqual(originalJob);
			expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
}

test("retained file symlinks cannot supply recovery proof", async () => {
	const f = await recoveryFixture();
	try {
		const input = await f.operation();
		const path = join(f.dir, "provider-source.png.response.bin");
		const external = join(f.directory, "outside.bin");
		await writeFile(external, await readFile(path));
		await rm(path);
		await symlink(external, path);
		expect((await f.post(f.route, input)).status).not.toBe(201);
		expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
	} finally {
		await f.close();
	}
});

for (const kind of ["job", "batch"] as const) {
	test(`a different unresolved ${kind} still blocks admission after recovery`, async () => {
		const f = await recoveryFixture();
		try {
			const otherId = randomUUID();
			if (kind === "job") {
				const otherDir = join(f.ownerRoot, "jobs", otherId);
				await mkdir(otherDir);
				await jsonFile(otherDir, "job.json", {
					id: otherId,
					state: "UNKNOWN",
					reviewStatus: "HOLD",
					imageUrl: null,
					metrics: null,
					errorCode: "LOCAL_NETWORK_FAILURE",
					payloadSHA: "a".repeat(64),
				});
			} else await unresolvedBatch(f.ownerRoot, otherId);
			expect((await f.post(f.route, await f.operation())).status).toBe(201);
			const listing = leaseSchema.parse(await (await f.get("/jobs")).json());
			expect(listing.lease.admissionBlocked).toBe(true);
			expect(listing.lease.requestIds).not.toContain(f.id);
			const payload = JSON.parse(
				await readFile(join(f.dir, "request-payload.json"), "utf8"),
			);
			const denied = await f.post("/generations", {
				...payload,
				requestId: randomUUID(),
			});
			expect(denied.status).toBe(409);
			expect(await denied.json()).toMatchObject({
				error: { code: "OWNER_DISPATCH_UNCERTAIN" },
			});
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
}

for (const point of ["before-commit", "after-commit"] as const) {
	test(`restart at ${point} yields only the original job or one complete committed event`, async () => {
		let fired = false;
		const f = await recoveryFixture({
			checkpoint: async (current) => {
				if (current === point && !fired) {
					fired = true;
					throw Error("SIMULATED_PROCESS_STOP");
				}
			},
		});
		try {
			const input = await f.operation();
			const before = await fileHashes(f.dir);
			expect((await f.post(f.route, input)).status).toBe(400);
			await f.restart();
			const listing = leaseSchema.parse(await (await f.get("/jobs")).json());
			expect(listing.jobs[0]?.state).toBe(
				point === "before-commit" ? "UNKNOWN" : "FAILED",
			);
			expect(listing.lease.admissionBlocked).toBe(point === "before-commit");
			const replay = await f.post(f.route, input);
			expect(replay.status).toBe(point === "before-commit" ? 201 : 200);
			const after = await fileHashes(f.dir);
			for (const [name, digest] of Object.entries(before))
				expect(after[name]).toBe(digest);
			expect(Object.keys(after).filter((name) => !(name in before))).toEqual([
				terminalRejectionFile,
			]);
		} finally {
			await f.close();
		}
	});
}

test("different concurrent operations cannot both commit and owner remains excluded before commit", async () => {
	const entered = Promise.withResolvers<void>();
	const release = Promise.withResolvers<void>();
	const f = await recoveryFixture({
		checkpoint: async (point) => {
			if (point === "before-commit") {
				entered.resolve();
				await release.promise;
			}
		},
	});
	try {
		const input = await f.operation();
		const first = f.post(f.route, input);
		await entered.promise;
		expect(
			leaseSchema.parse(await (await f.get("/jobs")).json()).lease
				.admissionBlocked,
		).toBe(true);
		const payload = JSON.parse(
			await readFile(join(f.dir, "request-payload.json"), "utf8"),
		);
		expect(
			(await f.post("/generations", { ...payload, requestId: randomUUID() }))
				.status,
		).toBe(409);
		const second = f.post(f.route, { ...input, operationId: randomUUID() });
		release.resolve();
		expect((await first).status).toBe(201);
		expect((await second).status).toBe(409);
		expect(
			(await readdir(f.dir)).filter((name) => name === terminalRejectionFile),
		).toHaveLength(1);
	} finally {
		release.resolve();
		await f.close();
	}
});

test("missing retained proof after commit fails closed in list, admission, and replay", async () => {
	const f = await recoveryFixture();
	try {
		expect((await f.post(f.route, await f.operation())).status).toBe(201);
		await rm(join(f.dir, "provider-source.png.response.bin"));
		expect((await f.get("/jobs")).status).toBe(409);
		const payload = JSON.parse(
			await readFile(join(f.dir, "request-payload.json"), "utf8"),
		);
		expect((await f.post("/generations", payload)).status).toBe(409);
		expect(
			(await f.post("/generations", { ...payload, requestId: randomUUID() }))
				.status,
		).toBe(409);
		expect(f.outbound).toBe(0);
	} finally {
		await f.close();
	}
});

test("proof changed after validation cannot cross the commit CAS", async () => {
	const entered = Promise.withResolvers<void>();
	const release = Promise.withResolvers<void>();
	const f = await recoveryFixture({
		checkpoint: async (point) => {
			if (point === "before-commit") {
				entered.resolve();
				await release.promise;
			}
		},
	});
	try {
		const pending = f.post(f.route, await f.operation());
		await entered.promise;
		await writeFile(
			join(f.dir, "provider-source.png.response.bin"),
			"changed after proof read",
		);
		release.resolve();
		const response = await pending;
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: { code: "TERMINAL_REJECTION_CONFLICT" },
		});
		expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
		expect(await (await f.get(`/jobs/${f.id}`)).json()).toMatchObject({
			job: { state: "UNKNOWN" },
		});
	} finally {
		release.resolve();
		await f.close();
	}
});

test("logout during proof checking revokes commit authority", async () => {
	const entered = Promise.withResolvers<void>();
	const release = Promise.withResolvers<void>();
	const f = await recoveryFixture({
		checkpoint: async (point) => {
			if (point === "before-commit") {
				entered.resolve();
				await release.promise;
			}
		},
	});
	try {
		const headers = f.headers();
		const pending = f.post(f.route, await f.operation(), headers);
		await entered.promise;
		expect((await f.post("/auth/logout", {}, headers)).status).toBe(200);
		release.resolve();
		expect((await pending).status).toBe(401);
		expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
		expect(await (await f.get(`/jobs/${f.id}`)).json()).toMatchObject({
			job: { state: "UNKNOWN" },
		});
	} finally {
		release.resolve();
		await f.close();
	}
});
