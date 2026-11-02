import { randomUUID } from "node:crypto";
import {
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { createAuth } from "../src/auth.ts";
import { batchSchema, writeBatch } from "../src/batches.ts";
import { loadConfig } from "../src/config.ts";
import { referenceRecord } from "../src/reference-analysis.ts";
import { referenceGenerationRequestSchema } from "../src/reference-contract.ts";
import { transformReferencePng } from "../src/reference-transform.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import {
	rejectionProofFiles,
	terminalRejectionRequestSchema,
} from "../src/terminal-rejection-proof.ts";

export async function fileHashes(dir: string) {
	return Object.fromEntries(
		await Promise.all(
			(await readdir(dir))
				.sort()
				.map(async (name) => [name, hash(await readFile(join(dir, name)))]),
		),
	);
}
export async function jsonFile(dir: string, name: string, value: unknown) {
	await writeFile(join(dir, name), `${JSON.stringify(value)}\n`);
}
export async function recoveryFixture(
	options: {
		readonly retained?: string;
		readonly checkpoint?: (
			point: "before-commit" | "after-commit",
		) => Promise<void>;
	} = {},
) {
	const directory = await realpath(
		await mkdtemp(
			join(process.env["RUN_TMP"] ?? tmpdir(), "terminal-recovery-"),
		),
	);
	const ownerRoot = join(directory, "storage", "1");
	const id = options.retained ? basename(options.retained) : randomUUID();
	const dir = join(ownerRoot, "jobs", id);
	if (options.retained) {
		await mkdir(join(ownerRoot, "jobs"), { recursive: true });
		await cp(options.retained, dir, {
			recursive: true,
			errorOnExist: true,
			force: false,
		});
	} else {
		await mkdir(dir, { recursive: true });
		const imageBytes = encodePng({
			width: 1,
			height: 1,
			pixels: new Uint8Array([40, 50, 60, 255]),
		});
		const detail = Buffer.from(JSON.stringify({ personId: "person-0998" }));
		const token = Buffer.from(
			JSON.stringify({
				personId: "person-0998",
				image: { sha256: hash(imageBytes) },
			}),
		);
		const records = {
			manifest: referenceRecord({
				sourceSHA256: hash(imageBytes),
				tokenSHA256: hash(token),
			}),
			observation: referenceRecord({ status: "UNQUALIFIED" }),
			directive: referenceRecord({ requestId: id }),
			intent: referenceRecord({ inputMode: "reference-img2img" }),
		};
		const payload = referenceGenerationRequestSchema.parse({
			schemaVersion: 2,
			requestId: id,
			connectionId: randomUUID(),
			personId: "person-0998",
			inputMode: "reference-img2img",
			sourceSelection: {
				kind: "selected",
				personId: "person-0998",
				sourceSHA256: hash(imageBytes),
			},
			explicitEdits: [],
			provider: "openai-compatible",
			providerModel: "gpt-image-2.5-sunburst",
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		});
		const initial = {
			id,
			state: "RUNNING",
			reviewStatus: "HOLD",
			imageUrl: null,
			metrics: null,
			errorCode: null,
			payloadSHA: hash(Buffer.from(JSON.stringify(payload))),
		};
		await jsonFile(dir, "job.json", {
			...initial,
			state: "UNKNOWN",
			errorCode: "LOCAL_MODEL_NOT_EXPOSED",
		});
		await jsonFile(dir, "initial-job.json", initial);
		await jsonFile(dir, "request-payload.json", payload);
		await jsonFile(dir, "connection-binding.json", {
			connectionId: payload.connectionId,
			ownerId: "1",
			sessionFingerprint: "b".repeat(64),
			expiresAt: 1,
			revision: randomUUID(),
			endpointId: "local-openai",
			endpointRevision: "local-openai.v1",
			protocolVersion: "openai-compatible-http.v1",
			toolName: "openai-images-edits",
			toolSchemaDigest: hash(
				Buffer.from(
					"openai-compatible-http.v1:/images/edits:canonical-multipart",
				),
			),
			state: "READY",
		});
		const prompt = "Preserve the reference.\nNo edits.";
		const form = new FormData();
		for (const [key, value] of Object.entries({
			model: payload.providerModel,
			prompt,
			size: "1024x1536",
			n: "1",
			output_format: "png",
			background: "transparent",
		}))
			form.set(key, value);
		form.append(
			"image[]",
			new Blob([imageBytes], { type: "image/png" }),
			"recipient-1.png",
		);
		const encoded = new Request("http://127.0.0.1/never-sent", {
			method: "POST",
			body: form,
		});
		const contentType = encoded.headers.get("content-type");
		const wire = Buffer.from(await encoded.arrayBuffer());
		const record = {
			schemaVersion: 2,
			inputMode: "reference-img2img",
			compiler: "source-preservation-edit.v1",
			requestId: id,
			model: payload.providerModel,
			sourceSHA256: hash(imageBytes),
			provenance: { records },
			prompt,
			promptSHA256: hash(Buffer.from(prompt)),
			wirePromptSHA256: hash(Buffer.from(prompt.replace(/\n/g, "\r\n"))),
			wirePromptNewlines: "multipart-crlf",
			referenceHashes: [hash(imageBytes)],
			size: "1024x1536",
			n: 1,
			output_format: "png",
			background: "transparent",
			wire: { contentType, bytes: wire.length, sha256: hash(wire) },
		};
		const response = Buffer.from(
			JSON.stringify({
				created: 1,
				data: [{ b64_json: Buffer.from(imageBytes).toString("base64") }],
			}),
		);
		await writeFile(join(dir, "provider-source.png.request.bin"), wire);
		await writeFile(join(dir, "provider-source.png.response.bin"), response);
		await jsonFile(dir, "provider-source.png.request.json", record);
		await jsonFile(dir, "provider-source.png.receipt.json", {
			...record,
			status: 200,
			responseBodySHA256: hash(response),
			requestedModel: payload.providerModel,
			returnedModel: null,
			modelSnapshot: null,
			modelSnapshotStatus: "NOT_EXPOSED",
			modelAttestation: "UNKNOWN",
			failure: "MODEL_NOT_EXPOSED",
		});
		await writeFile(join(dir, "dispatch.lock"), "");
		await jsonFile(dir, "job-history.json", {
			createdAt: "2026-01-01T00:00:00.000Z",
		});
		await jsonFile(dir, "provenance.json", {
			requestId: id,
			original: {
				detail: hash(detail),
				token: hash(token),
				image: hash(imageBytes),
			},
			reference: {
				schemaVersion: 2,
				inputMode: "reference-img2img",
				sourceSelection: payload.sourceSelection,
			},
		});
		await jsonFile(dir, "reference-analysis.json", { records });
		await writeFile(
			join(dir, "reference-normalized.png"),
			transformReferencePng(imageBytes).rgbaBytes,
		);
		await jsonFile(dir, "source-bytes.json", {
			detail: detail.toString("base64"),
			token: token.toString("base64"),
			image: Buffer.from(imageBytes).toString("base64"),
		});
	}
	const config = loadConfig({
		PORTAL_MODE: "local",
		PORTAL_PORT: "0",
		PORTAL_STORAGE_PATH: join(directory, "storage"),
	});
	let outbound = 0;
	const create = () =>
		createPortal(config, {
			template: createTransportFixture(),
			referenceSend: async () => {
				outbound++;
				throw Error("UNEXPECTED_PROVIDER_CALL");
			},
			...(options.checkpoint
				? { terminalRejectionCheckpoint: options.checkpoint }
				: {}),
		});
	let app = await create();
	let origin = `http://127.0.0.1:${(await app.listen()).port}`;
	const auth = createAuth(config);
	function headers(owner = "1") {
		const token = auth.issue({ id: owner, login: `owner-${owner}` });
		const session = auth.verify(token);
		if (!session) throw Error("SESSION_MISSING");
		return {
			cookie: `portal_session=${token}`,
			origin,
			"x-csrf-token": session.csrfToken,
			"content-type": "application/json",
		};
	}
	async function operation() {
		const hashes = await fileHashes(dir);
		return terminalRejectionRequestSchema.parse({
			schemaVersion: 1,
			operationId: randomUUID(),
			expectedJobSHA256: hashes["job.json"],
			expectedPayloadSHA256: hashes["request-payload.json"],
			expectedReceiptSHA256: hashes["provider-source.png.receipt.json"],
			expectedRequestSHA256: hashes["provider-source.png.request.bin"],
			expectedResponseSHA256: hashes["provider-source.png.response.bin"],
			expectedRetainedManifest: Object.fromEntries(
				rejectionProofFiles.map((name) => [name, hashes[name]]),
			),
		});
	}
	const route = `/v1/jobs/${id}/terminal-rejections`;
	return {
		directory,
		ownerRoot,
		dir,
		id,
		route,
		headers,
		operation,
		get outbound() {
			return outbound;
		},
		get app() {
			return app;
		},
		get origin() {
			return origin;
		},
		get: (path: string, h = headers()) =>
			fetch(`${origin}/tools/api${path}`, { headers: h }),
		post: (path: string, input: unknown, h = headers()) =>
			fetch(`${origin}/tools/api${path}`, {
				method: "POST",
				headers: h,
				body: JSON.stringify(input),
			}),
		restart: async () => {
			await app.close();
			app = await create();
			origin = `http://127.0.0.1:${(await app.listen()).port}`;
		},
		close: async () => {
			await app.close();
			await rm(directory, { recursive: true, force: true });
		},
	};
}

export async function unresolvedBatch(
	ownerRoot: string,
	requestId: string = randomUUID(),
) {
	const batch = batchSchema.parse({
		schema: "portal-batch.v1",
		ownerId: "1",
		batchId: randomUUID(),
		payloadSHA: "a".repeat(64),
		connectionId: randomUUID(),
		connectionRevision: randomUUID(),
		providerModel: "gpt-image-2.5-sunburst",
		faceMode: { kind: "unique", variantId: null },
		state: "PAUSED_UNKNOWN",
		createdAt: "2026-01-01",
		updatedAt: "2026-01-01",
		revision: 1,
		cancelRequested: false,
		pauseReason: "OWNER_DISPATCH_UNCERTAIN",
		items: [
			{
				itemId: randomUUID(),
				requestId,
				ordinal: 0,
				personId: "person-0998",
				characterId: "K998",
				name: "fixture",
				snapshotSHA: "b".repeat(64),
				status: "UNKNOWN",
				jobId: requestId,
				startedAt: null,
				finishedAt: null,
				errorCode: "OWNER_DISPATCH_UNCERTAIN",
			},
		],
	});
	await writeBatch(ownerRoot, batch);
	return batch;
}
