import { afterEach, expect, test } from "bun:test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compileReferenceEditPrompt } from "../src/comfyui-prompt.ts";
import type { RegisteredEndpoint } from "../src/connections.ts";
import {
	referenceBytesSHA256,
	referenceRecord,
} from "../src/reference-analysis.ts";
import { resolveReferenceSource } from "../src/reference-contract.ts";
import { resolveReferenceIntent } from "../src/reference-intent.ts";
import {
	dispatchLocalReferenceV2,
	prepareReferenceProviderV2,
} from "../src/reference-provider.ts";
import { referenceProviderFixture } from "./reference-provider-fixture.ts";

const directories: string[] = [];
afterEach(async () => {
	for (const directory of directories.splice(0))
		await rm(directory, { recursive: true });
});
const directory = async () => {
	const path = await mkdtemp(join(tmpdir(), "reference-provider-"));
	directories.push(path);
	return path;
};
const outbound = <T>(
	start: (endpoint: RegisteredEndpoint, key: string, baseUrl?: string) => T,
) =>
	start(
		{
			endpointId: "existing-cpa",
			revision: "1",
			protocolVersion: "openai-compatible-http.v1",
			toolName: "images/edits",
			toolSchemaDigest: "a".repeat(64),
		},
		"offline-secret",
		"https://existing-cpa.invalid/v1",
	);

test("actual v2 boundary submits one native recipient PNG and only the compiled edit text", async () => {
	const fixture = await referenceProviderFixture(true);
	const prepared = prepareReferenceProviderV2(fixture.request, fixture);
	const dir = await directory();
	let calls = 0;
	const result = await dispatchLocalReferenceV2(
		{ request: fixture.request },
		{
			...fixture,
			directory: dir,
			outbound,
			send: async (request) => {
				calls++;
				expect(request.url).toBe(
					"https://existing-cpa.invalid/v1/images/edits",
				);
				expect(request.headers.get("authorization")).toBe(
					"Bearer offline-secret",
				);
				const wire = new Uint8Array(await request.arrayBuffer());
				expect(referenceBytesSHA256(wire)).toBe(
					referenceBytesSHA256(
						await readFile(join(dir, "provider-source.png.request.bin")),
					),
				);
				const form = await new Request(request.url, {
					method: "POST",
					headers: {
						"content-type": request.headers.get("content-type") ?? "",
					},
					body: wire,
				}).formData();
				expect([...form.keys()]).toEqual([
					"model",
					"prompt",
					"size",
					"n",
					"output_format",
					"background",
					"image[]",
				]);
				expect(form.get("prompt")).toBe(
					compileReferenceEditPrompt(fixture.records).text.replace(
						/\n/g,
						"\r\n",
					),
				);
				expect(form.get("size")).toBe("1024x1536");
				expect(form.get("n")).toBe("1");
				expect(form.get("output_format")).toBe("png");
				expect(form.get("background")).toBe("transparent");
				const images = form.getAll("image[]");
				expect(images).toHaveLength(1);
				const image = images[0];
				if (!(image instanceof File)) throw Error("EXPECTED_PNG");
				expect(image.type).toBe("image/png");
				expect(image.name).toBe("recipient-1.png");
				expect(
					referenceBytesSHA256(new Uint8Array(await image.arrayBuffer())),
				).toBe(prepared.conditions.referenceHashes[0]);
				return Response.json({
					model: "gpt-image-2.5-sunburst",
					data: [
						{
							b64_json: Buffer.from(
								prepared.conditions.orderedImageBytes[0],
							).toString("base64"),
						},
					],
				});
			},
		},
	);
	expect(calls).toBe(1);
	expect(result.receipt.modelAttestation).toBe("MATCH");
	expect(result.receipt.modelSnapshotStatus).toBe("NOT_EXPOSED");
	expect(result.receipt.provenance).toMatchObject({
		analysisQualified: false,
		analysisStatus: "UNQUALIFIED",
		accuracy: "NOT_ESTABLISHED",
		outputContractIsContentEditPermission: false,
	});
	expect(await readdir(dir)).not.toContain("candidate.png");
});

test("actual boundary rejects token override, missing images, source mutation and rehashed forged intent before artifacts or submit", async () => {
	const original = await referenceProviderFixture();
	const cases: Array<(f: typeof original) => unknown> = [
		(f) => ({ ...f.request, slots: { face: "override" } }),
		(f) => ({ ...f.request, orderedImageBytes: [] }),
		(f) => ({
			...f.request,
			orderedImageBytes: [
				f.serverEvidence.recipientImage.bytes,
				f.serverEvidence.recipientImage.bytes,
			],
		}),
		(f) => {
			f.serverEvidence.recipientImage.bytes[100] =
				(f.serverEvidence.recipientImage.bytes[100] ?? 0) ^ 1;
			return f.request;
		},
		(f) => {
			f.records.intent = referenceRecord({
				...f.records.intent.value,
				semanticAuthority:
					"forged" as "explicit-edits-then-source-preservation",
			});
			return f.request;
		},
		(f) => {
			f.records.directive = referenceRecord({
				...f.records.directive.value,
				requestId: crypto.randomUUID(),
			});
			return f.request;
		},
		(f) => ({ ...f.request, providerModel: "other-model" }),
		(f) => ({ ...f.request, provider: "comfyui" }),
		(f) => {
			f.serverEvidence.recipientImage.sourceSHA256 = "0".repeat(64);
			return f.request;
		},
	];
	for (const mutate of cases) {
		const fixture = structuredClone(original);
		const request = mutate(fixture);
		const dir = await directory();
		let calls = 0;
		await expect(
			dispatchLocalReferenceV2(
				{ request },
				{
					...fixture,
					directory: dir,
					outbound,
					send: async () => {
						calls++;
						return Response.json({});
					},
				},
			),
		).rejects.toThrow();
		expect(calls).toBe(0);
		expect(await readdir(dir)).toEqual([]);
	}
});

test("actual boundary rejects mismatched and unexposed models without candidate or fallback", async () => {
	const fixture = await referenceProviderFixture();
	for (const model of ["other-model", null]) {
		const dir = await directory();
		let calls = 0;
		await expect(
			dispatchLocalReferenceV2(
				{ request: fixture.request },
				{
					...fixture,
					directory: dir,
					outbound,
					send: async () => {
						calls++;
						return Response.json({ ...(model ? { model } : {}), data: [] });
					},
				},
			),
		).rejects.toMatchObject({
			code: model ? "LOCAL_MODEL_MISMATCH" : "LOCAL_MODEL_NOT_EXPOSED",
			uncertain: false,
		});
		expect(calls).toBe(1);
		expect(await readdir(dir)).not.toContain("provider-source.png");
		const receipt = JSON.parse(
			await readFile(join(dir, "provider-source.png.receipt.json"), "utf8"),
		);
		expect(receipt.modelAttestation).toBe(model ? "FAIL" : "UNKNOWN");
		expect(receipt.returnedModel).toBe(model);
	}
});

test("semantic review failures are retained only in provenance and cannot be silently dropped", async () => {
	const fixture = await referenceProviderFixture();
	const failures = [
		{ field: "composition.gaze" as const, verdict: "FAIL" as const },
		{ field: "composition.framing" as const, verdict: "FAIL" as const },
	];
	const semanticReview = {
		observationReceiptSHA256: fixture.records.observation.sha256,
		reviews: [
			{ receiptSHA256: "a".repeat(64), verdict: "HOLD" as const, failures },
			{ receiptSHA256: "b".repeat(64), verdict: "HOLD" as const, failures },
		],
	};
	const prepared = prepareReferenceProviderV2(fixture.request, {
		...fixture,
		semanticReview,
	});
	expect(prepared.provenance.semanticReview).toEqual(semanticReview);
	expect(prepared.conditions.prompt).toBe(
		compileReferenceEditPrompt(fixture.records).text,
	);
	expect(() =>
		prepareReferenceProviderV2(fixture.request, {
			...fixture,
			semanticReview: {
				...semanticReview,
				reviews: semanticReview.reviews.slice(0, 1),
			},
		}),
	).toThrow();
	expect(() =>
		prepareReferenceProviderV2(fixture.request, {
			...fixture,
			semanticReview: {
				...semanticReview,
				observationReceiptSHA256: "c".repeat(64),
			},
		}),
	).toThrow("REFERENCE_REVIEW_BINDING_MISMATCH");
	const observation = referenceRecord({
		...fixture.records.observation.value,
		status: "HOLD" as const,
		reason: "ANALYSIS_BINDING_MISMATCH",
	});
	const records = resolveReferenceIntent({
		acquisition: resolveReferenceSource(
			fixture.request,
			fixture.serverEvidence,
		),
		manifest: fixture.records.manifest,
		directive: fixture.records.directive,
		observation,
	});
	expect(() =>
		prepareReferenceProviderV2(fixture.request, { ...fixture, records }),
	).toThrow("REFERENCE_INTENT_HOLD");
});
