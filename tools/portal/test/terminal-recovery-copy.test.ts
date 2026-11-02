import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { fileHashes, recoveryFixture } from "./terminal-recovery-fixture.ts";

// Explicit opt-in local evidence test. The retained directory is read/copied
// only; every HTTP write targets the fixture's independent storage root.
const retained = process.env["TERMINAL_RECOVERY_RETAINED_JOB"];
if (retained) {
	test("the exact retained fourteen-file job recovers only in separate copied storage", async () => {
		const before = await fileHashes(retained);
		expect(Object.keys(before)).toHaveLength(14);
		const f = await recoveryFixture({ retained });
		try {
			expect(await fileHashes(f.dir)).toEqual(before);
			const operation = await f.operation();
			const response = await f.post(f.route, operation);
			const result = z
				.object({
					job: z.object({
						state: z.literal("FAILED"),
						imageUrl: z.null(),
						errorCode: z.literal("LOCAL_MODEL_NOT_EXPOSED"),
					}),
					event: z.object({
						modelAttestation: z.literal("UNKNOWN"),
						imageAdoption: z.literal("NONE"),
					}),
				})
				.parse(await response.json());
			expect(response.status).toBe(201);
			await f.restart();
			const replay = await f.post(f.route, operation);
			expect(replay.status).toBe(200);
			expect(await replay.json()).toMatchObject(result);
			const payload = JSON.parse(
				await readFile(join(f.dir, "request-payload.json"), "utf8"),
			);
			expect(
				await (await f.post("/generations", payload)).json(),
			).toMatchObject({ job: { state: "FAILED" } });
			expect(await (await f.get("/jobs")).json()).toMatchObject({
				lease: { admissionBlocked: false },
			});
			expect((await f.get(`/jobs/${f.id}/result`)).status).toBe(409);
			expect((await f.get(`/jobs/${f.id}/image`)).status).toBe(404);
			const after = await fileHashes(f.dir);
			for (const [name, digest] of Object.entries(before))
				expect(after[name]).toBe(digest);
			expect(Object.keys(after)).toHaveLength(15);
			expect(await fileHashes(retained)).toEqual(before);
			expect(f.outbound).toBe(0);
			console.log(
				JSON.stringify({
					schema: "terminal-recovery-copy-proof.v1",
					original: retained,
					originalHashes: before,
					operation,
					originalStorageWrites: 0,
					copiedStorageRecovered: true,
					providerCalls: f.outbound,
				}),
			);
		} finally {
			await f.close();
		}
	}, 15000);
}
