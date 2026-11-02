import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { workbenchFixture } from "./reference-workbench-fixture.ts";

type HttpBody = {
	error: { code: string };
	connection: { connectionId: string };
	job: {
		state: string;
		metrics: { width: number; height: number };
		reference: { semanticReview: { reviews: unknown[] } };
	};
	result: { approval: string };
	inspection: {
		originalRequest: { schemaVersion: number };
		provenance: { reference: { accuracy: string } };
	};
	source: { normalizedSHA: string };
	history: { reference: { analysisStatus: string } }[];
};

test("v2 actual HTTP dispatch binds reference CPA, explicit Comfy, token absence and results", async () => {
	const f = await workbenchFixture();
	try {
		const headers = await f.session();
		const post = async (path: string, input: unknown) => {
			const response = await fetch(`${f.api}${path}`, {
				method: "POST",
				headers,
				body: JSON.stringify(input),
			});
			return {
				status: response.status,
				body: (await response.json()) as HttpBody,
			};
		};
		const get = async (path: string) => {
			const response = await fetch(`${f.api}${path}`, { headers });
			return {
				status: response.status,
				body: (await response.json()) as HttpBody,
			};
		};
		const cpa = await post("/connections", {
			baseUrl: "http://127.0.0.1:1/v1",
			apiKey: "offline-workbench-key",
		});
		expect(cpa.status).toBe(201);
		const base = {
			schemaVersion: 2,
			requestId: randomUUID(),
			connectionId: cpa.body.connection.connectionId,
			personId: "person-0998",
			inputMode: "reference-img2img",
			sourceSelection: {
				kind: "selected",
				personId: "person-0998",
				sourceSHA256: f.state.pin,
			},
			explicitEdits: [],
			provider: "openai-compatible",
			providerModel: "gpt-image-2.5-sunburst",
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		for (const [change, code, status] of [
			[
				{
					sourceSelection: {
						...base.sourceSelection,
						sourceSHA256: "0".repeat(64),
					},
				},
				"REFERENCE_HASH_MISMATCH",
				409,
			],
			[
				{
					sourceSelection: { ...base.sourceSelection, personId: "person-0041" },
				},
				"REFERENCE_IDENTITY_MISMATCH",
				422,
			],
			[{ inputMode: "token-only" }, "MODE_SOURCE_MISMATCH", 422],
			[
				{
					explicitEdits: [
						{ field: "person.face", operation: "replace", value: "round" },
					],
				},
				"EDIT_FIELD_UNSUPPORTED",
				422,
			],
			[{ acquired: true }, "INVALID_REFERENCE_REQUEST", 422],
			[{ sourceRecipe: "source-025" }, "INVALID_REFERENCE_REQUEST", 422],
		] as const) {
			const result = await post("/generations", {
				...base,
				...change,
				requestId: randomUUID(),
			});
			expect({ code: result.body.error?.code, status: result.status }).toEqual({
				code,
				status,
			});
		}
		f.state.imageStatus = 503;
		expect(
			(await post("/generations", { ...base, requestId: randomUUID() })).body
				.error.code,
		).toBe("REFERENCE_NOT_ACQUIRED");
		f.state.imageStatus = 200;
		f.state.pin = "f".repeat(64);
		expect(
			(await post("/generations", { ...base, requestId: randomUUID() })).body
				.error.code,
		).toBe("REFERENCE_HASH_MISMATCH");
		f.state.pin = base.sourceSelection.sourceSHA256;
		expect(f.calls).toHaveLength(0);
		expect(f.comfy.prompts).toHaveLength(0);
		const started = once(f.app.server, "jobs:1", {
			signal: AbortSignal.timeout(15000),
		});
		const submitted = post("/generations", base);
		await started;
		const result = await submitted;
		expect(result.status).toBe(200);
		expect(result.body.job.state).toBe("HOLD");
		expect(result.body.job.metrics.width).toBe(340);
		expect(result.body.job.metrics.height).toBe(510);
		expect(f.calls).toHaveLength(1);
		expect(f.calls[0]?.prompt).not.toContain("pupils");
		expect(f.calls[0]?.prompt).not.toContain("rounder");
		expect(result.body.job.reference.semanticReview.reviews).toHaveLength(2);
		const sealed = await get(`/jobs/${base.requestId}/result`);
		expect(sealed.status).toBe(200);
		expect(sealed.body.result.approval).toBe("NONE");
		const inspection = await get(`/jobs/${base.requestId}/inspection`);
		expect(inspection.status).toBe(200);
		expect(inspection.body.inspection.originalRequest.schemaVersion).toBe(2);
		expect(inspection.body.inspection.provenance.reference.accuracy).toBe(
			"NOT_ESTABLISHED",
		);
		expect(
			(await get(`/jobs/${base.requestId}/captured-source`)).body.source
				.normalizedSHA,
		).toMatch(/^[a-f0-9]{64}$/);
		expect((await post("/generations", base)).status).toBe(200);
		expect(f.calls).toHaveLength(1);
		expect(
			(
				await post("/generations", {
					...base,
					explicitEdits: [
						{
							field: "outfit.upper.color",
							operation: "replace",
							value: "dark blue",
						},
					],
				})
			).body.error.code,
		).toBe("REQUEST_CONFLICT");
		const edit = await post("/generations", {
			...base,
			requestId: randomUUID(),
			explicitEdits: [
				{
					field: "outfit.upper.color",
					operation: "replace",
					value: "dark blue",
				},
			],
		});
		expect(edit.body.job.state).toBe("HOLD");
		expect(f.calls.at(-1)?.prompt).toContain("dark blue");
		for (const mode of ["reference-img2img", "token-only"] as const) {
			const workflow =
				mode === "reference-img2img"
					? "moss-image-sft-source-img2img.alpha.v1"
					: "moss-image-sft-style-male.alpha.v1";
			const connected = await post("/connections", {
				provider: "comfyui",
				workflow,
			});
			expect(connected.status).toBe(201);
			for (const personId of mode === "token-only"
				? ["person-0041", "person-900001"]
				: ["person-0998"]) {
				const payload = {
					...base,
					requestId: randomUUID(),
					connectionId: connected.body.connection.connectionId,
					provider: "comfyui",
					providerModel: `comfyui:${workflow}`,
					inputMode: mode,
					personId,
					sourceSelection:
						mode === "token-only"
							? {
									kind: "intentional-absence",
									reason: "no-reference-available",
								}
							: base.sourceSelection,
				};
				if (mode === "token-only") {
					const before = f.comfy.prompts.length;
					const rejected = await post("/generations", {
						...payload,
						sourceRecipe: "source-025",
					});
					expect(rejected.status).toBe(422);
					expect(f.comfy.prompts).toHaveLength(before);
				}
				const generated = await post("/generations", payload);
				expect(generated.status).toBe(200);
				expect(generated.body.job.state).toBe("HOLD");
				const proof = await get(`/jobs/${payload.requestId}/result`);
				expect(proof.status).toBe(200);
				expect(proof.body.error).toBeUndefined();
				expect(
					(await get(`/jobs/${payload.requestId}/inspection`)).status,
				).toBe(200);
				if (mode === "reference-img2img") {
					expect(f.comfy.prompts.at(-1)?.prompt["7"]?.inputs["denoise"]).toBe(
						0.45,
					);
					const before = f.comfy.prompts.length;
					for (const invalid of [
						{ sourceRecipe: "source-050" },
						{ sourceRecipe: 0.25 },
						{ denoise: 0.25 },
					]) {
						const rejected = await post("/generations", {
							...payload,
							...invalid,
							requestId: randomUUID(),
						});
						expect(rejected.status).toBe(422);
						expect(rejected.body.error.code).toBe("INVALID_REFERENCE_REQUEST");
					}
					expect(f.comfy.prompts).toHaveLength(before);
					for (const [sourceRecipe, denoise] of [
						["source-025", 0.25],
						["source-045", 0.45],
						["source-065", 0.65],
					] as const) {
						const chosen = {
							...payload,
							sourceRecipe,
							requestId: randomUUID(),
						};
						const generated = await post("/generations", chosen);
						expect(generated.body.job.state).toBe("HOLD");
						const sampler = f.comfy.prompts.at(-1)?.prompt["7"]?.inputs;
						expect(sampler).toMatchObject({
							denoise,
							seed: 152995270030802,
							steps: 25,
							cfg: 2.5,
							sampler_name: "er_sde",
							scheduler: "simple",
						});
						const dir = join(
							f.directory,
							"storage",
							"1",
							"jobs",
							chosen.requestId,
						);
						const retainedRequest = JSON.parse(
							await readFile(join(dir, "request-payload.json"), "utf8"),
						);
						const canonical = JSON.parse(
							await readFile(
								join(dir, "provider-canonical.receipt.json"),
								"utf8",
							),
						);
						const delivered = JSON.parse(
							await readFile(join(dir, "candidate.png.receipt.json"), "utf8"),
						);
						const history = JSON.parse(
							await readFile(join(dir, "comfy-history.json"), "utf8"),
						);
						expect(retainedRequest.sourceRecipe).toBe(sourceRecipe);
						expect(canonical.sourceInit.denoise).toBe(denoise);
						expect(delivered.sourceInit.denoise).toBe(denoise);
						expect(
							history[canonical.promptId].prompt[2]["7"].inputs.denoise,
						).toBe(denoise);
						expect((await get(`/jobs/${chosen.requestId}/result`)).status).toBe(
							200,
						);
						const retainedInspection = await get(
							`/jobs/${chosen.requestId}/inspection`,
						);
						expect(retainedInspection.status).toBe(200);
						const calls = f.comfy.prompts.length;
						expect((await post("/generations", chosen)).status).toBe(200);
						expect(
							(
								await post("/generations", {
									...chosen,
									sourceRecipe:
										sourceRecipe === "source-025" ? "source-065" : "source-025",
								})
							).body.error.code,
						).toBe("REQUEST_CONFLICT");
						expect(f.comfy.prompts).toHaveLength(calls);
						const requestBytes = await readFile(
							join(dir, "request-payload.json"),
						);
						await writeFile(
							join(dir, "request-payload.json"),
							JSON.stringify({
								...retainedRequest,
								sourceRecipe:
									sourceRecipe === "source-025" ? "source-065" : "source-025",
							}),
						);
						expect(
							(await get(`/jobs/${chosen.requestId}/result`)).status,
						).not.toBe(200);
						await writeFile(join(dir, "request-payload.json"), requestBytes);
						expect((await get(`/jobs/${chosen.requestId}/result`)).status).toBe(
							200,
						);
						console.log(
							`RECIPE_HTTP ${JSON.stringify({ sourceRecipe, denoise, requestId: chosen.requestId, sampler, receiptDenoise: canonical.sourceInit.denoise, historyDenoise: history[canonical.promptId].prompt[2]["7"].inputs.denoise, resultVerified: true, changedRecipeReplayCalls: f.comfy.prompts.length - calls })}`,
						);
					}
				}
			}
			const revoked = await fetch(
				`${f.api}/connections/${connected.body.connection.connectionId}`,
				{ method: "DELETE", headers },
			);
			expect(revoked.status).toBe(200);
		}
		const history = await get("/jobs");
		expect(history.body.history[0]?.reference.analysisStatus).toBe(
			"UNQUALIFIED",
		);
		const output = join(
			f.directory,
			"storage",
			"1",
			"jobs",
			base.requestId,
			"candidate.png",
		);
		const originalOutput = await readFile(output);
		await writeFile(output, Buffer.from("tampered"));
		expect((await get(`/jobs/${base.requestId}/result`)).body.error.code).toBe(
			"RESULT_HASH_MISMATCH",
		);
		await writeFile(output, originalOutput);
		expect((await get(`/jobs/${base.requestId}/result`)).status).toBe(200);
		f.state.cpaStatus = 503;
		const failed = await post("/generations", {
			...base,
			requestId: randomUUID(),
		});
		expect(failed.body.job.state).toBe("FAILED");
		expect(f.comfy.prompts).toHaveLength(6);
		expect(f.calls).toHaveLength(3);
		console.log(
			`WORKBENCH_HTTP ${JSON.stringify({ cpaCalls: f.calls.length, comfyPrompts: f.comfy.prompts.length, uploads: f.comfy.uploads.length, result: sealed.body.result, inspection: inspection.body.inspection.provenance.reference, output })}`,
		);
	} finally {
		await f.close();
	}
}, 60000);
