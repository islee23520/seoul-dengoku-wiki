import { expect, test } from "bun:test";
import { readdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { loadConfig } from "../src/config.ts";
import { createPortal } from "../src/server.ts";
import { terminalRejectionRequestSchema } from "../src/terminal-rejection-proof.ts";
import { terminalRejectionFile } from "../src/terminal-rejections.ts";

for (const point of ["before-commit", "after-commit"] as const) {
	test(`actual process exit at ${point} preserves atomic recovery and replay`, async () => {
		// Given an independent server over its own fixture storage, subscribe to
		// stdout readiness and process exit before triggering the HTTP operation.
		const worker = Bun.spawn(
			[
				process.execPath,
				"--no-install",
				new URL("./terminal-recovery-crash-worker.ts", import.meta.url)
					.pathname,
			],
			{
				env: {
					...process.env,
					NODE_ENV: "test",
					TERMINAL_RECOVERY_CRASH_POINT: point,
				},
				stdout: "pipe",
				stderr: "pipe",
			},
		);
		const exited = worker.exited;
		const reader = worker.stdout.getReader();
		let directory: string | undefined;
		let app: Awaited<ReturnType<typeof createPortal>> | undefined;
		try {
			let text = "";
			while (!text.includes("\n")) {
				const chunk = await reader.read();
				if (chunk.done)
					throw Error(
						`WORKER_EXIT_BEFORE_READY:${await new Response(worker.stderr).text()}`,
					);
				text += new TextDecoder().decode(chunk.value);
			}
			const ready = z
				.object({
					directory: z.string(),
					id: z.uuid(),
					origin: z.string(),
					headers: z.record(z.string(), z.string()),
					operation: terminalRejectionRequestSchema,
				})
				.parse(JSON.parse(text.trim()));
			directory = ready.directory;
			const dir = join(directory, "storage", "1", "jobs", ready.id);
			const before = await readFile(join(dir, "job.json"));
			// When the real process exits inside the durable commit boundary, the
			// client loses its response; no cleanup/finally can fabricate recovery.
			await expect(
				fetch(
					`${ready.origin}/tools/api/v1/jobs/${ready.id}/terminal-rejections`,
					{
						method: "POST",
						headers: ready.headers,
						body: JSON.stringify(ready.operation),
						signal: AbortSignal.timeout(5000),
					},
				),
			).rejects.toBeDefined();
			expect(await exited).toBe(86);
			app = await createPortal(
				loadConfig({
					PORTAL_MODE: "local",
					PORTAL_PORT: "0",
					PORTAL_STORAGE_PATH: join(directory, "storage"),
				}),
			);
			const origin = `http://127.0.0.1:${(await app.listen()).port}`;
			const session = await fetch(`${origin}/tools/api/auth/session`);
			const auth = z
				.object({ csrfToken: z.string() })
				.parse(await session.json());
			const headers = {
				origin,
				cookie: (session.headers.get("set-cookie") ?? "").split(";")[0] ?? "",
				"x-csrf-token": auth.csrfToken,
				"content-type": "application/json",
			};
			const listing = await fetch(`${origin}/tools/api/jobs`, { headers });
			expect(await listing.json()).toMatchObject({
				jobs: [{ state: point === "before-commit" ? "UNKNOWN" : "FAILED" }],
				lease: { admissionBlocked: point === "before-commit" },
			});
			const replay = await fetch(
				`${origin}/tools/api/v1/jobs/${ready.id}/terminal-rejections`,
				{ method: "POST", headers, body: JSON.stringify(ready.operation) },
			);
			expect(replay.status).toBe(point === "before-commit" ? 201 : 200);
			expect(await readFile(join(dir, "job.json"))).toEqual(before);
			expect(
				(await readdir(dir)).filter((name) => name === terminalRejectionFile),
			).toHaveLength(1);
		} finally {
			worker.kill();
			await exited;
			reader.releaseLock();
			await app?.close();
			if (directory) await rm(directory, { recursive: true, force: true });
		}
	}, 15000);
}
