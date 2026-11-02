import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
	copyFile,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import approvedProfile from "../../../ART-ASSETS/portrait-training/shared-target-drawing-v3/manifest.json" with {
	type: "json",
};
import { decodePng } from "../../portrait/acceptance/src/png.ts";
import { cpaPadding } from "../../portrait/generator/src/cpa-padding.ts";
import {
	prepareTrainingConditions,
	trainingTargetProfileBinding,
} from "../../portrait/generator/src/training-transport.ts";
import { runCli } from "../src/cli.ts";
import { loadConfig } from "../src/config.ts";
import { remoteInputs } from "../src/management.ts";
import { trainingPortraitDelivery } from "../src/portrait-size.ts";
import { transformReferencePng } from "../src/reference-transform.ts";
import { createReleasePackage } from "../src/release-package.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import {
	acquireTrainingSource,
	compileTrainingContent,
	loadTrainingStyles,
	prepareTrainingGeneration,
	trainingRequestSchema,
	trainingSlot,
	verifyTrainingResult,
} from "../src/training-generation.ts";
import { createWikiSource } from "../src/wiki.ts";
import { finishingPngFixture } from "./comfyui-finishing-fixture.ts";

for (const profileId of [
	"shared-target-drawing-v2",
	"shared-target-drawing-v3",
] as const) {
	test(`${profileId} four training cells enforce fresh admission, replay, collision and retained verification`, async () => {
		const directory = await mkdtemp(
			join(process.env["RUN_TMP"] ?? tmpdir(), "training-portal-"),
		);
		const previousRoot = process.env["PORTAL_TRAINING_ASSET_ROOT"];
		const previousV2Root = process.env["PORTAL_TRAINING_V2_ASSET_ROOT"];
		const assetRoot = join(directory, "immutable-style-fixture");
		await mkdir(assetRoot);
		const sourceRoot = process.env["TRAINING_REFERENCE_ROOT"];
		if (!sourceRoot) throw Error("TRAINING_REFERENCE_ROOT_REQUIRED");
		await mkdir(join(assetRoot, "images"));
		for (const index of [1, 2]) {
			const source = process.env[`TRAINING_STYLE_${index}_PNG`];
			if (!source) throw Error("TRAINING_STYLE_FIXTURE_REQUIRED");
			await copyFile(source, join(assetRoot, `style-${index}.png`));
			const person = index === 1 ? "0998" : "0399";
			await copyFile(
				join(sourceRoot, "images", `person-${person}.png`),
				join(assetRoot, "images", `person-${person}.png`),
			);
		}
		process.env["PORTAL_TRAINING_ASSET_ROOT"] = assetRoot;
		process.env["PORTAL_TRAINING_V2_ASSET_ROOT"] = assetRoot;
		const styles = await loadTrainingStyles(profileId);
		const rows = await Promise.all(
			["0998", "0195", "0001", "0003"].map(async (suffix) => {
				const id = `person-${suffix}`;
				const token = await readFile(
					suffix === "0001" || suffix === "0003"
						? new URL(
								`./fixtures/training-person-${suffix}.json`,
								import.meta.url,
							)
						: join(sourceRoot, "tokens", `${id}.json`),
				);
				const value = JSON.parse(token.toString());
				return {
					id,
					token,
					detail: {
						id,
						characterId: value.characterId,
						name: value.name,
						detailRoute: `/people/${id}`,
						familyTree: { personId: value.characterId },
					},
				};
			}),
		);
		let recipientGets = 0;
		const wiki = Bun.serve({
			port: 0,
			hostname: "127.0.0.1",
			async fetch(request) {
				const path = new URL(request.url).pathname;
				if (path === "/wiki/people")
					return new Response(
						'<script src="/wiki/assets/index-fixture.js"></script>',
					);
				if (path === "/wiki/assets/index-fixture.js")
					return new Response('const p="assets/peopleCatalog-fixture.js";');
				if (path === "/wiki/assets/peopleCatalog-fixture.js")
					return new Response(
						`var p=${JSON.stringify(rows.map((row) => row.detail))};export{p};`,
					);
				const row = rows.find((item) => path.includes(item.id));
				if (!row) return new Response("", { status: 404 });
				if (path.includes("person-details")) return Response.json(row.detail);
				if (path.includes("portrait-tokens")) return new Response(row.token);
				if (path.includes("portraits")) {
					recipientGets++;
					return new Response(
						await readFile(join(sourceRoot, "images", `${row.id}.png`)),
					);
				}
				return new Response("", { status: 404 });
			},
		});
		const padded = transformReferencePng(
			finishingPngFixture(340, 510).finishedBytes,
			"native",
			"cpa340-padded-v1",
		).rgbaBytes;
		const calls: { hashes: string[]; filenames: string[]; size: string }[] = [];
		let model: string | null = "gpt-image-2.5-sunburst";
		const cpa = Bun.serve({
			port: 0,
			hostname: "127.0.0.1",
			async fetch(request) {
				const form = await request.formData();
				const hashes: string[] = [],
					filenames: string[] = [];
				for (const part of form.getAll("image[]")) {
					if (!(part instanceof File)) throw Error("FILE_REQUIRED");
					hashes.push(hash(new Uint8Array(await part.arrayBuffer())));
					filenames.push(part.name);
				}
				calls.push({ hashes, filenames, size: String(form.get("size")) });
				return Response.json({
					model,
					data: [{ b64_json: Buffer.from(padded).toString("base64") }],
				});
			},
		});
		const app = await createPortal(
			loadConfig({
				PORTAL_MODE: "local",
				PORTAL_PORT: "0",
				PORTAL_STORAGE_PATH: join(directory, "storage"),
				WIKI_BASE_URL: `http://127.0.0.1:${wiki.port}/wiki/`,
			}),
		);
		const address = await app.listen();
		const origin = `http://127.0.0.1:${address.port}`;
		const api = `${origin}/tools/api`;
		const session = await fetch(`${api}/auth/session`);
		const auth = z
			.object({ csrfToken: z.string() })
			.parse(await session.json());
		const headers = {
			cookie: (session.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
			origin,
			"x-csrf-token": auth.csrfToken,
			"content-type": "application/json",
		};
		const responseSchema = z.object({
			connection: z.object({ connectionId: z.string() }).optional(),
			job: z
				.object({
					state: z.string(),
					imageUrl: z.string().nullable(),
					errorCode: z.string().nullable(),
				})
				.optional(),
			trainingSelected: z.boolean().optional(),
			error: z.object({ code: z.string() }).optional(),
		});
		const post = async (path: string, input: unknown) => {
			const response = await fetch(api + path, {
				method: "POST",
				headers,
				body: JSON.stringify(input),
			});
			return {
				status: response.status,
				body: responseSchema.parse(await response.json()),
			};
		};
		try {
			const connection = await post("/connections", {
				baseUrl: `http://127.0.0.1:${cpa.port}/v1`,
				apiKey: "offline-training-key",
			});
			expect(connection.status).toBe(201);
			if (!connection.body.connection) throw Error("CONNECTION_REQUIRED");
			for (const slotId of ["MR001", "FR001", "MT001", "FT001"]) {
				const reference = slotId.startsWith("MR") || slotId.startsWith("FR");
				const personId = {
					MR001: "person-0998",
					FR001: "person-0195",
					MT001: "person-0001",
					FT001: "person-0003",
				}[slotId];
				const row = rows.find((item) => item.id === personId);
				if (!row) throw Error("ROW_REQUIRED");
				if (!personId) throw Error("PERSON_REQUIRED");
				const sourceSHA256 = reference
					? hash(await readFile(join(sourceRoot, "images", `${row.id}.png`)))
					: hash(row.token);
				const request = trainingRequestSchema.parse({
					schema: "cpa-training-generation.v1",
					requestId: randomUUID(),
					connectionId: connection.body.connection.connectionId,
					slotId,
					styleProfileId: profileId,
					provider: "openai-compatible",
					providerModel: "gpt-image-2.5-sunburst",
					generationProfile: "cpa340-padded-v1",
					size: "340x510",
					inputMode: reference ? "reference-image" : "tokens-only",
					sourceSelection: reference
						? { kind: "selected", personId, sourceSHA256 }
						: {
								kind: "intentional-absence",
								reason: "design-token-content-only",
							},
					...(reference
						? { variantId: "V01" }
						: { tokenSelection: { personId, tokenSHA256: sourceSHA256 } }),
				});
				expect(trainingSlot(request).personId).toBe(personId);
				const wikiBaseUrl = `http://127.0.0.1:${wiki.port}/wiki/`;
				const prepared = prepareTrainingGeneration(
					request,
					await acquireTrainingSource(request, {
						characters: null,
						wiki: createWikiSource(wikiBaseUrl),
						wikiBaseUrl,
					}),
					styles,
				);
				expect(prepared.conditions.images.map((image) => image.role)).toEqual(
					reference
						? ["recipient-identity-content", "style-only", "style-only"]
						: ["style-only", "style-only"],
				);
				expect(prepared.intent.content === null).toBe(reference);
				expect(prepared.conditions.targetProfileBinding).toEqual(
					profileId === "shared-target-drawing-v3"
						? trainingTargetProfileBinding
						: undefined,
				);
				if (profileId === "shared-target-drawing-v3")
					expect(() =>
						prepareTrainingConditions({
							...prepared.conditions,
							targetProfileBinding: {
								...trainingTargetProfileBinding,
								requestedProfileSHA256: "0".repeat(64),
							},
						}),
					).toThrow();
				for (const changed of [
					{ ...prepared.conditions, styleProfileId: "unknown-profile" },
					{
						...prepared.conditions,
						styleProfileId:
							profileId === "shared-target-drawing-v3"
								? "shared-target-drawing-v2"
								: "shared-target-drawing-v3",
					},
					{
						...prepared.conditions,
						orderedImageBytes: [
							...prepared.conditions.orderedImageBytes,
						].reverse(),
					},
					{
						...prepared.conditions,
						images: prepared.conditions.images.map((image, index) =>
							index === prepared.conditions.images.length - 1
								? { ...image, role: "recipient-identity-content" }
								: image,
						),
					},
				])
					expect(() => prepareTrainingConditions(changed)).toThrow();
				const gets = recipientGets;
				if (profileId === "shared-target-drawing-v2") {
					const before = calls.length;
					const denied = await post("/training-generations", request);
					expect(denied.status).toBe(422);
					expect(denied.body.error?.code).toBe(
						"TRAINING_STYLE_PROFILE_NOT_APPROVED",
					);
					expect(calls.length).toBe(before);
					expect(recipientGets).toBe(gets);
					const dir = join(
						directory,
						"storage",
						"1",
						"jobs",
						request.requestId,
					);
					await expect(readdir(dir)).rejects.toMatchObject({ code: "ENOENT" });
					// Seed a historical failed job without creating or dispatching a new v2 job.
					const retained = {
						"request-payload.json": JSON.stringify(request),
						"job.json": JSON.stringify({
							id: request.requestId,
							state: "FAILED",
							reviewStatus: "HOLD",
							imageUrl: null,
							metrics: null,
							errorCode: "MODEL_NOT_EXPOSED",
							payloadSHA: hash(Buffer.from(JSON.stringify(request))),
						}),
					};
					await mkdir(dir, { recursive: true });
					for (const [name, value] of Object.entries(retained))
						await writeFile(join(dir, name), value);
					const replay = await post("/training-generations", request);
					expect(replay.status).toBe(200);
					expect(replay.body.job).toEqual({
						state: "FAILED",
						imageUrl: null,
						errorCode: "MODEL_NOT_EXPOSED",
					});
					const { connectionId: _connectionId, ...withoutConnection } = request;
					expect(
						(await post("/training-generations", withoutConnection)).body,
					).toEqual(replay.body);
					const readback = await fetch(
						`${api}/training-generations/${request.requestId}`,
						{ headers },
					);
					expect(readback.status).toBe(200);
					expect(responseSchema.parse(await readback.json()).job).toEqual(
						replay.body.job,
					);
					expect(
						(
							await post("/training-generations", {
								...request,
								styleProfileId: "shared-target-drawing-v3",
							})
						).status,
					).toBe(409);
					expect((await readdir(dir)).sort()).toEqual(
						Object.keys(retained).sort(),
					);
					for (const [name, value] of Object.entries(retained))
						expect(await readFile(join(dir, name), "utf8")).toBe(value);
					expect(calls.length).toBe(before);
					expect(recipientGets).toBe(gets);
					continue;
				}
				const result = await post("/training-generations", request);
				expect(result.body).toMatchObject({ job: { state: "HOLD" } });
				expect(recipientGets - gets).toBe(reference ? 1 : 0);
				expect(calls.at(-1)?.filenames).toEqual(
					reference
						? ["recipient-1.png", "style-1.png", "style-2.png"]
						: ["style-1.png", "style-2.png"],
				);
				expect(calls.at(-1)?.size).toBe("640x1024");
				expect(calls.at(-1)?.hashes).toEqual(
					prepared.conditions.images.map((image) => image.wireSHA256),
				);
				expect(calls.at(-1)?.hashes.slice(reference ? 1 : 0)).toEqual(
					styles.map(hash),
				);
				if (profileId === "shared-target-drawing-v3")
					expect(calls.at(-1)?.hashes.slice(reference ? 1 : 0)).toEqual(
						approvedProfile.exemplars.map((image) => image.sha256),
					);
				const before = calls.length;
				expect((await post("/training-generations", request)).status).toBe(200);
				expect(calls.length).toBe(before);
				expect(
					(await post("/training-generations", { ...request, slotId: "MR002" }))
						.status,
				).toBe(409);
				const dir = join(directory, "storage", "1", "jobs", request.requestId);
				const retainedReceipt = JSON.parse(
					await readFile(join(dir, "provider-source.png.receipt.json"), "utf8"),
				);
				expect(retainedReceipt.targetProfileBinding).toEqual(
					profileId === "shared-target-drawing-v3"
						? trainingTargetProfileBinding
						: undefined,
				);
				expect((await verifyTrainingResult(dir)).trainingSelected).toBe(false);
				const response = await fetch(
					`${api}/training-generations/${request.requestId}/image`,
					{ headers },
				);
				expect(response.status).toBe(200);
				const image = decodePng(new Uint8Array(await response.arrayBuffer()));
				expect([image.width, image.height]).toEqual([340, 510]);
				if (slotId === "FT001") {
					await writeFile(
						join(dir, "provider-source.png.response.bin"),
						"tampered",
					);
					await expect(verifyTrainingResult(dir)).rejects.toThrow(
						"RESULT_EVIDENCE_MISMATCH",
					);
				}
				if (slotId === "MR001") {
					model = null;
					const failedId = randomUUID();
					const failed = await post("/training-generations", {
						...request,
						requestId: failedId,
					});
					expect(failed.body.job?.state).toBe("FAILED");
					expect(failed.body.job?.imageUrl).toBeNull();
					expect(failed.body.trainingSelected).toBe(false);
					const diagnostic = JSON.parse(
						await readFile(
							join(
								directory,
								"storage",
								"1",
								"jobs",
								failedId,
								"diagnostic.json",
							),
							"utf8",
						),
					);
					expect(diagnostic.modelAttestation).toBe("UNKNOWN");
					expect(diagnostic.trainingSelected).toBe(false);
					model = "gpt-image-2.5-sunburst";
				}
				console.log(
					"TRAINING_CELL_PROOF",
					JSON.stringify({
						slotId,
						state: result.body.job?.state,
						wire: calls[before - 1],
						replayImagePOSTs: 0,
					}),
				);
			}
		} finally {
			await app.close();
			wiki.stop(true);
			cpa.stop(true);
			if (previousRoot === undefined)
				delete process.env["PORTAL_TRAINING_ASSET_ROOT"];
			else process.env["PORTAL_TRAINING_ASSET_ROOT"] = previousRoot;
			if (previousV2Root === undefined)
				delete process.env["PORTAL_TRAINING_V2_ASSET_ROOT"];
			else process.env["PORTAL_TRAINING_V2_ASSET_ROOT"] = previousV2Root;
			await rm(directory, { recursive: true, force: true });
		}
	}, 30000);
}

test("training CLI registry parses both operations without an image dispatch", async () => {
	const get = remoteInputs["training-generations.get"].parse({
		requestId: "e6e05700-8ae7-4db3-a020-000000000001",
	});
	const directory = await mkdtemp(
		join(process.env["RUN_TMP"] ?? tmpdir(), "training-cli-"),
	);
	const previous = process.env["SSSTOOL_SERVER_URL"];
	delete process.env["SSSTOOL_SERVER_URL"];
	try {
		const path = join(directory, "get.json");
		await writeFile(path, JSON.stringify(get));
		const result = await runCli([
			"training-generations",
			"get",
			get.requestId,
			"--format",
			"json",
		]);
		expect(result.operation).toBe("training-generations.get");
		expect(result.ok).toBe(false);
		if (result.ok) throw Error("EXPECTED_CONFIGURATION_FAILURE");
		expect(result.failures?.[0]?.code).toBe("REMOTE_SERVER_REQUIRED");
		console.log("TRAINING_CLI_REGISTRY_PROOF", JSON.stringify(result));
		const create = remoteInputs["training-generations.create"].parse({
			schema: "cpa-training-generation.v1",
			requestId: get.requestId,
			slotId: "MT001",
			provider: "openai-compatible",
			providerModel: "gpt-image-2.5-sunburst",
			generationProfile: "cpa340-padded-v1",
			size: "340x510",
			inputMode: "tokens-only",
			sourceSelection: {
				kind: "intentional-absence",
				reason: "design-token-content-only",
			},
			tokenSelection: {
				personId: "person-0001",
				tokenSHA256:
					"5061b0418b546e927af3c53cda8d5d71238e7f31efbc49860de6ddbb93da9d4f",
			},
		});
		expect(create.styleProfileId).toBe("shared-target-drawing-v3");
		expect(
			trainingRequestSchema.safeParse({
				...create,
				styleProfileId: "unknown-profile",
			}).success,
		).toBe(false);
		await writeFile(path, JSON.stringify(create));
		const created = await runCli([
			"training-generations",
			"create",
			"--input",
			path,
			"--format",
			"json",
		]);
		expect(created.operation).toBe("training-generations.create");
		if (created.ok) throw Error("EXPECTED_CONFIGURATION_FAILURE");
		expect(created.failures[0]?.code).toBe("REMOTE_SERVER_REQUIRED");
		console.log("TRAINING_CLI_REGISTRY_PROOF", JSON.stringify(created));
	} finally {
		if (previous === undefined) delete process.env["SSSTOOL_SERVER_URL"];
		else process.env["SSSTOOL_SERVER_URL"] = previous;
		await rm(directory, { recursive: true, force: true });
	}
});

test("private style assets survive release packaging without public paths", async () => {
	const entries = await Promise.all(
		[1, 2].map(async (index) => {
			const root = process.env["TRAINING_REFERENCE_ROOT"];
			const exemplar = approvedProfile.exemplars[index - 1];
			if (!root || !exemplar) throw Error("TRAINING_STYLE_FIXTURE_REQUIRED");
			const data = await readFile(join(root, exemplar.path));
			expect(hash(data)).toBe(exemplar.sha256);
			return {
				path: `private/training/${approvedProfile.id}/${exemplar.path}`,
				data,
				bytes: data.length,
				sha256: hash(data),
			};
		}),
	);
	const release = createReleasePackage(entries);
	const manifest = z
		.object({
			artifacts: z.array(z.object({ path: z.string(), sha256: z.string() })),
		})
		.parse(JSON.parse(release.manifest.toString()));
	for (const [index, entry] of entries.entries()) {
		expect(manifest.artifacts[index]).toEqual({
			path: entry.path,
			sha256: entry.sha256,
		});
		expect(entry.path.startsWith("public/")).toBe(false);
		for (const archive of release.archives)
			expect(archive.data.includes(entry.data)).toBe(true);
	}
});

test("training content compiler excludes history authority and delivery rejects geometry corruption", async () => {
	const token = JSON.parse(
		(
			await readFile(
				new URL("./fixtures/training-person-0001.json", import.meta.url),
			)
		).toString(),
	);
	const compiled = compileTrainingContent(token);
	const changed = compileTrainingContent({
		...token,
		generationContract: undefined,
		style: { invalidStyleDirective: true },
	});
	// Assert the machine-consumed projection, not prose spelling.
	expect(changed.fields).toEqual(compiled.fields);
	const raw = transformReferencePng(
		finishingPngFixture(340, 510).finishedBytes,
		"native",
		"cpa340-padded-v1",
	).rgbaBytes;
	const receipt = Buffer.from(
		JSON.stringify({
			schema: "cpa-training-generation-receipt.v1",
			generationProfile: "cpa340-padded-v1",
			generationGeometry: cpaPadding,
			responseSHA: hash(raw),
			modelAttestation: "MATCH",
		}),
	);
	const delivery = trainingPortraitDelivery({
		rawBytes: raw,
		canonicalReceiptBytes: receipt,
	});
	expect(decodePng(delivery.bytes).width).toBe(340);
	expect(() =>
		trainingPortraitDelivery({
			rawBytes: raw,
			canonicalReceiptBytes: Buffer.from(
				receipt.toString().replace(hash(raw), "0".repeat(64)),
			),
		}),
	).toThrow("RESULT_EVIDENCE_MISMATCH");
});
