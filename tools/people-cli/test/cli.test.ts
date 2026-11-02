import { afterEach, describe, expect, it } from "bun:test";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { z } from "zod";

const packageRoot = resolve(import.meta.dir, "..");
const cliPath = join(packageRoot, "dist", "cli.js");
const folders: string[] = [];
const PngSignature: Buffer<ArrayBuffer> = Buffer.from([
	137, 80, 78, 71, 13, 10, 26, 10,
]);
const sha256 = (bytes: Uint8Array): string =>
	createHash("sha256").update(bytes).digest("hex");

const SourceSchema = z.object({
	bytesBase64: z.string(),
	sha256: z.string(),
	byteLength: z.number().int().nonnegative(),
});
const GetOutputSchema = z.object({
	personId: z.string(),
	characterId: z.string(),
	name: z.string(),
	sources: z.object({
		detail: SourceSchema,
		token: SourceSchema,
		image: SourceSchema,
	}),
});
const PersonIdentitySchema = z.object({
	personId: z.string(),
	characterId: z.string(),
	name: z.string(),
});
const HelpOutputSchema = z.object({
	stdout: z.string().min(1),
	code: z.literal(0),
});

function pngFixture(pixel: number): Buffer<ArrayBuffer> {
	const chunk = (type: string, data: Buffer): Buffer => {
		const label = Buffer.from(type);
		const length = Buffer.alloc(4);
		length.writeUInt32BE(data.length);
		const crc = Buffer.alloc(4);
		crc.writeUInt32BE(crc32(Buffer.concat([label, data])));
		return Buffer.concat([length, label, data, crc]);
	};
	const header = Buffer.alloc(13);
	header.writeUInt32BE(1, 0);
	header.writeUInt32BE(1, 4);
	header[8] = 8;
	header[9] = 6;
	return Buffer.concat([
		PngSignature,
		chunk("IHDR", header),
		chunk("IDAT", deflateSync(Buffer.from([0, pixel, 2, 3, 255]))),
		chunk("IEND", Buffer.alloc(0)),
	]);
}

function crc32(bytes: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit += 1) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

async function makeDirectory(prefix: string): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), prefix));
	folders.push(directory);
	return directory;
}

interface Result {
	readonly code: number;
	readonly stdout: string;
	readonly stderr: string;
}

function run(args: readonly string[], cwd: string): Promise<Result> {
	return new Promise((resolveResult, reject) => {
		const child = spawn(process.execPath, [cliPath, ...args], {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		const timer = setTimeout(() => {
			child.kill("SIGKILL");
			reject(new Error("CLI subprocess exceeded 10 seconds"));
		}, 10_000);
		child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
			stdout += chunk;
		});
		child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
			stderr += chunk;
		});
		child.once("error", (error) => {
			clearTimeout(timer);
			reject(error);
		});
		child.once("close", (code) => {
			clearTimeout(timer);
			resolveResult({ code: code ?? 1, stdout, stderr });
		});
	});
}

async function fixture(
	directory: string,
	options: {
		readonly revision?: string;
		readonly personId?: string;
		readonly characterId?: string;
		readonly name?: string;
	} = {},
) {
	const revision = options.revision ?? "first";
	const personId = options.personId ?? "person-cli-fixture";
	const characterId = options.characterId ?? "K-cli-fixture";
	const name = options.name ?? "CLI Fixture";
	const image = pngFixture(revision === "second" ? 2 : 1);
	const detail = Buffer.from(
		JSON.stringify({
			id: personId,
			name,
			detailRoute: `/people/${personId}`,
			familyTree: { personId: characterId },
			revision,
		}),
	);
	const token = Buffer.from(
		JSON.stringify({
			personId,
			characterId,
			name,
			image: { sha256: sha256(image) },
			generationContract: { revision },
			slots: {},
		}),
	);
	await writeFile(join(directory, "detail.json"), detail);
	await writeFile(join(directory, "token.json"), token);
	await writeFile(join(directory, "portrait.png"), image);
	return {
		personId,
		detail,
		token,
		image,
		manifest: {
			people: [
				{
					personId,
					characterId,
					name,
					detail: {
						url: `https://example.test/${personId}/detail`,
						path: "detail.json",
						sha256: sha256(detail),
					},
					token: {
						url: `https://example.test/${personId}/token`,
						path: "token.json",
						sha256: sha256(token),
					},
					image: {
						url: `https://example.test/${personId}/image`,
						path: "portrait.png",
						sha256: sha256(image),
					},
				},
			],
		},
	};
}

afterEach(async () => {
	for (const folder of folders.splice(0)) {
		await rm(folder, { recursive: true, force: true });
	}
});

describe("people-originals CLI contract", () => {
	it("imports, gets source bytes, and exports exact bytes from outside the package", async () => {
		const directory = await makeDirectory("people-cli-contract-");
		const outside = await makeDirectory("people-cli-cwd-");
		const data = await fixture(directory);
		const manifestPath = join(directory, "manifest.json");
		const db = join(directory, "store.sqlite");
		await writeFile(manifestPath, JSON.stringify(data.manifest));
		const imported = await run(["import", manifestPath, "--db", db], outside);
		expect(imported.code).toBe(0);
		const fetched = await run(["get", data.personId, "--db", db], outside);
		expect(fetched.code).toBe(0);
		expect(fetched.stdout).not.toBe("");
		const identity = GetOutputSchema.parse(
			JSON.parse(fetched.stdout) as unknown,
		);
		expect(identity).toMatchObject({
			personId: data.personId,
			characterId: "K-cli-fixture",
			name: "CLI Fixture",
		});
		const sources = identity.sources;
		expect(sources).toBeDefined();
		for (const [kind, bytes] of [
			["detail", data.detail],
			["token", data.token],
			["image", data.image],
		] as const) {
			const source = sources?.[kind];
			expect(source).toBeDefined();
			expect(Buffer.from(source?.bytesBase64 ?? "", "base64")).toEqual(bytes);
			expect(source?.sha256).toBe(sha256(bytes));
			expect(source?.byteLength).toBe(bytes.byteLength);
			const output = join(outside, `${kind}.out`);
			const exported = await run(
				[
					"export",
					data.personId,
					"--kind",
					kind,
					"--output",
					output,
					"--db",
					db,
				],
				outside,
			);
			expect(exported.code).toBe(0);
			expect(await readFile(output)).toEqual(bytes);
		}
	});

	it("imports a subset without replacing unrelated people", async () => {
		const directory = await makeDirectory("people-cli-subset-");
		const outside = await makeDirectory("people-cli-cwd-");
		const original = await fixture(directory);
		const unrelatedDirectory = join(directory, "unrelated");
		await mkdir(unrelatedDirectory);
		const unrelatedFixture = await fixture(unrelatedDirectory, {
			personId: "person-unrelated",
			characterId: "K-unrelated",
			name: "Unrelated",
		});
		const manifestPath = join(directory, "manifest.json");
		const db = join(directory, "store.sqlite");
		const firstManifest = {
			people: [
				...original.manifest.people,
				...unrelatedFixture.manifest.people.map((person) => ({
					...person,
					detail: { ...person.detail, path: `unrelated/${person.detail.path}` },
					token: { ...person.token, path: `unrelated/${person.token.path}` },
					image: { ...person.image, path: `unrelated/${person.image.path}` },
				})),
			],
		};
		await writeFile(manifestPath, JSON.stringify(firstManifest));
		expect(
			(await run(["import", manifestPath, "--db", db], outside)).code,
		).toBe(0);
		await writeFile(manifestPath, JSON.stringify(original.manifest));
		expect(
			(await run(["import", manifestPath, "--db", db], outside)).code,
		).toBe(0);
		const unrelated = await run(
			["get", "person-unrelated", "--db", db],
			outside,
		);
		expect(unrelated.code).toBe(0);
		expect(unrelated.stdout).not.toBe("");
		if (unrelated.stdout !== "") {
			expect(
				PersonIdentitySchema.parse(JSON.parse(unrelated.stdout) as unknown),
			).toMatchObject({
				personId: "person-unrelated",
				characterId: "K-unrelated",
				name: "Unrelated",
			});
		}
	});

	it("rejects mismatched SHA without changing the store", async () => {
		const directory = await makeDirectory("people-cli-hash-");
		const outside = await makeDirectory("people-cli-cwd-");
		const data = await fixture(directory);
		const manifestPath = join(directory, "manifest.json");
		const db = join(directory, "store.sqlite");
		await writeFile(manifestPath, JSON.stringify(data.manifest));
		expect(
			(await run(["import", manifestPath, "--db", db], outside)).code,
		).toBe(0);
		const dbExists = await Bun.file(db).exists();
		expect(dbExists).toBe(true);
		if (dbExists) {
			const before = await readFile(db);
			const invalidManifest = structuredClone(data.manifest);
			const firstPerson = invalidManifest.people[0];
			expect(firstPerson).toBeDefined();
			if (!firstPerson) throw new Error("fixture person is missing");
			firstPerson.detail.sha256 = "0".repeat(64);
			await writeFile(manifestPath, JSON.stringify(invalidManifest));
			const rejected = await run(["import", manifestPath, "--db", db], outside);
			expect(rejected.code).toBe(1);
			expect(await readFile(db)).toEqual(before);
		} else {
			throw new Error("cannot verify rejected import without baseline DB");
		}
	});

	it("prints one diagnostic for missing files, directories, and invalid flags", async () => {
		const directory = await makeDirectory("people-cli-errors-");
		const outside = await makeDirectory("people-cli-cwd-");
		const db = join(directory, "store.sqlite");
		const fixtureData = await fixture(directory);
		const manifestPath = join(directory, "manifest.json");
		await writeFile(manifestPath, JSON.stringify(fixtureData.manifest));
		const initialized = await run(
			["import", manifestPath, "--db", db],
			outside,
		);
		expect(initialized.code).toBe(0);
		const dbExists = await Bun.file(db).exists();
		expect(dbExists).toBe(true);
		if (dbExists) {
			const before = await readFile(db);
			const cases: readonly (readonly string[])[] = [
				["import", join(directory, "absent.json"), "--db", db],
				["import", directory, "--db", db],
				["get", "person-x", "--db", db, "--unknown"],
				[
					"export",
					fixtureData.personId,
					"--kind",
					"detail",
					"--output",
					join(directory, "absent-output", "detail.json"),
					"--db",
					db,
				],
			];
			for (const args of cases) {
				const result = await run(args, outside);
				expect(result.code).toBe(1);
				expect(result.stderr.trim()).not.toBe("");
				expect(result.stderr.trim().split("\n")).toHaveLength(1);
				expect(result.stdout).toBe("");
				expect(await readFile(db)).toEqual(before);
			}
		} else {
			throw new Error("cannot verify invalid inputs without baseline DB");
		}
	});

	it("prints help without requiring a database path", async () => {
		const outside = await makeDirectory("people-cli-cwd-");
		const result = await run(["--help"], outside);
		expect(HelpOutputSchema.safeParse(result).success).toBe(true);
	});

	it("exports the requested older revision", async () => {
		const directory = await makeDirectory("people-cli-revision-");
		const outside = await makeDirectory("people-cli-cwd-");
		const data = await fixture(directory);
		const manifestPath = join(directory, "manifest.json");
		const db = join(directory, "store.sqlite");
		const first = JSON.stringify(data.manifest);
		await writeFile(manifestPath, first);
		expect(
			(await run(["import", manifestPath, "--db", db], outside)).code,
		).toBe(0);
		const second = await fixture(directory, { revision: "second" });
		await writeFile(manifestPath, JSON.stringify(second.manifest));
		expect(
			(await run(["import", manifestPath, "--db", db], outside)).code,
		).toBe(0);
		const output = join(outside, "old-detail.json");
		const exported = await run(
			[
				"export",
				data.personId,
				"--kind",
				"detail",
				"--output",
				output,
				"--db",
				db,
				"--revision",
				"1",
			],
			outside,
		);
		expect(exported.code).toBe(0);
		const outputExists = await Bun.file(output).exists();
		expect(outputExists).toBe(true);
		if (!outputExists) throw new Error("expected export output file");
		expect(await readFile(output)).toEqual(data.detail);
	});
});
