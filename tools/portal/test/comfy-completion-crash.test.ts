import { expect, test } from "bun:test";
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { completionFixture } from "./comfy-completion-fixture.ts";

if (
	process.env["COMFY_COMPLETION_EVIDENCE"] &&
	process.env["COMFY_COMPLETION_RETAINED"]
)
	for (const point of ["before-commit", "after-commit"] as const)
		test(`process exit at ${point} cannot expose partial completion`, async () => {
			const worker = Bun.spawn(
				[
					process.execPath,
					"--no-install",
					new URL("./comfy-completion-crash-worker.ts", import.meta.url)
						.pathname,
				],
				{
					env: {
						...process.env,
						NODE_ENV: "test",
						COMFY_COMPLETION_CRASH_POINT: point,
					},
					stdout: "pipe",
					stderr: "pipe",
				},
			);
			const exited = worker.exited,
				reader = worker.stdout.getReader();
			let directory: string | undefined;
			let recovered: Awaited<ReturnType<typeof completionFixture>> | undefined;
			try {
				let text = "";
				while (!text.includes("\n")) {
					const chunk = await reader.read();
					if (chunk.done)
						throw Error(
							`WORKER_EXIT:${await new Response(worker.stderr).text()}`,
						);
					text += new TextDecoder().decode(chunk.value);
				}
				const ready = JSON.parse(text.trim());
				directory = ready.directory;
				const original = await readFile(
					join(ready.directory, "storage", "1", "jobs", ready.id, "job.json"),
				);
				await expect(
					fetch(
						`${ready.origin}/tools/api/v1/jobs/${ready.id}/comfy-completions`,
						{
							method: "POST",
							headers: ready.headers,
							body: JSON.stringify(ready.request),
							signal: AbortSignal.timeout(30000),
						},
					),
				).rejects.toBeDefined();
				expect(await exited).toBe(86);
				recovered = await completionFixture({ directory: ready.directory });
				expect(
					z
						.object({ job: z.object({ state: z.string() }) })
						.parse(await (await recovered.get(`/jobs/${ready.id}`)).json()).job
						.state,
				).toBe(point === "before-commit" ? "UNKNOWN" : "HOLD");
				expect((await recovered.post(ready.request)).status).toBe(
					point === "before-commit" ? 201 : 200,
				);
				expect(await readFile(join(recovered.dir, "job.json"))).toEqual(
					original,
				);
				expect(recovered.state.externalGeneration).toBe(0);
				if (point === "after-commit")
					expect(recovered.state.calls).toHaveLength(0);
			} finally {
				worker.kill();
				await exited;
				reader.releaseLock();
				await recovered?.close();
				if (directory) await rm(directory, { recursive: true, force: true });
			}
		}, 120000);
