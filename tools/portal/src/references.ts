import {
	lstat,
	mkdir,
	open,
	readFile,
	realpath,
	writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { generateWorkstationSet } from "../../portrait/2d/generate-character-set.mjs";
import { validateWorkstationRequest } from "../../portrait/2d/modular-parts.mjs";
import options from "../../portrait/2d/options.json" with {
	type: "json",
};
import style from "../../portrait/2d/style-lock.json" with {
	type: "json",
};
import { defaultProviderModel, type ProviderModel } from "./provider-models.ts";
import { hash } from "./sources.ts";

export type WorkstationOutput = {
	schemaVersion: 2;
	category:
		| "portrait"
		| "fullbody-turntable"
		| "torso"
		| "detached-head"
		| "head-without-hair-eyes-teeth"
		| "hair"
		| "underwear-only-torso";
	variant: "complete" | "exclude-hair-eyes-teeth" | "authored-underwear";
	view: "viewer-right" | "front" | "profile" | "side" | "back";
	frameOrder: number;
	format: "png";
	width: number;
	height: number;
	background:
		| { kind: "transparent"; alpha: "zero-background" }
		| { kind: "solid"; alpha: "opaque"; rgb: [number, number, number] };
	alignment: {
		canvasId: string;
		coordinates: "pixels-top-left-x-right-y-down";
		anchor: [number, number];
		crop: [number, number, number, number];
	};
	featureExclusions: ("hair" | "eyes" | "teeth")[];
};
export type WorkstationRequest = Omit<ReferenceRequest, "shots"> & {
	schemaVersion: 2;
	authoredLook: { sourceId: string; lookId: string; sha256: string };
	sourceBinding?: {
		schemaVersion: 2;
		ownerId: string;
		characterId: string;
		originalHashes: { detail: string; token: string; image: string };
		identityPngSHA: string;
	};
	frames: { outputSpec: WorkstationOutput; outputSpecSha256: string }[];
};
export type WorkstationDispatch = {
	schemaVersion: 2;
	requestId: string;
	binding: Record<string, unknown>;
	outputSpec: WorkstationOutput;
	outputSpecSha256: string;
	prompt: string;
	references: ReferenceDispatch["references"];
};
export function parseWorkstationRequest(value: unknown): WorkstationRequest {
	return validateWorkstationRequest(value);
}

// Caller supplies the authenticated owner's private root and sealed inputs.
// This does not acquire an HTTP lease or authorize a provider dispatch.
export async function generatePortalWorkstation(
	input: Omit<Parameters<typeof generateWorkstationSet>[0], "outputDir"> & {
		ownerRoot: string;
	},
	transport: (payload: WorkstationDispatch) => Promise<unknown>,
) {
	const request = parseWorkstationRequest(input.request);
	const parent = await workstationParent(
		input.ownerRoot,
		request.personId,
		true,
	);
	return generateWorkstationSet(
		{ ...input, request, outputDir: join(parent, request.requestId) },
		transport,
	);
}

export async function workstationParent(
	ownerRoot: string,
	personId: string,
	create = false,
) {
	z.string()
		.regex(/^person-\d+$/)
		.parse(personId);
	const root = await realpath(ownerRoot);
	if (!(await lstat(root)).isDirectory()) throw Error("INVALID_PATH");
	let current = root;
	for (const name of ["workstations", personId]) {
		current = join(current, name);
		if (create) await mkdir(current, { recursive: true, mode: 0o700 });
		if (
			!(await lstat(current)).isDirectory() ||
			(await realpath(current)) !== current
		)
			throw Error("INVALID_PATH");
	}
	return current;
}

export const referenceKinds = [
	"front",
	"profile",
	"side",
	"back",
	"head",
	"hair",
	"upper",
	"lower",
	"footwear",
] as const;
export const referenceRequestSchema = z.strictObject({
	requestId: z.uuid(),
	connectionId: z.uuid(),
	personId: z.string().regex(/^person-\d+$/),
	providerModel: z.literal("gpt-image-2.5-sunburst"),
	shots: z
		.array(z.enum(referenceKinds))
		.min(1)
		.max(9)
		.refine((value) => new Set(value).size === value.length),
	identityResultId: z.uuid(),
	styleReferenceSha256: z.string().regex(/^[a-f0-9]{64}$/),
	faceMode: z.discriminatedUnion("kind", [
		z.strictObject({ kind: z.literal("unique"), variantId: z.null() }),
		z.strictObject({
			kind: z.literal("template"),
			variantId: z.string().min(1).max(128),
		}),
	]),
});
export type ReferenceRequest = z.infer<typeof referenceRequestSchema>;
export type ReferenceDispatch = {
	requestId: string;
	shot: (typeof referenceKinds)[number];
	binding: Record<string, unknown>;
	prompt: string;
	references: { role: string; sha256: string; pngBase64: string }[];
};
export type ReferenceManifest = {
	schemaVersion: 1;
	kind: "image-reference-set";
	binding: Record<string, unknown> & { parentRequestId: string };
	order: (typeof referenceKinds)[number][];
	status: string;
	shots: {
		shot: (typeof referenceKinds)[number];
		requestId: string;
		status: string;
		receiptSha256: string;
	}[];
	paidProof: "NOT_RUN";
};
export const referenceCatalog = {
	schema: "portal-reference-catalog.v1",
	kinds: referenceKinds,
	productionGeneration: "BLOCKED_SINGLE_ATTEMPT_NOT_PROVED",
	paidProof: "NOT_RUN",
};
export async function referenceInputs(
	directory: string,
	character: Buffer,
	styleImage: Uint8Array,
) {
	for (const [name, bytes] of [
		["character.json", character],
		["style.json", JSON.stringify(style)],
		["options.json", JSON.stringify(options)],
		["style.png", styleImage],
	] as const)
		await writeFile(join(directory, name), bytes, { flag: "wx", mode: 0o600 });
	return {
		characterPath: join(directory, "character.json"),
		sha256: hash(character),
		stylePath: join(directory, "style.json"),
		referencePath: join(directory, "style.png"),
		optionsPath: join(directory, "options.json"),
	};
}
// Translate the domain's internal binding protocol to the existing own-server
// OpenAI-compatible multipart route. It is never forwarded as upstream JSON.
export async function dispatchReference(
	payload: ReferenceDispatch,
	options: {
		directory: string;
		model?: ProviderModel;
		outbound: <T>(start: (key: string, baseUrl: string) => T) => T;
	},
) {
	const plan = JSON.parse(
		await readFile(join(options.directory, "plan.json"), "utf8"),
	) as { children: { shot: string; requestId: string }[] };
	const journal = await readFile(
		join(options.directory, `${payload.shot}.request.json`),
	);
	if (
		!plan.children.some(
			(child) =>
				child.shot === payload.shot && child.requestId === payload.requestId,
		) ||
		JSON.stringify(JSON.parse(journal.toString())) !== JSON.stringify(payload)
	)
		throw Error("REFERENCE_JOURNAL_MISMATCH");
	// Durability precedes actual upstream dispatch, not just the transport callback.
	for (const name of ["plan.json", `${payload.shot}.request.json`]) {
		const file = await open(join(options.directory, name), "r");
		try {
			await file.sync();
		} finally {
			await file.close();
		}
	}
	const parent = await open(options.directory, "r");
	try {
		await parent.sync();
	} finally {
		await parent.close();
	}
	const form = new FormData();
	form.set("model", options.model ?? defaultProviderModel);
	form.set(
		"prompt",
		`Image 1 is style technique only. Image 2 is the supplied sealed recipient identity; preserve its face, common head shape and authored asymmetry. Any third image is continuity only and cannot override authored slots. ${payload.prompt}`,
	);
	form.set("size", "1024x1536");
	form.set("n", "1");
	for (const [index, reference] of payload.references.entries()) {
		const bytes = Buffer.from(reference.pngBase64, "base64");
		if (
			bytes.toString("base64") !== reference.pngBase64 ||
			hash(bytes) !== reference.sha256
		)
			throw Error("REFERENCE_HASH_MISMATCH");
		form.append(
			"image[]",
			new Blob([bytes], { type: "image/png" }),
			`reference-${index + 1}.png`,
		);
	}
	const response = await options.outbound((key, baseUrl) => {
		if (payload.prompt.includes(key)) throw Error("CREDENTIAL_IN_PROMPT");
		return fetch(`${baseUrl.replace(/\/+$/, "")}/images/edits`, {
			method: "POST",
			headers: { authorization: `Bearer ${key}` },
			body: form,
			redirect: "error",
			signal: AbortSignal.timeout(120000),
		});
	});
	if (!response.ok || !response.body)
		throw Error("REFERENCE_PROVIDER_UNCERTAIN");
	const chunks: Uint8Array[] = [];
	let size = 0;
	for await (const chunk of response.body) {
		size += chunk.length;
		if (size > 12582912) throw Error("REFERENCE_RESPONSE_TOO_LARGE");
		chunks.push(chunk);
	}
	const raw = Buffer.concat(chunks);
	await writeFile(
		join(options.directory, `${payload.shot}.provider-response.bin`),
		raw,
		{ flag: "wx", mode: 0o600 },
	);
	const result = z
		.object({
			data: z.array(z.object({ b64_json: z.string().min(1) })).length(1),
		})
		.parse(JSON.parse(raw.toString()));
	const pngBase64 = result.data[0]?.b64_json ?? "";
	const bytes = Buffer.from(pngBase64, "base64");
	if (bytes.toString("base64") !== pngBase64)
		throw Error("REFERENCE_PROVIDER_UNCERTAIN");
	return {
		status: "SUCCEEDED",
		requestId: payload.requestId,
		shot: payload.shot,
		binding: payload.binding,
		pngBase64,
		imageSha256: hash(bytes),
	};
}
