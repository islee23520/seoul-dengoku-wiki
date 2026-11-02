import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRemoteClient } from "../src/remote-client.ts";

for (const scenario of ["mime", "header-size", "body-size", "hash"] as const)
	test(`local AI attachment rejects ${scenario} before publication`, async () => {
		// Given authenticated transport with one incorrectly bound attachment.
		const directory = await mkdtemp(join(tmpdir(), "local-ai-download-"));
		try {
			const bytes = Buffer.from("verified"),
				binding = {
					mime: "application/octet-stream",
					bytes: bytes.length,
					sha256: createHash("sha256").update(bytes).digest("hex"),
				};
			const client = createRemoteClient({
				serverUrl: "https://sss.linalab.io/tools/",
				stateDirectory: directory,
				accessToken: async () => "private-canary",
				fetch: async (input) => {
					const url = new URL(String(input));
					if (url.pathname.endsWith("/auth/session"))
						return Response.json(
							{ authenticated: true, csrfToken: "fixture" },
							{ headers: { "set-cookie": "portal_session=fixture; Secure" } },
						);
					if (url.pathname.endsWith("/connections"))
						return Response.json({ connection: null });
					return new Response(
						scenario === "hash"
							? Buffer.alloc(bytes.length)
							: scenario === "body-size"
								? Buffer.concat([bytes, bytes])
								: bytes,
						{
							headers: {
								"content-type":
									scenario === "mime" ? "text/plain" : binding.mime,
								"content-length": String(
									binding.bytes + (scenario === "header-size" ? 1 : 0),
								),
								"x-content-sha256": binding.sha256,
							},
						},
					);
				},
			});
			// When the attachment is read, then mismatched metadata or bytes fail closed.
			await expect(
				client.read(
					"/api/local-ai/jobs/fixture/artifacts/result",
					undefined,
					binding,
				),
			).rejects.toMatchObject({
				code: scenario === "hash" ? "RESULT_HASH_MISMATCH" : "INVALID_RESPONSE",
			});
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});
