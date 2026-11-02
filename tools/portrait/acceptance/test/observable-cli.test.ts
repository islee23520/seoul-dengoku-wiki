import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { observableReviewComparison } from "../src/observable-review.js";
import { encodePng } from "../src/png.js";

const sha = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const bytes = (v: unknown) => new TextEncoder().encode(JSON.stringify(v));
const names = [
	"crown",
	"chin",
	"headLeft",
	"headRight",
	"faceTop",
	"faceLeft",
	"faceRight",
	"leftPupil",
	"rightPupil",
	"leftShoulder",
	"rightShoulder",
	"torsoLeft",
	"torsoRight",
];
const absent = {
	status: "unmeasured",
	point: null,
	uncertaintyPixels: null,
	pixelBounds: null,
};
const pt = (x: number, y: number) => ({
	status: "observed",
	point: [x, y],
	uncertaintyPixels: 0,
	pixelBounds: [
		[x, x],
		[y, y],
	],
});
const image = encodePng({
	width: 7,
	height: 11,
	pixels: new Uint8Array(7 * 11 * 4).fill(255),
});
const doc = {
	schema: "portrait-observable-observation.v1",
	characterId: "synthetic",
	imageSHA: sha(image),
	canvas: [7, 11],
	definitions: {
		head: "visible-connected-main-head-mass.v3",
		body: "visible-clothed-body-bands.v1",
	},
	origins: {
		headCandidateSHA: "a".repeat(64),
		headReviewSHA: "b".repeat(64),
		bodyDraftSHA: "c".repeat(64),
		headDefinitionReviewSHA: "d".repeat(64),
		bodyDefinitionSHA: "e".repeat(64),
		bodyIndependentReviewSHA: "f".repeat(64),
	},
	landmarks: Object.fromEntries(
		names.map((n) => [
			n,
			pt(
				n === "headLeft" ? 1 : n === "headRight" ? 5 : 3,
				n === "crown" ? 1 : n === "chin" ? 3 : 2,
			),
		]),
	),
	bodyBands: ([1, 2, 3] as const).map((k, i) => ({
		k,
		sourcePixelY: [5, 7, 8][i],
		left: { status: "observed", xInterval: [1, 1], clipped: false },
		right: { status: "observed", xInterval: [5, 5], clipped: false },
		equipment: "no_separate_outer_contribution_observed",
	})),
};
const content = bytes(doc),
	imageSHA = sha(image),
	observationSHA = sha(content);
const usage =
	"usage: portrait-acceptance observe-compare <image.png> <observation.json> --character <id> --image-sha <sha256> --observation-sha <sha256>";
const node = Bun.which("node"),
	cli = join(import.meta.dir, "../dist/cli.js");
let temp = "",
	imagePath = "",
	observationPath = "",
	directoryPath = "";
beforeAll(async () => {
	if (!node) throw Error("Node executable required");
	temp = await mkdtemp(join(tmpdir(), "observable-cli-"));
	imagePath = join(temp, "original with spaces.png");
	observationPath = join(temp, "observation with spaces.json");
	directoryPath = join(temp, "directory");
	await mkdir(directoryPath);
	await Promise.all([
		writeFile(imagePath, image),
		writeFile(observationPath, content),
	]);
});
afterAll(async () => {
	if (temp) await rm(temp, { recursive: true });
});
async function run(args: string[]) {
	if (!node) throw Error("Node executable required");
	const signal = AbortSignal.timeout(10000);
	const timedOut = new Promise<never>((_, reject) =>
		signal.addEventListener("abort", () => reject(Error("CLI timed out")), {
			once: true,
		}),
	);
	const child = Bun.spawn([node, cli, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});
	signal.addEventListener("abort", () => child.kill(), { once: true });
	const [stdout, stderr, exitCode] = await Promise.race([
		Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
			child.exited,
		]),
		timedOut,
	]);
	return { stdout, stderr, exitCode };
}
function args(
	overrides: Partial<{
		image: string;
		observation: string;
		imageSHA: string;
		observationSHA: string;
		character: string;
	}> = {},
) {
	return [
		"observe-compare",
		overrides.image ?? imagePath,
		overrides.observation ?? observationPath,
		"--character",
		overrides.character ?? "synthetic",
		"--image-sha",
		overrides.imageSHA ?? imageSHA,
		"--observation-sha",
		overrides.observationSHA ?? observationSHA,
	];
}
function errorRecord(
	result: { stdout: string; stderr: string; exitCode: number },
	code: string,
) {
	expect(result.exitCode).toBe(1);
	expect(result.stdout).toBe("");
	expect(result.stderr.endsWith("\n")).toBe(true);
	const expected = {
		schema: "portrait-observable-review-error.v1",
		code,
		productionAdvancement: "HOLD",
	};
	expect(result.stderr.startsWith("{")).toBe(true);
	expect(JSON.parse(result.stderr)).toEqual(expected);
	expect(result.stderr).toBe(`${JSON.stringify(expected)}\n`);
}
async function withBytes(
	value: Uint8Array,
	action: (path: string, pin: string) => Promise<void>,
) {
	const path = join(temp, `case-${crypto.randomUUID()}.json`);
	await writeFile(path, value);
	try {
		await action(path, sha(value));
	} finally {
		await rm(path);
	}
}
async function withDoc(
	value: unknown,
	action: (path: string, pin: string) => Promise<void>,
) {
	await withBytes(bytes(value), action);
}
const hold = {
	integrityAssessment: "PASS",
	evidenceAuthority: "UNVERIFIED_DRAFT_ASSERTIONS",
	evidenceAuthorityAccepted: false,
	reviewAcceptance: "NOT_EVALUATED",
	productionAdvancement: "HOLD",
	completeConfirmed: false,
	ownerApprovalImplied: false,
	releaseApprovalImplied: false,
	profileApprovalImplied: false,
	anatomical: false,
};
describe("real Node observable CLI", () => {
	test("01 actual emitted command returns API JSON exit zero", async () => {
		const r = await run(args());
		expect(r.exitCode).toBe(0);
		expect(r.stderr).toBe("");
		const api = observableReviewComparison({
			imageBytes: image,
			observationBytes: content,
			expectedImageSHA: imageSHA,
			expectedObservationSHA: observationSHA,
			expectedCharacterId: "synthetic",
		});
		expect(JSON.parse(r.stdout)).toEqual(api);
		expect(r.stdout).toBe(`${JSON.stringify(api)}\n`);
		expect(api).toMatchObject(hold);
	});
	test("02 interleaved flags paths with spaces", async () => {
		const r = await run([
			"observe-compare",
			"--character",
			"synthetic",
			imagePath,
			"--observation-sha",
			observationSHA,
			observationPath,
			"--image-sha",
			imageSHA,
		]);
		expect(r.exitCode).toBe(0);
		expect(r.stderr).toBe("");
		expect(JSON.parse(r.stdout)).toMatchObject({
			...hold,
			characterId: "synthetic",
		});
	});
	test("02 independent identity mismatch", async () =>
		errorRecord(await run(args({ character: "other" })), "IDENTITY_MISMATCH"));
	for (const flag of ["--help", "-h"]) {
		test(`03 sole ${flag} without file reads`, async () =>
			expect(await run(["observe-compare", flag])).toEqual({
				exitCode: 0,
				stdout: `${usage}\n`,
				stderr: "",
			}));
		test(`03 mixed ${flag} rejects as USAGE`, async () =>
			errorRecord(await run([...args(), flag]), "USAGE"));
	}
	const invalidArgs: readonly (readonly [string, () => string[]])[] = [
		["missing all paths and flags", () => ["observe-compare"]],
		["missing observation pin", () => args().slice(0, -2)],
		[
			"missing character flag",
			() => args().filter((_, i) => i !== 3 && i !== 4),
		],
		["duplicate character", () => [...args(), "--character", "synthetic"]],
		["unknown profile", () => [...args(), "--profile", "x"]],
		["unknown terminal", () => [...args(), "--terminal", "x"]],
		["unknown request", () => [...args(), "--request", "x"]],
		["extra path", () => [...args(), "extra"]],
		[
			"equals syntax",
			() =>
				args().map((x) =>
					x === "--image-sha" ? `--image-sha=${imageSHA}` : x,
				),
		],
		["malformed SHA", () => args({ imageSHA: "x" })],
		["whitespace identity", () => args({ character: " " })],
		["identity alias", () => [...args(), "--id", "synthetic"]],
	];
	for (const [name, makeArgs] of invalidArgs)
		test(`04 ${name} expects USAGE`, async () =>
			errorRecord(await run(makeArgs()), "USAGE"));
	for (const key of ["imageSHA", "observationSHA"] as const)
		test(`05 wrong raw ${key} expects SHA_MISMATCH`, async () =>
			errorRecord(await run(args({ [key]: "0".repeat(64) })), "SHA_MISMATCH"));
	for (const fresh of [false, true])
		test(`05 whitespace mutation ${fresh ? "fresh pin accepts" : "stale pin SHA_MISMATCH"}`, async () => {
			await withBytes(new Uint8Array([...content, 32]), async (path, pin) => {
				const r = await run(
					args({
						observation: path,
						...(fresh ? { observationSHA: pin } : {}),
					}),
				);
				if (fresh) {
					expect(r.exitCode).toBe(0);
					expect(r.stderr).toBe("");
					expect(JSON.parse(r.stdout)).toMatchObject(hold);
				} else errorRecord(r, "SHA_MISMATCH");
			});
		});
	for (const [name, value, code] of [
		[
			"embedded image pin",
			{ ...doc, imageSHA: "0".repeat(64) },
			"SHA_MISMATCH",
		],
		[
			"document identity",
			{ ...doc, characterId: "other" },
			"IDENTITY_MISMATCH",
		],
	] as const)
		test(`05 ${name} expects ${code}`, async () =>
			withDoc(value, async (path, pin) =>
				errorRecord(
					await run(args({ observation: path, observationSHA: pin })),
					code,
				),
			));
	for (const [name, text] of [
		["malformed", "{"],
		[
			"escaped nested duplicate",
			JSON.stringify(doc).replace(
				'"status":"observed"',
				'"status":"observed","sta\\u0074us":"observed"',
			),
		],
	])
		test(`06 ${name} expects INVALID_JSON`, async () =>
			withBytes(new TextEncoder().encode(text), async (path, pin) =>
				errorRecord(
					await run(args({ observation: path, observationSHA: pin })),
					"INVALID_JSON",
				),
			));
	test("06 malformed PNG expects INVALID_IMAGE", async () =>
		withBytes(Uint8Array.of(1, 2, 3), async (path, pin) =>
			withDoc({ ...doc, imageSHA: pin }, async (op, osha) =>
				errorRecord(
					await run(
						args({
							image: path,
							imageSHA: pin,
							observation: op,
							observationSHA: osha,
						}),
					),
					"INVALID_IMAGE",
				),
			),
		));
	test("06 mismatched canvas expects CANVAS_MISMATCH", async () =>
		withDoc({ ...doc, canvas: [8, 11] }, async (path, pin) =>
			errorRecord(
				await run(args({ observation: path, observationSHA: pin })),
				"CANVAS_MISMATCH",
			),
		));
	for (const [name, value, code] of [
		[
			"reversed interval",
			{
				...doc,
				landmarks: {
					...doc.landmarks,
					crown: {
						...pt(3, 1),
						pixelBounds: [
							[4, 3],
							[1, 1],
						],
					},
				},
			},
			"INVALID_INTERVAL",
		],
		[
			"wrong nominal row",
			{
				...doc,
				bodyBands: doc.bodyBands.map((b, i) =>
					i === 0 ? { ...b, sourcePixelY: 6 } : b,
				),
			},
			"INVALID_BAND_ROW",
		],
		[
			"unclipped boundary",
			{
				...doc,
				bodyBands: doc.bodyBands.map((b, i) =>
					i === 0
						? {
								...b,
								left: { status: "draft", xInterval: [0, 0], clipped: false },
							}
						: b,
				),
			},
			"INCONSISTENT_CLIPPING",
		],
	] as const)
		test(`07 ${name} expects ${code}`, async () =>
			withDoc(value, async (path, pin) =>
				errorRecord(
					await run(args({ observation: path, observationSHA: pin })),
					code,
				),
			));
	for (const key of ["image", "observation"] as const)
		for (const directory of [false, true])
			test(`08 ${key} ${directory ? "directory INVALID_ARTIFACT" : "missing MISSING_ARTIFACT"}`, async () =>
				errorRecord(
					await run(
						args({ [key]: directory ? directoryPath : join(temp, "missing") }),
					),
					directory ? "INVALID_ARTIFACT" : "MISSING_ARTIFACT",
				));
	for (const missing of [false, true])
		test(`09 all ${missing ? "unmeasured" : "observed"} authority HOLD and immutable bytes`, async () => {
			const value = missing
				? {
						...doc,
						landmarks: Object.fromEntries(names.map((n) => [n, absent])),
						bodyBands: doc.bodyBands.map((b) => ({
							...b,
							sourcePixelY: null,
							left: { status: "unmeasured", xInterval: null, clipped: null },
							right: { status: "unmeasured", xInterval: null, clipped: null },
						})),
					}
				: doc;
			await withDoc(value, async (path, pin) => {
				const before = await readFile(path);
				const r = await run(args({ observation: path, observationSHA: pin }));
				expect(r.exitCode).toBe(0);
				expect(r.stderr).toBe("");
				expect(JSON.parse(r.stdout)).toMatchObject(hold);
				expect(await readFile(path)).toEqual(before);
			});
			expect(new Uint8Array(await readFile(imagePath))).toEqual(
				new Uint8Array(image),
			);
			expect(new Uint8Array(await readFile(observationPath))).toEqual(content);
		});
	for (const command of ["full", "source-compare"])
		test(`10 old ${command} human readable dispatch`, async () => {
			const r = await run(command === "full" ? [] : [command]);
			expect(r.exitCode).toBe(1);
			expect(r.stdout).toBe("");
			expect(r.stderr.startsWith("usage: portrait-acceptance ")).toBe(true);
			expect(() => JSON.parse(r.stderr)).toThrow(SyntaxError);
		});
});
