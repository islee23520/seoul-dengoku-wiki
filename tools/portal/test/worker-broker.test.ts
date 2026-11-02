import { expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import {
	encodeRequest,
	parseReply,
	verifyArtifact,
} from "../../local-ai/worker-broker-client.ts";

test("admission preserves eligibility without accepting an old active-ready claim", () => {
	// Given configuration eligibility, not active lease authority.
	const reply = {
		version: 1,
		op: "admission",
		configurationEligible: true,
	} as const;
	// When the reply crosses the wire parser, then only the exact contract survives.
	expect(parseReply(reply)).toEqual(reply);
	expect(() =>
		parseReply({ version: 1, op: "admission", ready: true }),
	).toThrow("INVALID_FIELDS");
});

test("wire rejects command injection and forged success when input crosses the client boundary", () => {
	// Given a legitimate operation with an unrecognized command field.
	const request = { version: 1, op: "probe", command: "calc.exe" } satisfies {
		version: 1;
		op: "probe";
		command: string;
	};
	// When/Then: unknown authority and fields cannot cross the wire.
	expect(() => encodeRequest(request)).toThrow("INVALID_FIELDS");
	expect(() =>
		parseReply({
			version: 1,
			op: "run",
			requestId: randomUUID(),
			state: "SUCCEEDED",
			requestSha256: "a".repeat(64),
			exitCode: 0,
		}),
	).toThrow("INVALID_STATE");
});

test("artifact verifier rejects corruption when bytes differ from the approved digest", () => {
	// Given approved artifact bytes and their independently computed digest.
	const bytes = Buffer.from("artifact");
	const hash = createHash("sha256").update(bytes).digest("hex");
	// When/Then.
	verifyArtifact(bytes, hash);
	expect(() => verifyArtifact(Buffer.from("corrupt"), hash)).toThrow(
		"ARTIFACT_HASH_MISMATCH",
	);
});

test("chunk parser rejects bounds violations when server returns oversized data", () => {
	// Given an overlong chunk.
	const reply = {
		version: 1,
		op: "get",
		artifactId: "mesh",
		offset: 0,
		total: 40000,
		sha256: "a".repeat(64),
		data: Buffer.alloc(32769).toString("base64"),
	};
	// When/Then.
	expect(() => parseReply(reply)).toThrow("INVALID_CHUNK");
});
