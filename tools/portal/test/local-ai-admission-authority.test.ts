import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { createLocalAiJobs, type LocalAiWorker } from "../src/local-ai-jobs.ts";
import { localAiFixture } from "./local-ai-worker-fixture.ts";

test("owner close/status/open protects new GPU jobs and preserves read-only access", async () => {
	const root = await mkdtemp(join(tmpdir(), "admission-http-"));
	const f = await localAiFixture(root);
	try {
		const address = await f.app.listen();
		const origin = `http://127.0.0.1:${address.port}`;
		const headers: Record<string, string> = { host: "sss.linalab.io", "cf-access-jwt-assertion": f.assertion };
		const session = await fetch(`${origin}/tools/api/auth/session`, { headers });
		headers["cookie"] = z.string().parse(session.headers.get("set-cookie")).split(";")[0] ?? "";
		headers["origin"] = "https://sss.linalab.io";
		headers["x-csrf-token"] = z.object({ csrfToken: z.string() }).parse(await session.json()).csrfToken;
		headers["content-type"] = "application/json";
		const call = (path: string, method = "GET", value?: object, override = headers) => fetch(`${origin}/tools/api/local-ai/${path}`, { method, headers: override, ...(value ? { body: JSON.stringify(value) } : {}) });
		const input = { reason: "approved maintenance", windowId: "fixture-window" };
		expect((await call("admission/close", "POST", input, { ...headers, "cf-access-jwt-assertion": "not-owner" })).status).toBe(401);
		expect((await call("admission/close", "POST", input, { ...headers, "x-csrf-token": "invalid" })).status).toBe(403);
		expect((await call("admission/close", "POST", input, { ...headers, cookie: "" })).status).toBe(401);
		const closed = await call("admission/close", "POST", input);
		expect(closed.status).toBe(200);
		const state = await closed.json();
		expect(state).toMatchObject({ admission: "closed", ...input });
		expect(await (await call("admission/status")).json()).toEqual(state);
		expect(JSON.parse(await readFile(join(root, "storage/local-ai/admission.json"), "utf8"))).toEqual(state);
		const readiness = z.object({ tools: z.array(z.object({ maintenanceReady: z.boolean() })) });
		expect(readiness.parse(await (await call("catalog")).json()).tools[0]?.maintenanceReady).toBe(true);
		const rejected = await call("jobs", "POST", f.input);
		expect(rejected.status).toBe(503);
		expect(await rejected.text()).toContain("GPU_MAINTENANCE_REQUIRED");
		expect(f.runs()).toBe(0);
		expect((await fetch(`${origin}/tools/api/status`, { headers })).status).toBe(200);
		expect((await call("admission/open", "POST", { ...input, windowId: "wrong" })).status).toBe(409);
		expect((await call("admission/open", "POST", input)).status).toBe(200);
		expect(readiness.parse(await (await call("catalog")).json()).tools[0]?.maintenanceReady).toBe(false);
		expect((await call("jobs", "POST", f.input)).status).toBe(202);
		expect((await call("admission/close", "POST", input)).status).toBe(200);
		expect((await call(`jobs/${f.input.requestId}`)).status).toBe(200);
		expect((await call("jobs", "POST", f.input)).status).toBe(202);
	} finally { await f.app.close(); await rm(root, { recursive: true, force: true }); }
});

test("closure survives module reload and does not cancel admitted work", async () => {
	const root = await realpath(await mkdtemp(join(tmpdir(), "admission-durable-")));
	const input = { requestId: randomUUID(), tool: "uniforge3d", assetId: "fixture", seed: 1 };
	let finish!: () => void;
	const running = new Promise<void>((done) => { finish = done; });
	const worker: LocalAiWorker = async (request) => {
		if (request.op === "admission") return { version: 1, op: "admission", configurationEligible: true };
		await running;
		throw new Error("fixture terminal");
	};
	const options = { storagePath: root, catalogPath: null, catalog: [{ tool: "uniforge3d" as const, assets: ["fixture"], missingModels: [], unsupportedRuntime: false, licenseRequired: false, error: null }], worker };
	let jobs = await createLocalAiJobs(options);
	try {
		const terminal = once(jobs.events, "terminal", { signal: AbortSignal.timeout(10000) });
		await jobs.create("1", input);
		const state = await jobs.setAdmission("closed", { reason: "maintenance", windowId: "durable" });
		expect((await jobs.get("1", input.requestId)).state).toBe("running");
		finish();
		await terminal;
		await jobs.close();
		const reloaded = await import(`../src/local-ai-jobs.ts?reload=${randomUUID()}`);
		jobs = await reloaded.createLocalAiJobs(options);
		expect(await jobs.admissionStatus()).toEqual(state);
		expect((await jobs.catalog())[1]?.maintenanceReady).toBe(true);
		await expect(jobs.create("2", { ...input, requestId: randomUUID() })).rejects.toMatchObject({ code: "GPU_MAINTENANCE_REQUIRED", status: 503 });
	} finally { finish(); await jobs.close(); await rm(root, { recursive: true, force: true }); }
});
