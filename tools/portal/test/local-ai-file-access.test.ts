import { expect, test } from "bun:test";
import {
	mkdtemp,
	open,
	readFile,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalAiFileAccess } from "../src/local-ai-file-access.ts";

test("atomic replacement starts only after an overlapping real reader closes", async () => {
	// Given a real open job file, held at an explicit read-open event barrier.
	const root = await mkdtemp(join(tmpdir(), "local-ai-file-access-"));
	const access = createLocalAiFileAccess();
	const opened = Promise.withResolvers<void>();
	const release = Promise.withResolvers<void>();
	const file = join(root, "job.json");
	const replacement = join(root, "job.tmp");
	let closed = false;
	try {
		await writeFile(file, '{"state":"queued"}');
		await writeFile(replacement, '{"state":"running"}');
		const reading = access(async () => {
			const handle = await open(file, "r");
			try {
				opened.resolve();
				await release.promise;
				return await handle.readFile("utf8");
			} finally {
				await handle.close();
				closed = true;
			}
		});
		await opened.promise;
		// When an atomic replace is requested while that handle is still open.
		const replacing = access(async () => {
			// This assertion fails deterministically if access stops serializing.
			expect(closed).toBe(true);
			await rename(replacement, file);
		});
		release.resolve();
		// Then the old read completes before replace; new reads see the new bytes.
		expect(await reading).toBe('{"state":"queued"}');
		await replacing;
		expect(await access(() => readFile(file, "utf8"))).toBe(
			'{"state":"running"}',
		);
	} finally {
		release.resolve();
		await rm(root, { recursive: true, force: true });
	}
});
