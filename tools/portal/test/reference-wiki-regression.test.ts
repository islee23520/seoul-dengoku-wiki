import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { hash } from "../src/sources.ts";
import { finishingPngFixture } from "./comfyui-finishing-fixture.ts";
import { workbenchFixture } from "./reference-workbench-fixture.ts";

for (const retained of [true, false]) {
	test(`v2 HTTP ${retained ? "retained offline wiki" : "unpublished upload"} preserves acquired authority`, async () => {
		const f = await workbenchFixture({
			retained,
			imageBytes: Buffer.from(finishingPngFixture(340, 510).finishedBytes),
		});
		try {
			const headers = await f.session();
			const post = async (route: string, input: unknown) => {
				const response = await fetch(`${f.api}${route}`, {
					method: "POST",
					headers,
					body: JSON.stringify(input),
				});
				return {
					status: response.status,
					body: (await response.json()) as {
						sheetId: string;
						error?: { code: string };
						connection: { connectionId: string };
						job: { state: string };
					},
				};
			};
			const connection = await post("/connections", {
				baseUrl: "http://127.0.0.1:1/v1",
				apiKey: "offline-regression-key",
			});
			expect(connection.status).toBe(201);
			const personId = retained ? "person-0998" : "person-900099";
			let sheetId: string | undefined;
			if (!retained) {
				const original = JSON.parse(f.token.toString());
				const token = {
					...original,
					personId,
					characterId: "K900099",
					identity: { ...original.identity, characterId: "K900099" },
				};
				const detail = {
					id: personId,
					characterId: token.characterId,
					familyTree: { personId: token.characterId },
					name: token.name,
					detailRoute: `/people/${personId}`,
				};
				const uploaded = await post("/sheets", {
					detailBase64: Buffer.from(JSON.stringify(detail)).toString("base64"),
					tokenBase64: Buffer.from(JSON.stringify(token)).toString("base64"),
					imageBase64: f.image.toString("base64"),
				});
				expect(uploaded.status).toBe(201);
				sheetId = uploaded.body.sheetId;
			}
			const base = {
				schemaVersion: 2,
				connectionId: connection.body.connection.connectionId,
				...(sheetId ? { sheetId } : { personId }),
				inputMode: "reference-img2img",
				sourceSelection: {
					kind: "selected",
					personId,
					sourceSHA256: hash(f.image),
				},
				explicitEdits: [],
				provider: "openai-compatible",
				providerModel: "gpt-image-2.5-sunburst",
				size: "340x510",
				faceMode: { kind: "unique", variantId: null },
			};
			if (retained) f.state.wikiStatus = 503;
			for (const [change, code] of [
				[
					{
						sourceSelection: {
							...base.sourceSelection,
							sourceSHA256: "0".repeat(64),
						},
					},
					"REFERENCE_HASH_MISMATCH",
				],
				[
					{
						sourceSelection: {
							...base.sourceSelection,
							personId: "person-0041",
						},
					},
					"REFERENCE_IDENTITY_MISMATCH",
				],
			] as const) {
				const denied = await post("/generations", {
					...base,
					...change,
					requestId: randomUUID(),
				});
				expect(denied.body.error?.code).toBe(code);
			}
			expect(f.calls).toHaveLength(0);
			expect(f.comfy.prompts).toHaveLength(0);
			const result = await post("/generations", {
				...base,
				requestId: randomUUID(),
			});
			expect({
				status: result.status,
				error: result.body.error,
				state: result.body.job?.state,
			}).toEqual({ status: 200, error: undefined, state: "HOLD" });
			expect(f.calls).toHaveLength(1);
			if (retained) {
				const connected = await post("/connections", {
					provider: "comfyui",
					workflow: "moss-image-sft-style-male.alpha.v1",
				});
				expect(connected.status).toBe(201);
				const tokenOnly = await post("/generations", {
					...base,
					requestId: randomUUID(),
					connectionId: connected.body.connection.connectionId,
					provider: "comfyui",
					providerModel: "comfyui:moss-image-sft-style-male.alpha.v1",
					inputMode: "token-only",
					sourceSelection: {
						kind: "intentional-absence",
						reason: "no-reference-available",
					},
				});
				expect(tokenOnly.status).toBe(200);
				expect(tokenOnly.body.job.state).toBe("HOLD");
				expect(f.comfy.prompts).toHaveLength(1);
				f.state.wikiStatus = 404;
				const missing = await post("/generations", {
					...base,
					requestId: randomUUID(),
				});
				expect(missing.status).toBe(404);
				expect(missing.body.error?.code).toBe("NOT_FOUND");
				expect(f.calls).toHaveLength(1);
				f.state.wikiStatus = 200;
				f.state.publishedName = "different published identity";
				const drift = await post("/generations", {
					...base,
					requestId: randomUUID(),
				});
				expect(drift.body.error?.code).toBe("WIKI_INVALID_SOURCE");
				expect(f.calls).toHaveLength(1);
			}
		} finally {
			await f.close();
		}
	});
}
