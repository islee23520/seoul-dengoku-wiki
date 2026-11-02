import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	executeFullAcceptance,
	type FullAcceptanceOptions,
	requireBatchReviewIngress,
} from "../src/acceptance-ingress.js";
import { BatchHoldError, requireBatchReview } from "../src/batch-gate.js";
import { PortraitCliError } from "../src/cli.js";
import { encodePng } from "../src/png.js";

const hash = (value: string | Uint8Array): string =>
	createHash("sha256").update(value).digest("hex");
const encode = (value: unknown) => Buffer.from(JSON.stringify(value));
function canonical(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
	if (typeof value === "object" && value !== null)
		return `{${Object.keys(value)
			.sort()
			.map(
				(key) => `${JSON.stringify(key)}:${canonical(Reflect.get(value, key))}`,
			)
			.join(",")}}`;
	return JSON.stringify(value);
}
const pixels = new Uint8Array(1024 * 1536 * 4);
pixels.set([80, 100, 120, 255], (500 * 1024 + 500) * 4);
const image = encodePng({ width: 1024, height: 1536, pixels });
const imageSHA = hash(image);
const observation = {
	imageSHA,
	actualImageMeasured: true,
	canvas: [1024, 1536],
	bodyType: "u03-technical-fixture",
	landmarks: {
		crown: [512, 100],
		chin: [512, 500],
		headLeft: [412, 300],
		headRight: [612, 300],
		faceTop: [512, 160],
		faceLeft: [452, 300],
		faceRight: [572, 300],
		leftPupil: [472, 260],
		rightPupil: [552, 260],
		leftShoulder: [362, 560],
		rightShoulder: [662, 560],
		torsoLeft: [412, 620],
		torsoRight: [612, 620],
	},
};
const measurement = encode(observation);
const payload = {
	schema: "portrait-proportion-profile.v1",
	canvas: [1024, 1536],
	bodyType: "u03-technical-fixture",
	commonSourceSHA: imageSHA,
	bodySourceSHA: imageSHA,
	commonMeasurementSHA: hash(measurement),
	bodyMeasurementSHA: hash(measurement),
	targets: {
		headWidth: 200,
		headHeight: 400,
		faceWidth: 120,
		faceHeight: 340,
		eyeY: 260,
		headCenterX: 512,
		crownY: 100,
	},
	ratios: { shoulderToHead: 1.5, torsoToHead: 1 },
	tolerance: { pixels: 2, ratio: 0.05, evidenceSHA: hash(measurement) },
};
const profile = { ...payload, profileSHA: hash(canonical(payload)) };
const evidence = Buffer.from(
	"U03 independent technical evidence, not owner approval",
);
const evidenceSHA = hash(evidence);
const position = {
	referenceVersion: "u03-fixture",
	referenceSHA: "a".repeat(64),
	ruleSHA: "b".repeat(64),
};
const names = [
	"Q01",
	"Q02",
	"Q03",
	"Q04",
	"Q05",
	"Q06",
	"Q07",
	"Q08",
	"Q09",
	"Q10",
	"authoredIdentity",
	"approvedPositionIntervals",
	"opaqueInterior",
	"naturalSilhouette",
	"defringe",
];
const review = {
	characterId: "U03",
	requestId: "u03-request",
	sha256: imageSHA,
	actualImageViewed: true,
	technicalVerdict: "pass",
	acceptanceSchema: "portrait-integrated-acceptance.v1",
	positionReference: position,
	criteria: Object.fromEntries(
		names.map((name) => [
			name,
			{ verdict: "pass", scope: "whole-image", imageSHA, evidenceSHA },
		]),
	),
	evidence: [{ path: "evidence.bin", sha256: evidenceSHA }],
};
let bundle = "",
	candidate = "";
beforeAll(async () => {
	bundle = await mkdtemp(join(tmpdir(), "u03-node-entry-"));
	candidate = join(bundle, "candidate.mjs");
	const build = await Bun.build({
		entrypoints: [join(import.meta.dir, "helpers/acceptance-ingress-cli.ts")],
		target: "node",
		format: "esm",
	});
	expect(build.success).toBe(true);
	const output = build.outputs[0];
	if (!output) throw new Error("candidate build produced no output");
	await writeFile(candidate, await output.text());
});
afterAll(async () => {
	if (bundle) await rm(bundle, { recursive: true });
});

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "u03-real-fs-"));
	const path = (name: string) => join(root, name);
	await Promise.all([
		writeFile(path("image.png"), image),
		writeFile(path("measurement.json"), measurement),
		writeFile(path("profile.json"), encode(profile)),
		writeFile(path("review.json"), encode(review)),
		writeFile(path("evidence.bin"), evidence),
		writeFile(
			path("authority.json"),
			encode({ schema: "position-reference.v2", ...position }),
		),
		writeFile(
			path("terminal.json"),
			encode({ id: "U03", requestId: "u03-request" }),
		),
	]);
	const options: FullAcceptanceOptions = {
		mode: "operator",
		character: "U03",
		request: "u03-request",
		paths: [
			path("image.png"),
			path("review.json"),
			path("profile.json"),
			path("measurement.json"),
		],
		profileSHA: hash(encode(profile)),
		positionReference: path("authority.json"),
	};
	const terminal = {
		id: "U03",
		requestId: "u03-request",
		result: { path: path("image.png") },
	};
	const pins = {
		profilePath: path("profile.json"),
		profileFileSHA: hash(encode(profile)),
		measurementPath: path("measurement.json"),
		positionReference: position,
	};
	const args = [
		...options.paths,
		"--character",
		"U03",
		"--request",
		"u03-request",
		"--profile-sha",
		options.profileSHA,
		"--position-reference",
		options.positionReference,
	];
	return { root, path, options, terminal, pins, args };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
async function withFixture(action: (f: Fixture) => Promise<void>) {
	const f = await fixture();
	try {
		await action(f);
	} finally {
		await rm(f.root, { recursive: true });
	}
}
async function run(entry: string, args: string[]) {
	const child = Bun.spawn(["node", entry, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	return { stdout, stderr, exitCode };
}
function checkPass(result: Awaited<ReturnType<typeof executeFullAcceptance>>) {
	expect(result.pass).toBe(true);
	expect(result.failures).toEqual([]);
	expect(result.characterId).toBe("U03");
	expect(result.requestId).toBe("u03-request");
	expect(result.imageSHA).toBe(imageSHA);
	expect(result.proportions?.measured).toEqual({
		...payload.targets,
		shoulderWidth: 300,
		torsoWidth: 200,
	});
	expect(result.ownerApprovalImplied).toBe(false);
	expect(result.releaseApprovalImplied).toBe(false);
}
const cliErrors: readonly {
	name: string;
	code: string;
	change: (f: Fixture) => Promise<FullAcceptanceOptions>;
}[] = [
	{
		name: "profile pin before malformed authority",
		code: "INVALID_PROFILE_PIN",
		change: async (f) => {
			await writeFile(f.path("authority.json"), "{");
			return { ...f.options, profileSHA: "f".repeat(64) };
		},
	},
	{
		name: "strict authority rejects extra keys",
		code: "INVALID_POSITION_AUTHORITY",
		change: async (f) => {
			await writeFile(
				f.path("authority.json"),
				encode({ schema: "position-reference.v2", ...position, extra: true }),
			);
			return f.options;
		},
	},
	{
		name: "authority whitespace version",
		code: "INVALID_POSITION_AUTHORITY",
		change: async (f) => {
			await writeFile(
				f.path("authority.json"),
				encode({
					schema: "position-reference.v2",
					...position,
					referenceVersion: " ",
				}),
			);
			return f.options;
		},
	},
	{
		name: "malformed review",
		code: "INVALID_REVIEW",
		change: async (f) => {
			await writeFile(f.path("review.json"), "{");
			return f.options;
		},
	},
	{
		name: "empty evidence",
		code: "REVIEW_EVIDENCE_REQUIRED",
		change: async (f) => {
			await writeFile(
				f.path("review.json"),
				encode({ ...review, evidence: [] }),
			);
			return f.options;
		},
	},
	...["../outside", "..\\outside", "/outside", "."].map((path) => ({
		name: `confined evidence ${path}`,
		code: "INVALID_EVIDENCE_PATH",
		change: async (f: Fixture) => {
			await writeFile(
				f.path("review.json"),
				encode({ ...review, evidence: [{ path, sha256: evidenceSHA }] }),
			);
			return f.options;
		},
	})),
	{
		name: "missing evidence distinct CLI code",
		code: "EVIDENCE_HASH_MISMATCH",
		change: async (f) => {
			await rm(f.path("evidence.bin"));
			return f.options;
		},
	},
	{
		name: "tampered evidence",
		code: "EVIDENCE_HASH_MISMATCH",
		change: async (f) => {
			await writeFile(f.path("evidence.bin"), "changed");
			return f.options;
		},
	},
	{
		name: "terminal whitespace",
		code: "INVALID_TERMINAL_RECEIPT",
		change: async (f) => {
			await writeFile(
				f.path("terminal.json"),
				encode({ id: " ", requestId: "u03-request" }),
			);
			return {
				...f.options,
				mode: "terminal",
				terminal: f.path("terminal.json"),
			};
		},
	},
	{
		name: "repinned malformed profile",
		code: "INVALID_PROFILE",
		change: async (f) => {
			await writeFile(f.path("profile.json"), "{");
			return { ...f.options, profileSHA: hash("{") };
		},
	},
	{
		name: "missing image",
		code: "MISSING_ARTIFACT",
		change: async (f) => {
			await rm(f.path("image.png"));
			return f.options;
		},
	},
];
describe("U03 direct full ingress independent RED", () => {
	it("operator genuine full pass", () =>
		withFixture(async (f) =>
			checkPass(await executeFullAcceptance(f.options)),
		));
	for (const status of [undefined, "FAILED", "DISPATCHED_RESPONSE_UNKNOWN"])
		it(`CLI identity-only terminal preserves ${status}`, () =>
			withFixture(async (f) => {
				await writeFile(
					f.path("terminal.json"),
					encode({ id: "U03", requestId: "u03-request", status, error: true }),
				);
				checkPass(
					await executeFullAcceptance({
						...f.options,
						mode: "terminal",
						terminal: f.path("terminal.json"),
					}),
				);
			}));
	for (const row of cliErrors)
		it(row.name, () =>
			withFixture(async (f) => {
				const options = await row.change(f);
				let error: unknown;
				try {
					await executeFullAcceptance(options);
				} catch (cause: unknown) {
					error = cause;
				}
				expect(error).toBeInstanceOf(PortraitCliError);
				expect(error).toMatchObject({ code: row.code });
			}),
		);
	for (const row of [
		{
			name: "external identity",
			file: "review.json",
			value: { ...review, characterId: "other" },
			failures: ["exactImageReview"],
		},
		{
			name: "external position authority",
			file: "authority.json",
			value: {
				schema: "position-reference.v2",
				...position,
				ruleSHA: "c".repeat(64),
			},
			failures: ["positionReference"],
		},
		{
			name: "measurement bound image",
			file: "measurement.json",
			value: { ...observation, imageSHA: "f".repeat(64) },
			failures: ["measuredProportions"],
		},
		{
			name: "measurement schema",
			file: "measurement.json",
			value: { ...observation, landmarks: {} },
			failures: ["measuredProportions"],
		},
	])
		it(row.name, () =>
			withFixture(async (f) => {
				await writeFile(f.path(row.file), encode(row.value));
				const verdict = await executeFullAcceptance(f.options);
				expect(verdict.pass).toBe(false);
				expect(verdict.failures).toEqual(row.failures);
				expect(verdict.ownerApprovalImplied).toBe(false);
				expect(verdict.releaseApprovalImplied).toBe(false);
			}),
		);
});
const batchErrors: readonly {
	name: string;
	code: string;
	change: (f: Fixture) => Promise<{ terminal: unknown; pins: unknown }>;
}[] = [
	...["FAILED", "DISPATCHED_RESPONSE_UNKNOWN"].map((status) => ({
		name: `batch ${status} precedes missing files and pins`,
		code: "TERMINAL_RECONCILIATION_REQUIRED",
		change: async (f: Fixture) => {
			await rm(f.path("review.json"));
			return { terminal: { ...f.terminal, status }, pins: null };
		},
	})),
	{
		name: "review identity before pins",
		code: "INVALID_REVIEW",
		change: async (f) => ({
			terminal: { ...f.terminal, id: "other" },
			pins: null,
		}),
	},
	{
		name: "pins required",
		code: "OPERATOR_PINS_REQUIRED",
		change: async (f) => ({ terminal: f.terminal, pins: {} }),
	},
	{
		name: "strict batch authority",
		code: "OPERATOR_PINS_REQUIRED",
		change: async (f) => ({
			terminal: f.terminal,
			pins: { ...f.pins, positionReference: { ...position, extra: true } },
		}),
	},
	{
		name: "profile byte pin",
		code: "PROFILE_PIN_MISMATCH",
		change: async (f) => ({
			terminal: f.terminal,
			pins: { ...f.pins, profileFileSHA: "f".repeat(64) },
		}),
	},
	{
		name: "supplied profile cannot forge authority",
		code: "PROFILE_MISMATCH",
		change: async (f) => ({
			terminal: f.terminal,
			pins: { ...f.pins, profile: { ...profile, bodyType: "forged" } },
		}),
	},
	{
		name: "malformed pinned profile",
		code: "INVALID_ARTIFACT",
		change: async (f) => {
			await writeFile(f.path("profile.json"), "{");
			return {
				terminal: f.terminal,
				pins: { ...f.pins, profileFileSHA: hash("{") },
			};
		},
	},
	{
		name: "evidence required",
		code: "EVIDENCE_REQUIRED",
		change: async (f) => {
			await writeFile(
				f.path("review.json"),
				encode({ ...review, evidence: [] }),
			);
			return { terminal: f.terminal, pins: f.pins };
		},
	},
	{
		name: "missing evidence distinct batch code",
		code: "INVALID_ARTIFACT",
		change: async (f) => {
			await rm(f.path("evidence.bin"));
			return { terminal: f.terminal, pins: f.pins };
		},
	},
	{
		name: "tampered evidence before measurement",
		code: "EVIDENCE_HASH_MISMATCH",
		change: async (f) => {
			await writeFile(f.path("evidence.bin"), "changed");
			await rm(f.path("measurement.json"));
			return { terminal: f.terminal, pins: f.pins };
		},
	},
	...["../outside", "..\\outside", "/outside", "."].map((path) => ({
		name: `batch confined evidence ${path}`,
		code: "INVALID_EVIDENCE_PATH",
		change: async (f: Fixture) => {
			await writeFile(
				f.path("review.json"),
				encode({ ...review, evidence: [{ path, sha256: evidenceSHA }] }),
			);
			return { terminal: f.terminal, pins: f.pins };
		},
	})),
];
describe("U03 fresh batch independently registered RED", () => {
	it("genuine pinned batch passes", () =>
		withFixture(async (f) =>
			checkPass(
				await requireBatchReviewIngress(
					f.terminal,
					f.path("review.json"),
					f.pins,
				),
			),
		));
	for (const row of batchErrors)
		it(row.name, () =>
			withFixture(async (f) => {
				const changed = await row.change(f);
				let error: unknown;
				try {
					await requireBatchReviewIngress(
						changed.terminal,
						f.path("review.json"),
						changed.pins,
					);
				} catch (cause: unknown) {
					error = cause;
				}
				expect(error).toBeInstanceOf(BatchHoldError);
				expect(error).toMatchObject({ code: row.code });
			}),
		);
	for (const row of [
		{
			name: "measurement mismatch has measured criterion",
			file: "measurement.json",
			value: { ...observation, imageSHA: "f".repeat(64) },
			criterion: "measuredProportions",
		},
		{
			name: "position mismatch has position criterion",
			file: "review.json",
			value: {
				...review,
				positionReference: { ...position, ruleSHA: "f".repeat(64) },
			},
			criterion: "positionReference",
		},
	])
		it(row.name, () =>
			withFixture(async (f) => {
				await writeFile(f.path(row.file), encode(row.value));
				await expect(
					requireBatchReviewIngress(f.terminal, f.path("review.json"), f.pins),
				).rejects.toMatchObject({
					code: "ACCEPTANCE_FAILED",
					message: expect.stringContaining(row.criterion),
				});
			}),
		);
});
describe("U03 actual Node candidate CLI RED", () => {
	for (const row of cliErrors)
		it(`Node ${row.name}`, () =>
			withFixture(async (f) => {
				const options = await row.change(f);
				const identity =
					options.mode === "terminal"
						? ["--terminal", options.terminal]
						: ["--character", options.character, "--request", options.request];
				const args = [
					...options.paths,
					...identity,
					"--profile-sha",
					options.profileSHA,
					"--position-reference",
					options.positionReference,
				];
				const shipped = await run(
					join(import.meta.dir, "../dist/cli.js"),
					args,
				);
				expect(shipped.exitCode).toBe(1);
				expect(shipped.stdout).toBe("");
				const result = await run(candidate, args);
				expect(result.exitCode).toBe(1);
				expect(result.stdout).toBe("");
				expect(result.stderr).toBe(shipped.stderr);
			}));
	for (const mode of ["operator", "terminal"])
		it(`prints complete ${mode} verdict`, () =>
			withFixture(async (f) => {
				const args =
					mode === "operator"
						? f.args
						: [
								...f.args.slice(0, 4),
								"--terminal",
								f.path("terminal.json"),
								...f.args.slice(8),
							];
				const result = await run(candidate, args);
				expect(result.exitCode).toBe(0);
				expect(result.stderr).toBe("");
				expect(result.stdout).not.toBe("");
				checkPass(JSON.parse(result.stdout));
			}));
	for (const args of [
		[],
		["--unknown", "x"],
		["--character", "U03", "--character", "U03"],
	])
		it(`invalid arguments ${JSON.stringify(args)}`, async () => {
			const result = await run(candidate, args);
			expect(result.exitCode).toBe(1);
			expect(result.stderr).toContain("usage: portrait-acceptance");
			expect(result.stdout).toBe("");
		});
	it("failed verdict prints JSON exit one", () =>
		withFixture(async (f) => {
			await writeFile(
				f.path("review.json"),
				encode({ ...review, characterId: "other" }),
			);
			const result = await run(candidate, f.args);
			expect(result.exitCode).toBe(1);
			expect(result.stderr).toBe("");
			expect(JSON.parse(result.stdout).failures).toEqual(["exactImageReview"]);
		}));
});
describe("unchanged shipped consumers not fresh RED", () => {
	for (const row of batchErrors)
		it(`shipped ${row.name}`, () =>
			withFixture(async (f) => {
				const changed = await row.change(f);
				await expect(
					requireBatchReview(
						changed.terminal,
						f.path("review.json"),
						changed.pins,
					),
				).rejects.toMatchObject({ name: "BatchHoldError", code: row.code });
			}));
	it("real Node full CLI and public batch genuine pass", () =>
		withFixture(async (f) => {
			const result = await run(join(import.meta.dir, "../dist/cli.js"), f.args);
			expect(result.exitCode).toBe(0);
			expect(result.stderr).toBe("");
			checkPass(JSON.parse(result.stdout));
			checkPass(
				await requireBatchReview(f.terminal, f.path("review.json"), f.pins),
			);
		}));
});
