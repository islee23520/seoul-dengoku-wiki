import { expect, test } from "bun:test";
import { once } from "node:events";
import { readdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { join } from "node:path";
import { z } from "zod";
import { encodePng } from "../../portrait/acceptance/src/png.ts";
import { createAuth } from "../src/auth.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { referencesFixture } from "./references-fixture.ts";

for (const scenario of [
	"valid",
	"size",
	"alpha",
	"uncertain",
	"production",
	"legacy",
	"legacy-production",
	"portrait",
	"fullbody-turntable",
	"torso",
	"detached-head",
	"head-without-hair-eyes-teeth",
	"hair",
	"underwear-only-torso",
])
	test(`v2 owner HTTP journals explicit PNG sends: ${scenario}`, async () => {
		const categoryCase = ![
			"valid",
			"size",
			"alpha",
			"uncertain",
			"production",
			"legacy",
			"legacy-production",
		].includes(scenario);
		const successful =
			scenario === "valid" || scenario === "legacy" || categoryCase;
		const width = 1024,
			height = 1536;
		// Source-authored synthetic designs, not photo edits or a relabeled hair PNG.
		const output = (view = 0) => {
			const pixels = new Uint8Array(width * height * 4);
			const rect = (
				left: number,
				top: number,
				right: number,
				bottom: number,
				color: number[],
			) => {
				for (let y = top; y < bottom; y++)
					for (let x = left; x < right; x++)
						pixels.set(color, (y * width + x) * 4);
			};
			const skin = [210, 160, 120, 255],
				blue = [40, 90, 180, 255],
				dark = [50, 30, 20, 255];
			if (scenario === "hair") {
				rect(300, 160, 724, 320, dark);
				rect(280, 320, 360, 700, dark);
				rect(664, 320, 744, 700, dark);
			} else if (scenario.includes("torso")) {
				rect(440, 300, 584, 440, skin);
				rect(260, 440, 764, 1080, skin);
				if (scenario === "underwear-only-torso") {
					rect(340, 440, 390, 620, blue);
					rect(634, 440, 684, 620, blue);
					rect(340, 600, 684, 1080, blue);
				} else rect(260, 440, 764, 1080, blue);
			} else if (scenario === "fullbody-turntable") {
				const left = [340, 420, 380, 350][view] ?? 340;
				rect(left + 40, 140, left + 220, 380, skin);
				rect(left, 380, left + 260, 940, blue);
				rect(left + 20, 940, left + 100, 1400, dark);
				rect(left + 160, 940, left + 240, 1400, dark);
			} else {
				rect(330, 260, 694, 780, skin);
				rect(440, 780, 584, 900, skin);
				if (scenario !== "head-without-hair-eyes-teeth") {
					rect(310, 180, 714, 320, dark);
					rect(390, 420, 430, 450, dark);
					rect(590, 420, 630, 450, dark);
					rect(450, 640, 574, 660, [255, 255, 255, 255]);
				}
				if (scenario === "portrait") rect(240, 900, 784, 1300, blue);
			}
			return Buffer.from(encodePng({ width, height, pixels }));
		};
		let auth: ReturnType<typeof createAuth> | undefined;
		const f = await referencesFixture({
			legacyToken: scenario.startsWith("legacy"),
			controlled: !scenario.endsWith("production"),
			factory: async (config, options) => {
				auth = createAuth(config);
				return createPortal(config, options);
			},
		});
		const sends: string[] = [];
		const signals = new EventTarget();
		let release: (() => void) | undefined;
		const provider = createServer(async (req, res) => {
			try {
				if (req.method === "GET" && req.url === "/v2/models") {
					res
						.writeHead(200, { "content-type": "application/json" })
						.end(JSON.stringify({ data: [{ id: "gpt-image-2.5-sunburst" }] }));
					return;
				}
				expect(req.method).toBe("POST");
				expect(req.url).toBe("/v2/images/edits");
				expect(req.headers.authorization).toBe("Bearer workstation-key");
				const chunks: Buffer[] = [];
				for await (const chunk of req) chunks.push(Buffer.from(chunk));
				const form = await new Response(Buffer.concat(chunks), {
					headers: { "content-type": req.headers["content-type"] ?? "" },
				}).formData();
				expect([...form.keys()].sort()).toEqual([
					"background",
					"image[]",
					"image[]",
					"model",
					"n",
					"output_format",
					"prompt",
					"size",
				]);
				expect(form.get("size")).toBe(
					scenario === "size" ? "1023x1536" : "1024x1536",
				);
				expect(form.get("output_format")).toBe("png");
				expect(form.get("background")).toBe(
					scenario === "alpha" ? "opaque" : "transparent",
				);
				expect(form.get("n")).toBe("1");
				let child: string | undefined;
				for (const id of await readdir(join(f.storage, "1", "jobs"))) {
					let payload: { personId: string };
					try {
						payload = JSON.parse(
							await readFile(
								join(f.storage, "1", "jobs", id, "workstation-request.json"),
								"utf8",
							),
						);
					} catch {
						continue;
					}
					const dir = join(
						f.storage,
						"1",
						"workstations",
						payload.personId,
						id,
					);
					const plan = JSON.parse(
						await readFile(join(dir, "plan.json"), "utf8"),
					);
					for (const frame of plan.children) {
						if (sends.includes(frame.requestId)) continue;
						let journal: { prompt: string; references: { sha256: string }[] };
						try {
							journal = JSON.parse(
								await readFile(
									join(
										dir,
										`frame-${frame.outputSpec.frameOrder}.request.json`,
									),
									"utf8",
								),
							);
						} catch {
							continue;
						}
						if (form.get("prompt") !== journal.prompt) continue;
						const attempts = JSON.parse(
							await readFile(
								join(f.storage, "1", "workstation-attempts.json"),
								"utf8",
							),
						);
						expect(attempts.requestIds).toContain(frame.requestId);
						for (const [index, image] of (
							form.getAll("image[]") as File[]
						).entries())
							expect(hash(new Uint8Array(await image.arrayBuffer()))).toBe(
								z.string().parse(journal.references[index]?.sha256),
							);
						child = frame.requestId;
					}
				}
				if (!child) throw Error("NO_DURABLE_CHILD");
				sends.push(child);
				if (scenario === "valid" && sends.length === 1) {
					const released = new Promise<void>((resolve) => {
						release = resolve;
					});
					signals.dispatchEvent(new Event("sent"));
					await released;
				}
				res.writeHead(200, { "content-type": "application/json" }).end(
					JSON.stringify({
						data:
							scenario !== "uncertain"
								? [
										{
											b64_json: (categoryCase
												? output(sends.length - 1)
												: f.image
											).toString("base64"),
										},
									]
								: [],
					}),
				);
			} catch (error) {
				res.writeHead(500).end(String(error));
			}
		});
		const listening = once(provider, "listening", {
			signal: AbortSignal.timeout(5000),
		});
		provider.listen(0, "127.0.0.1");
		await listening;
		const address = provider.address();
		if (!address || typeof address === "string") throw Error("address");
		try {
			const priorConnection = z
				.object({ connection: z.object({ connectionId: z.string() }) })
				.parse(await (await f.request("/connections")).json());
			await fetch(
				`${f.origin}/tools/api/connections/${priorConnection.connection.connectionId}`,
				{ method: "DELETE", headers: f.headers },
			);
			const connection = await f.request("/connections", {
				baseUrl: `http://127.0.0.1:${address.port}/v2`,
				apiKey: "workstation-key",
			});
			const connected = z
				.object({ connection: z.object({ connectionId: z.string() }) })
				.parse(await connection.json());
			const connectionId = connected.connection.connectionId;
			const snapshot = JSON.parse(
				await readFile(
					join(f.storage, "1", "jobs", f.identityResultId, "source-bytes.json"),
					"utf8",
				),
			);
			const token = JSON.parse(
				Buffer.from(snapshot.token, "base64").toString(),
			);
			const input = (category = "hair") => {
				const look = {
					schemaVersion: 2,
					sourceId: "owner-http-design",
					lookId: scenario.startsWith("legacy")
						? "explicit-owner-look"
						: token.lookId,
					personId: f.person.id,
					characterId: f.person.characterId,
					category,
					status: "owner-authored",
					description:
						category === "underwear-only-torso"
							? "Owner-authored blue sleeveless undershirt with two straps on a synthetic torso. No photograph clothing removal."
							: `Owner-authored synthetic ${category} reference design.`,
				};
				const authoredLookBase64 = Buffer.from(JSON.stringify(look)).toString(
					"base64",
				);
				return {
					request: {
						...f.payload(),
						schemaVersion: 2,
						connectionId,
						shots: undefined,
						...(scenario.startsWith("legacy")
							? {
									sourceBinding: {
										schemaVersion: 2,
										ownerId: "1",
										characterId: f.person.characterId,
										originalHashes: {
											detail: hash(Buffer.from(snapshot.detail, "base64")),
											token: hash(Buffer.from(snapshot.token, "base64")),
											image: hash(Buffer.from(snapshot.image, "base64")),
										},
										identityPngSHA: hash(f.image),
									},
								}
							: {}),
						authoredLook: {
							sourceId: look.sourceId,
							lookId: look.lookId,
							sha256: hash(Buffer.from(authoredLookBase64, "base64")),
						},
						frames: Array.from(
							{ length: category === "fullbody-turntable" ? 4 : 1 },
							(_, frameOrder) => {
								const outputSpec = {
									schemaVersion: 2,
									category,
									variant:
										category === "head-without-hair-eyes-teeth"
											? "exclude-hair-eyes-teeth"
											: category === "underwear-only-torso"
												? "authored-underwear"
												: "complete",
									view:
										category === "fullbody-turntable"
											? ["front", "profile", "side", "back"][frameOrder]
											: category === "portrait"
												? "viewer-right"
												: "front",
									frameOrder,
									format: "png",
									width: 1024,
									height: 1536,
									background: { kind: "transparent", alpha: "zero-background" },
									alignment: {
										canvasId: "owner-canvas",
										coordinates: "pixels-top-left-x-right-y-down",
										anchor: [512, 768],
										crop: [0, 0, 1024, 1536],
									},
									featureExclusions:
										category === "head-without-hair-eyes-teeth"
											? ["hair", "eyes", "teeth"]
											: [],
								};
								return {
									outputSpec,
									outputSpecSha256: hash(
										Buffer.from(JSON.stringify(outputSpec)),
									),
								};
							},
						),
					},
					authoredLookBase64,
				};
			};
			const catalog = await f.request("/v2/workstations/catalog");
			expect(catalog.status).toBe(200);
			expect(
				z.object({ schema: z.string() }).parse(await catalog.json()).schema,
			).toBe("portal-workstation-catalog.v2");
			const missing = input();
			const absent = await f.request("/v2/workstations", {
				request: missing.request,
			});
			expect(absent.status).toBe(422);
			expect(sends).toHaveLength(0);
			if (scenario.endsWith("production")) {
				const blocked = await f.request("/v2/workstations", input());
				expect(blocked.status).toBe(503);
				expect(await blocked.json()).toEqual({
					error: { code: "REFERENCE_PRODUCTION_BLOCKED" },
				});
				expect(sends).toHaveLength(0);
				return;
			}
			const wrongStyle = input();
			wrongStyle.request.styleReferenceSha256 = "0".repeat(64);
			expect((await f.request("/v2/workstations", wrongStyle)).status).toBe(
				409,
			);
			const wrongPerson = input();
			wrongPerson.request.personId = "person-9999";
			expect((await f.request("/v2/workstations", wrongPerson)).status).toBe(
				404,
			);
			expect(sends).toHaveLength(0);
			const invalidUuid = input();
			expect(
				(
					await f.request("/v2/workstations", {
						...invalidUuid,
						request: { ...invalidUuid.request, requestId: "not-a-uuid" },
					})
				).status,
			).toBe(422);
			expect(sends).toHaveLength(0);
			const hair = input(
				categoryCase ? scenario : scenario === "alpha" ? "torso" : "hair",
			);
			if (scenario === "legacy") {
				expect(Object.hasOwn(token, "lookId")).toBe(false);
				expect(token.schemaVersion).toBe(1);
				expect(token.stateId).toBeNull();
				for (const field of [
					"ownerId",
					"characterId",
					"identityPngSHA",
					"detail",
					"token",
					"image",
				]) {
					const wrong = structuredClone(hair);
					const selected = wrong.request.sourceBinding;
					if (!selected) throw Error("binding");
					if (field === "ownerId") selected.ownerId = "2";
					else if (field === "characterId") selected.characterId = "K9999";
					else if (field === "identityPngSHA")
						selected.identityPngSHA = "0".repeat(64);
					else
						selected.originalHashes[field as "detail" | "token" | "image"] =
							"0".repeat(64);
					expect((await f.request("/v2/workstations", wrong)).status).toBe(409);
				}
				const oldContract = structuredClone(hair);
				delete oldContract.request.sourceBinding;
				expect((await f.request("/v2/workstations", oldContract)).status).toBe(
					422,
				);
				for (const field of [
					"sourceId",
					"lookId",
					"personId",
					"characterId",
					"category",
					"description",
					"hash",
				]) {
					const wrong = structuredClone(hair);
					const look = JSON.parse(
						Buffer.from(wrong.authoredLookBase64, "base64").toString(),
					);
					if (field === "hash")
						wrong.request.authoredLook.sha256 = "0".repeat(64);
					else {
						look[field] =
							field === "personId"
								? "person-9999"
								: field === "category"
									? "torso"
									: field === "description"
										? ""
										: "different";
						const bytes = Buffer.from(JSON.stringify(look));
						wrong.authoredLookBase64 = bytes.toString("base64");
						wrong.request.authoredLook.sha256 = hash(bytes);
					}
					expect((await f.request("/v2/workstations", wrong)).status).toBe(
						field === "description" ? 422 : 409,
					);
				}
				expect(sends).toHaveLength(0);
			}
			if (categoryCase) {
				const invalid = structuredClone(hair);
				const frame = invalid.request.frames[0];
				if (!frame) throw Error("frame");
				frame.outputSpec.featureExclusions =
					scenario === "head-without-hair-eyes-teeth" ? [] : ["hair"];
				frame.outputSpecSha256 = hash(
					Buffer.from(JSON.stringify(frame.outputSpec)),
				);
				expect((await f.request("/v2/workstations", invalid)).status).toBe(422);
				for (const field of ["sourceId", "lookId", "personId", "category"]) {
					const wrong = structuredClone(hair);
					const look = JSON.parse(
						Buffer.from(wrong.authoredLookBase64, "base64").toString(),
					);
					look[field] =
						field === "personId"
							? "person-9999"
							: field === "category"
								? scenario === "hair"
									? "torso"
									: "hair"
								: "wrong-authored-source";
					const bytes = Buffer.from(JSON.stringify(look));
					wrong.authoredLookBase64 = bytes.toString("base64");
					wrong.request.authoredLook.sha256 = hash(bytes);
					expect((await f.request("/v2/workstations", wrong)).status).toBe(409);
				}
				expect(sends).toHaveLength(0);
			}
			if (scenario === "size" || scenario === "alpha") {
				const spec = hair.request.frames[0]?.outputSpec;
				if (!spec || !hair.request.frames[0]) throw Error("spec");
				if (scenario === "size") {
					spec.width = 1023;
					spec.alignment.crop[2] = 1023;
				} else
					Object.assign(spec, {
						background: {
							kind: "solid",
							alpha: "opaque",
							rgb: [255, 255, 255],
						},
					});
				hair.request.frames[0].outputSpecSha256 = hash(
					Buffer.from(JSON.stringify(spec)),
				);
			}
			const sent =
				scenario === "valid"
					? new Promise<void>((resolve, reject) => {
							const signal = AbortSignal.timeout(5000);
							signal.addEventListener("abort", () => reject(signal.reason), {
								once: true,
							});
							signals.addEventListener("sent", () => resolve(), { once: true });
						})
					: null;
			const pending = f.request("/v2/workstations", hair);
			if (sent) {
				await sent;
				expect((await f.request("/v2/workstations", hair)).status).toBe(409);
				expect((await f.request("/v2/workstations", input())).status).toBe(409);
				expect(sends).toHaveLength(1);
				release?.();
			}
			const first = await pending;
			expect(first.status).toBe(200);
			const result = z
				.object({ job: z.object({ state: z.string() }), approval: z.string() })
				.parse(await first.json());
			if (!successful) {
				expect(result.job.state).toBe("UNKNOWN");
				expect(result.approval).toBe("NONE");
				expect(sends).toHaveLength(1);
				expect((await f.request("/v2/workstations", hair)).status).toBe(200);
				const blocked = await f.request("/v2/workstations", input());
				expect(await blocked.json()).toEqual({
					error: { code: "OWNER_DISPATCH_UNCERTAIN" },
				});
				expect(sends).toHaveLength(1);
				return;
			}
			expect(result.job.state).toBe("HOLD");
			expect(result.approval).toBe("NONE");
			expect(sends).toHaveLength(hair.request.frames.length);
			expect((await f.request("/v2/workstations", hair)).status).toBe(200);
			expect(sends).toHaveLength(hair.request.frames.length);
			const changedAuthority = {
				...hair,
				authoredLookBase64: Buffer.from("{}").toString("base64"),
			};
			expect(
				(await f.request("/v2/workstations", changedAuthority)).status,
			).toBe(409);
			const altered = structuredClone(hair);
			altered.request.authoredLook.sourceId = "altered";
			expect((await f.request("/v2/workstations", altered)).status).toBe(409);
			const route = `/v2/workstations/${f.person.id}/${hair.request.requestId}`;
			expect((await f.request(route)).status).toBe(200);
			if (categoryCase) {
				for (const [frameOrder, frame] of hair.request.frames.entries()) {
					const metadata = await f.request(
						`${route}/frames/${frameOrder}/result`,
					);
					expect(metadata.status).toBe(200);
					const body = z
						.object({ request: z.unknown(), index: z.array(z.unknown()) })
						.parse(await metadata.json());
					expect(body.request).toEqual(hair.request);
					expect(body.index[frameOrder]).toMatchObject({
						personId: f.person.id,
						parentRequestId: hair.request.requestId,
						category: scenario,
						view: frame.outputSpec.view,
						frameOrder,
						authoredLookSha256: hair.request.authoredLook.sha256,
						styleReferenceSha256: hair.request.styleReferenceSha256,
						identityReferenceSha256: hash(f.image),
						pngSHA: hash(output(frameOrder)),
						technicalValidation: "PASS",
						semanticReview: "UNVERIFIED",
						approval: "NONE",
					});
					const image = await f.request(`${route}/frames/${frameOrder}/image`);
					expect(image.status).toBe(200);
					expect(image.headers.get("content-type")).toBe("image/png");
					expect(hash(new Uint8Array(await image.arrayBuffer()))).toBe(
						hash(output(frameOrder)),
					);
					const receipt = JSON.parse(
						await readFile(
							join(
								f.storage,
								"1",
								"workstations",
								f.person.id,
								hair.request.requestId,
								`frame-${frameOrder}.receipt.json`,
							),
							"utf8",
						),
					);
					expect(receipt).toMatchObject({
						width,
						height,
						channels: 4,
						technicalValidation: "PASS",
						outputSpec: frame.outputSpec,
					});
					expect(receipt.visiblePixels).toBeGreaterThan(0);
					expect(receipt.transparentPixels).toBeGreaterThan(0);
					expect(receipt.visibleBounds[0]).toBeGreaterThanOrEqual(
						frame.outputSpec.alignment.crop[0] ?? 0,
					);
					expect(receipt.visibleBounds[3]).toBeLessThanOrEqual(
						frame.outputSpec.alignment.crop[3] ?? height,
					);
				}
				for (const path of [
					"/v2/workstations",
					`/v2/workstations/${f.person.id}/history`,
				]) {
					const history = await f.request(path);
					expect(history.status).toBe(200);
					const body = z
						.object({ items: z.array(z.object({ request: z.unknown() })) })
						.parse(await history.json());
					expect(body.items).toHaveLength(1);
					expect(body.items[0]?.request).toEqual(hair.request);
				}
				const ledger = JSON.parse(
					await readFile(
						join(f.storage, "1", "workstation-attempts.json"),
						"utf8",
					),
				);
				expect(ledger.requestIds).toEqual(sends);
				expect(ledger.requestIds.length).toBeLessThanOrEqual(5);
				console.log(
					JSON.stringify({
						proof: "remaining-category-owner-http",
						category: scenario,
						state: result.job.state,
						create: first.status,
						get: 200,
						list: 200,
						result: 200,
						download: 200,
						sends: sends.length,
						pngSHA: hair.request.frames.map((_, i) => hash(output(i))),
						approval: result.approval,
					}),
				);
				return;
			}
			if (!auth) throw Error("auth");
			const foreignToken = auth.issue({ id: "2", login: "foreign" });
			const foreign = await fetch(`${f.origin}/tools/api${route}`, {
				headers: { cookie: `portal_session=${foreignToken}` },
			});
			expect(foreign.status).toBe(404);
			const anonymous = await fetch(
				`${f.origin}/tools/api/v2/workstations/catalog`,
			);
			expect(anonymous.status).toBe(401);
			const image = await f.request(`${route}/frames/0/image`);
			expect(hash(new Uint8Array(await image.arrayBuffer()))).toBe(
				hash(f.image),
			);
			const history = await f.request(
				`/v2/workstations/${f.person.id}/history`,
			);
			expect(
				z.object({ items: z.array(z.unknown()) }).parse(await history.json())
					.items,
			).toHaveLength(1);
			expect(
				(
					await f.request(
						`/v2/workstations/person-9999/${hair.request.requestId}`,
					)
				).status,
			).toBe(404);
			const turns = input("fullbody-turntable");
			const turnResult = await f.request("/v2/workstations", turns);
			expect(turnResult.status).toBe(200);
			expect(
				z
					.object({ job: z.object({ state: z.string() }) })
					.parse(await turnResult.json()).job.state,
			).toBe("HOLD");
			expect(sends).toHaveLength(5);
			const budget = await f.request("/v2/workstations", input());
			expect(await budget.json()).toEqual({
				error: { code: "WORKSTATION_ATTEMPT_LIMIT" },
			});
			expect(sends).toHaveLength(5);
		} finally {
			release?.();
			const closed = once(provider, "close");
			provider.close();
			provider.closeAllConnections();
			await closed;
			await f.close();
		}
	});
