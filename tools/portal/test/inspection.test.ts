import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { hash } from "../src/sources.ts";
import { inspectionFixture } from "./inspection-fixture.ts";

test.each([undefined, "340x510"] as const)(
	"owner inspection preserves size %s and blocks redispatch after exact process restart",
	async (size) => {
		const f = await inspectionFixture();
		try {
			const payload = await f.interrupt(size);
			const before = await f.state();
			const directory = join(f.root, "storage", "1", "jobs", payload.requestId);
			const filesBefore = await readdir(directory);
			const inspectionResponse = await f.request(
				`/jobs/${payload.requestId}/inspection`,
			);
			expect(inspectionResponse.status).toBe(200);
			const { inspection } = z
				.object({
					inspection: z.looseObject({
						job: z.unknown(),
						originalRequest: z.unknown(),
						history: z.array(
							z.looseObject({ job: z.looseObject({ state: z.string() }) }),
						),
						artifacts: z.record(
							z.string(),
							z.looseObject({ available: z.boolean() }),
						),
					}),
				})
				.parse(await inspectionResponse.json());
			expect(inspection).toMatchObject({
				requestId: payload.requestId,
				originalRequest: payload,
				inputHashes: f.inputHashes,
				upstreamOutcome: "UNRESOLVED",
				reviewStatus: "HOLD",
				job: { state: "UNKNOWN" },
				lease: { active: false, admissionBlocked: true },
				readOnly: true,
				resolutionAvailable: false,
			});
			expect(inspection.originalRequest).toEqual(payload);
			expect(
				JSON.parse(
					await readFile(join(directory, "candidate.png.request.json"), "utf8"),
				),
			).toMatchObject({ size: "1024x1536" });
			expect(
				inspection.history.map(
					(entry: { job: { state: string } }) => entry.job.state,
				),
			).toEqual(["RUNNING", "RUNNING", "UNKNOWN"]);
			expect(inspection.artifacts["provider-request.bin"]).toMatchObject({
				available: true,
				sha256: f.outbound[0]?.sha256,
			});
			expect(inspection.artifacts["candidate.png"]?.available).toBe(false);
			// Text-only production jobs retain an explicit null image, not an
			// empty image or the hash of empty bytes.
			const sourcePath = join(directory, "source-bytes.json");
			const sourceBytes = await readFile(sourcePath);
			await writeFile(
				sourcePath,
				JSON.stringify({ ...JSON.parse(sourceBytes.toString()), image: null }),
			);
			const textOnly = await f.request(`/jobs/${payload.requestId}/inspection`);
			expect(textOnly.status).toBe(200);
			expect(await textOnly.json()).toMatchObject({
				inspection: {
					inputHashes: { ...f.inputHashes, image: null },
					readOnly: true,
				},
			});
			await writeFile(sourcePath, sourceBytes);
			expect(
				await (await f.request(`/jobs/${payload.requestId}`)).json(),
			).toEqual({ job: inspection.job });
			expect(await (await f.request("/jobs")).json()).toMatchObject({
				jobs: [{ state: "UNKNOWN" }],
				lease: { admissionBlocked: true },
			});
			const replay = await f.request(
				"/generations",
				inspection.originalRequest,
			);
			expect(replay.status).toBe(200);
			expect(await replay.json()).toMatchObject({
				job: { id: payload.requestId, state: "UNKNOWN", reviewStatus: "HOLD" },
			});
			const conflict = await f.request("/generations", {
				...payload,
				sheetId: randomUUID(),
			});
			expect(conflict.status).toBe(409);
			expect(await conflict.json()).toEqual({
				error: { code: "REQUEST_CONFLICT" },
			});
			const sizeConflict = await f.request("/generations", {
				...payload,
				size: size === undefined ? "340x510" : undefined,
			});
			expect(sizeConflict.status).toBe(409);
			expect(await sizeConflict.json()).toEqual({
				error: { code: "REQUEST_CONFLICT" },
			});
			expect(
				(await f.request("/generations", { ...payload, size: "1536x1024" }))
					.status,
			).toBe(422);
			const { connectionId: _connectionId, ...withoutAuthority } = payload;
			expect((await f.request("/generations", withoutAuthority)).status).toBe(
				200,
			);
			const blocked = await f.request("/generations", {
				...payload,
				requestId: randomUUID(),
			});
			expect(blocked.status).toBe(409);
			expect(await blocked.json()).toEqual({
				error: { code: "OWNER_DISPATCH_UNCERTAIN" },
			});
			const mutation = await f.request(
				`/jobs/${payload.requestId}/inspection`,
				{},
			);
			expect(mutation.status).toBe(404);
			const anonymous = await fetch(
				`${f.origin}/tools/api/jobs/${payload.requestId}/inspection`,
			);
			expect(anonymous.status).toBe(401);
			const outsider = await f.request(`/jobs/${randomUUID()}/inspection`);
			expect(outsider.status).toBe(404);
			expect(f.outbound).toHaveLength(1);
			expect(hash((await f.state()).bytes)).toBe(hash(before.bytes));
			expect(await readdir(directory)).toEqual(filesBefore);
			expect(
				await readFile(join(directory, "interrupted-job.json"), "utf8"),
			).toContain('"RUNNING"');
		} finally {
			await f.close();
		}
	},
	30000,
);
