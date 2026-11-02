import { expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { terminalRejectionFile } from "../src/terminal-rejections.ts";
import { fileHashes, recoveryFixture } from "./terminal-recovery-fixture.ts";

// Explicit contract inventory, not derived from the implementation list: an
// accidental omission in production must still fail these per-file cases.
const retainedFiles = [
	"connection-binding.json",
	"dispatch.lock",
	"initial-job.json",
	"job-history.json",
	"job.json",
	"provenance.json",
	"provider-source.png.receipt.json",
	"provider-source.png.request.bin",
	"provider-source.png.request.json",
	"provider-source.png.response.bin",
	"reference-analysis.json",
	"reference-normalized.png",
	"request-payload.json",
	"source-bytes.json",
] as const;
const retained = process.env["TERMINAL_RECOVERY_RETAINED_JOB"];
const fixtureOptions = retained ? { retained } : {};

test("terminal event binds the exact closed fourteen-file retained manifest", async () => {
	const f = await recoveryFixture(fixtureOptions);
	try {
		const before = await fileHashes(f.dir);
		expect(Object.keys(before).sort()).toEqual([...retainedFiles].sort());
		expect((await f.post(f.route, await f.operation())).status).toBe(201);
		const event = JSON.parse(
			await readFile(join(f.dir, terminalRejectionFile), "utf8"),
		);
		expect(event.proofSHA256).toEqual(before);
		const after = await fileHashes(f.dir);
		for (const name of retainedFiles) expect(after[name]).toBe(before[name]);
	} finally {
		await f.close();
	}
});

for (const name of retainedFiles) {
	test(`changed ${name} before proof rejects the unchanged owner-pinned manifest`, async () => {
		const f = await recoveryFixture(fixtureOptions);
		try {
			const input = await f.operation();
			const before = await fileHashes(f.dir);
			await writeFile(join(f.dir, name), "independent invalid retained bytes");
			const response = await f.post(f.route, input);
			expect(response.status).toBe(409);
			expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
			const after = await fileHashes(f.dir);
			for (const other of retainedFiles)
				if (other !== name) expect(after[other]).toBe(before[other]);
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
	test(`expected manifest missing ${name} rejects before proof loading`, async () => {
		const f = await recoveryFixture(fixtureOptions);
		try {
			const input = await f.operation();
			const manifest = Object.fromEntries(
				Object.entries(input.expectedRetainedManifest).filter(
					([key]) => key !== name,
				),
			);
			expect(
				(
					await f.post(f.route, {
						...input,
						expectedRetainedManifest: manifest,
					})
				).status,
			).toBe(422);
			expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
		} finally {
			await f.close();
		}
	});
	test(`missing ${name} before validation cannot publish recovery`, async () => {
		const f = await recoveryFixture(fixtureOptions);
		try {
			const input = await f.operation();
			await rm(join(f.dir, name));
			const response = await f.post(f.route, input);
			expect(response.status).toBe(409);
			expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
	for (const mutation of ["replace", "remove"] as const) {
		test(`${mutation} ${name} after proof validation fails the commit CAS`, async () => {
			const entered = Promise.withResolvers<void>();
			const release = Promise.withResolvers<void>();
			const f = await recoveryFixture({
				...fixtureOptions,
				checkpoint: async (point) => {
					if (point === "before-commit") {
						entered.resolve();
						await release.promise;
					}
				},
			});
			try {
				const before = await fileHashes(f.dir);
				const pending = f.post(f.route, await f.operation());
				await entered.promise;
				if (mutation === "replace")
					await writeFile(join(f.dir, name), "tampered after validation");
				else await rm(join(f.dir, name));
				release.resolve();
				expect((await pending).status).toBe(409);
				const after = await fileHashes(f.dir);
				expect(after[terminalRejectionFile]).toBeUndefined();
				for (const other of retainedFiles)
					if (other !== name) expect(after[other]).toBe(before[other]);
				expect(f.outbound).toBe(0);
			} finally {
				release.resolve();
				await f.close();
			}
		});

		test(`${mutation} ${name} after commit fails every execution fold and admission closed`, async () => {
			const f = await recoveryFixture(fixtureOptions);
			try {
				const payload = JSON.parse(
					await readFile(join(f.dir, "request-payload.json"), "utf8"),
				);
				const input = await f.operation();
				expect((await f.post(f.route, input)).status).toBe(201);
				const event = await readFile(join(f.dir, terminalRejectionFile));
				if (mutation === "replace")
					await writeFile(join(f.dir, name), "tampered after commit");
				else await rm(join(f.dir, name));
				for (const path of [
					`/jobs/${f.id}`,
					"/jobs",
					`/jobs/${f.id}/inspection`,
					`/jobs/${f.id}/image`,
					`/jobs/${f.id}/result`,
				]) {
					const response = await f.get(path);
					expect(response.status).toBe(409);
					expect(await response.json()).toEqual({
						error: { code: "TERMINAL_REJECTION_PROOF_MISMATCH" },
					});
				}
				expect((await f.post(f.route, input)).status).toBe(409);
				expect((await f.post("/generations", payload)).status).toBe(409);
				expect(
					(
						await f.post("/generations", {
							...payload,
							requestId: randomUUID(),
						})
					).status,
				).toBe(409);
				expect(await readFile(join(f.dir, terminalRejectionFile))).toEqual(
					event,
				);
				expect(f.outbound).toBe(0);
			} finally {
				await f.close();
			}
		});
	}
}

for (const kind of [
	"absent",
	"extra-key",
	"path-key",
	"bad-hash",
	"null",
] as const) {
	test(`owner expected manifest rejects ${kind}`, async () => {
		const f = await recoveryFixture(fixtureOptions);
		try {
			const input = await f.operation();
			const { expectedRetainedManifest: manifest, ...oldBody } = input;
			const value =
				kind === "absent"
					? oldBody
					: {
							...input,
							expectedRetainedManifest:
								kind === "extra-key"
									? { ...manifest, "candidate.png": "a".repeat(64) }
									: kind === "path-key"
										? { ...manifest, "../job.json": "a".repeat(64) }
										: kind === "bad-hash"
											? { ...manifest, "dispatch.lock": "NOT_SHA256" }
											: null,
						};
			expect((await f.post(f.route, value)).status).toBe(422);
			expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
		} finally {
			await f.close();
		}
	});
}

test("changing expected retained pins conflicts with the same committed operation", async () => {
	const f = await recoveryFixture(fixtureOptions);
	try {
		const input = await f.operation();
		expect((await f.post(f.route, input)).status).toBe(201);
		const response = await f.post(f.route, {
			...input,
			expectedRetainedManifest: {
				...input.expectedRetainedManifest,
				"dispatch.lock": "a".repeat(64),
			},
		});
		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({
			error: { code: "TERMINAL_REJECTION_CONFLICT" },
		});
	} finally {
		await f.close();
	}
});

for (const name of [
	"dispatch.lock",
	"job-history.json",
	"provenance.json",
	"reference-analysis.json",
	"reference-normalized.png",
	"source-bytes.json",
] as const) {
	test(`re-pinning invalid ${name} does not bypass retained relationship validation`, async () => {
		const f = await recoveryFixture(fixtureOptions);
		try {
			await writeFile(join(f.dir, name), "invalid despite newly supplied hash");
			const response = await f.post(f.route, await f.operation());
			expect(response.status).toBe(409);
			expect(await readdir(f.dir)).not.toContain(terminalRejectionFile);
		} finally {
			await f.close();
		}
	});
}

for (const name of retainedFiles) {
	test(`event missing the ${name} hash cannot release admission`, async () => {
		const f = await recoveryFixture(fixtureOptions);
		try {
			expect((await f.post(f.route, await f.operation())).status).toBe(201);
			const path = join(f.dir, terminalRejectionFile);
			const event = JSON.parse(await readFile(path, "utf8"));
			delete event.proofSHA256[name];
			await writeFile(path, JSON.stringify(event));
			expect((await f.get(`/jobs/${f.id}`)).status).toBe(409);
			expect((await f.get("/jobs")).status).toBe(409);
			expect(f.outbound).toBe(0);
		} finally {
			await f.close();
		}
	});
}
