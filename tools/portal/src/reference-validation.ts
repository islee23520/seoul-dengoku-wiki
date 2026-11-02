import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { z } from "zod";
import { decodeCodexPng } from "../../portrait/2d/codex-image.mjs";
import { validateWorkstationPng } from "../../portrait/2d/generate-character-set.mjs";
import {
	authoredWorkstationLookSchema,
	validateWorkstationOutput,
	workstationSourceBindingSchema,
} from "../../portrait/2d/modular-parts.mjs";
import {
	parseWorkstationRequest,
	referenceKinds,
	referenceRequestSchema,
	workstationParent,
} from "./references.ts";
import { hash } from "./sources.ts";

// Separate v2 reader: never reinterpret historical nine-shot manifests.
export async function indexWorkstationArtifact(input: {
	ownerRoot: string;
	ownerId?: string;
	personId: string;
	parentRequestId: string;
}) {
	z.uuid().parse(input.parentRequestId);
	const parent = await workstationParent(input.ownerRoot, input.personId);
	const directory = join(parent, input.parentRequestId);
	if (
		!(await lstat(directory)).isDirectory() ||
		(await realpath(directory)) !== directory
	)
		throw Error("INVALID_PATH");
	async function read(name: string, max = 65536) {
		const path = join(directory, name);
		if (!(await lstat(path)).isFile() || (await realpath(path)) !== path)
			throw Error("INVALID_PATH");
		const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
		try {
			const stat = await file.stat();
			if (!stat.isFile() || stat.size > max) throw Error("INVALID_FILE");
			const bytes = await file.readFile();
			if (bytes.length > max) throw Error("INVALID_FILE");
			return bytes;
		} finally {
			await file.close();
		}
	}
	const same = (a: unknown, b: unknown) =>
		JSON.stringify(a) === JSON.stringify(b);
	const digest = (value: unknown) => hash(Buffer.from(JSON.stringify(value)));
	const request = parseWorkstationRequest(
		JSON.parse((await read("request.json")).toString()),
	);
	const authoredBytes = await read("authored-look.json");
	const look = authoredWorkstationLookSchema.parse(
		JSON.parse(authoredBytes.toString()),
	);
	const binding = bindingSchema.safeExtend({
		sourceBinding: workstationSourceBindingSchema.optional(),
		characterId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/),
		authoredLook: z.strictObject({
			sourceId: z.string(),
			lookId: z.string(),
			sha256: sha,
		}),
		category: z.string(),
		requestSha256: sha,
	});
	const frame = z.strictObject({
		requestId: z.uuid(),
		category: z.string(),
		view: z.string(),
		frameOrder: z.number().int().nonnegative(),
		outputSpecSha256: sha,
		status: z.literal("SUCCEEDED"),
		receiptSha256: sha,
	});
	const setSchema = z.strictObject({
		schemaVersion: z.literal(2),
		kind: z.literal("image-workstation-set"),
		binding,
		status: z.literal("candidate-unreviewed"),
		frames: z.array(frame).min(1).max(4),
		paidProof: z.literal("NOT_RUN"),
		approval: z.literal("NONE"),
		reviewStatus: z.literal("HOLD"),
	});
	const manifestBytes = await read("set.json");
	const manifest = setSchema.parse(JSON.parse(manifestBytes.toString()));
	const b = manifest.binding;
	if (
		request.requestId !== input.parentRequestId ||
		request.personId !== input.personId ||
		b.parentRequestId !== request.requestId ||
		b.personId !== request.personId ||
		b.connectionId !== request.connectionId ||
		b.providerModel !== request.providerModel ||
		b.identityResultId !== request.identityResultId ||
		b.styleReferenceSha256 !== request.styleReferenceSha256 ||
		!same(b.faceMode, request.faceMode) ||
		!same(b.authoredLook, request.authoredLook) ||
		!same(b.sourceBinding, request.sourceBinding) ||
		(request.sourceBinding !== undefined &&
			(request.sourceBinding.ownerId !== input.ownerId ||
				request.sourceBinding.characterId !== b.characterId ||
				request.sourceBinding.identityPngSHA !== b.identityReferenceSha256)) ||
		b.requestSha256 !== digest(request) ||
		hash(authoredBytes) !== request.authoredLook.sha256 ||
		look.sourceId !== request.authoredLook.sourceId ||
		look.lookId !== request.authoredLook.lookId ||
		look.personId !== b.personId ||
		look.characterId !== b.characterId ||
		look.category !== b.category ||
		b.category !== request.frames[0]?.outputSpec.category
	)
		throw Error("INVALID_BINDING");
	const childSchema = z.strictObject({
		requestId: z.uuid(),
		outputSpec: z.unknown(),
		outputSpecSha256: sha,
	});
	const plan = setSchema
		.omit({ frames: true, status: true })
		.extend({
			frames: z.array(z.never()).length(0),
			status: z.literal("PLANNED"),
			children: z.array(childSchema).min(1).max(4),
		})
		.parse(JSON.parse((await read("plan.json")).toString()));
	if (
		!same(plan.binding, b) ||
		plan.children.length !== request.frames.length ||
		manifest.frames.length !== request.frames.length ||
		new Set(plan.children.map((c) => c.requestId)).size !== plan.children.length
	)
		throw Error("INVALID_PLAN");
	const rows = [];
	for (const [index, selected] of request.frames.entries()) {
		const child = plan.children[index];
		const entry = manifest.frames[index];
		if (
			!child ||
			!entry ||
			child.requestId === input.parentRequestId ||
			entry.requestId !== child.requestId ||
			!same(validateWorkstationOutput(child.outputSpec), selected.outputSpec) ||
			child.outputSpecSha256 !== selected.outputSpecSha256 ||
			entry.outputSpecSha256 !== selected.outputSpecSha256 ||
			entry.frameOrder !== index ||
			entry.category !== b.category ||
			entry.view !== selected.outputSpec.view
		)
			throw Error("INVALID_FRAME");
		const stem = `frame-${index}`;
		const journal = z
			.strictObject({
				schemaVersion: z.literal(2),
				requestId: z.uuid(),
				binding,
				outputSpec: z.unknown(),
				outputSpecSha256: sha,
				prompt: z.string().min(1),
				references: z
					.array(
						z.strictObject({
							role: z.enum(["style-only", "sealed-identity"]),
							sha256: sha,
							pngBase64: z.string(),
						}),
					)
					.length(2),
			})
			.parse(
				JSON.parse((await read(`${stem}.request.json`, 12582912)).toString()),
			);
		if (
			journal.requestId !== child.requestId ||
			!same(journal.binding, b) ||
			!same(
				validateWorkstationOutput(journal.outputSpec),
				selected.outputSpec,
			) ||
			journal.outputSpecSha256 !== selected.outputSpecSha256
		)
			throw Error("INVALID_JOURNAL");
		for (const [n, ref] of journal.references.entries()) {
			const bytes = Buffer.from(ref.pngBase64, "base64");
			if (
				ref.role !== ["style-only", "sealed-identity"][n] ||
				ref.sha256 !== [b.styleReferenceSha256, b.identityReferenceSha256][n] ||
				hash(bytes) !== ref.sha256 ||
				bytes.toString("base64") !== ref.pngBase64
			)
				throw Error("INVALID_REFERENCE");
		}
		const receiptBytes = await read(`${stem}.receipt.json`);
		if (hash(receiptBytes) !== entry.receiptSha256)
			throw Error("INVALID_RECEIPT_HASH");
		const receipt = z
			.strictObject({
				schemaVersion: z.literal(2),
				requestId: z.uuid(),
				binding,
				outputSpec: z.unknown(),
				outputSpecSha256: sha,
				status: z.literal("SUCCEEDED"),
				imageName: z.literal(`${stem}.png`),
				imageSha256: sha,
				width: z.number(),
				height: z.number(),
				channels: z.number(),
				visiblePixels: z.number(),
				transparentPixels: z.number(),
				visibleBounds: z.array(z.number()).length(4),
				technicalValidation: z.literal("PASS"),
				semanticReview: z.literal("UNVERIFIED"),
				reviewStatus: z.literal("candidate-unreviewed"),
				approval: z.literal("NONE"),
			})
			.parse(JSON.parse(receiptBytes.toString()));
		if (
			receipt.requestId !== child.requestId ||
			!same(receipt.binding, b) ||
			!same(
				validateWorkstationOutput(receipt.outputSpec),
				selected.outputSpec,
			) ||
			receipt.outputSpecSha256 !== selected.outputSpecSha256
		)
			throw Error("INVALID_RECEIPT");
		const png = await read(`${stem}.png`, 8388608);
		if (hash(png) !== receipt.imageSha256) throw Error("INVALID_PNG_HASH");
		const actual = validateWorkstationPng(png, selected.outputSpec);
		for (const key of [
			"width",
			"height",
			"channels",
			"visiblePixels",
			"transparentPixels",
			"visibleBounds",
		] as const)
			if (!same(actual[key], receipt[key])) throw Error("INVALID_PNG_RECEIPT");
		rows.push(
			Object.freeze({
				personId: b.personId,
				characterId: b.characterId,
				parentRequestId: b.parentRequestId,
				childRequestId: child.requestId,
				category: selected.outputSpec.category,
				view: selected.outputSpec.view,
				frameOrder: index,
				outputSpecSha256: selected.outputSpecSha256,
				authoredLookSha256: b.authoredLook.sha256,
				sourceSha256: b.sourceSha256,
				identityReferenceSha256: b.identityReferenceSha256,
				styleReferenceSha256: b.styleReferenceSha256,
				receiptSHA: entry.receiptSha256,
				pngSHA: receipt.imageSha256,
				manifestSHA: hash(manifestBytes),
				imageName: receipt.imageName,
				technicalValidation: "PASS" as const,
				semanticReview: "UNVERIFIED" as const,
				approval: "NONE" as const,
			}),
		);
	}
	return Object.freeze(rows);
}

export const referenceValidationInput = z.strictObject({
	artifactRoot: z.string().min(1),
	artifactDirectory: z.string().min(1),
});
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const bindingSchema = z
	.strictObject({
		parentRequestId: z.uuid(),
		connectionId: z.uuid(),
		personId: referenceRequestSchema.shape.personId,
		characterId: z.string().regex(/^K\d+$/),
		providerModel: referenceRequestSchema.shape.providerModel,
		sourceSha256: sha,
		styleLockSha256: sha,
		styleReferenceSha256: sha,
		identityResultId: z.uuid(),
		identityReferenceSha256: sha,
		faceMode: referenceRequestSchema.shape.faceMode,
		faceVariant: z
			.strictObject({
				id: z.string().min(1),
				traitsSha256: sha,
				referenceImageSha256: sha,
			})
			.nullable(),
	})
	.refine((b) =>
		b.faceMode.kind === "unique"
			? b.faceVariant === null
			: b.faceVariant?.id === b.faceMode.variantId,
	);
const shotSchema = z.enum(referenceKinds);
const manifestSchema = z.strictObject({
	schemaVersion: z.literal(1),
	kind: z.literal("image-reference-set"),
	binding: bindingSchema,
	order: referenceRequestSchema.shape.shots,
	status: z.literal("candidate-unreviewed"),
	shots: z
		.array(
			z.strictObject({
				shot: shotSchema,
				requestId: z.uuid(),
				status: z.literal("SUCCEEDED"),
				receiptSha256: sha,
			}),
		)
		.min(1)
		.max(9),
	paidProof: z.literal("NOT_RUN"),
});
const receiptSchema = z.strictObject({
	schemaVersion: z.literal(1),
	requestId: z.uuid(),
	shot: shotSchema,
	binding: bindingSchema,
	status: z.literal("SUCCEEDED"),
	imageName: z.string(),
	imageSha256: sha,
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	channels: z.union([z.literal(3), z.literal(4)]),
	visiblePixels: z.number().int().positive(),
	continuitySha256: sha.nullable(),
	reviewStatus: z.literal("candidate-unreviewed"),
});
const authority = {
	approval: "NONE",
	dispatch: "NONE",
	paidProof: "NOT_RUN",
} as const;
export type ReferenceValidationVerdict = typeof authority &
	(
		| {
				schema: "portal-reference-validation.v1";
				verdict: "VALID";
				manifestSHA: string;
				binding: z.infer<typeof bindingSchema>;
				order: (typeof referenceKinds)[number][];
				shots: {
					shot: (typeof referenceKinds)[number];
					receiptSHA: string;
					pngSHA: string;
				}[];
		  }
		| {
				schema: "portal-reference-validation.v1";
				verdict: "INVALID";
				code: "REFERENCE_ARTIFACT_INVALID";
		  }
	);

// Local integrity only: recorded hashes are not trusted approval or dispatch pins.
export async function validateReferenceArtifact(
	input: z.infer<typeof referenceValidationInput>,
): Promise<ReferenceValidationVerdict> {
	try {
		const root = resolve(input.artifactRoot),
			directory = resolve(input.artifactDirectory);
		const child = relative(root, directory);
		if (isAbsolute(child) || child === ".." || child.startsWith(`..${sep}`))
			throw Error("INVALID_PATH");
		for (const current of [
			root,
			...child
				.split(sep)
				.filter(Boolean)
				.map((_, index, parts) => join(root, ...parts.slice(0, index + 1))),
		])
			if (
				!(await lstat(current)).isDirectory() ||
				(await realpath(current)) !== current
			)
				throw Error("INVALID_PATH");
		async function read(name: string, max: number) {
			const path = join(directory, name);
			if (!(await lstat(path)).isFile() || (await realpath(path)) !== path)
				throw Error("INVALID_PATH");
			const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
			try {
				const stat = await file.stat();
				if (!stat.isFile() || stat.size > max) throw Error("INVALID_FILE");
				const bytes = await file.readFile();
				if (bytes.length > max) throw Error("INVALID_FILE");
				return bytes;
			} finally {
				await file.close();
			}
		}
		const bytes = await read("set.json", 65536);
		const manifest = manifestSchema.parse(JSON.parse(bytes.toString()));
		const order = referenceKinds.filter((shot) =>
			manifest.order.includes(shot),
		);
		if (
			JSON.stringify(order) !== JSON.stringify(manifest.order) ||
			manifest.shots.length !== order.length ||
			new Set(manifest.shots.map((shot) => shot.requestId)).size !==
				order.length
		)
			throw Error("INVALID_ORDER");
		const shots = [];
		let continuity: string | null = null;
		for (const [index, shot] of manifest.shots.entries()) {
			if (
				shot.shot !== order[index] ||
				shot.requestId === manifest.binding.parentRequestId
			)
				throw Error("INVALID_SHOT");
			const receiptBytes = await read(`${shot.shot}.receipt.json`, 65536);
			if (hash(receiptBytes) !== shot.receiptSha256)
				throw Error("INVALID_RECEIPT_HASH");
			const receipt = receiptSchema.parse(JSON.parse(receiptBytes.toString()));
			if (
				receipt.shot !== shot.shot ||
				receipt.requestId !== shot.requestId ||
				receipt.imageName !== `${shot.shot}.png` ||
				JSON.stringify(receipt.binding) !== JSON.stringify(manifest.binding) ||
				receipt.continuitySha256 !== continuity
			)
				throw Error("INVALID_BINDING");
			const png = await read(`${shot.shot}.png`, 8388608);
			if (hash(png) !== receipt.imageSha256) throw Error("INVALID_PNG_HASH");
			const image = decodeCodexPng(png);
			let visible = 0;
			for (let i = 0; i < image.pixels.length; i += image.channels)
				if (image.channels === 3 || (image.pixels[i + 3] ?? 0) > 0) visible++;
			if (
				!visible ||
				image.width !== receipt.width ||
				image.height !== receipt.height ||
				image.channels !== receipt.channels ||
				visible !== receipt.visiblePixels
			)
				throw Error("INVALID_PNG_RECEIPT");
			if (shot.shot === "front") continuity = receipt.imageSha256;
			shots.push({
				shot: shot.shot,
				receiptSHA: shot.receiptSha256,
				pngSHA: receipt.imageSha256,
			});
		}
		return {
			schema: "portal-reference-validation.v1",
			verdict: "VALID",
			...authority,
			manifestSHA: hash(bytes),
			binding: manifest.binding,
			order,
			shots,
		};
	} catch {
		return {
			schema: "portal-reference-validation.v1",
			verdict: "INVALID",
			...authority,
			code: "REFERENCE_ARTIFACT_INVALID",
		};
	}
}
