import { expect, spyOn, test } from "bun:test";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import {
	ComfyError,
	comfyCompletionRequestSchema,
	createComfyProvider,
} from "../src/comfyui-provider.ts";
import { hash } from "../src/sources.ts";
import { completionFixture } from "./comfy-completion-fixture.ts";
import { sourceFixture, sourceTransport } from "./comfyui-source-fixture.ts";

const jobBody = z.object({ job: z.object({ state: z.string() }) });
const recoveryBody = jobBody.extend({
	event: z.object({ qualityApproval: z.string() }),
});
const inspectionBody = z.object({
	inspection: z.object({
		comfyCompletion: z.object({ qualityApproval: z.string() }),
	}),
});
const leaseBody = z.object({
	lease: z.object({ admissionBlocked: z.boolean() }),
});

for (const name of ["AbortError", "TimeoutError", "unrelated"] as const) {
	test(`typed HTTP diagnostic preserves recovery uncertainty for ${name}`, async () => {
		const controller = new AbortController();
		const original =
			name === "unrelated"
				? Object.assign(Error("unrelated failure"), { name: "TimeoutError" })
				: new DOMException("Request stopped", name);
		controller.abort(original);
		const provider = createComfyProvider({
			authorize: (start) => start(),
			transport: {
				async fetch() {
					controller.signal.throwIfAborted();
					throw Error("UNREACHABLE");
				},
				webSocket() {
					throw Error("UNEXPECTED_SOCKET");
				},
			},
		});
		const promptId = "4d504628-e9dc-4559-9b57-387f5755ac1e";
		try {
			await provider.recoverSource(sourceFixture(), {
				schema: "comfy-completion-recovery.v1",
				jobSHA256: "0".repeat(64),
				promptId,
				clientId: promptId,
				historySHA256: "0".repeat(64),
				outputSHA256: {
					"9": "0".repeat(64),
					"11": "0".repeat(64),
					"15": "0".repeat(64),
					"16": "0".repeat(64),
				},
			});
			throw Error("EXPECTED_REJECTION");
		} catch (error) {
			if (name === "unrelated") expect(error).toBe(original);
			else {
				expect(error).toBeInstanceOf(ComfyError);
				expect(error).toMatchObject({
					code:
						name === "TimeoutError"
							? "COMFY_HTTP_TIMEOUT"
							: "COMFY_HTTP_ABORTED",
					uncertain: true,
					promptId,
				});
			}
		}
	});
}

test("shared completion verifies source receipt and recovers with read-only provider calls", async () => {
	const source = sourceFixture(),
		transport = sourceTransport();
	const connection = await transport.provider.connect(
		"moss-image-sft-source-img2img.alpha.v1",
	);
	const original = await transport.provider.generate(connection, source);
	if (!original.finishingImages) throw Error("FIXTURE_FINISHING_MISSING");
	const pins = comfyCompletionRequestSchema.parse({
		schema: "comfy-completion-recovery.v1",
		jobSHA256: "0".repeat(64),
		promptId: original.provenance.promptId,
		clientId: JSON.parse(original.requestBytes.toString()).client_id,
		historySHA256: hash(original.historyBytes),
		outputSHA256: {
			"9": hash(original.nativeBytes),
			"11": hash(original.finishingImages.maskBytes),
			"15": hash(original.finishingImages.rawMaskBytes),
			"16": hash(original.finishingImages.rawBytes),
		},
	});
	const calls = transport.paths.length;
	const recovered = await transport.provider.recoverSource(source, pins);
	expect(hash(recovered.bytes)).toBe(hash(original.bytes));
	expect(
		transport.paths
			.slice(calls)
			.every(
				(path) => path.startsWith("/history/") || path.startsWith("/view?"),
			),
	).toBe(true);
	expect(transport.prompts).toHaveLength(1);
	expect(transport.uploads).toHaveLength(1);
});

// Local actual-evidence suite, explicitly enabled like terminal-recovery-copy.
if (
	process.env["COMFY_COMPLETION_EVIDENCE"] &&
	process.env["COMFY_COMPLETION_RETAINED"]
) {
	for (const name of ["AbortError", "TimeoutError"] as const)
		for (const phase of ["history-fetch", "output-body"] as const)
			test(`typed HTTP diagnostic ${name} at ${phase} retains admission block`, async () => {
				const deadlines: AbortController[] = [];
				const f = await completionFixture({
					readResponse: (url, signal) => {
						const target =
							phase === "history-fetch"
								? url.includes("/history/")
								: url.includes("type=output");
						if (!target) return;
						const controller = deadlines.find(
							(entry) => entry.signal === signal,
						);
						if (!controller) throw Error("MISSING_HTTP_DEADLINE");
						const abort = () =>
							controller.abort(new DOMException("Request stopped", name));
						if (phase === "history-fetch") {
							abort();
							signal.throwIfAborted();
						}
						return new Response(
							new ReadableStream({
								start(stream) {
									signal.addEventListener(
										"abort",
										() => stream.error(signal.reason),
										{ once: true },
									);
								},
								pull() {
									abort();
								},
							}),
						);
					},
				});
				const timeout = spyOn(AbortSignal, "timeout").mockImplementation(() => {
					const controller = new AbortController();
					deadlines.push(controller);
					return controller.signal;
				});
				try {
					const response = await f.post();
					expect(response.status).toBe(400);
					expect(await response.json()).toEqual({
						error: {
							code:
								name === "TimeoutError"
									? "COMFY_HTTP_TIMEOUT"
									: "COMFY_HTTP_ABORTED",
						},
					});
					expect((await readdir(f.dir)).includes("comfy-completion.v1")).toBe(
						false,
					);
					expect(
						leaseBody.parse(await (await f.get("/jobs")).json()).lease
							.admissionBlocked,
					).toBe(true);
					expect(
						jobBody.parse(await (await f.get(`/jobs/${f.id}`)).json()).job
							.state,
					).toBe("UNKNOWN");
					expect(f.state.calls.length).toBe(phase === "history-fetch" ? 1 : 3);
					expect(f.state.externalGeneration).toBe(0);
					expect(f.state.calls.every((call) => call.startsWith("GET "))).toBe(
						true,
					);
				} finally {
					timeout.mockRestore();
					await f.close();
				}
			}, 120000);

	test("portal recovery gives output reads a fresh deadline after SSH measurement expires the input deadline", async () => {
		const f = await completionFixture({
			beforeAssetMeasurement: () => {
				for (const controller of deadlines)
					controller.abort(
						new DOMException("The operation timed out.", "TimeoutError"),
					);
			},
		});
		const deadlines: AbortController[] = [];
		const timeout = spyOn(AbortSignal, "timeout").mockImplementation(() => {
			const controller = new AbortController();
			deadlines.push(controller);
			return controller.signal;
		});
		try {
			expect((await f.post()).status).toBe(201);
			expect(deadlines[0]?.signal.aborted).toBe(true);
			expect((await f.get(`/jobs/${f.id}/result`)).status).toBe(200);
			expect(f.state.calls.length).toBe(6);
			expect(f.state.externalGeneration).toBe(0);
			await f.restart();
			expect((await f.post()).status).toBe(200);
			expect(f.state.calls.length).toBe(6);
		} finally {
			timeout.mockRestore();
			await f.close();
		}
	}, 120000);

	for (const artifact of [
		"result.json",
		"result-snapshot.json",
		"evaluations",
		"candidate.png",
		"unknown-proof.json",
	]) {
		for (const when of ["before-request", "before-commit"] as const) {
			test(`closed recovery inventory rejects ${artifact} ${when} without publication`, async () => {
				let f: Awaited<ReturnType<typeof completionFixture>>;
				const inject = async () => {
					if (artifact === "evaluations") {
						await mkdir(join(f.dir, artifact));
						await writeFile(join(f.dir, artifact, "foreign.json"), "{}");
					} else
						await writeFile(
							join(f.dir, artifact),
							JSON.stringify({ schema: "foreign-result.v1" }),
						);
				};
				f = await completionFixture({
					checkpoint: async (point) => {
						if (when === "before-commit" && point === "before-commit")
							await inject();
					},
				});
				try {
					if (when === "before-request") await inject();
					expect((await f.post()).status).toBe(409);
					expect((await readdir(f.dir)).includes("comfy-completion.v1")).toBe(
						false,
					);
					expect(
						jobBody.parse(await (await f.get(`/jobs/${f.id}`)).json()).job
							.state,
					).toBe("UNKNOWN");
					expect(
						leaseBody.parse(await (await f.get("/jobs")).json()).lease
							.admissionBlocked,
					).toBe(true);
					expect((await f.get(`/jobs/${f.id}/image`)).status).toBe(404);
					expect(f.state.calls.length).toBe(when === "before-request" ? 0 : 6);
					expect(f.state.externalGeneration).toBe(0);
				} finally {
					await f.close();
				}
			}, 120000);
		}
	}
	test("native HTTP history pin is exact and saved-file LF is not normalized", async () => {
		const f = await completionFixture();
		try {
			expect(f.state.historyBytes.length).toBe(5269);
			expect(f.request.historySHA256).toBe(
				"127f3bd7739d640bbe3b59351b18af44459f6076d59d90f5735461e7bcab9615",
			);
			const artifact = await readFile(
				join(
					process.env["COMFY_COMPLETION_EVIDENCE"] ?? "",
					"task-9-source025-actual-history.json",
				),
			);
			expect(artifact.length).toBe(5270);
			expect(JSON.parse(artifact.toString())).toEqual(
				JSON.parse(f.state.historyBytes.toString()),
			);
			expect(
				(await f.post({ ...f.request, historySHA256: hash(artifact) })).status,
			).toBe(400);
			expect((await readdir(f.dir)).includes("comfy-completion.v1")).toBe(
				false,
			);
			expect(
				leaseBody.parse(await (await f.get("/jobs")).json()).lease
					.admissionBlocked,
			).toBe(true);
			expect((await f.post()).status).toBe(201);
			expect(
				await readFile(
					join(f.dir, "comfy-completion.v1", "comfy-history.json"),
				),
			).toEqual(f.state.historyBytes);
			expect((await f.get(`/jobs/${f.id}/result`)).status).toBe(200);
			expect(f.state.externalGeneration).toBe(0);
		} finally {
			await f.close();
		}
	}, 120000);
	for (const name of ["candidate.png", "result.json"])
		test(`staging artifact ${name} cannot change before atomic publication`, async () => {
			let f: Awaited<ReturnType<typeof completionFixture>>;
			f = await completionFixture({
				checkpoint: async (point) => {
					if (point !== "before-commit") return;
					const stage = (await readdir(f.dir)).find(
						(entry) =>
							entry.startsWith(".comfy-completion-") && entry.endsWith(".tmp"),
					);
					if (!stage) throw Error("STAGE_MISSING");
					await writeFile(join(f.dir, stage, name), "foreign-stage-artifact");
				},
			});
			try {
				expect((await f.post()).status).toBe(409);
				expect((await readdir(f.dir)).includes("comfy-completion.v1")).toBe(
					false,
				);
				expect(
					leaseBody.parse(await (await f.get("/jobs")).json()).lease
						.admissionBlocked,
				).toBe(true);
				expect(f.state.externalGeneration).toBe(0);
			} finally {
				await f.close();
			}
		}, 120000);
	test("actual retained COPY and real HTTP recover HOLD, replay concurrently and restart without external generation", async () => {
		const f = await completionFixture();
		try {
			const before = await readFile(join(f.dir, "job.json"));
			expect(
				jobBody.parse(await (await f.get(`/jobs/${f.id}`)).json()).job.state,
			).toBe("UNKNOWN");
			const results = await Promise.all([f.post(), f.post()]);
			const bodies = await Promise.all(
				results.map(async (result) => recoveryBody.parse(await result.json())),
			);
			expect(results.map((result) => result.status).sort()).toEqual([200, 201]);
			expect(
				bodies.every(
					(body) =>
						body.job.state === "HOLD" && body.event.qualityApproval === "NONE",
				),
			).toBe(true);
			expect(f.state.calls.length).toBe(6);
			expect(f.state.externalGeneration).toBe(0);
			const image = await f.get(`/jobs/${f.id}/image`);
			expect(image.status).toBe(200);
			expect((await f.get(`/jobs/${f.id}/result`)).status).toBe(200);
			expect(
				inspectionBody.parse(
					await (await f.get(`/jobs/${f.id}/inspection`)).json(),
				).inspection.comfyCompletion.qualityApproval,
			).toBe("NONE");
			await f.restart();
			expect((await f.post()).status).toBe(200);
			expect(f.state.calls.length).toBe(6);
			expect(hash(await readFile(join(f.dir, "job.json")))).toBe(hash(before));
			expect(
				jobBody.parse(await (await f.get(`/jobs/${f.id}`)).json()).job.state,
			).toBe("HOLD");
		} finally {
			await f.close();
		}
	}, 120000);

	for (const mode of [
		"missing",
		"pending",
		"foreign-graph",
		"foreign-prompt",
		"upload",
		"output",
		"output-name",
		"source",
		"pin",
	] as const)
		test(`recovery fails closed for ${mode} with no adoption or release`, async () => {
			const f = await completionFixture();
			try {
				const history = JSON.parse(f.state.historyBytes.toString()),
					entry = history[f.request.promptId];
				if (mode === "missing") f.state.historyBytes = Buffer.from("{}");
				else if (mode === "pending") {
					entry.status.completed = false;
					f.state.historyBytes = Buffer.from(JSON.stringify(history));
				} else if (mode === "foreign-graph") {
					entry.prompt[2]["7"].inputs.denoise = 0.65;
					f.state.historyBytes = Buffer.from(JSON.stringify(history));
					f.request.historySHA256 = hash(f.state.historyBytes);
				} else if (mode === "foreign-prompt") {
					entry.prompt[1] = crypto.randomUUID();
					f.state.historyBytes = Buffer.from(JSON.stringify(history));
					f.request.historySHA256 = hash(f.state.historyBytes);
				} else if (mode === "upload") f.state.upload = Buffer.from("invalid");
				else if (mode === "output")
					f.state.images["9"] = Buffer.from("invalid");
				else if (mode === "output-name") {
					entry.outputs["9"].images[0].filename = "foreign.png";
					f.state.historyBytes = Buffer.from(JSON.stringify(history));
					f.request.historySHA256 = hash(f.state.historyBytes);
				} else if (mode === "source")
					await writeFile(join(f.dir, "reference-conditioning.png"), "invalid");
				else f.request.outputSHA256["9"] = "0".repeat(64);
				expect((await f.post()).status).not.toBe(201);
				expect(
					jobBody.parse(await (await f.get(`/jobs/${f.id}`)).json()).job.state,
				).toBe("UNKNOWN");
				expect((await f.get(`/jobs/${f.id}/image`)).status).toBe(404);
				expect((await f.get(`/jobs/${f.id}/result`)).status).not.toBe(200);
				expect(
					leaseBody.parse(await (await f.get("/jobs")).json()).lease
						.admissionBlocked,
				).toBe(true);
				expect(f.state.externalGeneration).toBe(0);
			} finally {
				await f.close();
			}
		}, 120000);

	for (const point of ["before-commit", "after-commit"] as const)
		test(`interruption at ${point} is atomic and replayable`, async () => {
			let crash = true;
			const f = await completionFixture({
				checkpoint: async (at) => {
					if (crash && at === point) throw Error("CRASH_INJECTION");
				},
			});
			try {
				expect((await f.post()).status).not.toBe(201);
				crash = false;
				await f.restart();
				expect(
					jobBody.parse(await (await f.get(`/jobs/${f.id}`)).json()).job.state,
				).toBe(point === "after-commit" ? "HOLD" : "UNKNOWN");
				expect((await f.post()).status).toBe(
					point === "after-commit" ? 200 : 201,
				);
				expect(f.state.externalGeneration).toBe(0);
			} finally {
				await f.close();
			}
		}, 120000);

	test("authentication, CSRF and owner isolation reject before any Comfy read", async () => {
		const f = await completionFixture();
		try {
			expect(
				(await f.post(f.request, { ...f.headers(), cookie: "" })).status,
			).toBe(401);
			expect(
				(await f.post(f.request, { ...f.headers(), "x-csrf-token": "invalid" }))
					.status,
			).toBe(403);
			expect((await f.post(f.request, f.headers("2"))).status).not.toBe(201);
			expect(f.state.calls).toHaveLength(0);
		} finally {
			await f.close();
		}
	});

	test("UNKNOWN retained execution is eligible without rewriting its evidence", async () => {
		const f = await completionFixture();
		try {
			await f.app.close();
			const original = JSON.parse(
				await readFile(join(f.dir, "job.json"), "utf8"),
			);
			const unknown = Buffer.from(
				JSON.stringify({
					...original,
					state: "UNKNOWN",
					errorCode: "OWNER_DISPATCH_UNCERTAIN",
				}),
			);
			await writeFile(join(f.dir, "job.json"), unknown);
			const { unlink } = await import("node:fs/promises");
			await unlink(join(f.dir, "comfy-interrupted.json"));
			f.request.jobSHA256 = hash(unknown);
			await f.restart();
			expect((await f.post()).status).toBe(201);
			expect(await readFile(join(f.dir, "job.json"))).toEqual(unknown);
		} finally {
			await f.close();
		}
	}, 120000);

	test("commit CAS rejects source mutation and committed event never substitutes for artifact proof", async () => {
		let fixture: Awaited<ReturnType<typeof completionFixture>>;
		fixture = await completionFixture({
			checkpoint: async (point) => {
				if (point === "before-commit")
					await writeFile(
						join(fixture.dir, "reference-conditioning.png"),
						"changed-before-commit",
					);
			},
		});
		try {
			expect((await fixture.post()).status).toBe(409);
			expect(
				jobBody.parse(await (await fixture.get(`/jobs/${fixture.id}`)).json())
					.job.state,
			).toBe("UNKNOWN");
		} finally {
			await fixture.close();
		}
		const f = await completionFixture();
		try {
			expect((await f.post()).status).toBe(201);
			await writeFile(
				join(f.dir, "comfy-completion.v1", "provider-native.png"),
				"tampered",
			);
			expect((await f.get(`/jobs/${f.id}`)).status).toBe(409);
			expect((await f.get(`/jobs/${f.id}/image`)).status).toBe(409);
			expect((await f.get(`/jobs/${f.id}/result`)).status).toBe(409);
			expect((await f.post()).status).toBe(409);
			expect(f.state.externalGeneration).toBe(0);
		} finally {
			await f.close();
		}
	}, 120000);
}
