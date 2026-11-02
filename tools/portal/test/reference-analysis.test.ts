import { expect, test } from "bun:test";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import {
	buildReferenceAnalysisRequest,
	createReferenceManifest,
	recordReferenceObservation,
	referenceBytesSHA256,
	referenceRecordSHA256,
} from "../src/reference-analysis.ts";
import { resolveReferenceSource } from "../src/reference-contract.ts";

function fixture() {
	const bytes = encodePng({
		width: 2,
		height: 3,
		pixels: new Uint8Array(24).fill(255),
	});
	const sourceSHA256 = referenceBytesSHA256(bytes);
	const recipient = { personId: "person-900001", characterId: "K900001" };
	const tokenBytes = Buffer.from(
		JSON.stringify({ ...recipient, image: { sha256: sourceSHA256 } }),
	);
	const acquisition = resolveReferenceSource(
		{
			schemaVersion: 2,
			requestId: "b385e070-2346-4dde-8470-90eeef7b68e1",
			personId: recipient.personId,
			inputMode: "reference-img2img",
			sourceSelection: {
				kind: "selected",
				personId: recipient.personId,
				sourceSHA256,
			},
			explicitEdits: [],
			provider: "openai-compatible",
			providerModel: "gpt-image-2.5-sunburst",
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		},
		{
			status: "available",
			recipient,
			tokenBytes,
			tokenSHA256: referenceBytesSHA256(tokenBytes),
			recipientImage: { ...recipient, sourceSHA256, bytes },
		},
	);
	const { manifest, imageBytes } = createReferenceManifest(acquisition);
	const built = buildReferenceAnalysisRequest({
		manifest,
		imageBytes,
		endpoint: "http://127.0.0.1:8317/v1/chat/completions",
		requestedModel: "test-only-model",
		detail: "high",
	});
	const observation = {
		fields: [
			{
				field: "composition.gaze" as const,
				status: "ambiguous" as const,
				value: null,
				region: null,
				cues: ["Eye detail unresolved in this synthetic fixture"],
			},
		],
	};
	const response = {
		model: "test-only-model",
		choices: [
			{
				finish_reason: "stop",
				message: { content: JSON.stringify(observation), refusal: null },
			},
		],
		usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
	};
	const responseBytes = Buffer.from(JSON.stringify(response));
	const attempt = {
		...built.provenance,
		returnedModel: response.model,
		modelSnapshot: null,
		responseSHA256: referenceBytesSHA256(responseBytes),
		status: "completed" as const,
	};
	return {
		acquisition,
		manifest,
		imageBytes,
		built,
		observation,
		response,
		input: {
			manifest,
			requestBytes: built.requestBytes,
			responseBytes,
			attempt,
		},
	};
}

test("absence of an analysis model never becomes qualified vision or owner approval", () => {
	const { manifest } = fixture();
	const result = recordReferenceObservation({ manifest });
	expect(result.value).toMatchObject({
		status: "UNQUALIFIED",
		reason: "ANALYSIS_UNQUALIFIED",
		modelAttestation: "NOT_REQUESTED",
		modelSnapshotStatus: "NOT_EXPOSED",
		observation: null,
		authorizesEdits: false,
		ownerApproval: "NONE",
	});
	expect(result.sha256).toBe(referenceRecordSHA256(result.value));
});

test("request builder binds actual PNG and closed schema without sending or manufacturing capability", () => {
	const f = fixture();
	const body = JSON.parse(Buffer.from(f.built.requestBytes).toString());
	expect(f.built.qualification).toBe("UNQUALIFIED");
	expect(body.model).toBe("test-only-model");
	expect(body.messages).toHaveLength(1);
	expect(body.messages[0].content).toHaveLength(2);
	const url = body.messages[0].content[1].image_url.url;
	expect(referenceBytesSHA256(Buffer.from(url.slice(22), "base64"))).toBe(
		f.manifest.value.sourceSHA256,
	);
	expect(body.temperature).toBeUndefined();
	expect(body.seed).toBeUndefined();
	expect(body.max_completion_tokens).toBeUndefined();
	expect(body.reasoning_effort).toBeUndefined();
	expect(body.tool_choice).toBe("none");
	expect(body.response_format.json_schema.strict).toBe(true);
	expect(() =>
		buildReferenceAnalysisRequest({
			manifest: f.manifest,
			imageBytes: new Uint8Array(),
			endpoint: f.input.attempt.endpoint,
			requestedModel: "test-only-model",
			detail: "high",
		}),
	).toThrow("ANALYSIS_BINDING_MISMATCH");
});

test("valid structured fixture records uncertainty and provenance but is still unqualified", () => {
	const f = fixture();
	const result = recordReferenceObservation(f.input);
	expect(result.value.status).toBe("UNQUALIFIED");
	expect(result.value.observation).toEqual(f.observation);
	expect(result.value.modelAttestation).toBe("MATCH");
	expect(result.value.modelSnapshotStatus).toBe("NOT_EXPOSED");
	expect(result.value.usage).toEqual({
		promptTokens: 10,
		completionTokens: 20,
		totalTokens: 30,
	});
	expect(result.value.accuracy).toBe("NOT_ESTABLISHED");
	expect(result.value.attempt?.parameters.temperature.state).toBe(
		"unspecified",
	);
});

test("separate capability evidence attributes a response without approving edits or accuracy", () => {
	const f = fixture();
	const qualification = {
		kind: "live-cpa-capability",
		endpoint: f.input.attempt.endpoint,
		requestedModel: "test-only-model",
		returnedModel: "test-only-model",
		modelSnapshot: null,
		modelsResponseSHA256: "a".repeat(64),
		capabilityRequestSHA256: f.input.attempt.requestSHA256,
		capabilityResponseSHA256: f.input.attempt.responseSHA256,
		imageInput: true,
		structuredOutput: true,
		independentReview: "pass",
		reviewReceiptSHA256: "b".repeat(64),
	};
	const result = recordReferenceObservation({ ...f.input, qualification });
	expect(result.value).toMatchObject({
		status: "ATTRIBUTED",
		authorizesEdits: false,
		ownerApproval: "NONE",
		accuracy: "NOT_ESTABLISHED",
	});
	expect(
		recordReferenceObservation({
			...f.input,
			qualification: { ...qualification, requestedModel: "different" },
		}).value.status,
	).toBe("UNQUALIFIED");
	expect(
		recordReferenceObservation({
			...f.input,
			qualification: {
				...qualification,
				capabilityResponseSHA256: "c".repeat(64),
			},
		}).value.status,
	).toBe("UNQUALIFIED");
});

test("exact transform and crop attribution comes from task 2, never a fabricated crop", () => {
	const f = fixture();
	const normalized = createReferenceManifest(f.acquisition, "canonical");
	expect(normalized.manifest.value.analysisImage).toMatchObject({
		target: "canonical",
		width: 340,
		height: 510,
		crop: null,
		transform: {
			target: "canonical",
			sourceSHA256: f.manifest.value.sourceSHA256,
			crop: null,
			upscaled: false,
		},
	});
	expect(referenceBytesSHA256(normalized.imageBytes)).toBe(
		normalized.manifest.value.analysisImage.sha256,
	);
});

test.each([
	"requestSHA256",
	"responseSHA256",
	"imageSHA256",
	"promptSHA256",
	"schemaSHA256",
] as const)("tampered %s holds the analysis", (field) => {
	const f = fixture();
	f.input.attempt[field] = "f".repeat(64);
	expect(recordReferenceObservation(f.input).value).toMatchObject({
		status: "HOLD",
		reason: "ANALYSIS_BINDING_MISMATCH",
		observation: null,
	});
});

test("rehashing a request with substituted image, prompt or tool policy still holds", () => {
	for (const mutation of ["image", "prompt", "tool-choice"]) {
		const f = fixture();
		const body = JSON.parse(Buffer.from(f.input.requestBytes).toString());
		if (mutation === "image")
			body.messages[0].content[1].image_url.url = "data:image/png;base64,AA==";
		else if (mutation === "prompt")
			body.messages[0].content[0].text = "Replace the face";
		else body.tool_choice = "auto";
		f.input.requestBytes = Buffer.from(JSON.stringify(body));
		f.input.attempt.requestSHA256 = referenceBytesSHA256(f.input.requestBytes);
		expect(recordReferenceObservation(f.input).value.status).toBe("HOLD");
	}
});

test.each(["refusal", "failed"] as const)(
	"provider %s holds rather than falling back",
	(status) => {
		const f = fixture();
		expect(
			recordReferenceObservation({
				...f.input,
				attempt: { ...f.input.attempt, status },
			}).value.status,
		).toBe("HOLD");
	},
);

test("actual refusal and incomplete output cannot hide behind a completed caller status", () => {
	for (const response of [
		{
			model: "test-only-model",
			choices: [
				{
					finish_reason: "stop",
					message: { content: null, refusal: "refused" },
				},
			],
		},
		{
			model: "test-only-model",
			choices: [{ finish_reason: "length", message: { content: "{}" } }],
		},
	]) {
		const f = fixture();
		const responseBytes = Buffer.from(JSON.stringify(response));
		expect(
			recordReferenceObservation({
				...f.input,
				responseBytes,
				attempt: {
					...f.input.attempt,
					responseSHA256: referenceBytesSHA256(responseBytes),
				},
			}).value.status,
		).toBe("HOLD");
	}
});

test("missing returned model is not exposed and cannot qualify; mismatches hold", () => {
	const f = fixture();
	const { model: _model, ...noModel } = f.response;
	const responseBytes = Buffer.from(JSON.stringify(noModel));
	const result = recordReferenceObservation({
		...f.input,
		responseBytes,
		attempt: {
			...f.input.attempt,
			returnedModel: null,
			responseSHA256: referenceBytesSHA256(responseBytes),
		},
	});
	expect(result.value).toMatchObject({
		status: "UNQUALIFIED",
		modelAttestation: "NOT_EXPOSED",
	});
	expect(
		recordReferenceObservation({
			...f.input,
			attempt: { ...f.input.attempt, returnedModel: "another-model" },
		}).value.status,
	).toBe("HOLD");
	expect(
		recordReferenceObservation({
			...f.input,
			responseBytes,
			attempt: {
				...f.input.attempt,
				responseSHA256: referenceBytesSHA256(responseBytes),
			},
		}).value.status,
	).toBe("HOLD");
});

test.each([
	{
		fields: [
			{
				field: "composition.gaze",
				status: "ambiguous",
				value: "camera",
				region: null,
				cues: [],
			},
		],
	},
	{
		fields: [
			{
				field: "person.face",
				status: "observed",
				value: "round",
				region: null,
				cues: [],
			},
		],
	},
	{
		fields: [
			{
				field: "person.face",
				status: "not-visible",
				value: "round",
				region: null,
				cues: [],
			},
		],
	},
	{
		fields: [
			{
				field: "person.face",
				status: "observed",
				value: "round",
				region: { x: 0.9, y: 0, width: 0.5, height: 1 },
				cues: ["outline"],
			},
		],
	},
	{ fields: [], approved: true },
])("malformed or unjustifiably certain fields hold", (observation) => {
	const f = fixture();
	const choice = f.response.choices[0];
	if (!choice) throw Error("Missing fixture choice");
	choice.message.content = JSON.stringify(observation);
	const responseBytes = Buffer.from(JSON.stringify(f.response));
	expect(
		recordReferenceObservation({
			...f.input,
			responseBytes,
			attempt: {
				...f.input.attempt,
				responseSHA256: referenceBytesSHA256(responseBytes),
			},
		}).value.status,
	).toBe("HOLD");
});

test("malformed response bytes and legacy observations never become attributed", () => {
	const f = fixture();
	const responseBytes = Buffer.from("not-json");
	expect(
		recordReferenceObservation({
			...f.input,
			responseBytes,
			attempt: {
				...f.input.attempt,
				responseSHA256: referenceBytesSHA256(responseBytes),
			},
		}).value.status,
	).toBe("HOLD");
	const legacy = recordReferenceObservation({
		manifest: f.manifest,
		legacyBytes: Buffer.from("old gaze observation"),
	});
	expect(legacy.value).toMatchObject({
		status: "UNATTRIBUTED",
		observation: null,
		authorizesEdits: false,
		ownerApproval: "NONE",
	});
});

test("a caller cannot invent an immutable model snapshot absent from response bytes", () => {
	const f = fixture();
	expect(
		recordReferenceObservation({
			...f.input,
			attempt: { ...f.input.attempt, modelSnapshot: "invented-snapshot" },
		}).value,
	).toMatchObject({ status: "HOLD", reason: "ANALYSIS_SNAPSHOT_MISMATCH" });
});
