import { readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, join, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import historicalProfile from "../training/shared-target-drawing-v2/manifest.json" with {
	type: "json",
};
import approvedProfile from "../training/shared-target-drawing-v3/manifest.json" with {
	type: "json",
};
import contentInventory from "../training/training100-content-v1/manifest.json" with {
	type: "json",
};
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import {
	prepareTrainingConditions,
	trainingHash,
	trainingTargetProfileBinding,
} from "../../portrait/generator/src/training-transport.ts";
import { trainingPortraitDelivery } from "./portrait-size.ts";
import { transformReferencePng } from "./reference-transform.ts";
import {
	acquireReferenceSource,
	type ReferenceSourceDependencies,
} from "./source-acquisition.ts";
import { generationLook } from "./sources.ts";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const common = {
	schema: z.literal("cpa-training-generation.v1"),
	requestId: z.uuid(),
	connectionId: z.uuid().optional(),
	slotId: z.string().regex(/^(MR|FR|MT|FT)0(0[1-9]|1[0-9]|2[0-5])$/),
	styleProfileId: z
		.enum(["shared-target-drawing-v2", "shared-target-drawing-v3"])
		.default("shared-target-drawing-v3"),
	provider: z.literal("openai-compatible"),
	providerModel: z.literal("gpt-image-2.5-sunburst"),
	generationProfile: z.literal("cpa340-padded-v1"),
	size: z.literal("340x510"),
};
export const trainingRequestSchema = z.discriminatedUnion("inputMode", [
	z.strictObject({
		...common,
		inputMode: z.literal("reference-image"),
		sourceSelection: z.strictObject({
			kind: z.literal("selected"),
			personId: z.string().regex(/^person-\d+$/),
			sourceSHA256: sha,
		}),
		variantId: z.string().regex(/^V(0[1-9]|1[0-3])$/),
	}),
	z.strictObject({
		...common,
		inputMode: z.literal("tokens-only"),
		sourceSelection: z.strictObject({
			kind: z.literal("intentional-absence"),
			reason: z.literal("design-token-content-only"),
		}),
		tokenSelection: z.strictObject({
			personId: z.string().regex(/^person-\d+$/),
			tokenSHA256: sha,
		}),
	}),
]);
export type TrainingRequest = z.infer<typeof trainingRequestSchema>;
export function trainingStyleProfile(id: TrainingRequest["styleProfileId"]) {
	return id === "shared-target-drawing-v2"
		? historicalProfile
		: approvedProfile;
}
export class TrainingError extends Error {
	constructor(
		readonly code: string,
		readonly status = 422,
	) {
		super(code);
	}
}
export function trainingSlot(request: TrainingRequest) {
	const inventory =
		request.styleProfileId === "shared-target-drawing-v2"
			? historicalProfile.inventory
			: contentInventory;
	const slot = inventory.slots.find((item) => item.slotId === request.slotId);
	if (!slot) throw new TrainingError("TRAINING_SLOT_UNKNOWN");
	switch (request.inputMode) {
		case "reference-image":
			if (
				!slot.cellId.endsWith("/reference-image") ||
				request.sourceSelection.personId !== slot.personId ||
				request.sourceSelection.sourceSHA256 !== slot.sourceSHA256 ||
				request.variantId !== slot.variantId
			)
				throw new TrainingError("TRAINING_SLOT_MISMATCH", 409);
			break;
		case "tokens-only":
			if (
				!slot.cellId.endsWith("/tokens-only") ||
				request.tokenSelection.personId !== slot.personId ||
				request.tokenSelection.tokenSHA256 !== slot.sourceSHA256
			)
				throw new TrainingError("TRAINING_SLOT_MISMATCH", 409);
			break;
		default:
			request satisfies never;
	}
	return slot;
}
export function compileTrainingContent(token: Record<string, unknown>) {
	const normalized = generationLook(token);
	const fields: {
		pointer: string;
		value: string | number;
		status: string;
		source: string | null;
	}[] = [];
	const trait = z.object({
		value: z.union([z.string(), z.number()]).nullable(),
		status: z.string(),
		source: z.string().nullable(),
		unit: z.string().nullish(),
	});
	const slots = z
		.record(z.string(), z.record(z.string(), z.unknown()))
		.parse(normalized["slots"]);
	const identity = z
		.record(z.string(), z.unknown())
		.parse(normalized["identity"]);
	for (const [section, values] of Object.entries(slots)) {
		for (const [field, value] of Object.entries(values)) {
			const parsed = trait.parse(value);
			if (parsed.value !== null && parsed.status !== "unknown")
				fields.push({
					pointer: `/slots/${section}/${field}`,
					value: parsed.unit ? `${parsed.value} ${parsed.unit}` : parsed.value,
					status: parsed.status,
					source: parsed.source,
				});
		}
	}
	for (const field of [
		"ethnicity",
		"origin",
		"gender",
		"ageCategory",
	] as const) {
		const parsed = trait.safeParse(identity[field]);
		if (
			parsed.success &&
			parsed.data.value !== null &&
			parsed.data.status !== "unknown"
		)
			fields.push({
				pointer: `/identity/${field}`,
				value: parsed.data.value,
				status: parsed.data.status,
				source: parsed.data.source,
			});
	}
	const text = fields
		.map((field) => `${field.pointer}: ${field.value}`)
		.join("\n");
	return { fields, text, sha256: trainingHash(Buffer.from(text)) };
}
export async function loadTrainingStyles(
	id: TrainingRequest["styleProfileId"] = "shared-target-drawing-v3",
) {
	const profile = trainingStyleProfile(id);
	const bytes: Uint8Array[] = [];
	const configuredRoot =
		(id === "shared-target-drawing-v2"
			? process.env["PORTAL_TRAINING_V2_ASSET_ROOT"]
			: undefined) ?? process.env["PORTAL_TRAINING_ASSET_ROOT"];
	if (configuredRoot && !isAbsolute(configuredRoot))
		throw new TrainingError("TRAINING_ASSET_ROOT_INVALID");
	const root = configuredRoot ? await realpath(configuredRoot) : null;
	for (const exemplar of profile.exemplars) {
		const location = root
			? await realpath(join(root, exemplar.path))
			: new URL(
					import.meta.url.endsWith(".ts")
						? id === "shared-target-drawing-v2"
							? `../training/${id}/${exemplar.path}`
							: `../../../public/portraits/${exemplar.path.replace(/^images\//, "")}`
						: id === "shared-target-drawing-v2"
							? `./private/training/${exemplar.path}`
							: `./private/training/${id}/${exemplar.path}`,
					import.meta.url,
				);
		if (
			root &&
			typeof location === "string" &&
			!location.startsWith(root + sep)
		)
			throw new TrainingError("TRAINING_ASSET_ROOT_INVALID");
		const source = await readFile(location);
		const png = decodePng(source);
		if (
			trainingHash(source) !== exemplar.sha256 ||
			png.width !== exemplar.dimensions[0] ||
			png.height !== exemplar.dimensions[1]
		)
			throw new TrainingError("TRAINING_STYLE_BYTES_MISMATCH", 409);
		bytes.push(source);
	}
	return bytes;
}
export async function acquireTrainingSource(
	request: TrainingRequest,
	dependencies: ReferenceSourceDependencies,
) {
	const slot = trainingSlot(request);
	const acquired = await acquireReferenceSource(
		{
			schemaVersion: 2,
			requestId: request.requestId,
			personId: slot.personId,
			inputMode:
				request.inputMode === "reference-image"
					? "reference-img2img"
					: "token-only",
			sourceSelection:
				request.inputMode === "reference-image"
					? request.sourceSelection
					: { kind: "intentional-absence", reason: "no-reference-available" },
			explicitEdits: [],
			provider:
				request.inputMode === "reference-image"
					? "openai-compatible"
					: "comfyui",
			providerModel:
				request.inputMode === "reference-image"
					? request.providerModel
					: "comfyui:moss-image-sft-style-male.alpha.v1",
			size: request.size,
			faceMode: { kind: "unique", variantId: null },
		},
		dependencies,
	);
	if (
		acquired.status !== "acquired" &&
		acquired.status !== "intentional-absence"
	)
		throw new TrainingError(acquired.errorCode, acquired.httpStatus);
	const source = acquired.generation;
	if (
		(request.inputMode === "tokens-only"
			? source.tokenSHA256
			: source.recipientImage?.sourceSHA256) !== slot.sourceSHA256
	)
		throw new TrainingError("TRAINING_SOURCE_HASH_MISMATCH", 409);
	return {
		token: source.tokenBytes,
		recipient: source.recipientImage?.bytes ?? null,
	};
}
export function prepareTrainingGeneration(
	request: TrainingRequest,
	source: { readonly token: Uint8Array; readonly recipient: Uint8Array | null },
	styles: readonly Uint8Array[],
) {
	const slot = trainingSlot(request);
	const reference = request.inputMode === "reference-image";
	const profile = trainingStyleProfile(request.styleProfileId);
	const inventory =
		request.styleProfileId === "shared-target-drawing-v2"
			? historicalProfile.inventory
			: contentInventory;
	if (
		reference !== (source.recipient !== null) ||
		trainingHash(
			reference && source.recipient ? source.recipient : source.token,
		) !== slot.sourceSHA256
	)
		throw new TrainingError("TRAINING_SOURCE_HASH_MISMATCH", 409);
	const token = z
		.record(z.string(), z.unknown())
		.parse(JSON.parse(Buffer.from(source.token).toString("utf8")));
	if (token["personId"] !== slot.personId)
		throw new TrainingError("TRAINING_IDENTITY_MISMATCH");
	const content = reference ? null : compileTrainingContent(token);
	const transformed =
		source.recipient === null
			? null
			: transformReferencePng(source.recipient, "native", "cpa340-padded-v1");
	const images = [
		...(transformed
			? [
					{
						index: 1,
						role: "recipient-identity-content" as const,
						assetId: `reference:${slot.personId}`,
						filename: "recipient-1.png",
						originalSHA256: slot.sourceSHA256,
						wireSHA256: trainingHash(transformed.rgbaBytes),
						transformSHA256: trainingHash(
							Buffer.from(JSON.stringify(transformed.receipt)),
						),
					},
				]
			: []),
		...profile.exemplars.map((exemplar, index) => ({
			index: index + (reference ? 2 : 1),
			role: "style-only" as const,
			assetId: exemplar.assetId,
			filename: "filename" in exemplar ? exemplar.filename : exemplar.path,
			originalSHA256: exemplar.sha256,
			wireSHA256: exemplar.sha256,
			transformSHA256: null,
		})),
	];
	const prefix = reference
		? "Image 1 is recipient identity and content. Preserve its individual face geometry, eye apertures, hair, accessories, garment construction, pose, head orientation, framing and gaze except exact slot edits below. Transform rendering style; do not preserve source technique. Images 2 and 3 provide style technique only."
		: "Generate AUTHORED CONTENT. No recipient image exists. Images 1 and 2 provide style technique only, never identity or content.";
	const prompt = [
		prefix,
		reference
			? `EXACT SLOT EDITS\n${JSON.stringify(slot.edits)}`
			: `AUTHORED CONTENT\n${content?.text}`,
		...profile.axes.map(
			(axis) => `${axis.axis}: KEEP ${axis.keep} DROP ${axis.drop}`,
		),
		...profile.roleExclusions,
		"Technique means mark treatment, not facial geometry: preserve individual jaw/chin proportions and eye apertures. Do not average faces. Neither exemplar supplies pose, gaze, head turn, palette, anatomy, garment or identity. Recipient/authored colors win. Historical corpus depiction direction is observation only, not a global pose requirement.",
		"Use 640x1024 computational canvas; content only inside x150 y257 width340 height510 at scale1. Transparent outer padding, no expansion/crop/stretch; delivery removes only declared padding. Fully opaque confident person interior; natural true-edge partial alpha; alpha0 RGB0. No exemplar background transfer.",
	].join("\n");
	const intent = {
		schema: "cpa-training-intent.v1",
		request,
		slot,
		profileSHA256: trainingHash(Buffer.from(JSON.stringify(profile))),
		inventorySHA256: inventory.sourceSHA256,
		content,
		sourceSHA256: slot.sourceSHA256,
		tokenSHA256: trainingHash(source.token),
		transform: transformed?.receipt ?? null,
		images,
	};
	const conditions = prepareTrainingConditions({
		schema: "cpa-training-conditions.v1",
		compiler: "shared-style-cpa-training.v1",
		inputMode: request.inputMode,
		model: request.providerModel,
		styleProfileId: request.styleProfileId,
		profileSHA256: intent.profileSHA256,
		...(request.styleProfileId === "shared-target-drawing-v3"
			? { targetProfileBinding: trainingTargetProfileBinding }
			: {}),
		inventorySHA256: intent.inventorySHA256,
		intentSHA256: trainingHash(Buffer.from(JSON.stringify(intent))),
		prompt,
		promptSHA256: trainingHash(Buffer.from(prompt)),
		images,
		orderedImageBytes: [
			...(transformed ? [transformed.rgbaBytes] : []),
			...styles,
		],
	});
	return { intent, conditions };
}
export async function verifyTrainingResult(directory: string) {
	const read = (name: string) => readFile(join(directory, name));
	const request = trainingRequestSchema.parse(
		JSON.parse((await read("request-payload.json")).toString()),
	);
	const source = z
		.object({ token: z.string(), recipient: z.string().nullable() })
		.parse(JSON.parse((await read("training-source.json")).toString()));
	const prepared = prepareTrainingGeneration(
		request,
		{
			token: Buffer.from(source.token, "base64"),
			recipient:
				source.recipient === null
					? null
					: Buffer.from(source.recipient, "base64"),
		},
		await loadTrainingStyles(request.styleProfileId),
	);
	const retainedIntent = JSON.parse(
		(await read("training-intent.json")).toString(),
	);
	if (!isDeepStrictEqual(retainedIntent, prepared.intent))
		throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	const receipt = JSON.parse(
		(await read("provider-source.png.receipt.json")).toString(),
	);
	const wire = await read("provider-source.png.request.bin");
	const response = await read("provider-source.png.response.bin");
	const {
		orderedImageBytes,
		schema: _conditionsSchema,
		...pins
	} = prepared.conditions;
	for (const [key, value] of Object.entries(pins))
		if (!isDeepStrictEqual(receipt[key], value))
			throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	if (
		trainingHash(wire) !== receipt.wire.sha256 ||
		trainingHash(response) !== receipt.responseBodySHA256
	)
		throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	const form = await new Request("http://localhost/verify", {
		method: "POST",
		headers: { "content-type": receipt.wire.contentType },
		body: wire,
	}).formData();
	const entries = [...form.entries()];
	if (entries.length !== 6 + prepared.conditions.images.length)
		throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	for (const [key, value] of Object.entries({
		model: prepared.conditions.model,
		prompt: prepared.conditions.prompt.replace(/\r?\n/g, "\r\n"),
		size: "640x1024",
		n: "1",
		output_format: "png",
		background: "transparent",
	}))
		if (form.getAll(key).length !== 1 || form.get(key) !== value)
			throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	const parts = form.getAll("image[]");
	for (const [index, image] of prepared.conditions.images.entries()) {
		const part = parts[index];
		if (
			!(part instanceof File) ||
			part.name !== image.filename ||
			trainingHash(new Uint8Array(await part.arrayBuffer())) !==
				image.wireSHA256 ||
			image.wireSHA256 !==
				trainingHash(orderedImageBytes[index] ?? new Uint8Array())
		)
			throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	}
	const envelope = z
		.object({
			model: z.literal("gpt-image-2.5-sunburst"),
			data: z.tuple([z.object({ b64_json: z.string() })]),
		})
		.parse(JSON.parse(response.toString()));
	const raw = Buffer.from(envelope.data[0].b64_json, "base64");
	if (
		raw.toString("base64") !== envelope.data[0].b64_json ||
		trainingHash(raw) !== receipt.responseSHA ||
		trainingHash(await read("provider-source.png")) !== trainingHash(raw)
	)
		throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	const delivery = trainingPortraitDelivery({
		rawBytes: raw,
		canonicalReceiptBytes: await read("provider-source.png.receipt.json"),
	});
	if (
		trainingHash(await read("candidate.png")) !== trainingHash(delivery.bytes)
	)
		throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	return {
		schema: "cpa-training-result.v1",
		requestId: request.requestId,
		slotId: request.slotId,
		approval: "NONE",
		trainingSelected: false,
		reviewStatus: "candidate-unreviewed",
		imageSHA256: trainingHash(delivery.bytes),
		transformation: delivery.transformation,
	};
}

export async function quarantineTrainingResponse(directory: string) {
	const receipt = z
		.object({
			responseBodySHA256: sha,
			failure: z.string(),
			modelAttestation: z.string().optional(),
		})
		.parse(
			JSON.parse(
				await readFile(
					join(directory, "provider-source.png.receipt.json"),
					"utf8",
				),
			),
		);
	const body = await readFile(
		join(directory, "provider-source.png.response.bin"),
	);
	if (trainingHash(body) !== receipt.responseBodySHA256)
		throw new TrainingError("RESULT_EVIDENCE_MISMATCH", 409);
	const payload = z
		.object({ data: z.tuple([z.object({ b64_json: z.string() })]) })
		.safeParse(JSON.parse(body.toString()));
	if (!payload.success) return null;
	const encoded = payload.data.data[0].b64_json;
	const bytes = Buffer.from(encoded, "base64");
	if (bytes.toString("base64") !== encoded) return null;
	try {
		decodePng(bytes);
	} catch (error) {
		if (error instanceof Error) return null;
		throw error;
	}
	const diagnostic = {
		schema: "cpa-training-quarantine.v1",
		disposition: "QUARANTINED_UNVERIFIED_MODEL",
		responseBodySHA256: receipt.responseBodySHA256,
		dataIndex: 0,
		pngSHA256: trainingHash(bytes),
		modelAttestation: receipt.modelAttestation ?? "UNKNOWN",
		failure: receipt.failure,
		productionImageUrl: null,
		trainingSelected: false,
		ownerApproval: "NONE",
	};
	await writeFile(join(directory, "diagnostic-provider.png"), bytes, {
		flag: "wx",
		mode: 0o600,
	});
	await writeFile(
		join(directory, "diagnostic.json"),
		`${JSON.stringify(diagnostic)}\n`,
		{ flag: "wx", mode: 0o600 },
	);
	return diagnostic;
}
