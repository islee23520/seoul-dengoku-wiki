import { expect, test } from "bun:test";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTransportFixture } from "../../portrait/generator/test/transport-fixture.ts";
import { createAuth } from "../src/auth.ts";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { hash } from "../src/sources.ts";
import { png } from "./backend.test.ts";
import { observedTokenFixture } from "./native-moss-provider-result-fixture.ts";

test("native image intent cannot downgrade to legacy request and only verified artifacts serve PNG", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-native-image-integrity-"));
	const config = loadConfig({
		PORTAL_MODE: "hosted",
		PORTAL_STORAGE_PATH: root,
		PORTAL_SESSION_SECRET: "s".repeat(48),
	});
	const auth = createAuth(config);
	const cookie = `portal_session=${auth.issue({ id: "42", login: "fixture" })}`;
	const app = await createPortal(config);
	try {
		const address = await app.listen();
		const f = observedTokenFixture();
		const id = f.expected.requestId;
		const dir = join(root, "42", "jobs", id);
		await mkdir(dir, { recursive: true });
		await writeFile(
			join(dir, "job.json"),
			JSON.stringify({
				id,
				state: "HOLD",
				reviewStatus: "HOLD",
				imageUrl: `/tools/api/jobs/${id}/image`,
				metrics: null,
				errorCode: null,
				payloadSHA: "a".repeat(64),
			}),
		);
		const image = f.files.find(
			(file) => file.name === "output/final-RGBA.png",
		)?.bytes;
		if (!image) throw Error("FIXTURE_FINAL_MISSING");
		await writeFile(join(dir, "candidate.png"), image);
		await writeFile(
			join(dir, "native-dispatch.json"),
			JSON.stringify({
				schema: "native-moss-dispatch-intent.v1",
				requestId: id,
			}),
		);
		const endpoint = `http://127.0.0.1:${address.port}/tools/api/jobs/${id}/image`;
		for (const request of [
			JSON.stringify({ provider: "openai-compatible" }),
			"{}",
			"{",
			null,
		]) {
			if (request === null) await rm(join(dir, "request-payload.json"));
			else await writeFile(join(dir, "request-payload.json"), request);
			const response = await fetch(endpoint, { headers: { cookie } });
			expect(response.status).not.toBe(200);
			expect(response.headers.get("content-type")).not.toContain("image/png");
			expect(hash(new Uint8Array(await response.arrayBuffer()))).not.toBe(
				hash(image),
			);
		}
		const request = {
			schemaVersion: 2,
			requestId: id,
			personId: f.expected.personId,
			provider: "native-moss",
			providerModel: "native-moss:recovery16-provisional-v1",
			generationProfile: "native340-v1",
			nativeRecipe: f.expected.recipe,
			inputMode: f.expected.mode,
			sourceSelection: {
				kind: "intentional-absence",
				reason: "no-reference-available",
			},
			explicitEdits: [],
			size: "340x510",
			faceMode: { kind: "unique", variantId: null },
		};
		await writeFile(join(dir, "request-payload.json"), JSON.stringify(request));
		expect((await fetch(endpoint, { headers: { cookie } })).status).toBe(409);
		await writeFile(
			join(dir, "native-expected.json"),
			JSON.stringify({ expected: f.expected }),
		);
		await writeFile(
			join(dir, "native-artifacts.json"),
			JSON.stringify(
				f.files.map((file) => ({
					name: file.name,
					byteBase64: Buffer.from(file.bytes).toString("base64"),
				})),
			),
		);
		const verified = await fetch(endpoint, { headers: { cookie } });
		expect(verified.status).toBe(200);
		expect(hash(new Uint8Array(await verified.arrayBuffer()))).toBe(
			hash(image),
		);
		await writeFile(join(dir, "native-artifacts.json"), "[]");
		const missing = await fetch(endpoint, { headers: { cookie } });
		expect(missing.status).not.toBe(200);
		expect(missing.headers.get("content-type")).not.toContain("image/png");
	} finally {
		await app.close();
		await rm(root, { recursive: true, force: true });
	}
});

test("real logout immediately closes every revoked-session stream and leaves other sessions live", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-logout-stream-"));
	const config = loadConfig({
		PORTAL_MODE: "hosted",
		PORTAL_STORAGE_PATH: root,
		PORTAL_SESSION_SECRET: "s".repeat(48),
		PORTAL_PUBLIC_URL: "https://portal.example/tools",
	});
	const auth = createAuth(config);
	const token = auth.issue({ id: "42", login: "fixture" });
	const session = auth.verify(token);
	if (!session) throw Error("SESSION");
	const app = await createPortal(config);
	const ready = once(app.server, "listening", {
		signal: AbortSignal.timeout(5000),
	});
	app.server.listen(0, "127.0.0.1");
	await ready;
	const address = app.server.address();
	if (!address || typeof address === "string") throw Error("ADDRESS");
	const base = `http://127.0.0.1:${address.port}/tools/api`;
	const abort = new AbortController();
	try {
		const readers = [];
		for (const cookie of [
			token,
			token,
			auth.issue({ id: "43", login: "other" }),
		]) {
			const response = await fetch(`${base}/jobs/events`, {
				headers: { cookie: `portal_session=${cookie}` },
				signal: abort.signal,
			});
			const reader = response.body?.getReader();
			if (!reader) throw Error("STREAM");
			await reader.read();
			readers.push(reader);
		}
		const done = Promise.all(
			readers
				.slice(0, 2)
				.map((reader) =>
					reader.read().catch((error) => ({ done: false, error })),
				),
		);
		const response = await fetch(`${base}/auth/logout`, {
			method: "POST",
			headers: {
				cookie: `portal_session=${token}`,
				origin: "https://portal.example",
				"x-csrf-token": session.csrfToken,
			},
		});
		expect(response.status).toBe(200);
		expect(app.server.listenerCount("jobs:42")).toBe(0);
		expect(app.server.listenerCount("jobs-close")).toBe(1);
		expect(app.server.listenerCount("jobs:43")).toBe(1);
		expect(
			(
				await Promise.race([
					done,
					new Promise<never>((_, reject) => {
						const timer = setTimeout(
							() => reject(Error("STREAM_NOT_CLOSED")),
							1000,
						);
						timer.unref();
					}),
				])
			).every((value) => value.done),
		).toBe(true);
	} finally {
		abort.abort();
		await app.close();
		await rm(root, { recursive: true, force: true });
	}
});

test("old persisted jobs retain captured person identity and authoritative image across reboot with owner isolation", async () => {
	const root = await mkdtemp(join(tmpdir(), "portal-person-history-"));
	const id = "11111111-1111-4111-8111-111111111111";
	const dir = join(root, "42", "jobs", id);
	const image = png();
	const fixture = createTransportFixture();
	const detail = {
		id: "person-1009",
		name: "Historical person",
		familyTree: { personId: "K1009" },
		detailRoute: "/people/person-1009",
	};
	const token = {
		...JSON.parse(Buffer.from(fixture.candidate.lookBytes).toString()),
		personId: detail.id,
		characterId: "K1009",
		name: detail.name,
		identity: { characterId: "K1009", name: detail.name },
		image: { sha256: hash(image) },
		generationContract: { model: "gpt-image-2.5" },
	};
	await mkdir(dir, { recursive: true });
	const job = {
		id,
		state: "HOLD",
		reviewStatus: "HOLD",
		imageUrl: `/tools/api/jobs/${id}/image`,
		metrics: null,
		errorCode: null,
		payloadSHA: "a".repeat(64),
	};
	await writeFile(join(dir, "job.json"), JSON.stringify(job));
	await writeFile(join(dir, "candidate.png"), image);
	await writeFile(
		join(dir, "provenance.json"),
		JSON.stringify({
			original: {
				detail: hash(Buffer.from(JSON.stringify(detail))),
				token: hash(Buffer.from(JSON.stringify(token))),
				image: hash(image),
			},
		}),
	);
	await writeFile(
		join(dir, "source-bytes.json"),
		JSON.stringify({
			detail: Buffer.from(JSON.stringify(detail)).toString("base64"),
			token: Buffer.from(JSON.stringify(token)).toString("base64"),
			image: Buffer.from(image).toString("base64"),
		}),
	);
	const before = hash(await readFile(join(dir, "job.json")));
	const config = loadConfig({
		PORTAL_MODE: "hosted",
		PORTAL_STORAGE_PATH: root,
		PORTAL_SESSION_SECRET: "s".repeat(48),
	});
	try {
		for (let boot = 0; boot < 2; boot++) {
			const app = await createPortal(config);
			const ready = once(app.server, "listening", {
				signal: AbortSignal.timeout(5000),
			});
			app.server.listen(0, "127.0.0.1");
			await ready;
			const address = app.server.address();
			if (!address || typeof address === "string") throw Error("ADDRESS");
			const base = `http://127.0.0.1:${address.port}/tools/api`;
			const auth = createAuth(config);
			const cookie = (owner: string) => ({
				cookie: `portal_session=${auth.issue({ id: owner, login: "fixture" })}`,
			});
			try {
				const owner = cookie("42");
				const streamAbort = new AbortController();
				const stream = await fetch(`${base}/jobs/events`, {
					headers: owner,
					signal: streamAbort.signal,
				});
				expect(stream.headers.get("content-type")).toBe("text/event-stream");
				const reader = stream.body?.getReader();
				if (!reader) throw Error("EVENT_STREAM");
				expect(new TextDecoder().decode((await reader.read()).value)).toBe(
					"data: changed\n\n",
				);
				const changed = reader.read();
				app.server.emit("jobs:43");
				app.server.emit("jobs:42");
				expect(new TextDecoder().decode((await changed).value)).toBe(
					"data: changed\n\n",
				);
				streamAbort.abort();
				const listed = await fetch(`${base}/jobs`, { headers: owner });
				expect(listed.status).toBe(200);
				const body = (await listed.json()) as {
					history: {
						source: unknown;
						job: unknown;
						classification: unknown;
					}[];
				};
				expect(body.history[0]?.classification).toEqual({
					kind: "portrait",
					reviewAuthority: "owner",
				});
				expect(body.history[0]?.source).toEqual({
					personId: detail.id,
					characterId: "K1009",
					name: detail.name,
				});
				expect(body.history[0]?.job).toEqual(job);
				expect(
					hash(
						new Uint8Array(
							await (
								await fetch(`${base}/jobs/${id}/image`, { headers: owner })
							).arrayBuffer(),
						),
					),
				).toBe(hash(image));
				const other = (await (
					await fetch(`${base}/jobs`, { headers: cookie("43") })
				).json()) as { history: unknown[] };
				expect(other.history).toEqual([]);
				expect(
					(await fetch(`${base}/jobs/${id}/image`, { headers: cookie("43") }))
						.status,
				).toBe(404);
				expect((await fetch(`${base}/jobs`)).status).toBe(401);
			} finally {
				await app.close();
			}
		}
		expect(hash(await readFile(join(dir, "job.json")))).toBe(before);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
