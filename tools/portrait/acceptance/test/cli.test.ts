import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import {
	cp,
	mkdir,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import {
	makeObservation,
	makePortrait,
	makeProfile,
} from "./helpers/fixtures.js";

const root = join(import.meta.dir, "..");
const cli = join(root, "dist/cli.js");
const sha = (bytes: Uint8Array) =>
	createHash("sha256").update(bytes).digest("hex");
let temp = "";
let image: Uint8Array;
let measurement: Uint8Array;
let profile: ReturnType<typeof makeProfile>;
let profileBytes: Uint8Array;
let evidence: Uint8Array;
let authority: object;
let args: string[];
let terminalPath: string;

beforeAll(async () => {
	temp = await mkdtemp(join(tmpdir(), "portrait-cli-test-"));
	image = makePortrait();
	measurement = new TextEncoder().encode("measurement artifact bytes");
	const imageSHA = sha(image);
	const measurementEvidenceSHA = "0".repeat(64);
	const observation = makeObservation(imageSHA, measurementEvidenceSHA);
	measurement = new TextEncoder().encode(JSON.stringify(observation));
	profile = makeProfile(image, measurement);
	evidence = new TextEncoder().encode("review evidence");
	authority = {
		schema: "position-reference.v2",
		referenceVersion: "fixture-v1",
		referenceSHA: "a".repeat(64),
		ruleSHA: "b".repeat(64),
	};
	await mkdir(join(temp, "bundle"), { recursive: true });
	await writeFile(join(temp, "bundle/image.png"), image);
	await writeFile(join(temp, "bundle/measurement.json"), measurement);
	profileBytes = new TextEncoder().encode(JSON.stringify(profile));
	await writeFile(join(temp, "bundle/profile.json"), profileBytes);
	await writeFile(join(temp, "bundle/evidence.txt"), evidence);
	await writeFile(
		join(temp, "bundle/authority.json"),
		JSON.stringify(authority),
	);
	terminalPath = join(temp, "bundle/terminal.json");
	await writeFile(
		terminalPath,
		JSON.stringify({ id: "K001", requestId: "req-1" }),
	);
	const rowNames = [
		...Array.from(
			{ length: 10 },
			(_, i) => `Q${String(i + 1).padStart(2, "0")}`,
		),
		"authoredIdentity",
		"approvedPositionIntervals",
		"opaqueInterior",
		"naturalSilhouette",
		"defringe",
	];
	const digest = sha(evidence);
	const review = {
		characterId: "K001",
		requestId: "req-1",
		sha256: imageSHA,
		actualImageViewed: true,
		technicalVerdict: "pass",
		acceptanceSchema: "portrait-integrated-acceptance.v1",
		positionReference: {
			referenceVersion: "fixture-v1",
			referenceSHA: "a".repeat(64),
			ruleSHA: "b".repeat(64),
		},
		evidence: [{ sha256: digest, path: "evidence.txt" }],
		criteria: Object.fromEntries(
			rowNames.map((name) => [
				name,
				{
					verdict: "pass",
					scope: "whole-image",
					imageSHA,
					evidenceSHA: digest,
				},
			]),
		),
	};
	await writeFile(join(temp, "bundle/review.json"), JSON.stringify(review));
	args = [
		join(temp, "bundle/image.png"),
		join(temp, "bundle/review.json"),
		join(temp, "bundle/profile.json"),
		join(temp, "bundle/measurement.json"),
		"--character",
		"K001",
		"--request",
		"req-1",
		"--profile-sha",
		sha(profileBytes),
		"--position-reference",
		join(temp, "bundle/authority.json"),
	];
});

afterAll(async () => {
	if (temp) await rm(temp, { recursive: true, force: true });
});

async function run(extra: string[] = [], includeBase = true) {
	const child = Bun.spawn(
		[Bun.argv[0] ?? "node", cli, ...(includeBase ? args : []), ...extra],
		{ stdout: "pipe", stderr: "pipe" },
	);
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(child.stdout).text(),
		new Response(child.stderr).text(),
		child.exited,
	]);
	return { stdout, stderr, exitCode };
}

describe("portrait acceptance CLI", () => {
	it("prints a passing verdict with operator identity", async () => {
		const result = await run();
		if (result.exitCode !== 0)
			throw new Error(
				`CLI failed: stdout=${result.stdout} stderr=${result.stderr}`,
			);
		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout).pass).toBe(true);
	});

	it("runs when the copied CLI path contains spaces and encoded characters", async () => {
		const copiedPackage = await mkdtemp(
			join(tmpdir(), "portrait cli % fixture-"),
		);
		try {
			const copiedDist = join(copiedPackage, "dist");
			await cp(join(root, "dist"), copiedDist, { recursive: true });
			await writeFile(
				join(copiedPackage, "package.json"),
				JSON.stringify({ type: "module" }),
			);
			await symlink(
				join(root, "node_modules"),
				join(copiedPackage, "node_modules"),
			);
			const runCopied = async (copiedArgs: string[]) => {
				const child = Bun.spawn(
					["node", join(copiedDist, "cli.js"), ...copiedArgs],
					{
						cwd: copiedPackage,
						stdout: "pipe",
						stderr: "pipe",
					},
				);
				const [stdout, stderr, exitCode] = await Promise.all([
					new Response(child.stdout).text(),
					new Response(child.stderr).text(),
					child.exited,
				]);
				return { stdout, stderr, exitCode };
			};
			const help = await runCopied(["--help"]);
			expect(help).toEqual({
				stdout: expect.stringContaining("usage: portrait-acceptance"),
				stderr: "",
				exitCode: 0,
			});
			const copiedBundle = join(copiedPackage, "bundle");
			await mkdir(copiedBundle);
			for (const name of [
				"image.png",
				"review.json",
				"profile.json",
				"measurement.json",
				"evidence.txt",
				"authority.json",
			]) {
				await cp(join(temp, "bundle", name), join(copiedBundle, name));
			}
			const copiedArgs = args.map((arg) =>
				arg.startsWith(join(temp, "bundle"))
					? join(copiedBundle, arg.slice(join(temp, "bundle").length + 1))
					: arg,
			);
			const verdict = await runCopied(copiedArgs);
			expect(verdict.exitCode).toBe(0);
			expect(verdict.stderr).toBe("");
			expect(JSON.parse(verdict.stdout).pass).toBe(true);
		} finally {
			await rm(copiedPackage, { recursive: true, force: true });
		}
	});

	it("accepts terminal receipt identity rather than review identity", async () => {
		const direct = args.slice(0, 4);
		const result = await run(
			[
				...direct,
				"--terminal",
				terminalPath,
				"--profile-sha",
				sha(profileBytes),
				"--position-reference",
				join(temp, "bundle/authority.json"),
			],
			false,
		);
		if (result.exitCode !== 0)
			throw new Error(
				`CLI failed: stdout=${result.stdout} stderr=${result.stderr}`,
			);
		expect(result.exitCode).toBe(0);
		expect(JSON.parse(result.stdout).characterId).toBe("K001");
	});

	it("rejects absent flags and artifact substitutions", async () => {
		expect((await run(args.slice(0, 4))).stderr).toContain("usage:");
		expect(
			(await run(["--profile-sha", "0".repeat(64)], false)).stderr,
		).toContain("usage:");
		expect((await run([...args.slice(0, 9)], false)).stderr).toContain(
			"usage:",
		);
		const wrongPinArgs = [...args];
		wrongPinArgs[9] = "0".repeat(64);
		expect((await run(wrongPinArgs, false)).stderr).toBe(
			"profile authority pin mismatch\n",
		);
	});

	it("reports missing input files as one operational error", async () => {
		const missingArgs = [...args];
		missingArgs[0] = join(temp, "bundle/missing.png");
		const result = await run(missingArgs, false);
		expect(result.exitCode).toBe(1);
		expect(result.stdout).toBe("");
		expect(result.stderr).toMatch(/^missing artifact: .*missing\.png\n$/);
		expect(result.stderr).not.toContain("Error:");
		expect(result.stderr.trim().split("\n")).toHaveLength(1);
	});

	it("reports directory image and evidence inputs as one operational error", async () => {
		const imageArgs = [...args];
		imageArgs[0] = join(temp, "bundle");
		const imageResult = await run(imageArgs, false);
		expect(imageResult.exitCode).toBe(1);
		expect(imageResult.stdout).toBe("");
		expect(imageResult.stderr).toBe(`invalid artifact: ${imageArgs[0]}\n`);
		expect(imageResult.stderr.trim().split("\n")).toHaveLength(1);

		const reviewPath = join(temp, "bundle/review.json");
		const originalReview = await readFile(reviewPath, "utf8");
		try {
			const value: unknown = JSON.parse(originalReview);
			const parsedReview = z.record(z.string(), z.unknown()).safeParse(value);
			if (!parsedReview.success) throw new Error("invalid review fixture");
			await writeFile(
				reviewPath,
				JSON.stringify({
					...parsedReview.data,
					evidence: [{ sha256: sha(evidence), path: "directory" }],
				}),
			);
			await mkdir(join(temp, "bundle/directory"));
			const evidenceResult = await run();
			expect(evidenceResult.exitCode).toBe(1);
			expect(evidenceResult.stdout).toBe("");
			expect(evidenceResult.stderr).toBe(
				"evidence artifact hash mismatch: directory\n",
			);
			expect(evidenceResult.stderr.trim().split("\n")).toHaveLength(1);
		} finally {
			await writeFile(reviewPath, originalReview);
			await rm(join(temp, "bundle/directory"), {
				recursive: true,
				force: true,
			});
		}
	});

	it("rejects whitespace-only operator and terminal identities", async () => {
		const whitespaceArgs = [...args];
		whitespaceArgs[5] = "   ";
		expect((await run(whitespaceArgs, false)).stderr).toContain("usage:");
		const terminal = join(temp, "bundle/terminal-whitespace.json");
		await writeFile(terminal, JSON.stringify({ id: " ", requestId: "req-1" }));
		const terminalArgs = [
			...args.slice(0, 4),
			"--terminal",
			terminal,
			"--profile-sha",
			sha(profileBytes),
			"--position-reference",
			join(temp, "bundle/authority.json"),
		];
		expect((await run(terminalArgs, false)).stderr).toBe(
			"invalid terminal receipt\n",
		);
	});

	it("rejects malformed authority and missing evidence", async () => {
		const authorityPath = join(temp, "bundle/authority.json");
		const originalAuthority = await readFile(authorityPath, "utf8");
		try {
			await writeFile(
				authorityPath,
				JSON.stringify({ ...authority, extra: true }),
			);
			expect((await run()).stderr).toBe("invalid position authority\n");
		} finally {
			await writeFile(authorityPath, originalAuthority);
		}
		const reviewPath = join(temp, "bundle/review.json");
		const originalReview = await readFile(reviewPath, "utf8");
		try {
			const value: unknown = JSON.parse(originalReview);
			const parsedReview = z.record(z.string(), z.unknown()).safeParse(value);
			if (!parsedReview.success) throw new Error("invalid review fixture");
			const review = { ...parsedReview.data };
			Reflect.deleteProperty(review, "evidence");
			await writeFile(reviewPath, JSON.stringify(review));
			expect((await run()).stderr).toBe("review evidence artifacts required\n");
		} finally {
			await writeFile(reviewPath, originalReview);
		}
	});

	it("rejects altered, traversal, and tampered evidence", async () => {
		const reviewPath = join(temp, "bundle/review.json");
		const originalReview = await readFile(reviewPath, "utf8");
		try {
			const value: unknown = JSON.parse(originalReview);
			const parsedReview = z.record(z.string(), z.unknown()).safeParse(value);
			if (!parsedReview.success) throw new Error("invalid review fixture");
			const review = { ...parsedReview.data };
			Object.assign(review, {
				evidence: [{ sha256: sha(evidence), path: "../outside.txt" }],
			});
			await writeFile(reviewPath, JSON.stringify(review));
			expect((await run()).stderr).toBe("invalid evidence path\n");
			Object.assign(review, {
				evidence: [{ sha256: "0".repeat(64), path: "evidence.txt" }],
			});
			await writeFile(reviewPath, JSON.stringify(review));
			expect((await run()).stderr).toBe(
				"evidence artifact hash mismatch: evidence.txt\n",
			);
		} finally {
			await writeFile(reviewPath, originalReview);
		}
		const evidencePath = join(temp, "bundle/evidence.txt");
		try {
			await writeFile(evidencePath, new TextEncoder().encode("tampered"));
			expect((await run()).stderr).toContain(
				"evidence artifact hash mismatch:",
			);
		} finally {
			await writeFile(evidencePath, evidence);
		}
	});

	it("rejects unknown and duplicate flags and operator identity mismatch", async () => {
		expect((await run(["--unknown", "x"], false)).stderr).toContain("usage:");
		expect(
			(await run(["--character", "K1", "--character", "K2"], false)).stderr,
		).toContain("usage:");
		expect(
			(
				await run(
					[
						...args.slice(0, 4),
						"--character",
						"K999",
						"--request",
						"req-1",
						...args.slice(8),
					],
					false,
				)
			).stdout.includes('"exactImageReview"'),
		).toBe(true);
	});

	it("rejects stale image review hashes", async () => {
		const path = join(temp, "bundle/review.json");
		const original = await readFile(path, "utf8");
		try {
			const value: unknown = JSON.parse(original);
			const parsedReview = z.record(z.string(), z.unknown()).safeParse(value);
			if (!parsedReview.success) throw new Error("invalid review fixture");
			const review = { ...parsedReview.data };
			Object.assign(review, { sha256: "0".repeat(64) });
			await writeFile(path, JSON.stringify(review));
			const result = await run();
			expect(result.exitCode).toBe(1);
			expect(JSON.parse(result.stdout).failures).toContain("exactImageReview");
		} finally {
			await writeFile(path, original);
		}
	});
});
