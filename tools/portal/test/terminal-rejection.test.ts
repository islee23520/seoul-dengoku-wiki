import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { workbenchFixture } from "./reference-workbench-fixture.ts";

const jobResponse = z.object({
	job: z.object({
		id: z.string(),
		state: z.string(),
		errorCode: z.string().nullable(),
		imageUrl: z.string().nullable(),
	}),
});
const jobsResponse = z.object({
	jobs: z.array(jobResponse.shape.job),
	lease: z.object({
		admissionBlocked: z.boolean(),
		requestIds: z.array(z.string()),
	}),
});

for (const kind of ["missing-model", "network-loss", "partial-body"] as const) {
	test(`reference HTTP ${kind} preserves terminal certainty and replay authority`, async () => {
		// Given an isolated real portal and a controlled provider transport boundary.
		const submitted = Promise.withResolvers<void>();
		const response = Promise.withResolvers<Response>();
		const raw = Buffer.from(JSON.stringify({ created: 1, data: [] }));
		let calls = 0;
		const f = await workbenchFixture({
			create: (config, options) =>
				createPortal(config, {
					...options,
					referenceSend: async () => {
						calls++;
						submitted.resolve();
						return response.promise;
					},
				}),
		});
		try {
			const headers = await f.session();
			const post = (path: string, input: unknown) =>
				fetch(`${f.api}${path}`, {
					method: "POST",
					headers,
					body: JSON.stringify(input),
				});
			const get = (path: string) => fetch(`${f.api}${path}`, { headers });
			const connected = await post("/connections", {
				baseUrl: "http://127.0.0.1:1/v1",
				apiKey: "offline-terminal-key",
			});
			const { connection } = z
				.object({ connection: z.object({ connectionId: z.string() }) })
				.parse(await connected.json());
			const request = {
				schemaVersion: 2,
				requestId: randomUUID(),
				connectionId: connection.connectionId,
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
			// When dispatch is pending, observe RUNNING before releasing its outcome.
			const pending = post("/generations", request);
			await submitted.promise;
			const active = jobsResponse.parse(await (await get("/jobs")).json());
			expect(active.jobs[0]?.state).toBe("RUNNING");
			expect(active.lease.admissionBlocked).toBe(true);
			switch (kind) {
				case "missing-model":
					response.resolve(new Response(raw, { status: 200 }));
					break;
				case "network-loss":
					response.reject(new TypeError("transport lost after submission"));
					break;
				case "partial-body":
					response.resolve(
						new Response(
							new ReadableStream({
								start(controller) {
									controller.enqueue(raw.subarray(0, 8));
								},
								pull(controller) {
									controller.error(new TypeError("response stream lost"));
								},
							}),
							{ status: 200 },
						),
					);
					break;
			}
			const result = await pending;
			const terminal = jobResponse.parse(await result.json());
			// Then execution certainty and model attestation remain separate.
			expect(result.status).toBe(200);
			expect(terminal.job).toMatchObject({
				state: kind === "missing-model" ? "FAILED" : "UNKNOWN",
				errorCode:
					kind === "missing-model"
						? "LOCAL_MODEL_NOT_EXPOSED"
						: "LOCAL_NETWORK_FAILURE",
				imageUrl: null,
			});
			const dir = join(f.directory, "storage", "1", "jobs", request.requestId);
			const receipt = JSON.parse(
				await readFile(join(dir, "provider-source.png.receipt.json"), "utf8"),
			);
			expect(receipt.modelAttestation).toBe("UNKNOWN");
			if (kind === "missing-model") {
				expect(receipt).toMatchObject({
					status: 200,
					failure: "MODEL_NOT_EXPOSED",
					returnedModel: null,
					modelSnapshotStatus: "NOT_EXPOSED",
					responseBodySHA256: hash(raw),
				});
				expect(
					await readFile(join(dir, "provider-source.png.response.bin")),
				).toEqual(raw);
				expect(
					hash(await readFile(join(dir, "provider-source.png.request.bin"))),
				).toBe(receipt.wire.sha256);
			} else expect(receipt.status).toBe("unknown");
			const names = await readdir(dir);
			for (const name of [
				"provider-source.png",
				"candidate.png",
				"result.json",
			])
				expect(names).not.toContain(name);
			expect((await get(`/jobs/${request.requestId}/result`)).status).toBe(409);
			expect((await get(`/jobs/${request.requestId}/image`)).status).toBe(404);
			const replay = await post("/generations", request);
			expect(jobResponse.parse(await replay.json()).job).toEqual(terminal.job);
			const settled = jobsResponse.parse(await (await get("/jobs")).json());
			expect(settled.lease.admissionBlocked).toBe(kind !== "missing-model");
			expect(settled.lease.requestIds).toEqual(
				kind === "missing-model" ? [] : [request.requestId],
			);
			if (kind !== "missing-model") {
				const blocked = await post("/generations", {
					...request,
					requestId: randomUUID(),
				});
				expect(blocked.status).toBe(409);
				expect(await blocked.json()).toMatchObject({
					error: { code: "OWNER_DISPATCH_UNCERTAIN" },
				});
			}
			expect(calls).toBe(1);
			expect(f.comfy.prompts).toHaveLength(0);
		} finally {
			response.reject(new TypeError("test cleanup"));
			await f.close();
		}
	}, 15000);
}
